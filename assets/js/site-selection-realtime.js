// Real-time data fetching for Site Selection

class SiteSelectionRealTimeData {
    constructor() {
        this.apiKeys = {
            openWeatherMap: 'e086049ce09e1e2225c70492674c4802',
            nrel: 'DEMO_KEY' // National Renewable Energy Laboratory API key (replace with actual key in production)
        };
        this.baseUrls = {
            openWeatherMap: 'https://api.openweathermap.org/data/2.5',
            openElevation: 'https://api.open-elevation.com/api/v1',
            nrel: 'https://developer.nrel.gov/api',
            globalSolar: 'https://power.larc.nasa.gov/api/temporal/daily/point'
        };
        this.localData = {
            solarIrradiance: null,
            landSuitability: null,
            energyCosts: null,
            windSpeed: null
        };
        this.loadLocalDatasets();
    }

    // Load local datasets from the backend
    async loadLocalDatasets() {
        try {
            // Load solar irradiance data
            const solarResponse = await fetch('/api/solar/solar-data');
            if (solarResponse.ok) {
                const data = await solarResponse.json();
                this.localData.solarIrradiance = data.data;
            }

            // Load other datasets as needed
            // These would be implemented in the backend similar to solar-data.py
            // For now, we'll use the data we have
        } catch (error) {
            console.error('Error loading local datasets:', error);
        }
    }

    // Get weather data from OpenWeatherMap API
    async getWeatherData(latitude, longitude) {
        try {
            const response = await fetch(`${this.baseUrls.openWeatherMap}/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKeys.openWeatherMap}&units=metric`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching weather data:', error);
            return null;
        }
    }

    // Get elevation data from Open Elevation API
    async getElevationData(latitude, longitude) {
        try {
            const response = await fetch(`${this.baseUrls.openElevation}/lookup?locations=${latitude},${longitude}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.results[0].elevation;
        } catch (error) {
            console.error('Error fetching elevation data:', error);
            return null;
        }
    }

    // Get solar resource data from NREL API or NASA POWER API
    async getSolarResourceData(latitude, longitude) {
        try {
            // Try NREL API first (US only)
            const nrelResponse = await fetch(`${this.baseUrls.nrel}/solar/solar-resource/v1.json?api_key=${this.apiKeys.nrel}&lat=${latitude}&lon=${longitude}`);
            
            if (nrelResponse.ok) {
                const data = await nrelResponse.json();
                return data.outputs;
            } else {
                // Fall back to NASA POWER API (global)
                const nasaParams = {
                    parameters: 'ALLSKY_SFC_SW_DWN',
                    community: 'RE',
                    longitude: longitude,
                    latitude: latitude,
                    start: '20200101',
                    end: '20201231',
                    format: 'JSON'
                };
                
                const queryString = Object.keys(nasaParams)
                    .map(key => `${key}=${encodeURIComponent(nasaParams[key])}`)
                    .join('&');
                
                const nasaResponse = await fetch(`${this.baseUrls.globalSolar}?${queryString}`);
                
                if (nasaResponse.ok) {
                    const data = await nasaResponse.json();
                    return {
                        annual_average: {
                            solar_radiation: {
                                value: data.properties.parameter.ALLSKY_SFC_SW_DWN.mean / 1000, // Convert from W/m² to kW/m²
                                units: 'kWh/m²/day'
                            }
                        }
                    };
                }
            }
            
            // If both APIs fail, use local data or estimate
            return this.estimateSolarResourceFromLocalData(latitude, longitude);
        } catch (error) {
            console.error('Error fetching solar resource data:', error);
            return this.estimateSolarResourceFromLocalData(latitude, longitude);
        }
    }

    // Estimate solar resource from local data
    estimateSolarResourceFromLocalData(latitude, longitude) {
        if (!this.localData.solarIrradiance) {
            return {
                annual_average: {
                    solar_radiation: {
                        value: 5.0, // Default value
                        units: 'kWh/m²/day'
                    }
                }
            };
        }

        // Find the closest location in our dataset
        let closestLocation = null;
        let minDistance = Infinity;

        for (const location of this.localData.solarIrradiance) {
            const distance = this.calculateDistance(
                latitude, longitude,
                location.latitude, location.longitude
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestLocation = location;
            }
        }

        return {
            annual_average: {
                solar_radiation: {
                    value: closestLocation.solar_irradiance,
                    units: 'kWh/m²/day'
                }
            },
            source: 'local_data',
            location_name: closestLocation.location
        };
    }

    // Calculate distance between two points using Haversine formula
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const distance = R * c; // Distance in km
        return distance;
    }

    deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    // Get land suitability data
    async getLandSuitabilityData(latitude, longitude) {
        // In a real implementation, this would call a GIS API
        // For now, we'll use our local data or estimate
        if (!this.localData.landSuitability) {
            return {
                suitability: 'Medium',
                score: 75
            };
        }

        // Find the closest location in our dataset
        let closestLocation = null;
        let minDistance = Infinity;

        for (const location of this.localData.landSuitability) {
            const distance = this.calculateDistance(
                latitude, longitude,
                location.latitude, location.longitude
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestLocation = location;
            }
        }

        // Convert text rating to numeric score
        let score = 75; // Default medium score
        if (closestLocation.land_suitability === 'High') {
            score = 90;
        } else if (closestLocation.land_suitability === 'Low') {
            score = 50;
        }

        return {
            suitability: closestLocation.land_suitability,
            score: score,
            source: 'local_data',
            location_name: closestLocation.location
        };
    }

    // Get grid infrastructure data
    async getGridInfrastructureData(latitude, longitude) {
        // This would typically come from a utility company API or GIS database
        // For now, we'll generate realistic data based on location
        
        // Generate a deterministic but seemingly random value based on coordinates
        const seed = (latitude * 10000 + longitude * 10000) % 100;
        const gridDistance = 1 + (seed % 10); // 1-10 km distance to grid
        const gridCapacity = 10 + (seed % 40); // 10-50 MW capacity
        
        // Grid quality score (0-100)
        let gridScore;
        if (gridDistance < 3) {
            gridScore = 90 + (seed % 10); // 90-99 for close proximity
        } else if (gridDistance < 6) {
            gridScore = 70 + (seed % 20); // 70-89 for medium proximity
        } else {
            gridScore = 50 + (seed % 20); // 50-69 for far proximity
        }
        
        return {
            distance: gridDistance,
            capacity: gridCapacity,
            score: gridScore,
            substationDistance: gridDistance * 0.8, // Slightly closer than general grid
            transmissionLines: gridDistance < 5 ? 'High Voltage' : 'Medium Voltage',
            connectionCost: gridDistance * 50000 // $50k per km as a rough estimate
        };
    }

    // Get environmental impact assessment
    async getEnvironmentalImpactData(latitude, longitude, siteType) {
        // This would typically come from environmental databases or GIS
        // For now, we'll generate realistic data
        
        // Generate a deterministic but seemingly random value based on coordinates and site type
        const seed = (latitude * 10000 + longitude * 10000) % 100;
        
        // Different impacts based on site type
        let carbonOffset, landUseImpact, wildlifeImpact, waterResourceImpact;
        
        if (siteType === 'solar') {
            carbonOffset = 10000 + (seed * 500); // 10,000-60,000 tons CO2/year
            landUseImpact = 70 + (seed % 30); // 70-99 score (higher is better)
            wildlifeImpact = 65 + (seed % 25); // 65-89 score
            waterResourceImpact = 80 + (seed % 20); // 80-99 score
        } else if (siteType === 'data-center') {
            carbonOffset = 5000 + (seed * 200); // 5,000-25,000 tons CO2/year (less than solar)
            landUseImpact = 80 + (seed % 20); // 80-99 score (data centers use less land)
            wildlifeImpact = 75 + (seed % 20); // 75-94 score
            waterResourceImpact = 60 + (seed % 30); // 60-89 score (data centers use more water)
        } else { // hybrid
            carbonOffset = 15000 + (seed * 400); // 15,000-55,000 tons CO2/year
            landUseImpact = 65 + (seed % 25); // 65-89 score (hybrids use more land)
            wildlifeImpact = 70 + (seed % 20); // 70-89 score
            waterResourceImpact = 70 + (seed % 20); // 70-89 score
        }
        
        return {
            carbonOffset: carbonOffset,
            landUseImpact: landUseImpact,
            wildlifeImpact: wildlifeImpact,
            waterResourceImpact: waterResourceImpact,
            overallScore: Math.floor((landUseImpact + wildlifeImpact + waterResourceImpact) / 3),
            protectedAreas: seed < 20 ? 'Nearby' : 'None in vicinity',
            mitigationCost: seed * 10000 // $0-$990,000 for environmental mitigation
        };
    }

    // Get financial ROI projection
    async getFinancialProjection(latitude, longitude, siteType, solarData, gridData) {
        // This would typically use complex financial models
        // For now, we'll generate realistic data based on inputs
        
        const solarIrradiance = solarData.annual_average.solar_radiation.value;
        const gridDistance = gridData.distance;
        
        // Base calculations
        let installationCost, annualRevenue, operatingCost, roi, paybackPeriod;
        
        if (siteType === 'solar') {
            // Solar farm financial model
            const capacityMW = 20; // 20 MW solar farm
            const costPerMW = 1000000; // $1M per MW
            installationCost = capacityMW * costPerMW;
            
            // Revenue based on solar irradiance
            const capacityFactor = 0.2 + (solarIrradiance / 20); // 0.2-0.5 range
            const hoursPerYear = 8760;
            const energyPrice = 0.08; // $0.08 per kWh
            
            annualRevenue = capacityMW * 1000 * hoursPerYear * capacityFactor * energyPrice;
            operatingCost = installationCost * 0.02; // 2% of installation cost per year
            
            // Add grid connection costs
            installationCost += gridData.connectionCost;
            
        } else if (siteType === 'data-center') {
            // Data center financial model
            const sizeMW = 10; // 10 MW data center
            const costPerMW = 7000000; // $7M per MW for data centers
            installationCost = sizeMW * costPerMW;
            
            // Revenue based on data center services
            annualRevenue = sizeMW * 1500000; // $1.5M per MW per year
            operatingCost = installationCost * 0.15; // 15% of installation cost per year
            
            // Add grid connection costs
            installationCost += gridData.connectionCost;
            installationCost += gridData.connectionCost * 2; // Data centers need more robust connections
            
        } else { // hybrid
            // Hybrid site financial model
            const solarCapacityMW = 10; // 10 MW solar
            const dataCenterSizeMW = 5; // 5 MW data center
            
            // Combined installation costs
            const solarCostPerMW = 1000000; // $1M per MW
            const dataCenterCostPerMW = 7000000; // $7M per MW
            
            installationCost = (solarCapacityMW * solarCostPerMW) + (dataCenterSizeMW * dataCenterCostPerMW);
            
            // Revenue calculations
            const solarCapacityFactor = 0.2 + (solarIrradiance / 20);
            const hoursPerYear = 8760;
            const energyPrice = 0.08; // $0.08 per kWh
            
            const solarRevenue = solarCapacityMW * 1000 * hoursPerYear * solarCapacityFactor * energyPrice;
            const dataCenterRevenue = dataCenterSizeMW * 1500000; // $1.5M per MW per year
            
            annualRevenue = solarRevenue + dataCenterRevenue;
            
            // Operating costs (weighted average)
            const solarOpCost = solarCapacityMW * solarCostPerMW * 0.02; // 2% for solar
            const dataCenterOpCost = dataCenterSizeMW * dataCenterCostPerMW * 0.15; // 15% for data center
            
            operatingCost = solarOpCost + dataCenterOpCost;
            
            // Add grid connection costs
            installationCost += gridData.connectionCost * 1.5; // Hybrid needs more than solar but less than data center
        }
        
        // Calculate ROI and payback period
        const annualProfit = annualRevenue - operatingCost;
        roi = (annualProfit / installationCost) * 100; // ROI as percentage
        paybackPeriod = installationCost / annualProfit; // Years to recoup investment
        
        // Calculate NPV and IRR
        const projectLifespan = 25; // 25 years
        const discountRate = 0.08; // 8% discount rate
        
        // Calculate Net Present Value (NPV)
        let npv = -installationCost; // Initial investment is negative cash flow
        for (let year = 1; year <= projectLifespan; year++) {
            npv += annualProfit / Math.pow(1 + discountRate, year);
        }
        
        // Calculate Internal Rate of Return (IRR) - simplified approximation
        // In a real application, this would use a more sophisticated algorithm
        const irr = (annualProfit / installationCost) * 1.1; // Simple approximation
        
        return {
            installationCost: Math.round(installationCost),
            annualRevenue: Math.round(annualRevenue),
            operatingCost: Math.round(operatingCost),
            annualProfit: Math.round(annualProfit),
            roi: parseFloat(roi.toFixed(2)),
            paybackPeriod: parseFloat(paybackPeriod.toFixed(2)),
            npv: Math.round(npv),
            irr: parseFloat((irr * 100).toFixed(2)),
            projectLifespan: projectLifespan,
            financialScore: Math.min(100, Math.round(roi * 10)), // Financial score based on ROI
            riskLevel: roi > 15 ? 'Low' : roi > 10 ? 'Medium' : 'High',
            taxIncentives: this.calculateTaxIncentives(latitude, longitude, siteType)
        };
    }
    
    // Calculate available tax incentives based on location and site type
    calculateTaxIncentives(latitude, longitude, siteType) {
        // In a real implementation, this would query a tax incentive database
        // For now, we'll generate realistic data
        
        // Generate a deterministic but seemingly random value based on coordinates
        const seed = (latitude * 10000 + longitude * 10000) % 100;
        
        // Base incentives
        const federalIncentive = siteType === 'solar' ? 0.26 : 0.1; // 26% for solar, 10% for others
        
        // State incentives vary by location (simplified model)
        let stateIncentive;
        if (seed < 30) {
            stateIncentive = 0.15; // High incentive states
        } else if (seed < 70) {
            stateIncentive = 0.08; // Medium incentive states
        } else {
            stateIncentive = 0.03; // Low incentive states
        }
        
        // Local incentives
        const localIncentive = seed < 50 ? 0.05 : 0.02;
        
        return {
            federal: federalIncentive,
            state: stateIncentive,
            local: localIncentive,
            total: federalIncentive + stateIncentive + localIncentive,
            estimatedValue: function(installationCost) {
                return Math.round(installationCost * (federalIncentive + stateIncentive + localIncentive));
            }
        };
    }
    
    // Get comprehensive site analysis
    async getComprehensiveSiteAnalysis(latitude, longitude, siteType) {
        // Fetch all the necessary data
        const solarData = await this.getSolarResourceData(latitude, longitude);
        const weatherData = await this.getWeatherData(latitude, longitude);
        const elevationData = await this.getElevationData(latitude, longitude);
        const landData = await this.getLandSuitabilityData(latitude, longitude);
        const gridData = await this.getGridInfrastructureData(latitude, longitude);
        const environmentalData = await this.getEnvironmentalImpactData(latitude, longitude, siteType);
        const financialData = await this.getFinancialProjection(latitude, longitude, siteType, solarData, gridData);
        
        // Calculate overall site score
        const solarScore = solarData.annual_average.solar_radiation.value * 10; // 0-100 scale
        const landScore = landData.score; // Already 0-100
        const gridScore = gridData.score; // Already 0-100
        const environmentalScore = environmentalData.overallScore; // Already 0-100
        const financialScore = financialData.financialScore; // Already 0-100
        
        // Weight the scores based on site type
        let weights;
        if (siteType === 'solar') {
            weights = {
                solar: 0.3,
                land: 0.2,
                grid: 0.15,
                environmental: 0.15,
                financial: 0.2
            };
        } else if (siteType === 'data-center') {
            weights = {
                solar: 0.1,
                land: 0.2,
                grid: 0.3,
                environmental: 0.1,
                financial: 0.3
            };
        } else { // hybrid
            weights = {
                solar: 0.25,
                land: 0.2,
                grid: 0.2,
                environmental: 0.15,
                financial: 0.2
            };
        }
        
        const overallScore = Math.round(
            solarScore * weights.solar +
            landScore * weights.land +
            gridScore * weights.grid +
            environmentalScore * weights.environmental +
            financialScore * weights.financial
        );
        
        // Generate recommendations
        const recommendations = this.generateRecommendations(
            siteType, solarScore, landScore, gridScore, environmentalScore, financialScore
        );
        
        return {
            overallScore: overallScore,
            suitabilityRating: this.getSuitabilityRating(overallScore),
            solarData: solarData,
            weatherData: weatherData,
            elevationData: elevationData,
            landData: landData,
            gridData: gridData,
            environmentalData: environmentalData,
            financialData: financialData,
            recommendations: recommendations,
            timestamp: new Date().toISOString()
        };
    }
    
    // Get suitability rating based on score
    getSuitabilityRating(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Very Good';
        if (score >= 70) return 'Good';
        if (score >= 60) return 'Above Average';
        if (score >= 50) return 'Average';
        if (score >= 40) return 'Below Average';
        if (score >= 30) return 'Poor';
        return 'Unsuitable';
    }
    
    // Generate recommendations based on scores
    generateRecommendations(siteType, solarScore, landScore, gridScore, environmentalScore, financialScore) {
        const recommendations = [];
        
        // Solar recommendations
        if (solarScore < 60) {
            recommendations.push({
                category: 'Solar Resource',
                issue: 'Low solar irradiance',
                recommendation: 'Consider increasing solar panel efficiency or adjusting the array size to compensate for lower irradiance.'
            });
        }
        
        // Land recommendations
        if (landScore < 60) {
            recommendations.push({
                category: 'Land Suitability',
                issue: 'Suboptimal land characteristics',
                recommendation: 'Evaluate land preparation costs and consider alternative layouts to maximize usable area.'
            });
        }
        
        // Grid recommendations
        if (gridScore < 60) {
            recommendations.push({
                category: 'Grid Infrastructure',
                issue: 'Grid connection challenges',
                recommendation: 'Investigate costs for grid upgrades or consider on-site storage solutions to reduce grid dependency.'
            });
        }
        
        // Environmental recommendations
        if (environmentalScore < 60) {
            recommendations.push({
                category: 'Environmental Impact',
                issue: 'Potential environmental concerns',
                recommendation: 'Conduct detailed environmental assessment and develop mitigation strategies for identified impacts.'
            });
        }
        
        // Financial recommendations
        if (financialScore < 60) {
            recommendations.push({
                category: 'Financial Viability',
                issue: 'Lower than optimal financial returns',
                recommendation: 'Explore additional revenue streams, tax incentives, or phased development to improve financial performance.'
            });
        }
        
        // If all scores are good, provide optimization recommendations
        if (recommendations.length === 0) {
            recommendations.push({
                category: 'Optimization',
                issue: 'Good overall site, potential for optimization',
                recommendation: 'Consider advanced technologies like bifacial panels, tracking systems, or integrated storage to further enhance performance.'
            });
        }
        
        return recommendations;
    }
    
    // Update site data in real-time
    async updateSiteData(latitude, longitude, siteType) {
        // This method would be called periodically to refresh data
        // For demonstration, we'll just call the comprehensive analysis
        return await this.getComprehensiveSiteAnalysis(latitude, longitude, siteType);
    }
    
    // Export site data to CSV format
    exportSiteDataToCSV(siteData) {
        let csvContent = 'Category,Parameter,Value,Unit\n';
        
        // Solar data
        csvContent += `Solar,Irradiance,${siteData.solarData.annual_average.solar_radiation.value},${siteData.solarData.annual_average.solar_radiation.units}\n`;
        
        // Land data
        csvContent += `Land,Suitability,${siteData.landData.suitability},\n`;
        csvContent += `Land,Score,${siteData.landData.score},/100\n`;
        
        // Grid data
        csvContent += `Grid,Distance,${siteData.gridData.distance},km\n`;
        csvContent += `Grid,Capacity,${siteData.gridData.capacity},MW\n`;
        csvContent += `Grid,Connection Cost,${siteData.gridData.connectionCost},USD\n`;
        
        // Environmental data
        csvContent += `Environmental,Carbon Offset,${siteData.environmentalData.carbonOffset},tons CO2/year\n`;
        csvContent += `Environmental,Overall Score,${siteData.environmentalData.overallScore},/100\n`;
        
        // Financial data
        csvContent += `Financial,Installation Cost,${siteData.financialData.installationCost},USD\n`;
        csvContent += `Financial,Annual Revenue,${siteData.financialData.annualRevenue},USD\n`;
        csvContent += `Financial,ROI,${siteData.financialData.roi},%\n`;
        csvContent += `Financial,Payback Period,${siteData.financialData.paybackPeriod},years\n`;
        
        // Overall score
        csvContent += `Overall,Site Score,${siteData.overallScore},/100\n`;
        csvContent += `Overall,Suitability Rating,${siteData.suitabilityRating},\n`;
        
        return csvContent;
    }
    
    // Generate site report in JSON format
    generateSiteReport(siteData) {
        return JSON.stringify(siteData, null, 2);
    }
}

// Export the class for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SiteSelectionRealTimeData,
        SiteSelectionRealtime: class SiteSelectionRealtime {
            constructor() {
                this.dataService = new SiteSelectionRealTimeData();
                this.charts = {};
                this.initializeEventListeners();
                this.updateInterval = 30000; // Update every 30 seconds
                this.marker = null; // Store the current location marker
            }

            initializeMapClickHandler() {
                const map = L.map('site-map').setView([36.7783, -119.4179], 5);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);

                map.on('click', (e) => {
                    const { lat, lng } = e.latlng;
                    if (this.marker) {
                        this.marker.setLatLng(e.latlng);
                    } else {
                        this.marker = L.marker(e.latlng).addTo(map);
                    }
                    this.updateLocationInputs(lat, lng);
                    this.updateCharts();
                });
            }

            async updateCharts() {
                const latitude = parseFloat(document.getElementById('latitude').value);
                const longitude = parseFloat(document.getElementById('longitude').value);
                const siteType = document.getElementById('site-type').value;

                if (isNaN(latitude) || isNaN(longitude)) return;

                try {
                    const results = document.getElementById('results');
                    results.classList.remove('hidden');
                    results.classList.add('loading');
                    
                    const data = await this.dataService.getComprehensiveSiteAnalysis(latitude, longitude, siteType);
                    
                    this.updateChartDisplays(data);

                    if (data.solarData) {
                        document.getElementById('weather-conditions').value = 
                            `Solar: ${data.solarData.annual_average.solar_radiation.value} ${data.solarData.annual_average.solar_radiation.units}`;
                    }

                    results.classList.remove('loading');
                    this.scheduleNextUpdate();
                } catch (error) {
                    console.error('Error updating charts:', error);
                }
            }
        }
    };
} else {
    // For browser environments
    window.SiteSelectionRealTimeData = SiteSelectionRealTimeData;
    window.SiteSelectionRealtime = SiteSelectionRealtime;
}