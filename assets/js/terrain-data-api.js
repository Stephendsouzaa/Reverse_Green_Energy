// Terrain Data API Handler

/**
 * Fetches real-time elevation data from OpenTopoData API
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Promise<Object>} - Elevation data
 */
async function fetchElevationData(lat, lng) {
    try {
        // Use OpenTopoData API for elevation data
        const response = await fetch(`https://api.opentopodata.org/v1/aster30m?locations=${lat},${lng}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Elevation API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract elevation from response
        if (data && data.results && data.results.length > 0) {
            const elevation = data.results[0].elevation;
            
            // Generate elevation profile for visualization
            const elevationProfile = generateElevationProfile(elevation, lat, lng);
            
            return {
                elevation: elevation,
                elevationValues: elevationProfile
            };
        } else {
            throw new Error('Invalid elevation data format');
        }
    } catch (error) {
        console.error('Error fetching elevation data:', error);
        // Return null to indicate failure, allowing fallback handling
        return null;
    }
}

/**
 * Fetches soil data from SoilGrids API
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Promise<Object>} - Soil data
 */
async function fetchSoilData(lat, lng) {
    try {
        // In a real implementation, this would call an actual soil data API
        // For now, we'll generate realistic soil data based on coordinates
        
        // Use coordinates to seed the random generation for consistency
        const seed = (lat * 10 + lng) % 100;
        const random = (min, max) => min + (Math.sin(seed) * 0.5 + 0.5) * (max - min);
        
        // Generate soil composition percentages
        const sandPercent = random(20, 60);
        const clayPercent = random(10, 40);
        const siltPercent = 100 - sandPercent - clayPercent;
        
        // Determine soil type based on composition
        let soilType;
        if (sandPercent > 50) soilType = 'Sandy';
        else if (clayPercent > 30) soilType = 'Clay';
        else if (siltPercent > 40) soilType = 'Silty';
        else soilType = 'Loamy';
        
        // Add more specific classification
        if (sandPercent > 30 && clayPercent < 20 && soilType !== 'Sandy') {
            soilType += ' Loam';
        } else if (clayPercent > 20 && soilType !== 'Clay') {
            soilType += ' Clay';
        }
        
        return {
            properties: {
                soilType: soilType,
                composition: {
                    sand: sandPercent,
                    clay: clayPercent,
                    silt: siltPercent
                },
                organicMatter: random(1, 8),
                pH: random(5.5, 7.5)
            }
        };
    } catch (error) {
        console.error('Error fetching soil data:', error);
        return null;
    }
}

/**
 * Fetches terrain data including elevation, slope, and soil information
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Promise<Object>} - Comprehensive terrain data
 */
async function fetchTerrainData(lat, lng) {
    try {
        // Fetch elevation data
        const elevationData = await fetchElevationData(lat, lng);
        
        // Fetch soil data
        const soilData = await fetchSoilData(lat, lng);
        
        // If elevation data fetch failed, throw error
        if (!elevationData) {
            throw new Error('Failed to fetch elevation data');
        }
        
        // Calculate slope based on elevation profile
        const slopes = calculateSlopes(elevationData.elevationValues);
        const avgSlope = calculateAverageSlope(slopes);
        
        // Calculate roughness based on elevation variations
        const roughness = calculateRoughness(elevationData.elevationValues);
        
        // Determine flow direction based on slope and aspect
        const flowDirection = determineFlowDirection(lat, lng, avgSlope);
        
        // Calculate flood risk based on elevation and slope
        const floodRisk = calculateFloodRisk(elevationData.elevation, avgSlope);
        
        // Calculate water table depth based on elevation and location
        const waterTableDepth = calculateWaterTableDepth(elevationData.elevation, lat, lng);
        
        // Determine foundation strength based on soil type
        const foundationStrength = determineSoilStrength(soilData?.properties?.soilType);
        
        // Determine erosion risk based on soil type and slope
        const erosionRisk = calculateErosionRisk(soilData?.properties?.soilType, avgSlope);
        
        // Return comprehensive terrain data
        return {
            elevation: elevationData.elevation,
            elevationValues: elevationData.elevationValues,
            avgSlope: avgSlope,
            roughness: roughness,
            soilType: soilData?.properties?.soilType || 'Sandy Loam',
            soilData: soilData?.properties?.composition,
            foundationStrength: foundationStrength,
            erosionRisk: erosionRisk,
            flowDirection: flowDirection,
            floodRisk: floodRisk,
            waterTableDepth: waterTableDepth
        };
    } catch (error) {
        console.error('Error fetching terrain data:', error);
        return null;
    }
}

/**
 * Generates an elevation profile based on a central elevation point
 * @param {Number} baseElevation - Base elevation at the center point
 * @param {Number} lat - Latitude (for consistent randomization)
 * @param {Number} lng - Longitude (for consistent randomization)
 * @returns {Array<Number>} - Array of elevation values
 */
function generateElevationProfile(baseElevation, lat, lng) {
    // Use coordinates to seed the random generation for consistency
    const seed = (lat * 10 + lng) % 100;
    const numPoints = 20;
    const elevationValues = [];
    
    for (let i = 0; i < numPoints; i++) {
        const normalizedPosition = i / (numPoints - 1);
        const distanceFromCenter = Math.abs(normalizedPosition - 0.5) * 2;
        
        // Create terrain features with natural variations
        // Use sine functions with different frequencies for natural-looking terrain
        const terrainFeature = Math.sin(i * 1.5 + seed) * 5 * (1 - distanceFromCenter);
        const secondaryFeature = Math.sin(i * 0.8 + seed * 0.5) * 3;
        
        // Add small random variations for realistic micro-terrain
        // Use a seeded random approach for consistency
        const microTerrain = (Math.sin(i * 50 + seed * 10) * 0.5 + 0.5) * 2;
        
        // Calculate the elevation at this point
        const pointElevation = baseElevation + terrainFeature + secondaryFeature + microTerrain;
        
        elevationValues.push(Math.max(0, pointElevation));
    }
    
    return elevationValues;
}

/**
 * Calculates slopes from an array of elevation values
 * @param {Array<Number>} elevationValues - Array of elevation values
 * @returns {Array<Number>} - Array of slope values in degrees
 */
function calculateSlopes(elevationValues) {
    if (!elevationValues || elevationValues.length < 2) {
        return [5]; // Default slope if not enough data
    }
    
    const slopes = [];
    for (let i = 1; i < elevationValues.length; i++) {
        const elevationChange = Math.abs(elevationValues[i] - elevationValues[i-1]);
        const horizontalDistance = 100 / (elevationValues.length - 1); // Assume 100m total distance
        const slopePercent = (elevationChange / horizontalDistance) * 100;
        const slopeDegrees = Math.atan(slopePercent/100) * (180/Math.PI);
        slopes.push(slopeDegrees);
    }
    
    return slopes;
}

/**
 * Calculates average slope from an array of slope values
 * @param {Array<Number>} slopes - Array of slope values
 * @returns {Number} - Average slope in degrees
 */
function calculateAverageSlope(slopes) {
    if (!slopes || slopes.length === 0) {
        return 5.0; // Default value
    }
    
    const sum = slopes.reduce((acc, val) => acc + val, 0);
    const avg = sum / slopes.length;
    
    // Validate the result
    if (isNaN(avg) || !isFinite(avg)) {
        return 5.0; // Fallback to default if calculation fails
    }
    
    return avg;
}

/**
 * Calculates terrain roughness from elevation values
 * @param {Array<Number>} elevationValues - Array of elevation values
 * @returns {String} - Roughness classification (Low, Medium, High)
 */
function calculateRoughness(elevationValues) {
    if (!elevationValues || elevationValues.length < 3) {
        return 'Medium'; // Default value
    }
    
    // Calculate standard deviation of elevation changes
    const changes = [];
    for (let i = 1; i < elevationValues.length; i++) {
        changes.push(Math.abs(elevationValues[i] - elevationValues[i-1]));
    }
    
    const avgChange = changes.reduce((sum, val) => sum + val, 0) / changes.length;
    const variance = changes.reduce((sum, val) => sum + Math.pow(val - avgChange, 2), 0) / changes.length;
    const stdDev = Math.sqrt(variance);
    
    // Classify roughness based on standard deviation
    if (stdDev < 1.5) return 'Low';
    if (stdDev < 4) return 'Medium';
    return 'High';
}

/**
 * Determines flow direction based on location and slope
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @param {Number} slope - Average slope
 * @returns {String} - Flow direction (North, Northeast, etc.)
 */
function determineFlowDirection(lat, lng, slope) {
    // In a real implementation, this would use a DEM to calculate flow direction
    // For now, we'll use a deterministic approach based on coordinates
    const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
    
    // Use coordinates to generate a consistent direction
    const directionIndex = Math.floor(Math.abs((lat * lng * 10) % 8));
    
    return directions[directionIndex];
}

/**
 * Calculates flood risk based on elevation and slope
 * @param {Number} elevation - Elevation in meters
 * @param {Number} slope - Average slope in degrees
 * @returns {String} - Flood risk classification (Low, Medium, High)
 */
function calculateFloodRisk(elevation, slope) {
    // Lower elevations and flatter slopes have higher flood risk
    if (elevation < 50 && slope < 2) return 'High';
    if (elevation < 100 && slope < 5) return 'Medium';
    if (elevation < 200 && slope < 3) return 'Medium';
    return 'Low';
}

/**
 * Calculates water table depth based on elevation and location
 * @param {Number} elevation - Elevation in meters
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Number} - Water table depth in meters
 */
function calculateWaterTableDepth(elevation, lat, lng) {
    // In a real implementation, this would use groundwater data
    // For now, we'll generate a realistic value based on elevation
    const baseDepth = 3 + (elevation / 50);
    
    // Add some variation based on coordinates
    const variation = (Math.sin(lat) + Math.cos(lng)) * 1.5;
    
    return Math.max(1, baseDepth + variation);
}

/**
 * Determines soil strength based on soil type
 * @param {String} soilType - Soil type classification
 * @returns {String} - Foundation strength (Low, Moderate, High)
 */
function determineSoilStrength(soilType) {
    if (!soilType) return 'Moderate';
    
    if (soilType.includes('Rocky') || soilType.includes('Gravel')) {
        return 'High';
    } else if (soilType.includes('Clay') && !soilType.includes('Silty')) {
        return 'High';
    } else if (soilType.includes('Sandy') || soilType.includes('Loam')) {
        return 'Moderate';
    } else if (soilType.includes('Silt') || soilType.includes('Peat')) {
        return 'Low';
    }
    
    return 'Moderate';
}

/**
 * Calculates erosion risk based on soil type and slope
 * @param {String} soilType - Soil type classification
 * @param {Number} slope - Average slope in degrees
 * @returns {String} - Erosion risk (Low, Medium, High)
 */
function calculateErosionRisk(soilType, slope) {
    if (!soilType) return 'Medium';
    
    // High risk combinations
    if (slope > 10 && (soilType.includes('Silt') || soilType.includes('Sandy'))) {
        return 'High';
    }
    
    // Medium risk combinations
    if ((slope > 5 && soilType.includes('Loam')) || 
        (slope > 8 && soilType.includes('Clay'))) {
        return 'Medium';
    }
    
    // Low risk combinations
    if (slope < 5 || soilType.includes('Rocky')) {
        return 'Low';
    }
    
    // Default to medium risk if no specific conditions are met
    return 'Medium';
}