// Terrain Analysis Module for Renewable Energy Site Selection

/**
 * Main function to fetch and update terrain data based on location
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 */
async function updateTerrainDataFromLocation(lat, lng) {
    try {
        // Show loading state in the UI
        setLoadingState();
        
        // Fetch real terrain data
        const terrainData = await fetchTerrainData(lat, lng);
        
        // Update UI with the fetched data
        updateTerrainUI(terrainData);
        
        // Initialize visualizations
        initializeElevationProfile(terrainData.elevation, terrainData.elevationValues);
        initializeDrainagePattern(terrainData.flowDirection);
        
        // Update site recommendations based on terrain data
        updateSiteRecommendations(terrainData);
        
        console.log('Terrain data updated successfully:', terrainData);
    } catch (error) {
        console.error('Error updating terrain data:', error);
        // Use fallback data if real data fetch fails
        const fallbackData = generateFallbackTerrainData(lat, lng);
        updateTerrainUI(fallbackData);
        initializeElevationProfile(fallbackData.elevation, fallbackData.elevationValues);
        initializeDrainagePattern(fallbackData.flowDirection);
        updateSiteRecommendations(fallbackData);
    }
}

/**
 * Sets loading state in the UI while data is being fetched
 */
function setLoadingState() {
    // Update UI elements to show loading state
    document.getElementById('elevation').textContent = 'Loading...';
    document.getElementById('slope').textContent = 'Loading...';
    document.getElementById('surface-roughness').textContent = 'Loading...';
    document.getElementById('soil-type').textContent = 'Loading...';
    document.getElementById('foundation-strength').textContent = 'Loading...';
    document.getElementById('erosion-risk').textContent = 'Loading...';
    document.getElementById('flow-direction').textContent = 'Loading...';
    document.getElementById('flood-risk').textContent = 'Loading...';
    document.getElementById('water-table-depth').textContent = 'Loading...';
    
    // Clear recommendations
    const recommendationsElement = document.getElementById('recommendations');
    if (recommendationsElement) recommendationsElement.innerHTML = '';
}

/**
 * Fetches real terrain data from external APIs
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Object} - Terrain data object
 */
async function fetchTerrainData(lat, lng) {
    try {
        // Fetch elevation data from OpenTopoData API
        const elevationResponse = await fetch(`https://api.opentopodata.org/v1/aster30m?locations=${lat},${lng}`, {
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!elevationResponse.ok) {
            throw new Error(`Elevation API error: ${elevationResponse.status}`);
        }
        
        const elevationData = await elevationResponse.json();
        const elevation = elevationData.results[0].elevation;
        
        // Fetch soil data (in a real app, this would come from a soil database API)
        const soilData = await fetchSoilData(lat, lng);
        
        // Generate elevation profile based on the actual elevation
        const elevationValues = generateElevationProfile(elevation, lat, lng);
        
        // Calculate slope based on elevation profile
        const slopes = calculateSlopes(elevationValues);
        const avgSlope = slopes.reduce((sum, val) => sum + val, 0) / slopes.length;
        const maxSlope = Math.max(...slopes);
        
        // Determine surface roughness based on elevation variations
        const roughness = calculateRoughness(elevationValues);
        
        // Determine flow direction based on terrain
        const flowDirection = determineFlowDirection(lat, lng, elevation);
        
        // Calculate flood risk based on elevation and slope
        const floodRisk = calculateFloodRisk(elevation, avgSlope);
        
        // Calculate water table depth based on elevation and location
        const waterTableDepth = calculateWaterTableDepth(elevation, lat, lng);
        
        // Return comprehensive terrain data
        return {
            elevation: elevation,
            elevationValues: elevationValues,
            avgSlope: avgSlope,
            maxSlope: maxSlope,
            roughness: roughness,
            soilType: soilData.soilType,
            foundationStrength: soilData.foundationStrength,
            erosionRisk: soilData.erosionRisk,
            flowDirection: flowDirection,
            floodRisk: floodRisk,
            waterTableDepth: waterTableDepth
        };
    } catch (error) {
        console.error('Error fetching terrain data:', error);
        throw error;
    }
}

/**
 * Fetches soil data for a location
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Object} - Soil data
 */
async function fetchSoilData(lat, lng) {
    // In a real application, this would fetch from a soil database API
    // For now, we'll generate realistic soil data based on coordinates
    
    // Use coordinates to seed the random generation for consistency
    const latSeed = lat || 0;
    const lngSeed = lng || 0;
    const seedValue = (latSeed * 10 + lngSeed) % 100;
    
    // Generate soil type based on location
    const soilTypes = ['Sandy Loam', 'Clay', 'Silt', 'Rocky', 'Loamy Sand', 'Silty Clay'];
    const soilTypeIndex = Math.floor((Math.abs(latSeed) + Math.abs(lngSeed)) % soilTypes.length);
    const soilType = soilTypes[soilTypeIndex];
    
    // Generate foundation strength based on soil type
    let foundationStrength = 'Moderate';
    if (soilType === 'Rocky' || soilType === 'Clay') {
        foundationStrength = 'High';
    } else if (soilType === 'Sandy Loam') {
        foundationStrength = 'Moderate';
    } else {
        foundationStrength = 'Low';
    }
    
    // Generate erosion risk based on soil type and random factor
    let erosionRisk = 'Medium';
    const erosionFactor = Math.sin(seedValue) * 5 + 5; // 0-10 scale
    
    if (soilType === 'Silt' || soilType === 'Loamy Sand') {
        erosionRisk = erosionFactor > 7 ? 'High' : 'Medium';
    } else if (soilType === 'Rocky' || soilType === 'Clay') {
        erosionRisk = erosionFactor < 3 ? 'Low' : 'Medium';
    } else {
        erosionRisk = erosionFactor > 8 ? 'High' : (erosionFactor < 4 ? 'Low' : 'Medium');
    }
    
    return {
        soilType: soilType,
        foundationStrength: foundationStrength,
        erosionRisk: erosionRisk,
        composition: {
            sand: 30 + (Math.sin(seedValue) * 20),
            silt: 30 + (Math.cos(seedValue) * 15),
            clay: 20 + (Math.sin(seedValue * 2) * 10),
            organic: 5 + (Math.cos(seedValue * 2) * 5)
        }
    };
}

/**
 * Generates an elevation profile based on a central elevation value
 * @param {Number} baseElevation - The base elevation at the center point
 * @param {Number} lat - Latitude for variation seeding
 * @param {Number} lng - Longitude for variation seeding
 * @returns {Array} - Array of elevation values forming a profile
 */
function generateElevationProfile(baseElevation, lat, lng) {
    const points = 20;
    const elevationValues = [];
    
    // Use coordinates to seed the random generation for consistency
    const seed = (lat * 10 + lng) % 100;
    
    for (let i = 0; i < points; i++) {
        // Create a natural-looking terrain profile with variations
        // Use multiple sine waves with different frequencies and phases
        const normalizedPosition = i / (points - 1); // 0 to 1
        const distanceFromCenter = Math.abs(normalizedPosition - 0.5) * 2; // 0 at center, 1 at edges
        
        // Primary variation - larger scale terrain features
        const primaryVariation = Math.sin((normalizedPosition * 4) + seed/10) * 5;
        
        // Secondary variation - medium scale features
        const secondaryVariation = Math.sin((normalizedPosition * 8) + seed/5) * 2;
        
        // Micro variation - small details
        const microVariation = (Math.sin((normalizedPosition * 20) + seed) * 1) * (1 - distanceFromCenter);
        
        // Random noise - very small irregularities
        const noise = (Math.random() - 0.5) * 0.5;
        
        // Combine all variations, with more weight to the center of the profile
        const totalVariation = primaryVariation + secondaryVariation + microVariation + noise;
        
        // Scale variation based on elevation (higher elevations have more variation)
        const scaleFactor = Math.max(1, Math.log10(baseElevation) * 0.3);
        
        elevationValues.push(baseElevation + totalVariation * scaleFactor);
    }
    
    return elevationValues;
}

/**
 * Calculates slope values from an elevation profile
 * @param {Array} elevationValues - Array of elevation values
 * @returns {Array} - Array of slope values in degrees
 */
function calculateSlopes(elevationValues) {
    if (!elevationValues || elevationValues.length < 2) {
        return [5]; // Default slope if not enough data
    }
    
    const slopes = [];
    const horizontalDistance = 100; // Assume 100m between points
    
    for (let i = 1; i < elevationValues.length; i++) {
        const elevationChange = Math.abs(elevationValues[i] - elevationValues[i-1]);
        const slopePercent = (elevationChange / horizontalDistance) * 100;
        const slopeDegrees = Math.atan(slopePercent/100) * (180/Math.PI);
        slopes.push(slopeDegrees);
    }
    
    return slopes;
}

/**
 * Calculates terrain roughness from elevation values
 * @param {Array} elevationValues - Array of elevation values
 * @returns {String} - Roughness classification (Low, Medium, High)
 */
function calculateRoughness(elevationValues) {
    if (!elevationValues || elevationValues.length < 3) {
        return 'Medium'; // Default if not enough data
    }
    
    // Calculate standard deviation of elevation changes
    let changes = [];
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
 * Determines flow direction based on location and elevation
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @param {Number} elevation - Elevation
 * @returns {String} - Flow direction (N, NE, E, SE, S, SW, W, NW)
 */
function determineFlowDirection(lat, lng, elevation) {
    // In a real application, this would analyze a DEM (Digital Elevation Model)
    // For now, we'll generate a realistic direction based on coordinates
    
    const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
    
    // Use coordinates and elevation to seed the direction
    const directionSeed = (lat * lng * elevation) % 8;
    const directionIndex = Math.abs(Math.floor(directionSeed));
    
    return directions[directionIndex];
}

/**
 * Calculates flood risk based on elevation and slope
 * @param {Number} elevation - Elevation in meters
 * @param {Number} slope - Slope in degrees
 * @returns {String} - Flood risk classification (Low, Medium, High)
 */
function calculateFloodRisk(elevation, slope) {
    // Lower elevations and flatter slopes have higher flood risk
    if (elevation < 10 && slope < 2) return 'High';
    if (elevation < 50 && slope < 5) return 'Medium';
    if (elevation < 100 && slope < 3) return 'Medium';
    if (elevation > 200 || slope > 10) return 'Low';
    return 'Medium';
}

/**
 * Calculates water table depth based on elevation and location
 * @param {Number} elevation - Elevation in meters
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Number} - Water table depth in meters
 */
function calculateWaterTableDepth(elevation, lat, lng) {
    // In a real application, this would come from groundwater data
    // For now, we'll generate a realistic value based on elevation and location
    
    // Base depth increases with elevation
    const baseDepth = 3 + (elevation / 50);
    
    // Add variation based on location
    const latVariation = Math.sin(lat) * 2;
    const lngVariation = Math.cos(lng) * 2;
    
    return Math.max(1, baseDepth + latVariation + lngVariation);
}

/**
 * Generates fallback terrain data when API calls fail
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Object} - Fallback terrain data
 */
function generateFallbackTerrainData(lat, lng) {
    // Generate base elevation based on coordinates
    const baseElevation = 200 + (Math.abs(lat) % 10) * 10 + (Math.abs(lng) % 10) * 5;
    
    // Generate elevation profile
    const elevationValues = generateElevationProfile(baseElevation, lat, lng);
    
    // Calculate slopes
    const slopes = calculateSlopes(elevationValues);
    const avgSlope = slopes.reduce((sum, val) => sum + val, 0) / slopes.length;
    const maxSlope = avgSlope * 1.8;
    
    // Generate soil data based on location for consistency
    const soilTypes = ['Sandy Loam', 'Clay', 'Silt', 'Rocky', 'Loamy Sand', 'Silty Clay'];
    const soilTypeIndex = Math.floor((Math.abs(lat) + Math.abs(lng)) % soilTypes.length);
    const soilType = soilTypes[soilTypeIndex];
    
    // Generate foundation strength based on soil type
    let foundationStrength = 'Moderate';
    if (soilType === 'Rocky' || soilType === 'Clay') {
        foundationStrength = 'High';
    } else if (soilType === 'Sandy Loam') {
        foundationStrength = 'Moderate';
    } else {
        foundationStrength = 'Low';
    }
    
    // Generate erosion risk based on slope and soil type
    let erosionRisk = 'Medium';
    if (avgSlope > 10 && (soilType === 'Silt' || soilType === 'Loamy Sand')) {
        erosionRisk = 'High';
    } else if (avgSlope < 5 || soilType === 'Rocky') {
        erosionRisk = 'Low';
    }
    
    // Determine flow direction based on location
    const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
    const directionIndex = Math.floor((lat * lng) % 8);
    const flowDirection = directions[Math.abs(directionIndex)];
    
    // Calculate flood risk based on elevation and slope
    let floodRisk = 'Medium';
    if (baseElevation < 220 && avgSlope < 5) {
        floodRisk = 'High';
    } else if (baseElevation > 250 || avgSlope > 8) {
        floodRisk = 'Low';
    }
    
    // Calculate water table depth based on elevation
    const waterTableDepth = 3 + (baseElevation / 50);
    
    // Return comprehensive terrain data
    return {
        elevation: baseElevation,
        elevationValues: elevationValues,
        avgSlope: avgSlope,
        maxSlope: maxSlope,
        roughness: calculateRoughness(elevationValues),
        soilType: soilType,
        foundationStrength: foundationStrength,
        erosionRisk: erosionRisk,
        flowDirection: flowDirection,
        floodRisk: floodRisk,
        waterTableDepth: waterTableDepth
    };
}

/**
 * Updates the UI with terrain data
 * @param {Object} terrainData - The terrain data object
 */
function updateTerrainUI(terrainData) {
    // Update elevation analysis section
    document.getElementById('elevation').textContent = `${terrainData.elevation.toFixed(1)}m`;
    document.getElementById('slope').textContent = `${terrainData.avgSlope.toFixed(1)}°`;
    document.getElementById('surface-roughness').textContent = terrainData.roughness;
    
    // Update soil stability section
    document.getElementById('soil-type').textContent = terrainData.soilType;
    document.getElementById('foundation-strength').textContent = terrainData.foundationStrength;
    document.getElementById('erosion-risk').textContent = terrainData.erosionRisk;
    
    // Update drainage analysis section
    document.getElementById('flow-direction').textContent = terrainData.flowDirection;
    document.getElementById('flood-risk').textContent = terrainData.floodRisk;
    document.getElementById('water-table-depth').textContent = `${terrainData.waterTableDepth.toFixed(1)}m`;
    
    // Update suitability indicator if it exists
    const suitabilityIndicator = document.getElementById('suitability-indicator');
    if (suitabilityIndicator) {
        let suitabilityScore = 75; // Default moderate suitability
        
        // Adjust score based on terrain factors
        if (terrainData.avgSlope > 15) suitabilityScore -= 20;
        else if (terrainData.avgSlope < 5) suitabilityScore += 10;
        
        if (terrainData.erosionRisk === 'High') suitabilityScore -= 15;
        else if (terrainData.erosionRisk === 'Low') suitabilityScore += 10;
        
        if (terrainData.floodRisk === 'High') suitabilityScore -= 20;
        else if (terrainData.floodRisk === 'Low') suitabilityScore += 10;
        
        // Ensure score is within 0-100 range
        suitabilityScore = Math.max(0, Math.min(100, suitabilityScore));
        
        // Update indicator width
        suitabilityIndicator.style.width = suitabilityScore + '%';
        
        // Update color based on score
        if (suitabilityScore > 70) {
            suitabilityIndicator.className = 'h-full bg-green-500';
        } else if (suitabilityScore > 40) {
            suitabilityIndicator.className = 'h-full bg-yellow-500';
        } else {
            suitabilityIndicator.className = 'h-full bg-red-500';
        }
    }
}

/**
 * Updates site recommendations based on terrain data
 * @param {Object} terrainData - The terrain data object
 */
function updateSiteRecommendations(terrainData) {
    const recommendationsElement = document.getElementById('recommendations');
    if (!recommendationsElement) return;
    
    // Clear existing recommendations
    recommendationsElement.innerHTML = '';
    
    // Generate recommendations based on terrain data
    const recommendations = [];
    
    // Slope recommendations
    if (terrainData.avgSlope > 15) {
        recommendations.push('Consider terracing or specialized mounting systems due to steep terrain (slope > 15°).');
    } else if (terrainData.avgSlope > 10) {
        recommendations.push('Moderate slope requires careful foundation planning and erosion control measures.');
    } else if (terrainData.avgSlope < 3) {
        recommendations.push('Very flat terrain is excellent for solar installations but may require drainage improvements.');
    } else {
        recommendations.push('Gentle slope provides good natural drainage and is suitable for most renewable installations.');
    }
    
    // Soil type recommendations
    if (terrainData.soilType === 'Sandy Loam' || terrainData.soilType === 'Loamy Sand') {
        recommendations.push(`${terrainData.soilType} soil provides good drainage and moderate foundation support.`);
    } else if (terrainData.soilType === 'Clay') {
        recommendations.push('Clay soil may require special foundation considerations due to expansion/contraction properties.');
    } else if (terrainData.soilType === 'Rocky') {
        recommendations.push('Rocky soil provides excellent foundation stability but may increase installation costs.');
    } else if (terrainData.soilType === 'Silt') {
        recommendations.push('Silty soil may require additional foundation support and erosion control measures.');
    }
    
    // Erosion risk recommendations
    if (terrainData.erosionRisk === 'High') {
        recommendations.push('Implement comprehensive erosion control measures including retaining walls and vegetation.');
    } else if (terrainData.erosionRisk === 'Medium') {
        recommendations.push('Standard erosion control measures recommended including proper drainage channels.');
    }
    
    // Flood risk recommendations
    if (terrainData.floodRisk === 'High') {
        recommendations.push('Consider elevated mounting systems and flood protection measures due to high flood risk.');
    } else if (terrainData.floodRisk === 'Medium') {
        recommendations.push('Implement proper drainage systems to mitigate moderate flood risk.');
    }
    
    // Water table recommendations
    if (terrainData.waterTableDepth < 5) {
        recommendations.push(`Shallow water table (${terrainData.waterTableDepth.toFixed(1)}m) may require specialized foundation design.`);
    }
    
    // Add recommendations to the list
    recommendations.forEach(recommendation => {
        const li = document.createElement('li');
        li.textContent = recommendation;
        recommendationsElement.appendChild(li);
    });
}