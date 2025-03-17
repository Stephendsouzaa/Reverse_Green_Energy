// Real-time Data Service for Site Selection Charts

class RealTimeDataService {
    constructor() {
        this.baseUrl = '/api';
        this.cachedData = {};
    }

    async fetchSiteSuitabilityData(latitude, longitude, siteType) {
        try {
            // Clear cached data to ensure fresh data for each request
            this.cachedData = {};

            // Fetch all required data concurrently
            const [solarData, landData, energyCostData, windData] = await Promise.all([
                this.fetchSolarData(),
                this.fetchLandSuitabilityData(),
                this.fetchEnergyCostData(),
                this.fetchWindSpeedData()
            ]);

            // Find the closest location and calculate distances for weighted averaging
            const locationData = this.findNearestLocations(latitude, longitude, solarData);
            
            // Calculate weighted averages based on distance
            const solarIrradiance = this.calculateWeightedAverage(locationData, 'solar_irradiance');
            const landSuitability = this.calculateLandSuitability(locationData, landData);
            const energyCost = this.calculateEnergyCost(locationData, energyCostData);
            const windSpeed = this.calculateWeightedAverage(locationData, 'wind_speed', windData);

            // Calculate site-specific metrics
            const solarPotential = this.calculateSolarPotential(solarIrradiance, siteType);
            const gridInfrastructure = this.calculateGridInfrastructure(latitude, longitude);
            const environmentalImpact = this.calculateEnvironmentalImpact(solarIrradiance, windSpeed, landSuitability);
            const financialViability = this.calculateFinancialViability(energyCost, solarPotential, siteType);

            return {
                solarPotential: Math.round(solarPotential),
                landSuitability: Math.round(landSuitability),
                gridInfrastructure: Math.round(gridInfrastructure),
                environmentalImpact: Math.round(environmentalImpact),
                financialViability: Math.round(financialViability),
                environmentalData: {
                    carbonOffset: Math.round(solarPotential * 1.2),
                    landUse: Math.round(landSuitability),
                    wildlifeImpact: Math.round(this.calculateWildlifeImpact(landSuitability, environmentalImpact)),
                    waterResources: Math.round(this.calculateWaterResources(latitude, longitude))
                },
                financialData: {
                    yearlyROI: this.calculateYearlyROI(solarPotential, energyCost, siteType)
                },
                implementationData: {
                    phases: this.calculateImplementationPhases(solarPotential, gridInfrastructure)
                }
            };
        } catch (error) {
            console.error('Error in fetchSiteSuitabilityData:', error);
            throw error;
        }
    }

    findNearestLocations(latitude, longitude, locations, maxLocations = 3) {
        return locations
            .map(loc => ({
                ...loc,
                distance: this.calculateDistance(latitude, longitude, loc.latitude, loc.longitude)
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, maxLocations);
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    toRad(value) {
        return value * Math.PI / 180;
    }

    calculateWeightedAverage(locations, property, dataset = null) {
        const totalWeight = locations.reduce((sum, loc) => sum + (1 / loc.distance), 0);
        return locations.reduce((sum, loc) => {
            const value = dataset ? 
                dataset.find(d => d.location === loc.location)?.[property] || 0 :
                loc[property] || 0;
            return sum + (value * (1 / loc.distance) / totalWeight);
        }, 0);
    }

    calculateSolarPotential(irradiance, siteType) {
        const baseScore = (irradiance / 7) * 100; // Normalize to 0-100
        const typeMultiplier = {
            'solar': 1.2,
            'data-center': 0.8,
            'hybrid': 1.0
        }[siteType] || 1.0;
        return Math.min(baseScore * typeMultiplier, 100);
    }

    calculateFinancialViability(energyCost, solarPotential, siteType) {
        const baseCost = {
            'solar': 1000000,
            'data-center': 5000000,
            'hybrid': 6000000
        }[siteType] || 1000000;
        
        const potentialRevenue = solarPotential * 10000; // Estimated revenue per point
        const costFactor = (1 - energyCost) * 100; // Lower energy cost = higher viability
        return Math.min(((potentialRevenue / baseCost) * costFactor), 100);
    }

    calculateYearlyROI(solarPotential, energyCost, siteType) {
        const baseROI = solarPotential * (1 - energyCost) * 0.8;
        return [1, 2, 3, 4, 5].map(year => 
            Math.round(baseROI * year * this.getTypeMultiplier(siteType)));
    }

    getTypeMultiplier(siteType) {
        return {
            'solar': 1.2,
            'data-center': 0.9,
            'hybrid': 1.1
        }[siteType] || 1.0;
    }

    calculateImplementationPhases(solarPotential, gridInfrastructure) {
        const total = 100;
        const phase1 = Math.round(35 + (solarPotential - gridInfrastructure) * 0.1);
        const phase2 = Math.round(40 - (solarPotential - gridInfrastructure) * 0.05);
        const phase3 = total - phase1 - phase2;
        return [phase1, phase2, phase3];
    }

    /**
     * Fetch solar irradiance data from the API
     * @returns {Promise<Array>} - Array of solar irradiance data by location
     */
    async fetchSolarData() {
        if (this.cachedData.solarData) {
            return this.cachedData.solarData;
        }

        try {
            const response = await fetch(`${this.baseUrl}/solar/solar-data`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.cachedData.solarData = data.data || [];
            return this.cachedData.solarData;
        } catch (error) {
            console.error('Error fetching solar data:', error);
            // Fallback to local dataset if API fails
            return [
                {"location": "California", "latitude": 36.7783, "longitude": -119.4179, "solar_irradiance": 5.8},
                {"location": "Arizona", "latitude": 34.0489, "longitude": -111.0937, "solar_irradiance": 6.2},
                {"location": "Texas", "latitude": 31.9686, "longitude": -99.9018, "solar_irradiance": 5.5}
            ];
        }
    }

    /**
     * Fetch land suitability data
     * @returns {Promise<Array>} - Array of land suitability data by location
     */
    async fetchLandSuitabilityData() {
        if (this.cachedData.landData) {
            return this.cachedData.landData;
        }

        try {
            // In a real implementation, this would be an API call
            // For now, we'll use the local dataset
            this.cachedData.landData = [
                {"location": "California", "latitude": 36.7783, "longitude": -119.4179, "land_suitability": "High"},
                {"location": "Arizona", "latitude": 34.0489, "longitude": -111.0937, "land_suitability": "Medium"},
                {"location": "Texas", "latitude": 31.9686, "longitude": -99.9018, "land_suitability": "High"}
            ];
            return this.cachedData.landData;
        } catch (error) {
            console.error('Error fetching land suitability data:', error);
            return [];
        }
    }

    /**
     * Fetch energy cost data
     * @returns {Promise<Array>} - Array of energy cost data by location
     */
    async fetchEnergyCostData() {
        if (this.cachedData.energyCostData) {
            return this.cachedData.energyCostData;
        }

        try {
            // In a real implementation, this would be an API call
            // For now, we'll use the local dataset
            this.cachedData.energyCostData = [
                {"location": "California", "cost_per_kwh": 0.18},
                {"location": "Arizona", "cost_per_kwh": 0.15},
                {"location": "Texas", "cost_per_kwh": 0.12}
            ];
            return this.cachedData.energyCostData;
        } catch (error) {
            console.error('Error fetching energy cost data:', error);
            return [];
        }
    }

    /**
     * Fetch wind speed data
     * @returns {Promise<Array>} - Array of wind speed data by location
     */
    async fetchWindSpeedData() {
        if (this.cachedData.windData) {
            return this.cachedData.windData;
        }

        try {
            // In a real implementation, this would be an API call
            // For now, we'll use the local dataset
            this.cachedData.windData = [
                {"location": "California", "latitude": 36.7783, "longitude": -119.4179, "wind_speed": 6.5},
                {"location": "Arizona", "latitude": 34.0489, "longitude": -111.0937, "wind_speed": 7.1},
                {"location": "Texas", "latitude": 31.9686, "longitude": -99.9018, "wind_speed": 6.8}
            ];
            return this.cachedData.windData;
        } catch (error) {
            console.error('Error fetching wind speed data:', error);
            return [];
        }
    }
}

// Initialize and export the service
const realTimeDataService = new RealTimeDataService();
export default realTimeDataService;