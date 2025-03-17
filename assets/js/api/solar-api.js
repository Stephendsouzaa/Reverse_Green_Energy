/**
 * Solar API Integration
 * Handles fetching solar irradiance data for site analysis
 */

// API key (would be stored securely in a production environment)
const SOLAR_API_KEY = 'demo_key';

/**
 * Fetch solar irradiance data for a location
 * @param {object} coords - {lat, lon} object
 * @returns {Promise<object>} Solar irradiance data
 */
async function fetchSolarData(coords) {
    try {
        // In a real app, we would use the actual API
        // For demo purposes, we'll simulate the API response
        if (SOLAR_API_KEY === 'demo_key') {
            console.log('Using demo solar data');
            return simulateSolarData(coords);
        }
        
        // Real API call would go here
        const response = await fetch(`https://api.solardata.example/v1/irradiance?lat=${coords.lat}&lon=${coords.lon}&key=${SOLAR_API_KEY}`);
        
        if (!response.ok) {
            throw new Error(`Solar API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching solar data:', error);
        return simulateSolarData(coords); // Fallback to simulated data
    }
}

/**
 * Fetch historical solar irradiance data for a location
 * @param {object} coords - {lat, lon} object
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<object>} Historical solar irradiance data
 */
async function fetchHistoricalSolarData(coords, startDate, endDate) {
    try {
        // For demo purposes, we'll simulate the API response
        return simulateHistoricalSolarData(coords, startDate, endDate);
    } catch (error) {
        console.error('Error fetching historical solar data:', error);
        return simulateHistoricalSolarData(coords, startDate, endDate); // Fallback to simulated data
    }
}

/**
 * Simulate solar irradiance data for demo purposes
 * @param {object} coords - {lat, lon} object
 * @returns {object} Simulated solar irradiance data
 */
function simulateSolarData(coords) {
    // Generate solar irradiance based on latitude (simplified)
    const latitude = Math.abs(coords.lat);
    
    // Solar irradiance decreases as you move away from the equator
    let baseIrradiance;
    if (latitude < 23.5) { // Tropical
        baseIrradiance = 6.0; // kWh/m²/day
    } else if (latitude < 45) { // Temperate
        baseIrradiance = 5.0; // kWh/m²/day
    } else { // Polar
        baseIrradiance = 3.5; // kWh/m²/day
    }
    
    // Add some randomness
    const irradiance = baseIrradiance + (Math.random() * 1.0 - 0.5);
    
    // Calculate annual potential
    const annualPotential = Math.round(irradiance * 365);
    
    return {
        location: {
            lat: coords.lat,
            lon: coords.lon
        },
        current: {
            irradiance_kwh_m2_day: Math.round(irradiance * 10) / 10,
            cloud_cover_percent: Math.floor(Math.random() * 30),
            timestamp: new Date().toISOString()
        },
        annual: {
            average_irradiance_kwh_m2_day: Math.round(irradiance * 10) / 10,
            total_potential_kwh_m2_year: annualPotential,
            optimal_tilt_angle: Math.round(latitude * 0.76), // Simplified calculation
            potential_rating: irradiance > 5.5 ? 'Excellent' : irradiance > 4.5 ? 'Good' : irradiance > 3.5 ? 'Moderate' : 'Poor'
        }
    };
}

/**
 * Simulate historical solar irradiance data for demo purposes
 * @param {object} coords - {lat, lon} object
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {object} Simulated historical solar irradiance data
 */
function simulateHistoricalSolarData(coords, startDate, endDate) {
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate number of days
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    // Generate daily data
    const dailyData = [];
    const currentDate = new Date(start);
    
    for (let i = 0; i < days; i++) {
        // Base irradiance depends on latitude
        const latitude = Math.abs(coords.lat);
        let baseIrradiance;
        
        if (latitude < 23.5) { // Tropical
            baseIrradiance = 6.0; // kWh/m²/day
        } else if (latitude < 45) { // Temperate
            baseIrradiance = 5.0; // kWh/m²/day
        } else { // Polar
            baseIrradiance = 3.5; // kWh/m²/day
        }
        
        // Add seasonal variation (simplified)
        const month = currentDate.getMonth();
        const seasonalFactor = latitude < 23.5 ? 
            1.0 : // Less seasonal variation in tropics
            1.0 + 0.5 * Math.sin((month - 5) * Math.PI / 6); // More variation in temperate/polar
        
        // Add some randomness for cloud cover, etc.
        const dailyVariation = Math.random() * 0.4 - 0.2;
        
        // Calculate daily irradiance
        const irradiance = baseIrradiance * seasonalFactor + dailyVariation;
        
        dailyData.push({
            date: currentDate.toISOString().split('T')[0],
            irradiance_kwh_m2_day: Math.round(irradiance * 10) / 10,
            cloud_cover_percent: Math.floor(Math.random() * 40),
            sunrise: '06:30',
            sunset: '18:30',
            daylight_hours: 12
        });
        
        // Increment date
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
        location: {
            lat: coords.lat,
            lon: coords.lon
        },
        period: {
            start_date: startDate,
            end_date: endDate,
            days: days
        },
        data: dailyData,
        summary: {
            average_irradiance_kwh_m2_day: Math.round(dailyData.reduce((sum, day) => sum + day.irradiance_kwh_m2_day, 0) / days * 10) / 10,
            max_irradiance_kwh_m2_day: Math.round(Math.max(...dailyData.map(day => day.irradiance_kwh_m2_day)) * 10) / 10,
            min_irradiance_kwh_m2_day: Math.round(Math.min(...dailyData.map(day => day.irradiance_kwh_m2_day)) * 10) / 10,
            total_irradiance_kwh_m2: Math.round(dailyData.reduce((sum, day) => sum + day.irradiance_kwh_m2_day, 0) * 10) / 10
        }
    };
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchSolarData,
        fetchHistoricalSolarData
    };
}
