/**
 * Weather API Integration
 * Handles fetching weather data for site analysis
 */

// API key (would be stored securely in a production environment)
const WEATHER_API_KEY = 'demo_key';

/**
 * Fetch current weather data for a location
 * @param {string|object} location - Location name or {lat, lon} object
 * @returns {Promise<object>} Weather data
 */
async function fetchWeatherData(location) {
    try {
        // Handle location parameter as either string or coordinates
        const locationParam = typeof location === 'string' 
            ? location 
            : `${location.lat},${location.lon}`;
        
        // In a real app, we would use the actual API
        // For demo purposes, we'll simulate the API response
        if (WEATHER_API_KEY === 'demo_key') {
            console.log('Using demo weather data');
            return simulateWeatherData(locationParam);
        }
        
        // Real API call
        const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${locationParam}`);
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return simulateWeatherData(location); // Fallback to simulated data
    }
}

/**
 * Fetch historical weather data for a location
 * @param {string|object} location - Location name or {lat, lon} object
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<object>} Historical weather data
 */
async function fetchHistoricalWeatherData(location, date) {
    try {
        // For demo purposes, we'll simulate the API response
        return simulateHistoricalWeatherData(location, date);
    } catch (error) {
        console.error('Error fetching historical weather data:', error);
        return simulateHistoricalWeatherData(location, date); // Fallback to simulated data
    }
}

/**
 * Simulate weather data for demo purposes
 * @param {string|object} location - Location name or {lat, lon} object
 * @returns {object} Simulated weather data
 */
function simulateWeatherData(location) {
    // Parse location to get latitude if it's a string with coordinates
    let latitude = 0;
    if (typeof location === 'string' && location.includes(',')) {
        latitude = parseFloat(location.split(',')[0]);
    } else if (typeof location === 'object' && location.lat) {
        latitude = location.lat;
    }
    
    // Generate weather based on latitude (simplified)
    const isTropical = Math.abs(latitude) < 23.5;
    const isDesert = Math.abs(latitude) >= 23.5 && Math.abs(latitude) < 30;
    const isTemplateOrPolar = Math.abs(latitude) >= 30;
    
    // Random temperature based on climate zone
    let tempMin, tempMax, windMin, windMax;
    
    if (isTropical) {
        tempMin = 25; tempMax = 35;
        windMin = 5; windMax = 15;
    } else if (isDesert) {
        tempMin = 20; tempMax = 40;
        windMin = 10; windMax = 25;
    } else {
        tempMin = 5; tempMax = 25;
        windMin = 8; windMax = 20;
    }
    
    const temp = Math.floor(Math.random() * (tempMax - tempMin + 1)) + tempMin;
    const windSpeed = Math.floor(Math.random() * (windMax - windMin + 1)) + windMin;
    const humidity = Math.floor(Math.random() * 50) + 30; // 30-80%
    
    return {
        location: {
            name: typeof location === 'string' ? location.split(',')[0] : 'Custom Location',
            lat: typeof location === 'object' ? location.lat : latitude,
            lon: typeof location === 'object' ? location.lon : 0
        },
        current: {
            temp_c: temp,
            wind_kph: windSpeed,
            humidity: humidity,
            condition: {
                text: temp > 30 ? 'Sunny' : temp > 20 ? 'Partly cloudy' : 'Cloudy',
                icon: temp > 30 ? '//cdn.weatherapi.com/weather/64x64/day/113.png' : 
                      temp > 20 ? '//cdn.weatherapi.com/weather/64x64/day/116.png' : 
                      '//cdn.weatherapi.com/weather/64x64/day/119.png'
            }
        }
    };
}

/**
 * Simulate historical weather data for demo purposes
 * @param {string|object} location - Location name or {lat, lon} object
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {object} Simulated historical weather data
 */
function simulateHistoricalWeatherData(location, date) {
    // Generate 24 hours of data
    const hourlyData = [];
    
    for (let hour = 0; hour < 24; hour++) {
        // Temperature varies throughout the day
        const baseTemp = 20; // Base temperature
        const hourFactor = hour < 12 ? hour : 24 - hour; // 0 at midnight, peaks at noon
        const temp = baseTemp + hourFactor * 0.8; // Temperature curve
        
        hourlyData.push({
            time: `${date} ${hour.toString().padStart(2, '0')}:00`,
            temp_c: Math.round(temp * 10) / 10,
            wind_kph: Math.floor(Math.random() * 15) + 5,
            humidity: Math.floor(Math.random() * 30) + 50
        });
    }
    
    return {
        location: {
            name: typeof location === 'string' ? location.split(',')[0] : 'Custom Location',
            lat: typeof location === 'object' ? location.lat : 0,
            lon: typeof location === 'object' ? location.lon : 0
        },
        forecast: {
            forecastday: [{
                date: date,
                day: {
                    avgtemp_c: Math.round(hourlyData.reduce((sum, hour) => sum + hour.temp_c, 0) / 24 * 10) / 10,
                    maxtemp_c: Math.max(...hourlyData.map(hour => hour.temp_c)),
                    mintemp_c: Math.min(...hourlyData.map(hour => hour.temp_c)),
                    avghumidity: Math.round(hourlyData.reduce((sum, hour) => sum + hour.humidity, 0) / 24),
                    maxwind_kph: Math.max(...hourlyData.map(hour => hour.wind_kph))
                },
                hour: hourlyData
            }]
        }
    };
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchWeatherData,
        fetchHistoricalWeatherData
    };
}
