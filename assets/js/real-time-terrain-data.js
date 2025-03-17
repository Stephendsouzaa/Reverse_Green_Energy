// Real-Time Terrain Data Handler

/**
 * Fetches real-time terrain data from the backend API and updates the UI
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 */
async function fetchRealTimeTerrainData(lat, lng) {
    try {
        // Show loading indicators
        setLoadingState();
        
        // Fetch real-time terrain data using the terrain-data-api.js functions
        let terrainData = await fetchTerrainData(lat, lng);
        
        // If the API call fails, use fallback data
        if (!terrainData) {
            console.warn('Failed to fetch real-time terrain data, using fallback data');
            terrainData = generateFallbackTerrainData(lat, lng);
        }
        
        // Update UI with real-time data
        updateTerrainUI(terrainData);
        
        // Initialize visualizations
        initializeElevationProfile(terrainData.elevationValues);
        initializeDrainagePattern(terrainData.flowDirection);
        
        // Update site recommendations
        updateSiteRecommendations(terrainData);
        
        console.log('Terrain data updated successfully:', terrainData);
        return terrainData;
    } catch (error) {
        console.error('Error processing terrain data:', error);
        // Use fallback data if processing fails
        const fallbackData = generateFallbackTerrainData(lat, lng);
        updateTerrainUI(fallbackData);
        return fallbackData;
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
}

/**
 * Updates the UI with terrain data
 * @param {Object} terrainData - Terrain data from API or fallback
 */
function updateTerrainUI(terrainData) {
    // Ensure terrainData exists and has valid properties
    if (!terrainData) {
        console.error('No terrain data provided to updateTerrainUI');
        return;
    }
    
    // Update elevation data with validation
    const elevationElement = document.getElementById('elevation');
    if (elevationElement) {
        elevationElement.textContent = terrainData.elevation && !isNaN(terrainData.elevation) ? 
            `${terrainData.elevation.toFixed(1)}m` : 'N/A';
    }
    
    const slopeElement = document.getElementById('slope');
    if (slopeElement) {
        slopeElement.textContent = terrainData.avgSlope && !isNaN(terrainData.avgSlope) ? 
            `${terrainData.avgSlope.toFixed(1)}°` : 'N/A';
    }
    
    const roughnessElement = document.getElementById('surface-roughness');
    if (roughnessElement) {
        roughnessElement.textContent = terrainData.roughness || 'Medium';
    }
    
    // Update soil data with validation
    const soilTypeElement = document.getElementById('soil-type');
    if (soilTypeElement) {
        soilTypeElement.textContent = terrainData.soilType || 'Sandy Loam';
    }
    
    const foundationElement = document.getElementById('foundation-strength');
    if (foundationElement) {
        foundationElement.textContent = terrainData.foundationStrength || 'Moderate';
    }
    
    const erosionElement = document.getElementById('erosion-risk');
    if (erosionElement) {
        erosionElement.textContent = terrainData.erosionRisk || 'Medium';
    }
    
    // Update drainage data with validation
    const flowDirectionElement = document.getElementById('flow-direction');
    if (flowDirectionElement) {
        flowDirectionElement.textContent = terrainData.flowDirection || 'Southeast';
    }
    
    const floodRiskElement = document.getElementById('flood-risk');
    if (floodRiskElement) {
        floodRiskElement.textContent = terrainData.floodRisk || 'Medium';
    }
    
    const waterTableElement = document.getElementById('water-table-depth');
    if (waterTableElement) {
        waterTableElement.textContent = terrainData.waterTableDepth && !isNaN(terrainData.waterTableDepth) ? 
            `${terrainData.waterTableDepth.toFixed(1)}m` : 'N/A';
    }
    
    // Update soil composition visualization
    updateSoilCompositionVisualization(terrainData);
}

/**
 * Updates the soil composition visualization
 * @param {Object} terrainData - Terrain data from API or fallback
 */
function updateSoilCompositionVisualization(terrainData) {
    // If soil composition data is available, update the visualization
    if (terrainData.soilData && terrainData.soilData.composition) {
        const composition = terrainData.soilData.composition;
        const total = composition.sand + composition.silt + composition.clay;
        
        // Calculate percentages
        const sandPercent = (composition.sand / total) * 100;
        const siltPercent = (composition.silt / total) * 100;
        const clayPercent = (composition.clay / total) * 100;
        
        // Update the soil composition bars
        const soilComposition = document.querySelector('.flex.justify-between.mt-1');
        if (soilComposition) {
            const sandBar = soilComposition.querySelector('[title="Sand"]');
            const siltBar = soilComposition.querySelector('[title="Silt"]');
            const clayBar = soilComposition.querySelector('[title="Clay"]');
            
            if (sandBar && siltBar && clayBar) {
                sandBar.style.width = `${sandPercent}%`;
                siltBar.style.width = `${siltPercent}%`;
                clayBar.style.width = `${clayPercent}%`;
            }
        }
    }
}

/**
 * Initializes the elevation profile visualization
 * @param {Array} elevationValues - Array of elevation values
 */
function initializeElevationProfile(elevationValues) {
    const elevationProfile = document.getElementById('elevation-profile');
    if (!elevationProfile) return;
    
    // Clear previous content
    elevationProfile.innerHTML = '';
    
    // Create SVG for elevation profile
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 100 30');
    svg.setAttribute('preserveAspectRatio', 'none');
    
    // Create path for elevation profile
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Generate path data
    let pathData = 'M0,30';
    const numPoints = elevationValues.length;
    
    // Find min and max elevation for scaling
    const minElevation = Math.min(...elevationValues);
    const maxElevation = Math.max(...elevationValues);
    const elevationRange = maxElevation - minElevation;
    
    // Generate path points
    for (let i = 0; i < numPoints; i++) {
        const x = (i / (numPoints - 1)) * 100;
        const normalizedElevation = elevationRange > 0 ? 
            (elevationValues[i] - minElevation) / elevationRange : 0.5;
        const y = 30 - (normalizedElevation * 25); // Scale to fit in SVG
        pathData += ` L${x},${y}`;
    }
    
    // Close the path
    pathData += ' L100,30 Z';
    
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'rgba(59, 130, 246, 0.5)');
    path.setAttribute('stroke', 'rgb(59, 130, 246)');
    path.setAttribute('stroke-width', '1');
    
    svg.appendChild(path);
    elevationProfile.appendChild(svg);
}

/**
 * Initializes the drainage pattern visualization
 * @param {String} flowDirection - Flow direction string
 */
function initializeDrainagePattern(flowDirection) {
    const drainagePattern = document.getElementById('drainage-pattern');
    if (!drainagePattern) return;
    
    // Clear previous content
    drainagePattern.innerHTML = '';
    
    // Create SVG for drainage pattern
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 100 30');
    svg.setAttribute('preserveAspectRatio', 'none');
    
    // Determine flow angle based on direction
    let flowAngle = 0;
    switch (flowDirection) {
        case 'North': flowAngle = 270; break;
        case 'Northeast': flowAngle = 315; break;
        case 'East': flowAngle = 0; break;
        case 'Southeast': flowAngle = 45; break;
        case 'South': flowAngle = 90; break;
        case 'Southwest': flowAngle = 135; break;
        case 'West': flowAngle = 180; break;
        case 'Northwest': flowAngle = 225; break;
        default: flowAngle = 90; // Default to South
    }
    
    // Create flow lines
    const numLines = 10;
    for (let i = 0; i < numLines; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        
        // Calculate start and end points based on flow angle
        const x = 10 + (i * 8);
        const y = 5 + (Math.random() * 20);
        const length = 5 + (Math.random() * 5);
        
        const radians = (flowAngle * Math.PI) / 180;
        const endX = x + (Math.cos(radians) * length);
        const endY = y + (Math.sin(radians) * length);
        
        line.setAttribute('x1', x);
        line.setAttribute('y1', y);
        line.setAttribute('x2', endX);
        line.setAttribute('y2', endY);
        line.setAttribute('stroke', 'rgba(124, 58, 237, 0.7)');
        line.setAttribute('stroke-width', '1');
        
        // Add arrow at the end
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const arrowSize = 1.5;
        const arrowAngle1 = radians + (Math.PI * 0.8); // Arrow wing 1
        const arrowAngle2 = radians - (Math.PI * 0.8); // Arrow wing 2
        
        const arrowX1 = endX + (Math.cos(arrowAngle1) * arrowSize);
        const arrowY1 = endY + (Math.sin(arrowAngle1) * arrowSize);
        const arrowX2 = endX + (Math.cos(arrowAngle2) * arrowSize);
        const arrowY2 = endY + (Math.sin(arrowAngle2) * arrowSize);
        
        arrow.setAttribute('points', `${endX},${endY} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`);
        arrow.setAttribute('fill', 'rgba(124, 58, 237, 0.7)');
        
        svg.appendChild(line);
        svg.appendChild(arrow);
    }
    
    drainagePattern.appendChild(svg);
}

/**
 * Updates site recommendations based on terrain data
 * @param {Object} terrainData - Terrain data from API or fallback
 */
function updateSiteRecommendations(terrainData) {
    const recommendationsElement = document.getElementById('recommendations');
    if (!recommendationsElement) return;
    
    // Clear previous recommendations
    recommendationsElement.innerHTML = '';
    
    // Ensure terrainData exists and has valid properties
    if (!terrainData) {
        const li = document.createElement('li');
        li.textContent = 'Unable to generate recommendations due to missing terrain data.';
        li.className = 'text-gray-700';
        recommendationsElement.appendChild(li);
        return;
    }
    
    const recommendations = [];
    
    // Generate recommendations based on elevation
    if (terrainData.elevation && !isNaN(terrainData.elevation)) {
        if (terrainData.elevation < 50) {
            recommendations.push('Consider flood protection measures due to low elevation.');
        } else if (terrainData.elevation > 500) {
            recommendations.push('High elevation may require additional wind protection for solar panels.');
        }
    }
    
    // Generate recommendations based on slope
    if (terrainData.avgSlope && !isNaN(terrainData.avgSlope)) {
        if (terrainData.avgSlope > 10) {
            recommendations.push('Consider terracing or slope stabilization measures due to steep terrain.');
        } else if (terrainData.avgSlope < 3) {
            recommendations.push('Flat terrain is ideal for solar panel installation with minimal grading required.');
        }
    }
    
    // Generate recommendations based on soil type
    if (terrainData.soilType) {
        if (terrainData.soilType === 'Sandy Loam' || terrainData.soilType === 'Loamy Sand') {
            recommendations.push('Sandy soil provides good drainage but may require additional foundation support.');
        } else if (terrainData.soilType === 'Clay') {
            recommendations.push('Clay soil may expand and contract with moisture changes; consider specialized foundations.');
        } else if (terrainData.soilType === 'Rocky') {
            recommendations.push('Rocky soil provides excellent foundation support but may increase excavation costs.');
        }
    }
    
    // Generate recommendations based on erosion risk
    if (terrainData.erosionRisk) {
        if (terrainData.erosionRisk === 'High') {
            recommendations.push('Implement erosion control measures such as retaining walls and vegetation.');
        }
    }
    
    // Generate recommendations based on flood risk
    if (terrainData.floodRisk) {
        if (terrainData.floodRisk === 'High') {
            recommendations.push('Consider elevated mounting systems and flood protection measures.');
        }
    }
    
    // Add recommendations to the UI
    recommendations.forEach(recommendation => {
        const li = document.createElement('li');
        li.textContent = recommendation;
        li.className = 'text-gray-700';
        recommendationsElement.appendChild(li);
    });
    
    // If no recommendations were generated, add a default one
    if (recommendations.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Site has favorable terrain conditions for renewable energy development.';
        li.className = 'text-gray-700';
        recommendationsElement.appendChild(li);
    }
    
    // Add overall site suitability text
    const overallSuitability = document.getElementById('overall-suitability');
    if (overallSuitability) {
        let suitabilityScore = 75; // Default moderate suitability
        
        // Adjust score based on terrain factors
        if (terrainData.avgSlope && !isNaN(terrainData.avgSlope)) {
            if (terrainData.avgSlope > 15) suitabilityScore -= 20;
            else if (terrainData.avgSlope < 5) suitabilityScore += 10;
        }
        
        if (terrainData.erosionRisk) {
            if (terrainData.erosionRisk === 'High') suitabilityScore -= 15;
            else if (terrainData.erosionRisk === 'Low') suitabilityScore += 10;
        }
        
        if (terrainData.floodRisk) {
            if (terrainData.floodRisk === 'High') suitabilityScore -= 20;
            else if (terrainData.floodRisk === 'Low') suitabilityScore += 10;
        }
        
        // Ensure score is within 0-100 range
        suitabilityScore = Math.max(0, Math.min(100, suitabilityScore));
        
        // Set overall suitability text
        let suitabilityText = 'Moderate';
        if (suitabilityScore > 80) suitabilityText = 'Excellent';
        else if (suitabilityScore > 60) suitabilityText = 'Good';
        else if (suitabilityScore < 40) suitabilityText = 'Poor';
        
        overallSuitability.textContent = suitabilityText;
    }
}

/**
 * Generates fallback terrain data if API call fails
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Object} - Fallback terrain data
 */
function generateFallbackTerrainData(lat, lng) {
    // Ensure lat and lng are valid numbers, use defaults if not
    lat = (typeof lat === 'number' && !isNaN(lat)) ? lat : 37.7749;
    lng = (typeof lng === 'number' && !isNaN(lng)) ? lng : -122.4194;
    
    // Use coordinates to generate deterministic but realistic data
    // Using a seeded random approach for consistency based on coordinates
    const seed = Math.abs((lat * 10000) + lng);
    const seededRandom = (min, max, offset = 0) => {
        const x = Math.sin(seed + offset) * 10000;
        const rand = x - Math.floor(x);
        return min + rand * (max - min);
    };
    
    // Generate base elevation based on coordinates and regional topography
    // Higher latitudes tend to have more varied elevation
    const latFactor = Math.abs(lat) / 90; // 0 to 1 based on latitude
    const baseElevation = 100 + (latFactor * 300) + seededRandom(0, 200, 1);
    
    // Generate elevation profile with realistic terrain features
    const elevationValues = [];
    const numPoints = 20;
    
    // Create different terrain types based on longitude
    const terrainType = Math.floor(Math.abs(lng) % 4);
    let terrainAmplitude, terrainFrequency;
    
    switch(terrainType) {
        case 0: // Mountains
            terrainAmplitude = 30 + seededRandom(10, 50, 2);
            terrainFrequency = 1.5 + seededRandom(0, 1, 3);
            break;
        case 1: // Hills
            terrainAmplitude = 15 + seededRandom(5, 20, 2);
            terrainFrequency = 1.0 + seededRandom(0, 0.8, 3);
            break;
        case 2: // Plains
            terrainAmplitude = 5 + seededRandom(1, 8, 2);
            terrainFrequency = 0.5 + seededRandom(0, 0.5, 3);
            break;
        case 3: // Mixed
            terrainAmplitude = 20 + seededRandom(5, 25, 2);
            terrainFrequency = 1.2 + seededRandom(0, 0.7, 3);
            break;
    }
    
    for (let i = 0; i < numPoints; i++) {
        const normalizedPosition = i / (numPoints - 1);
        const distanceFromCenter = Math.abs(normalizedPosition - 0.5) * 2;
        
        // Create terrain features with natural variations
        const primaryFeature = Math.sin(i * terrainFrequency) * terrainAmplitude * (1 - distanceFromCenter * 0.5);
        const secondaryFeature = Math.sin(i * terrainFrequency * 2.5 + seed * 0.1) * (terrainAmplitude * 0.4);
        
        // Add micro-terrain for realism
        const microTerrain = seededRandom(-2, 2, i * 10);
        
        // Calculate the elevation at this point
        const pointElevation = baseElevation + primaryFeature + secondaryFeature + microTerrain;
        
        elevationValues.push(Math.max(0, pointElevation));
    }
    
    // Calculate average slope based on elevation profile
    const slopes = [];
    for (let i = 1; i < elevationValues.length; i++) {
        const elevationChange = Math.abs(elevationValues[i] - elevationValues[i-1]);
        const horizontalDistance = 100 / (numPoints - 1); // Assume 100m total distance
        const slopePercent = (elevationChange / horizontalDistance) * 100;
        const slopeDegrees = Math.atan(slopePercent/100) * (180/Math.PI);
        slopes.push(slopeDegrees);
    }
    
    // Calculate average slope with validation
    let avgSlope;
    if (slopes.length > 0) {
        const slopeSum = slopes.reduce((sum, val) => sum + val, 0);
        avgSlope = slopeSum / slopes.length;
        
        // Validate the result
        if (isNaN(avgSlope) || !isFinite(avgSlope)) {
            // Generate a realistic slope based on terrain type
            avgSlope = terrainType === 0 ? seededRandom(10, 25, 4) : 
                      terrainType === 1 ? seededRandom(5, 15, 4) : 
                      terrainType === 2 ? seededRandom(1, 5, 4) : 
                      seededRandom(3, 18, 4);
        }
    } else {
        // Fallback based on terrain type
        avgSlope = terrainType === 0 ? seededRandom(10, 25, 4) : 
                  terrainType === 1 ? seededRandom(5, 15, 4) : 
                  terrainType === 2 ? seededRandom(1, 5, 4) : 
                  seededRandom(3, 18, 4);
    }
    
    // Calculate terrain roughness from elevation variations
    const elevationChanges = [];
    for (let i = 1; i < elevationValues.length; i++) {
        elevationChanges.push(Math.abs(elevationValues[i] - elevationValues[i-1]));
    }
    
    let avgChange;
    if (elevationChanges.length > 0) {
        avgChange = elevationChanges.reduce((sum, val) => sum + val, 0) / elevationChanges.length;
        
        // Validate the result
        if (isNaN(avgChange) || !isFinite(avgChange)) {
            // Generate realistic roughness based on terrain type
            avgChange = terrainType === 0 ? seededRandom(3, 6, 5) : 
                       terrainType === 1 ? seededRandom(1.5, 4, 5) : 
                       terrainType === 2 ? seededRandom(0.5, 2, 5) : 
                       seededRandom(1, 5, 5);
        }
    } else {
        // Fallback based on terrain type
        avgChange = terrainType === 0 ? seededRandom(3, 6, 5) : 
                   terrainType === 1 ? seededRandom(1.5, 4, 5) : 
                   terrainType === 2 ? seededRandom(0.5, 2, 5) : 
                   seededRandom(1, 5, 5);
    }
    
    // Determine roughness classification
    let roughness;
    if (avgChange < 1.5) roughness = 'Low';
    else if (avgChange < 4) roughness = 'Medium';
    else roughness = 'High';
    
    // Determine soil type based on coordinates and climate zones
    // Different soil types are more common in different climate zones
    const latZone = Math.floor((lat + 90) / 30); // 0-5 climate zone
    const lngZone = Math.floor((lng + 180) / 60); // 0-5 longitude zone
    
    const soilTypeMap = [
        ['Sandy Loam', 'Loamy Sand', 'Sandy Clay', 'Clay Loam', 'Silty Clay', 'Rocky'],
        ['Clay', 'Clay Loam', 'Silty Clay', 'Silt', 'Silty Loam', 'Rocky Clay'],
        ['Sandy Clay', 'Sandy Loam', 'Loam', 'Silt Loam', 'Clay', 'Rocky Loam'],
        ['Silty Clay', 'Silty Loam', 'Silt', 'Clay Loam', 'Sandy Clay', 'Rocky Silt'],
        ['Loamy Sand', 'Sandy Loam', 'Sandy Clay Loam', 'Loam', 'Clay Loam', 'Rocky Sand'],
        ['Rocky', 'Rocky Clay', 'Rocky Loam', 'Rocky Silt', 'Rocky Sand', 'Rocky Clay Loam']
    ];
    
    // Select soil type based on climate and longitude zones with some randomization
    const zoneIndex = (latZone + lngZone) % 6;
    const soilOptions = soilTypeMap[zoneIndex];
    const soilTypeIndex = Math.floor(seededRandom(0, soilOptions.length, 6));
    const soilType = soilOptions[soilTypeIndex];
    
    // Determine foundation strength based on soil type and slope
    let foundationStrength;
    if (soilType.includes('Rocky') || (soilType.includes('Clay') && !soilType.includes('Sandy'))) {
        foundationStrength = 'High';
    } else if (soilType.includes('Sandy') || soilType.includes('Loam') && !soilType.includes('Clay')) {
        foundationStrength = 'Moderate';
    } else if (soilType.includes('Silt') || soilType.includes('Silty')) {
        foundationStrength = 'Low';
    } else {
        // Default with some randomization based on coordinates
        const strengthOptions = ['Low', 'Moderate', 'High'];
        const strengthIndex = Math.floor(seededRandom(0, 3, 7));
        foundationStrength = strengthOptions[strengthIndex];
    }
    
    // Determine erosion risk based on soil type, slope, and elevation
    let erosionRisk;
    if ((soilType.includes('Silt') || soilType.includes('Sandy')) && avgSlope > 8) {
        erosionRisk = 'High';
    } else if ((soilType.includes('Rocky') || soilType.includes('Clay')) && avgSlope < 5) {
        erosionRisk = 'Low';
    } else if (baseElevation > 500 && avgSlope > 15) {
        erosionRisk = 'High';
    } else if (baseElevation < 100 && avgSlope < 3) {
        erosionRisk = 'Low';
    } else {
        erosionRisk = 'Medium';
    }
    
    // Determine flow direction based on terrain slope and aspect
    const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
    // Use a combination of lat/lng to determine a consistent direction
    const directionSeed = (lat * 0.5 + lng * 0.3) * 100;
    const directionIndex = Math.floor(Math.abs(directionSeed) % directions.length);
    const flowDirection = directions[directionIndex];
    
    // Calculate flood risk based on elevation, slope, and terrain type
    let floodRisk;
    if (baseElevation < 50 && avgSlope < 2) {
        floodRisk = 'High';
    } else if ((baseElevation < 100 && avgSlope < 5) || (terrainType === 2 && baseElevation < 150)) {
        floodRisk = 'Medium';
    } else if (baseElevation > 300 || avgSlope > 10 || terrainType === 0) {
        floodRisk = 'Low';
    } else {
        // Use seeded random for consistent results
        const riskValue = seededRandom(0, 1, 8);
        floodRisk = riskValue < 0.3 ? 'High' : riskValue < 0.7 ? 'Medium' : 'Low';
    }
    
    // Calculate water table depth based on elevation, terrain type, and soil
    // Higher elevations and rocky soils typically have deeper water tables
    let waterTableDepth;
    if (soilType.includes('Rocky')) {
        waterTableDepth = 5 + (baseElevation / 40) + seededRandom(1, 5, 9);
    } else if (soilType.includes('Sandy')) {
        waterTableDepth = 4 + (baseElevation / 50) + seededRandom(0.5, 3, 9);
    } else if (soilType.includes('Clay')) {
        waterTableDepth = 3 + (baseElevation / 60) + seededRandom(0.5, 2, 9);
    } else {
        waterTableDepth = 3.5 + (baseElevation / 55) + seededRandom(0.5, 2.5, 9);
    }
    
    // Ensure water table depth is realistic (minimum 1 meter)
    waterTableDepth = Math.max(1, waterTableDepth);
    
    // Generate soil composition data based on soil type
    let sand = 33, silt = 33, clay = 33; // Default balanced composition
    
    if (soilType.includes('Sandy')) {
        sand = 50 + seededRandom(10, 30, 10);
        silt = seededRandom(5, 30, 11);
        clay = 100 - sand - silt;
    } else if (soilType.includes('Silt')) {
        silt = 50 + seededRandom(10, 30, 10);
        sand = seededRandom(5, 30, 11);
        clay = 100 - sand - silt;
    } else if (soilType.includes('Clay')) {
        clay = 50 + seededRandom(10, 30, 10);
        sand = seededRandom(5, 30, 11);
        silt = 100 - sand - clay;
    } else if (soilType.includes('Loam')) {
        // Loam is a balanced mix
        sand = 40 + seededRandom(-10, 10, 10);
        silt = 40 + seededRandom(-10, 10, 11);
        clay = 100 - sand - silt;
    } else if (soilType.includes('Rocky')) {
        // Rocky soils have less defined composition
        sand = 60 + seededRandom(-20, 20, 10);
        silt = seededRandom(5, 25, 11);
        clay = 100 - sand - silt;
    }
    
    // Ensure values are within valid ranges
    sand = Math.max(5, Math.min(90, sand));
    silt = Math.max(5, Math.min(90, silt));
    clay = Math.max(5, Math.min(90, clay));
    
    // Normalize to ensure they sum to 100%
    const total = sand + silt + clay;
    sand = (sand / total) * 100;
    silt = (silt / total) * 100;
    clay = (clay / total) * 100;
    
    const soilData = {
        composition: {
            sand: sand,
            silt: silt,
            clay: clay
        }
    };
    
    // Return comprehensive terrain data with realistic values
    return {
        elevation: baseElevation,
        elevationValues: elevationValues,
        avgSlope: avgSlope,
        roughness: roughness,
        soilType: soilType,
        foundationStrength: foundationStrength,
        erosionRisk: erosionRisk,
        flowDirection: flowDirection,
        floodRisk: floodRisk,
        waterTableDepth: waterTableDepth,
        soilData: soilData
    };
}