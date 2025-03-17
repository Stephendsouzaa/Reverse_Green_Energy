// Real-time Data Integration for Cost Estimation Dashboard

class CostEstimationRealTimeService {
    constructor() {
        this.baseUrl = '/api';
        this.cachedData = {};
        this.cacheExpiry = {};
        this.cacheDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
        this.fallbackData = {
            energyPricing: {
                'United States': { costPerWatt: 1.6, incentives: 0.3, omCost: 25 },
                'India': { costPerWatt: 1.2, incentives: 0.2, omCost: 15 },
                'Germany': { costPerWatt: 1.7, incentives: 0.2, omCost: 30 },
                'Australia': { costPerWatt: 1.6, incentives: 0.25, omCost: 22 },
                'Global': { costPerWatt: 1.5, incentives: 0.26, omCost: 20 }
            },
            renewableData: {
                'Global': { solarIrradiance: 5.0, windSpeed: 6.0 }
            }
        };
    }

    /**
     * Get user's current location using browser geolocation API
     * @returns {Promise<{lat: number, lng: number}>} - User's coordinates
     */
    async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    (error) => {
                        console.warn('Geolocation error:', error);
                        // Fallback to a default location (New York)
                        resolve({ lat: 40.7128, lng: -74.0060 });
                    },
                    { timeout: 10000 }
                );
            } else {
                console.warn('Geolocation not supported by this browser');
                // Fallback to a default location
                resolve({ lat: 40.7128, lng: -74.0060 });
            }
        });
    }

    /**
     * Get country and location information from coordinates
     * @param {Object} location - {lat, lng} coordinates
     * @returns {Promise<Object>} - Location data including country
     */
    async getLocationInfo(location) {
        const cacheKey = `location_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}`;
        
        // Check cache first
        if (this.isCacheValid(cacheKey)) {
            return this.cachedData[cacheKey];
        }

        try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.lat}&longitude=${location.lng}&localityLanguage=en`);
            
            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status}`);
            }
            
            const data = await response.json();
            const result = {
                country: data.countryName,
                city: data.city || data.locality,
                state: data.principalSubdivision,
                countryCode: data.countryCode
            };
            
            // Cache the result
            this.setCacheData(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Error fetching location info:', error);
            // Return fallback data
            return { country: 'Global', city: 'Unknown', state: 'Unknown', countryCode: 'XX' };
        }
    }

    /**
     * Get real-time energy pricing data for the user's location
     * @param {Object} locationInfo - Location information with country
     * @returns {Promise<Object>} - Energy pricing data
     */
    async getEnergyPricingData(locationInfo) {
        const cacheKey = `energy_pricing_${locationInfo.countryCode}`;
        
        // Check cache first
        if (this.isCacheValid(cacheKey)) {
            return this.cachedData[cacheKey];
        }
        
        // Ensure we have a valid country to work with
        const country = locationInfo.country || 'Global';
        const countryCode = locationInfo.countryCode || 'XX';

        try {
            // Try to get data from EIA API (for US) or Global Energy API
            let apiUrl;
            let apiKey = 'demo'; // Replace with your actual API key in production
            
            if (countryCode === 'US') {
                // US Energy Information Administration API
                const stateCode = locationInfo.state && locationInfo.state.length >= 2 ? 
                    locationInfo.state.substring(0, 2) : 'CA';
                apiUrl = `https://api.eia.gov/series/?api_key=${apiKey}&series_id=ELEC.PRICE.${stateCode}-ALL.M`;
            } else {
                // Global Energy API (example)
                apiUrl = `https://api.energydata.info/api/3/action/datastore_search?resource_id=energyprices&filters={"country":"${countryCode}"}`;
            }
            
            // Set a timeout for the fetch request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(apiUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Energy API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Process the API response based on the source
            let result;
            if (countryCode === 'US' && data.series && data.series[0] && data.series[0].data && data.series[0].data[0]) {
                // Process EIA data
                const latestData = data.series[0].data[0];
                result = {
                    costPerWatt: latestData[1] / 100, // Convert cents to dollars
                    incentives: this.calculateIncentives(countryCode),
                    omCost: this.calculateOMCost(countryCode),
                    timestamp: new Date().toISOString()
                };
            } else if (data.result && data.result.records && data.result.records[0]) {
                // Process global energy data
                result = {
                    costPerWatt: data.result.records[0].price_per_watt || 1.5,
                    incentives: this.calculateIncentives(countryCode),
                    omCost: this.calculateOMCost(countryCode),
                    timestamp: new Date().toISOString()
                };
            } else {
                // Data structure not as expected, use fallback
                throw new Error('Unexpected API response structure');
            }
            
            // Cache the result
            this.setCacheData(cacheKey, result);
            return result;
        } catch (error) {
            console.warn('Using fallback energy pricing data:', error.message);
            // Return fallback data
            const fallbackData = this.fallbackData.energyPricing[country] || this.fallbackData.energyPricing['Global'];
            return {
                ...fallbackData,
                timestamp: new Date().toISOString(),
                isFallback: true
            };
        }
    }

    /**
     * Calculate incentives based on country
     * @param {string} countryCode - Two-letter country code
     * @returns {number} - Incentive rate (0-1)
     */
    calculateIncentives(countryCode) {
        const incentiveRates = {
            'US': 0.30, // 30% federal tax credit
            'DE': 0.20, // Germany
            'IN': 0.20, // India
            'AU': 0.25, // Australia
            'GB': 0.15, // United Kingdom
            'CA': 0.25, // Canada
            'JP': 0.20, // Japan
            'CN': 0.15  // China
        };
        
        return incentiveRates[countryCode] || 0.26; // Default global average
    }

    /**
     * Calculate O&M costs based on country
     * @param {string} countryCode - Two-letter country code
     * @returns {number} - O&M cost per kW
     */
    calculateOMCost(countryCode) {
        const omCosts = {
            'US': 25,
            'DE': 30,
            'IN': 15,
            'AU': 22,
            'GB': 28,
            'CA': 26,
            'JP': 32,
            'CN': 18
        };
        
        return omCosts[countryCode] || 20; // Default global average
    }

    /**
     * Get real-time weather and renewable energy data for location
     * @param {Object} location - {lat, lng} coordinates
     * @returns {Promise<Object>} - Weather and renewable energy data
     */
    async getRenewableEnergyData(location) {
        const cacheKey = `renewable_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}`;
        
        // Check cache first
        if (this.isCacheValid(cacheKey)) {
            return this.cachedData[cacheKey];
        }
        
        // Validate location data
        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            console.warn('Invalid location data, using fallback');
            return {
                ...this.fallbackData.renewableData['Global'],
                isFallback: true,
                timestamp: new Date().toISOString()
            };
        }

        try {
            // OpenWeatherMap API for weather data
            const apiKey = 'demo'; // Replace with your actual API key in production
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=${apiKey}&units=metric`;
            
            // NREL API for solar data (US only)
            const nrelUrl = `https://developer.nrel.gov/api/solar/solar_resource/v1.json?api_key=${apiKey}&lat=${location.lat}&lon=${location.lng}`;
            
            // Set a timeout for the fetch requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            // Fetch weather data
            const weatherResponse = await fetch(weatherUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!weatherResponse.ok) {
                throw new Error(`Weather API error: ${weatherResponse.status}`);
            }
            const weatherData = await weatherResponse.json();
            
            // Try to fetch solar data if in the US
            let solarData = null;
            try {
                const controller2 = new AbortController();
                const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
                const solarResponse = await fetch(nrelUrl, { signal: controller2.signal });
                clearTimeout(timeoutId2);
                
                if (solarResponse.ok) {
                    solarData = await solarResponse.json();
                }
            } catch (solarError) {
                console.warn('Error fetching solar data:', solarError.message);
                // Continue with weather data only
            }
            
            // Calculate solar irradiance and wind speed
            let solarIrradiance;
            if (solarData && solarData.outputs && solarData.outputs.avg_dni && solarData.outputs.avg_dni.annual) {
                // Use NREL data if available
                solarIrradiance = solarData.outputs.avg_dni.annual;
            } else {
                // Estimate based on weather conditions and latitude
                const cloudCover = weatherData.clouds ? weatherData.clouds.all / 100 : 0.5;
                const latitudeFactor = 1 - Math.abs(location.lat) / 90 * 0.5;
                solarIrradiance = 7.0 * latitudeFactor * (1 - cloudCover * 0.7);
            }
            
            // Get wind speed from weather data
            const windSpeed = weatherData.wind ? weatherData.wind.speed : 6.0;
            
            const result = {
                solarIrradiance: parseFloat(solarIrradiance.toFixed(2)),
                windSpeed: parseFloat(windSpeed.toFixed(2)),
                temperature: weatherData.main ? weatherData.main.temp : 15,
                humidity: weatherData.main ? weatherData.main.humidity : 50,
                cloudCover: weatherData.clouds ? weatherData.clouds.all : 50,
                timestamp: new Date().toISOString(),
                isFallback: false
            };
            
            // Cache the result
            this.setCacheData(cacheKey, result);
            return result;
        } catch (error) {
            console.warn('Using fallback renewable energy data:', error.message);
            // Return fallback data with timestamp
            return {
                ...this.fallbackData.renewableData['Global'],
                timestamp: new Date().toISOString(),
                isFallback: true
            };
        }
    }

    /**
     * Get carbon emission factors for different countries
     * @param {string} countryCode - Two-letter country code
     * @returns {Promise<Object>} - Carbon emission data
     */
    async getCarbonEmissionData(countryCode) {
        const cacheKey = `carbon_${countryCode}`;
        
        // Check cache first
        if (this.isCacheValid(cacheKey)) {
            return this.cachedData[cacheKey];
        }

        // Ensure we have a valid country code
        const validCountryCode = countryCode || 'XX';

        try {
            // Carbon Intensity API (example)
            const apiUrl = `https://api.carbonintensity.org.uk/intensity`;
            
            // Set a timeout for the fetch request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(apiUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Carbon API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Validate the data structure
            if (!data.data || !data.data[0] || !data.data[0].intensity || !data.data[0].intensity.forecast) {
                throw new Error('Unexpected API response structure');
            }
            
            // Process the data
            const result = {
                gridEmissionFactor: data.data[0].intensity.forecast / 1000, // Convert to kg CO2/kWh
                timestamp: new Date().toISOString(),
                isFallback: false
            };
            
            // Cache the result
            this.setCacheData(cacheKey, result);
            return result;
        } catch (error) {
            console.warn('Using fallback carbon emission data:', error.message);
            // Return fallback data based on country
            const emissionFactors = {
                'US': 0.7,
                'DE': 0.6,
                'IN': 0.9,
                'AU': 0.8,
                'GB': 0.5,
                'CA': 0.4,
                'JP': 0.7,
                'CN': 0.9
            };
            
            return { 
                gridEmissionFactor: emissionFactors[validCountryCode] || 0.7,
                timestamp: new Date().toISOString(),
                isFallback: true
            };
        }
    }

    /**
     * Calculate financial metrics for the renewable energy project
     * @param {Object} params - Project parameters
     * @returns {Object} - Financial metrics
     */
    calculateFinancialMetrics(params) {
        try {
            const {
                systemType,
                systemSize,
                electricityRate,
                financingMethod,
                countryData,
                renewableData
            } = params;
            
            // Validate input parameters
            if (!systemType || !systemSize || !electricityRate || !countryData || !renewableData) {
                throw new Error('Missing required parameters for financial calculation');
            }
            
            // Ensure we have valid data with fallbacks
            const validCountryData = {
                costPerWatt: countryData.costPerWatt || this.fallbackData.energyPricing['Global'].costPerWatt,
                incentives: countryData.incentives || this.fallbackData.energyPricing['Global'].incentives,
                omCost: countryData.omCost || this.fallbackData.energyPricing['Global'].omCost
            };
            
            const validRenewableData = {
                solarIrradiance: renewableData.solarIrradiance || this.fallbackData.renewableData['Global'].solarIrradiance,
                windSpeed: renewableData.windSpeed || this.fallbackData.renewableData['Global'].windSpeed,
                latitude: renewableData.latitude || 0
            };
            
            // Calculate installation costs
            const installationCost = systemSize * 1000 * validCountryData.costPerWatt;
            const netInstallationCost = installationCost - (installationCost * validCountryData.incentives);
            const annualOMCost = systemSize * validCountryData.omCost;

            // Calculate annual energy production
            let annualProduction;
            if (systemType === 'solar') {
                annualProduction = systemSize * validRenewableData.solarIrradiance * 365 * 0.75; // Solar
            } else if (systemType === 'wind') {
                annualProduction = systemSize * Math.pow(validRenewableData.windSpeed, 3) * 0.5 * 24 * 365 * 0.35; // Wind
            } else {
                // Hybrid (average of solar and wind)
                annualProduction = (systemSize * validRenewableData.solarIrradiance * 365 * 0.75 * 0.6) + 
                                  (systemSize * Math.pow(validRenewableData.windSpeed, 3) * 0.5 * 24 * 365 * 0.35 * 0.4);
            }

            // Calculate annual savings
            const annualSavings = annualProduction * electricityRate;

            // Calculate simple payback period (with safety check for division by zero)
            const annualNetSavings = annualSavings - annualOMCost;
            const simplePayback = annualNetSavings > 0 ? netInstallationCost / annualNetSavings : 25;

            // Calculate ROI and other financial metrics (with safety checks)
            const roi = netInstallationCost > 0 ? ((annualSavings - annualOMCost) / netInstallationCost) * 100 : 0;
            const npv = this.calculateNPV(netInstallationCost, annualSavings - annualOMCost, 25, 0.05);
            const lcoe = this.calculateLCOE(netInstallationCost, annualOMCost, annualProduction, 25);

            // Calculate carbon offset
            const carbonOffset = annualProduction * 0.7; // kg CO2/year

            // Calculate monthly savings projection for chart
            const monthlySavings = this.calculateMonthlySavings(annualSavings, validRenewableData);

            // Calculate comparative costs for chart
            const comparativeCosts = this.calculateComparativeCosts(installationCost, netInstallationCost);

            return {
                installationCost,
                netInstallationCost,
                annualOMCost,
                annualProduction,
                annualSavings,
                simplePayback,
                roi,
                npv,
                lcoe,
                carbonOffset,
                monthlySavings,
                comparativeCosts,
                lifetimeSavings: annualSavings * 25,
                incentives: installationCost * validCountryData.incentives
            };
        } catch (error) {
            console.error('Error in financial calculation:', error.message);
            // Return default values as fallback
            return this.getDefaultFinancialMetrics();
        }
    }
    
    /**
     * Get default financial metrics as fallback
     * @returns {Object} - Default financial metrics
     */
    getDefaultFinancialMetrics() {
        // Default values for a 1000kW system
        const defaultSystemSize = 1000;
        const defaultElectricityRate = 0.12;
        const defaultCountryData = this.fallbackData.energyPricing['Global'];
        const defaultRenewableData = this.fallbackData.renewableData['Global'];
        
        const installationCost = defaultSystemSize * 1000 * defaultCountryData.costPerWatt;
        const netInstallationCost = installationCost - (installationCost * defaultCountryData.incentives);
        const annualOMCost = defaultSystemSize * defaultCountryData.omCost;
        
        // Default annual production (solar)
        const annualProduction = defaultSystemSize * defaultRenewableData.solarIrradiance * 365 * 0.75;
        
        // Default annual savings
        const annualSavings = annualProduction * defaultElectricityRate;
        
        // Default simple payback period
        const simplePayback = netInstallationCost / (annualSavings - annualOMCost);
        
        // Default ROI
        const roi = ((annualSavings - annualOMCost) / netInstallationCost) * 100;
        
        // Default NPV and LCOE
        const npv = this.calculateNPV(netInstallationCost, annualSavings - annualOMCost, 25, 0.05);
        const lcoe = this.calculateLCOE(netInstallationCost, annualOMCost, annualProduction, 25);
        
        // Default carbon offset
        const carbonOffset = annualProduction * 0.7;
        
        // Default monthly savings
        const monthlySavings = this.calculateMonthlySavings(annualSavings, { latitude: 40 });
        
        // Default comparative costs
        const comparativeCosts = this.calculateComparativeCosts(installationCost, netInstallationCost);
        
        return {
            installationCost,
            netInstallationCost,
            annualOMCost,
            annualProduction,
            annualSavings,
            simplePayback,
            roi,
            npv,
            lcoe,
            carbonOffset,
            monthlySavings,
            comparativeCosts,
            lifetimeSavings: annualSavings * 25,
            incentives: installationCost * defaultCountryData.incentives,
            isDefaultData: true
        };
    }
    /**
     * Calculate Net Present Value (NPV)
     * @param {number} initialInvestment - Initial investment amount
     * @param {number} annualCashFlow - Annual cash flow
     * @param {number} years - Project lifetime in years
     * @param {number} discountRate - Discount rate (e.g., 0.05 for 5%)
     * @returns {number} - NPV
     */
    calculateNPV(initialInvestment, annualCashFlow, years, discountRate) {
        try {
            // Validate inputs
            const validInitialInvestment = typeof initialInvestment === 'number' && !isNaN(initialInvestment) ? initialInvestment : 1000000;
            const validAnnualCashFlow = typeof annualCashFlow === 'number' && !isNaN(annualCashFlow) ? annualCashFlow : 100000;
            const validYears = typeof years === 'number' && !isNaN(years) && years > 0 ? years : 25;
            const validDiscountRate = typeof discountRate === 'number' && !isNaN(discountRate) && discountRate > 0 ? discountRate : 0.05;
            
            let npv = -validInitialInvestment;
            for (let year = 1; year <= validYears; year++) {
                npv += validAnnualCashFlow / Math.pow(1 + validDiscountRate, year);
            }
            return npv;
        } catch (error) {
            console.warn('Error calculating NPV, using default value:', error.message);
            return 500000; // Default NPV value
        }
    }

    /**
     * Calculate Levelized Cost of Energy (LCOE)
     * @param {number} initialCost - Initial investment
     * @param {number} annualOMCost - Annual O&M cost
     * @param {number} annualProduction - Annual energy production in kWh
     * @param {number} years - Project lifetime in years
     * @returns {number} - LCOE in $/kWh
     */
    calculateLCOE(initialCost, annualOMCost, annualProduction, years) {
        try {
            // Enhanced input validation with more specific error messages
            if (typeof initialCost !== 'number' || isNaN(initialCost)) {
                console.warn('Invalid initial cost provided, using default value of 1,000,000');
                initialCost = 1000000;
            }
            if (typeof annualOMCost !== 'number' || isNaN(annualOMCost)) {
                console.warn('Invalid annual O&M cost provided, using default value of 20,000');
                annualOMCost = 20000;
            }
            if (typeof annualProduction !== 'number' || isNaN(annualProduction) || annualProduction <= 0) {
                console.warn('Invalid annual production provided, using default value of 1,000,000 kWh');
                annualProduction = 1000000;
            }
            if (typeof years !== 'number' || isNaN(years) || years <= 0) {
                console.warn('Invalid project lifetime provided, using default value of 25 years');
                years = 25;
            }
            
            const totalCost = initialCost + (annualOMCost * years);
            const totalProduction = annualProduction * years;
            
            // Enhanced error handling for division
            if (totalProduction <= 0) {
                console.warn('Total production is zero or negative, returning default LCOE value');
                return 0.12; // Default LCOE if production is zero
            }
            
            const lcoe = totalCost / totalProduction;
            if (isNaN(lcoe) || !isFinite(lcoe)) {
                console.warn('LCOE calculation resulted in an invalid value, returning default value');
                return 0.12;
            }
            
            return lcoe;
        } catch (error) {
            console.warn('Error calculating LCOE, using default value:', error.message);
            return 0.12; // Default LCOE value (12 cents per kWh)
        }
    }

    /**
     * Calculate monthly savings projection for chart
     * @param {number} annualSavings - Annual savings
     * @param {Object} renewableData - Renewable energy data
     * @returns {Array} - Monthly savings data
     */
    calculateMonthlySavings(annualSavings, renewableData) {
        try {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const seasonalFactors = {
                // Northern Hemisphere seasonal factors
                north: [0.6, 0.7, 0.9, 1.1, 1.2, 1.3, 1.3, 1.2, 1.1, 0.9, 0.7, 0.6],
                // Southern Hemisphere seasonal factors (inverted)
                south: [1.3, 1.2, 1.1, 0.9, 0.7, 0.6, 0.6, 0.7, 0.9, 1.1, 1.2, 1.3]
            };
            
            // Validate inputs
            const validAnnualSavings = typeof annualSavings === 'number' && !isNaN(annualSavings) ? annualSavings : 1000;
            
            // Ensure renewableData has a valid latitude
            const validLatitude = renewableData && typeof renewableData.latitude === 'number' && !isNaN(renewableData.latitude) 
                ? renewableData.latitude 
                : 0;
            
            // Determine hemisphere based on latitude
            const hemisphere = validLatitude < 0 ? 'south' : 'north';
            const factors = seasonalFactors[hemisphere];
            
            // Calculate monthly values
            return months.map((month, index) => {
                return {
                    month,
                    savings: (validAnnualSavings / 12) * factors[index]
                };
            });
        } catch (error) {
            console.warn('Error calculating monthly savings, using default values:', error.message);
            // Return default monthly values if calculation fails
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const defaultSavingsPerMonth = 100; // $100 per month as fallback
            
            return months.map(month => ({
                month,
                savings: defaultSavingsPerMonth
            }));
        }
    }

    /**
     * Calculate comparative costs for chart
     * @param {number} installationCost - Total installation cost
     * @param {number} netInstallationCost - Net installation cost after incentives
     * @returns {Object} - Comparative cost data
     */
    calculateComparativeCosts(installationCost, netInstallationCost) {
        try {
            // Validate inputs
            const validInstallationCost = typeof installationCost === 'number' && !isNaN(installationCost) && installationCost > 0 
                ? installationCost 
                : 1500000; // Default $1.5M for 1MW system
                
            const validNetInstallationCost = typeof netInstallationCost === 'number' && !isNaN(netInstallationCost) && netInstallationCost > 0
                ? netInstallationCost
                : validInstallationCost * 0.7; // Default 30% incentives
                
            // Calculate traditional energy cost (25-year equivalent)
            const traditionalEnergyCost = validInstallationCost * 1.5;
            
            return {
                labels: ['Gross Cost', 'Net Cost (After Incentives)', 'Traditional Energy (25yr)'],
                data: [
                    validInstallationCost,
                    validNetInstallationCost,
                    traditionalEnergyCost
                ]
            };
        } catch (error) {
            console.warn('Error calculating comparative costs, using default values:', error.message);
            // Return default values if calculation fails
            return {
                labels: ['Gross Cost', 'Net Cost (After Incentives)', 'Traditional Energy (25yr)'],
                data: [1500000, 1050000, 2250000] // Default values
            };
        }
    }

    /**
     * Check if cached data is still valid
     * @param {string} key - Cache key
     * @returns {boolean} - True if cache is valid
     */
    isCacheValid(key) {
        if (!this.cachedData[key] || !this.cacheExpiry[key]) {
            return false;
        }
        return this.cacheExpiry[key] > Date.now();
    }

    /**
     * Set data in cache with expiry
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     */
    setCacheData(key, data) {
        this.cachedData[key] = data;
        this.cacheExpiry[key] = Date.now() + this.cacheDuration;
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        this.cachedData = {};
        this.cacheExpiry = {};
    }
}

// Initialize and export the service
const costEstimationRealTimeService = new CostEstimationRealTimeService();
export default costEstimationRealTimeService;

            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${latlng.lat}&lon=${latlng.lng}&appid=8c7f1c9d2e4a6b3058f9d7e1a4c2b5h8&units=metric`,
                {
                    headers: {
                        'auth-token': '7b4e2a9f6c1d8h5g3k2j4m7n9p0q8r5'
                    }
                }
            );
            