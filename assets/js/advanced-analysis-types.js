// Advanced Analysis Types for GIS Mapping
// Implements Viewshed Analysis, Environmental Impact Assessment, and Optimized Siting

// Global variables to store analysis layers
const analysisLayers = {
    viewshed: null,
    environmental: null,
    siting: null
};

/**
 * Main handler for different analysis types
 * @param {String} analysisType - Type of analysis to perform (terrain, viewshed, environmental, siting)
 * @param {Object} location - {lat, lng} object with coordinates
 */
function handleAnalysisTypeSelection(analysisType, location) {
    // Clear previous analysis layers from map
    clearAnalysisLayers();
    
    // Always perform all analyses and show all result sections
    // First perform the terrain analysis
    fetchRealTimeTerrainData(location.lat, location.lng);
    document.getElementById('terrainAnalysisResults').style.display = 'block';
    
    // Then perform viewshed analysis
    performViewshedAnalysis(location);
    document.getElementById('viewshedAnalysisResults').style.display = 'block';
    
    // Then perform environmental analysis
    performEnvironmentalAnalysis(location);
    document.getElementById('environmentalAnalysisResults').style.display = 'block';
    
    // Finally perform optimized siting
    performOptimizedSiting(location);
    document.getElementById('sitingAnalysisResults').style.display = 'block';
}

/**
 * Hide all analysis result sections
 */
function hideAllAnalysisResults() {
    const resultSections = [
        'terrainAnalysisResults',
        'viewshedAnalysisResults',
        'environmentalAnalysisResults',
        'sitingAnalysisResults'
    ];
    
    resultSections.forEach(section => {
        const element = document.getElementById(section);
        if (element) element.style.display = 'none';
    });
}

/**
 * Clear all analysis layers from the map
 */
function clearAnalysisLayers() {
    // Remove previous analysis layers if they exist
    Object.values(analysisLayers).forEach(layer => {
        if (layer && map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
    });
}

/**
 * Perform viewshed analysis for a location
 * @param {Object} location - {lat, lng} object with coordinates
 */
function performViewshedAnalysis(location) {
    // Show loading state
    setViewshedLoadingState();
    
    // In a real application, this would use a DEM service to calculate viewshed
    // For this demo, we'll simulate the viewshed calculation
    setTimeout(() => {
        // Create a simulated viewshed (visible area from the point)
        const viewshedData = generateViewshedData(location);
        
        // Visualize the viewshed on the map
        visualizeViewshed(viewshedData);
        
        // Update the UI with viewshed analysis results
        updateViewshedUI(viewshedData);
        
        // Initialize viewshed charts
        initializeViewshedCharts(viewshedData);
    }, 1000); // Simulate API delay
}

/**
 * Set loading state for viewshed analysis UI
 */
function setViewshedLoadingState() {
    // Update UI elements to show loading state
    document.getElementById('visibility-heatmap-status').textContent = 'Loading...';
    document.getElementById('obstruction-analysis').textContent = 'Loading...';
    document.getElementById('aesthetic-impact-score').textContent = 'Loading...';
    document.getElementById('glare-impact').textContent = 'Loading...';
    document.getElementById('protected-area-proximity').textContent = 'Loading...';
}

/**
 * Generate simulated viewshed data based on location
 * @param {Object} location - {lat, lng} object with coordinates
 * @returns {Object} - Viewshed analysis data
 */
function generateViewshedData(location) {
    // Use location to seed the random generation for consistency
    const seed = (location.lat * 10 + location.lng) % 100;
    
    // Generate a circular viewshed with random variations
    const radius = 2000; // 2km radius
    const points = 36; // Points around the circle
    const viewshedPolygon = [];
    
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        // Vary the radius to create an irregular viewshed
        const variationFactor = 0.5 + Math.abs(Math.sin(seed + i) * 0.5);
        const pointRadius = radius * variationFactor;
        
        // Calculate point coordinates
        const lat = location.lat + (Math.sin(angle) * pointRadius) / 111000;
        const lng = location.lng + (Math.cos(angle) * pointRadius) / (111000 * Math.cos(location.lat * Math.PI / 180));
        
        viewshedPolygon.push([lat, lng]);
    }
    // Close the polygon
    viewshedPolygon.push(viewshedPolygon[0]);
    
    // Generate visibility zones (fully visible, partially visible, obstructed)
    const visibilityZones = generateVisibilityZones(location, viewshedPolygon);
    
    // Generate obstruction data
    const obstructions = generateObstructions(location, seed);
    
    // Calculate distance to populated areas
    const populatedAreas = generatePopulatedAreas(location, seed);
    const distanceToPopulated = calculateDistanceToPopulated(location, populatedAreas);
    
    // Determine aesthetic impact score
    const aestheticImpact = determineAestheticImpact(distanceToPopulated, obstructions.length);
    
    // Determine glare impact for solar installations
    const glareImpact = determineGlareImpact(location, seed);
    
    // Check proximity to protected areas
    const protectedAreaProximity = checkProtectedAreaProximity(location, seed);
    
    return {
        location: location,
        viewshedPolygon: viewshedPolygon,
        visibilityZones: visibilityZones,
        obstructions: obstructions,
        distanceToPopulated: distanceToPopulated,
        aestheticImpact: aestheticImpact,
        glareImpact: glareImpact,
        protectedAreaProximity: protectedAreaProximity
    };
}

/**
 * Generate visibility zones (fully visible, partially visible, obstructed)
 * @param {Object} location - Center point
 * @param {Array} viewshedPolygon - Outer boundary of viewshed
 * @returns {Object} - Visibility zones
 */
function generateVisibilityZones(location, viewshedPolygon) {
    // Create three zones with different visibility levels
    const fullyVisibleRadius = 0.7; // 70% of the distance
    const partiallyVisibleRadius = 0.9; // 90% of the distance
    
    const fullyVisiblePolygon = [];
    const partiallyVisiblePolygon = [];
    
    // Generate polygons for each visibility zone
    for (let i = 0; i < viewshedPolygon.length - 1; i++) {
        const point = viewshedPolygon[i];
        const dx = point[0] - location.lat;
        const dy = point[1] - location.lng;
        
        // Fully visible zone
        fullyVisiblePolygon.push([
            location.lat + dx * fullyVisibleRadius,
            location.lng + dy * fullyVisibleRadius
        ]);
        
        // Partially visible zone
        partiallyVisiblePolygon.push([
            location.lat + dx * partiallyVisibleRadius,
            location.lng + dy * partiallyVisibleRadius
        ]);
    }
    
    // Close the polygons
    fullyVisiblePolygon.push(fullyVisiblePolygon[0]);
    partiallyVisiblePolygon.push(partiallyVisiblePolygon[0]);
    
    return {
        fullyVisible: fullyVisiblePolygon,
        partiallyVisible: partiallyVisiblePolygon,
        obstructed: viewshedPolygon // The outer boundary
    };
}

/**
 * Generate simulated obstructions (buildings, hills, forests)
 * @param {Object} location - Center point
 * @param {Number} seed - Random seed
 * @returns {Array} - List of obstructions
 */
function generateObstructions(location, seed) {
    const obstructions = [];
    const obstructionCount = 5 + Math.floor(Math.abs(Math.sin(seed) * 5));
    
    const obstructionTypes = ['Building', 'Hill', 'Forest', 'Mountain', 'Ridge'];
    
    for (let i = 0; i < obstructionCount; i++) {
        // Generate random position within viewshed
        const angle = Math.random() * Math.PI * 2;
        const distance = 500 + Math.random() * 1500; // Between 500m and 2000m
        
        const lat = location.lat + (Math.sin(angle) * distance) / 111000;
        const lng = location.lng + (Math.cos(angle) * distance) / (111000 * Math.cos(location.lat * Math.PI / 180));
        
        // Determine obstruction type
        const typeIndex = Math.floor(Math.random() * obstructionTypes.length);
        
        obstructions.push({
            type: obstructionTypes[typeIndex],
            location: { lat, lng },
            height: 10 + Math.random() * 90, // 10-100m height
            impact: Math.random() < 0.3 ? 'High' : (Math.random() < 0.7 ? 'Medium' : 'Low')
        });
    }
    
    return obstructions;
}

/**
 * Generate simulated populated areas
 * @param {Object} location - Center point
 * @param {Number} seed - Random seed
 * @returns {Array} - List of populated areas
 */
function generatePopulatedAreas(location, seed) {
    const areas = [];
    const areaCount = 3 + Math.floor(Math.abs(Math.cos(seed) * 3));
    
    const areaTypes = ['Town', 'Village', 'City', 'Hamlet', 'Suburb'];
    
    for (let i = 0; i < areaCount; i++) {
        // Generate random position
        const angle = Math.random() * Math.PI * 2;
        const distance = 1000 + Math.random() * 4000; // Between 1km and 5km
        
        const lat = location.lat + (Math.sin(angle) * distance) / 111000;
        const lng = location.lng + (Math.cos(angle) * distance) / (111000 * Math.cos(location.lat * Math.PI / 180));
        
        // Determine area type
        const typeIndex = Math.floor(Math.random() * areaTypes.length);
        
        areas.push({
            type: areaTypes[typeIndex],
            name: `${areaTypes[typeIndex]} ${i+1}`,
            location: { lat, lng },
            population: 500 + Math.floor(Math.random() * 9500), // 500-10000 people
            distance: distance
        });
    }
    
    return areas;
}

/**
 * Calculate distance to populated areas
 * @param {Object} location - Center point
 * @param {Array} populatedAreas - List of populated areas
 * @returns {Object} - Distance statistics
 */
function calculateDistanceToPopulated(location, populatedAreas) {
    // Sort areas by distance
    populatedAreas.sort((a, b) => a.distance - b.distance);
    
    // Calculate statistics
    const closest = populatedAreas[0];
    const totalPopulation = populatedAreas.reduce((sum, area) => sum + area.population, 0);
    const populationWithinViewshed = populatedAreas
        .filter(area => area.distance < 3000) // Within 3km
        .reduce((sum, area) => sum + area.population, 0);
    
    return {
        closestArea: closest,
        totalPopulation: totalPopulation,
        populationWithinViewshed: populationWithinViewshed,
        populationExposed: Math.floor(populationWithinViewshed * 0.7) // Assume 70% can see the installation
    };
}

/**
 * Determine aesthetic impact score
 * @param {Object} distanceData - Distance to populated areas data
 * @param {Number} obstructionCount - Number of obstructions
 * @returns {String} - Impact level (Low/Medium/High)
 */
function determineAestheticImpact(distanceData, obstructionCount) {
    // Calculate impact based on population exposed and distance
    const populationFactor = distanceData.populationExposed / 1000; // Normalize to 0-10 scale
    const distanceFactor = 3 - (distanceData.closestArea.distance / 1000); // Closer means higher impact
    const obstructionFactor = 1 - (obstructionCount / 10); // Fewer obstructions mean higher visibility
    
    const impactScore = (populationFactor * 0.5) + (distanceFactor * 0.3) + (obstructionFactor * 0.2);
    
    // Determine impact level
    if (impactScore > 2) return 'High';
    if (impactScore > 1) return 'Medium';
    return 'Low';
}

/**
 * Determine glare impact for solar installations
 * @param {Object} location - Installation location
 * @param {Number} seed - Random seed
 * @returns {Object} - Glare impact data
 */
function determineGlareImpact(location, seed) {
    // Simulate glare impact based on location and random factors
    const glareHours = 1 + Math.abs(Math.sin(seed) * 3); // 1-4 hours of potential glare
    const glareDirection = ['Morning', 'Afternoon', 'Evening'][Math.floor(Math.abs(Math.cos(seed) * 3))]; 
    
    let impactLevel;
    if (glareHours > 3) {        
        impactLevel = 'High';
    } else if (glareHours > 2) {
        impactLevel = 'Medium';
    } else {
        impactLevel = 'Low';
    }
    
    return {
        hours: glareHours.toFixed(1),
        timeOfDay: glareDirection,
        impactLevel: impactLevel,
        affectedAreas: glareDirection === 'Morning' ? 'Eastern' : (glareDirection === 'Afternoon' ? 'Western' : 'Northwestern')
    };
}

/**
 * Check proximity to protected areas
 * @param {Object} location - Installation location
 * @param {Number} seed - Random seed
 * @returns {Object} - Protected area proximity data
 */
function checkProtectedAreaProximity(location, seed) {
    // Simulate protected areas based on location and random factors
    const protectedTypes = ['National Park', 'Wildlife Reserve', 'Conservation Area', 'Heritage Site', 'Scenic Area'];
    const protectedAreas = [];
    
    // Generate 1-3 protected areas
    const areaCount = 1 + Math.floor(Math.abs(Math.sin(seed * 2) * 2));
    
    for (let i = 0; i < areaCount; i++) {
        // Generate random position
        const angle = Math.random() * Math.PI * 2;
        const distance = 2000 + Math.random() * 8000; // Between 2km and 10km
        
        const lat = location.lat + (Math.sin(angle) * distance) / 111000;
        const lng = location.lng + (Math.cos(angle) * distance) / (111000 * Math.cos(location.lat * Math.PI / 180));
        
        // Determine area type
        const typeIndex = Math.floor(Math.random() * protectedTypes.length);
        
        protectedAreas.push({
            type: protectedTypes[typeIndex],
            name: `${protectedTypes[typeIndex]} ${i+1}`,
            location: { lat, lng },
            distance: distance,
            restrictions: Math.random() < 0.3 ? 'Strict' : (Math.random() < 0.7 ? 'Moderate' : 'Minimal')
        });
    }
    
    // Sort by distance
    protectedAreas.sort((a, b) => a.distance - b.distance);
    
    // Determine compliance status
    let complianceStatus = 'Compliant';
    let requiredPermits = 0;
    
    if (protectedAreas.length > 0 && protectedAreas[0].distance < 3000) {
        if (protectedAreas[0].restrictions === 'Strict') {
            complianceStatus = 'Non-Compliant';
        } else {
            complianceStatus = 'Requires Permits';
            requiredPermits = protectedAreas[0].restrictions === 'Moderate' ? 2 : 1;
        }
    }
    
    return {
        nearestProtectedArea: protectedAreas.length > 0 ? protectedAreas[0] : null,
        protectedAreas: protectedAreas,
        complianceStatus: complianceStatus,
        requiredPermits: requiredPermits
    };
}

/**
 * Visualize viewshed on the map
 * @param {Object} viewshedData - Viewshed analysis data
 */
function visualizeViewshed(viewshedData) {
    // Create a layer group for the viewshed visualization
    const viewshedLayer = L.layerGroup();
    
    // Add fully visible zone (green)
    L.polygon(viewshedData.visibilityZones.fullyVisible, {
        color: '#4CAF50',
        fillColor: '#4CAF50',
        fillOpacity: 0.3,
        weight: 1
    }).addTo(viewshedLayer);
    
    // Add partially visible zone (yellow)
    L.polygon(viewshedData.visibilityZones.partiallyVisible, {
        color: '#FFC107',
        fillColor: '#FFC107',
        fillOpacity: 0.3,
        weight: 1
    }).addTo(viewshedLayer);
    
    // Add obstructed zone (red)
    L.polygon(viewshedData.visibilityZones.obstructed, {
        color: '#F44336',
        fillColor: '#F44336',
        fillOpacity: 0.2,
        weight: 1
    }).addTo(viewshedLayer);
    
    // Add obstructions as markers
    viewshedData.obstructions.forEach(obstruction => {
        const marker = L.marker([obstruction.location.lat, obstruction.location.lng], {
            icon: L.divIcon({
                className: 'obstruction-icon',
                html: `<div style="background-color: #795548; width: 10px; height: 10px; border-radius: 50%;"></div>`,
                iconSize: [10, 10]
            })
        });
        
        marker.bindTooltip(`${obstruction.type}<br>Height: ${obstruction.height.toFixed(1)}m<br>Impact: ${obstruction.impact}`);
        marker.addTo(viewshedLayer);
    });
    
    // Add populated areas as markers
    viewshedData.distanceToPopulated.closestArea && L.marker(
        [viewshedData.distanceToPopulated.closestArea.location.lat, viewshedData.distanceToPopulated.closestArea.location.lng], {
            icon: L.divIcon({
                className: 'populated-area-icon',
                html: `<div style="background-color: #2196F3; width: 12px; height: 12px; border-radius: 50%;"></div>`,
                iconSize: [12, 12]
            })
        }
    ).bindTooltip(
        `${viewshedData.distanceToPopulated.closestArea.name}<br>` +
        `Population: ${viewshedData.distanceToPopulated.closestArea.population}<br>` +
        `Distance: ${(viewshedData.distanceToPopulated.closestArea.distance/1000).toFixed(1)}km`
    ).addTo(viewshedLayer);
    
    // Add the viewshed layer to the map
    viewshedLayer.addTo(map);
    
    // Store the layer for later reference
    analysisLayers.viewshed = viewshedLayer;
}

/**
 * Update the UI with viewshed analysis results
 * @param {Object} viewshedData - Viewshed analysis data
 */
function updateViewshedUI(viewshedData) {
    // Update visibility heatmap status
    document.getElementById('visibility-heatmap-status').textContent = 'Generated';
    
    // Update obstruction analysis
    const obstructionText = viewshedData.obstructions.length > 0 ?
        `${viewshedData.obstructions.length} obstructions identified` :
        'No significant obstructions';
    document.getElementById('obstruction-analysis').textContent = obstructionText;
    
    // Update aesthetic impact score
    document.getElementById('aesthetic-impact-score').textContent = viewshedData.aestheticImpact;
    
    // Update glare impact
    const glareText = `${viewshedData.glareImpact.hours} hours (${viewshedData.glareImpact.timeOfDay})`;
    document.getElementById('glare-impact').textContent = glareText;
    
    // Update protected area proximity
    const protectedAreaText = viewshedData.protectedAreaProximity.nearestProtectedArea ?
        `${viewshedData.protectedAreaProximity.nearestProtectedArea.name} (${(viewshedData.protectedAreaProximity.nearestProtectedArea.distance/1000).toFixed(1)}km)` :
        'None within 10km';
    document.getElementById('protected-area-proximity').textContent = protectedAreaText;
    
    // Update line-of-sight simulation status
    document.getElementById('line-of-sight-status').textContent = 'Ready';
    
    // Update distance to populated areas
    const populationText = viewshedData.distanceToPopulated.populationExposed > 0 ?
        `${viewshedData.distanceToPopulated.populationExposed} people` :
        'Minimal';
    document.getElementById('distance-to-populated').textContent = populationText;
}

/**
 * Initialize viewshed charts
 * @param {Object} viewshedData - Viewshed analysis data
 */
function initializeViewshedCharts(viewshedData) {
    // Initialize visibility distribution chart
    const visibilityCtx = document.getElementById('visibility-distribution-chart').getContext('2d');
    new Chart(visibilityCtx, {
        type: 'doughnut',
        data: {
            labels: ['Fully Visible', 'Partially Visible', 'Obstructed'],
            datasets: [{
                data: [40, 35, 25], // Simulated distribution percentages
                backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Visibility Distribution',
                    color: '#ffffff'
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ffffff'
                    }
                }
            }
        }
    });
    
    // Initialize population impact chart
    const populationCtx = document.getElementById('population-impact-chart').getContext('2d');
    new Chart(populationCtx, {
        type: 'bar',
        data: {
            labels: ['Within 1km', 'Within 3km', 'Within 5km'],
            datasets: [{
                label: 'Population Affected',
                data: [
                    Math.round(viewshedData.distanceToPopulated.populationExposed * 0.3),
                    Math.round(viewshedData.distanceToPopulated.populationExposed * 0.7),
                    Math.round(viewshedData.distanceToPopulated.populationWithinViewshed)
                ],
                backgroundColor: '#2196F3'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Population',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Population Impact by Distance',
                    color: '#ffffff'
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * Perform environmental impact analysis for a location
 * @param {Object} location - {lat, lng} object with coordinates
 */
function performEnvironmentalAnalysis(location) {
    // Show loading state
    setEnvironmentalLoadingState();
    
    // In a real application, this would use environmental GIS data
    // For this demo, we'll simulate the environmental analysis
    setTimeout(() => {
        // Generate environmental data
        const environmentalData = generateEnvironmentalData(location);
        
        // Visualize the environmental data on the map
        visualizeEnvironmentalData(environmentalData);
        
        // Update the UI with environmental analysis results
        updateEnvironmentalUI(environmentalData);
        
        // Initialize environmental charts
        initializeEnvironmentalCharts(environmentalData);
    }, 1000); // Simulate API delay
}

/**
 * Set loading state for environmental analysis UI
 */
function setEnvironmentalLoadingState() {
    // Update UI elements to show loading state
    document.getElementById('environmental-sensitivity').textContent = 'Loading...';
    document.getElementById('biodiversity-risk').textContent = 'Loading...';
    document.getElementById('carbon-footprint').textContent = 'Loading...';
    document.getElementById('air-quality-index').textContent = 'Loading...';
    document.getElementById('water-resource-impact').textContent = 'Loading...';
    document.getElementById('deforestation-risk').textContent = 'Loading...';
    document.getElementById('legal-compliance-status').textContent = 'Loading...';
}

/**
 * Generate simulated environmental data based on location
 * @param {Object} location - {lat, lng} object with coordinates
 * @returns {Object} - Environmental analysis data
 */
function generateEnvironmentalData(location) {
    // Use location to seed the random generation for consistency
    const seed = (location.lat * 10 + location.lng) % 100;
    
    // Generate environmental sensitivity based on location
    const sensitivityLevels = ['Low', 'Medium', 'High', 'Critical'];
    const sensitivityIndex = Math.floor(Math.abs(Math.sin(seed) * sensitivityLevels.length));
    const environmentalSensitivity = sensitivityLevels[sensitivityIndex];
    
    // Generate biodiversity risk
    const biodiversityRisk = Math.min(1, environmentalSensitivity * (1 + Math.abs(Math.cos(seed) * 0.3)));
    let biodiversityRiskLevel;
    if (biodiversityRisk > 0.7) {
        biodiversityRiskLevel = 'High';
    } else if (biodiversityRisk > 0.4) {
        biodiversityRiskLevel = 'Medium';
    } else {
        biodiversityRiskLevel = 'Low';
    }
    
    // Generate carbon footprint (tons CO2 per year)
    const baseCarbonFootprint = 500 + Math.abs(Math.sin(seed) * 500);
    
    // Generate air quality impact
    const airQualityImpact = 20 + Math.abs(Math.cos(seed) * 80);
    let airQualityImpactLevel;
    if (airQualityImpact > 70) {
        airQualityImpactLevel = 'High';
    } else if (airQualityImpact > 40) {
        airQualityImpactLevel = 'Medium';
    } else {
        airQualityImpactLevel = 'Low';
    }
    
    // Generate water resource impact
    const waterResourceImpact = Math.min(1, 0.2 + (environmentalSensitivity * 0.8));
    let waterResourceImpactLevel;
    if (waterResourceImpact > 0.7) {
        waterResourceImpactLevel = 'High';
    } else if (waterResourceImpact > 0.4) {
        waterResourceImpactLevel = 'Medium';
    } else {
        waterResourceImpactLevel = 'Low';
    }
    
    // Generate deforestation risk
    const deforestationRisk = Math.min(1, (environmentalSensitivity * 0.7) + (Math.abs(Math.sin(seed + 1)) * 0.3));
    let deforestationRiskLevel;
    if (deforestationRisk > 0.7) {
        deforestationRiskLevel = 'High';
    } else if (deforestationRisk > 0.4) {
        deforestationRiskLevel = 'Medium';
    } else {
        deforestationRiskLevel = 'Low';
    }
    
    // Generate wildlife impact data
    const wildlifeImpact = generateWildlifeImpactData(location, seed, environmentalSensitivity);
    
    // Generate protected areas data
    const protectedAreas = generateProtectedAreasData(location, seed);
    
    // Determine legal compliance status based on protected areas
    let legalComplianceStatus, requiredPermits;
    if (protectedAreas.length === 0) {
        legalComplianceStatus = 'Fully Compliant';
        requiredPermits = 0;
    } else {
        const nearestProtectedArea = protectedAreas[0]; // Closest one
        if (nearestProtectedArea.distance < 1000) { // Within 1km
            if (nearestProtectedArea.restrictions === 'Severe') {
                legalComplianceStatus = 'Non-Compliant';
                requiredPermits = 3;
            } else {
                legalComplianceStatus = 'Requires Special Permits';
                requiredPermits = 2;
            }
        } else {
            legalComplianceStatus = 'Requires Standard Permits';
            requiredPermits = 1;
        }
    }
    
    // Generate impact scores for different categories
    const impactScores = {
        wildlife: Math.round(wildlifeImpact.overallImpact * 10),
        vegetation: Math.round(deforestationRisk * 10),
        water: Math.round(waterResourceImpact * 10),
        air: Math.round(airQualityImpact / 10),
        noise: 3 + Math.round(Math.random() * 7)
    };
    
    return {
        location: location,
        environmentalSensitivity: {
            value: environmentalSensitivity,
            level: sensitivityLevel
        },
        biodiversityRisk: {
            value: biodiversityRisk,
            level: biodiversityRiskLevel
        },
        carbonFootprint: baseCarbonFootprint.toFixed(1),
        airQualityImpact: {
            value: airQualityImpact.toFixed(1),
            level: airQualityImpactLevel
        },
        waterResourceImpact: {
            value: waterResourceImpact,
            level: waterResourceImpactLevel
        },
        deforestationRisk: {
            value: deforestationRisk,
            level: deforestationRiskLevel
        },
        wildlifeImpact: wildlifeImpact,
        protectedAreas: protectedAreas,
        legalCompliance: {
            status: legalComplianceStatus,
            requiredPermits: requiredPermits
        },
        impactScores: impactScores
    };
}

/**
 * Generate wildlife impact data
 * @param {Object} location - Location coordinates
 * @param {Number} seed - Random seed
 * @param {Number} environmentalSensitivity - Base environmental sensitivity
 * @returns {Object} - Wildlife impact data
 */
function generateWildlifeImpactData(location, seed, environmentalSensitivity) {
    // Generate species count in the area
    const baseSpeciesCount = 10 + Math.floor(Math.abs(Math.sin(seed) * 40));
    
    // Generate endangered species count
    const endangeredSpeciesCount = Math.floor(baseSpeciesCount * environmentalSensitivity * 0.3);
    
    // Generate migration routes
    const hasMigrationRoutes = Math.random() < environmentalSensitivity;
    
    // Calculate overall impact
    const overallImpact = environmentalSensitivity * (1 + (endangeredSpeciesCount / baseSpeciesCount));
    let impactLevel;
    if (overallImpact > 0.7) {
        impactLevel = 'Significant';
    } else if (overallImpact > 0.4) {
        impactLevel = 'Moderate';
    } else {
        impactLevel = 'Minimal';
    }
    
    return {
        speciesCount: baseSpeciesCount,
        endangeredSpecies: endangeredSpeciesCount,
        hasMigrationRoutes: hasMigrationRoutes,
        overallImpact: overallImpact,
        impactLevel: impactLevel
    };
}

/**
 * Generate protected areas data
 * @param {Object} location - Location coordinates
 * @param {Number} seed - Random seed
 * @returns {Array} - List of protected areas
 */
function generateProtectedAreasData(location, seed) {
    const protectedAreas = [];
    const areaCount = Math.floor(Math.abs(Math.sin(seed) * 3)); // 0-2 protected areas
    
    const areaTypes = ['National Park', 'Wildlife Sanctuary', 'Nature Reserve', 'Protected Watershed'];
    const restrictionLevels = ['Mild', 'Moderate', 'Severe'];
    
    for (let i = 0; i < areaCount; i++) {
        // Generate distance (1-10km)
        const distance = 1000 + Math.abs(Math.cos(seed + i) * 9000);
        
        // Select area type and restriction level
        const typeIndex = Math.floor(Math.abs(Math.sin(seed + i) * areaTypes.length));
        const restrictionIndex = Math.floor(Math.abs(Math.cos(seed + i) * restrictionLevels.length));
        
        protectedAreas.push({
            name: `${areaTypes[typeIndex]} ${String.fromCharCode(65 + i)}`,
            distance: distance,
            type: areaTypes[typeIndex],
            restrictions: restrictionLevels[restrictionIndex]
        });
    }
    
    // Sort by distance
    protectedAreas.sort((a, b) => a.distance - b.distance);
    
    return protectedAreas;
}

/**
 * Visualize environmental data on the map
 * @param {Object} environmentalData - Environmental analysis data
 */
function visualizeEnvironmentalData(environmentalData) {
    // Create a layer group for the environmental visualization
    const environmentalLayer = L.layerGroup();
    
    // Add wetlands (blue zones)
    environmentalData.zones.wetlands.forEach(wetland => {
        L.polygon(wetland.polygon, {
            color: '#2196F3',
            fillColor: '#2196F3',
            fillOpacity: 0.4,
            weight: 1
        }).bindTooltip(`${wetland.name}<br>${wetland.type}<br>${wetland.size.toFixed(2)} sq km`)
        .addTo(environmentalLayer);
    });
    
    // Add forests (green zones)
    environmentalData.zones.forests.forEach(forest => {
        L.polygon(forest.polygon, {
            color: '#4CAF50',
            fillColor: '#4CAF50',
            fillOpacity: 0.4,
            weight: 1
        }).bindTooltip(`${forest.name}<br>${forest.type}<br>${forest.size.toFixed(2)} sq km`)
        .addTo(environmentalLayer);
    });
    
    // Add agricultural lands (yellow zones)
    environmentalData.zones.agricultural.forEach(agriLand => {
        L.polygon(agriLand.polygon, {
            color: '#FFC107',
            fillColor: '#FFC107',
            fillOpacity: 0.4,
            weight: 1
        }).bindTooltip(`${agriLand.name}<br>${agriLand.type}<br>${agriLand.size.toFixed(2)} sq km`)
        .addTo(environmentalLayer);
    });
    
    // Add wildlife migration routes
    environmentalData.wildlifeRoutes.forEach(route => {
        // Color based on conservation status
        let routeColor = '#9C27B0'; // Default purple
        if (route.conservationStatus === 'Critically Endangered') routeColor = '#F44336'; // Red
        else if (route.conservationStatus === 'Endangered') routeColor = '#FF5722'; // Deep Orange
        else if (route.conservationStatus === 'Vulnerable') routeColor = '#FF9800'; // Orange
        
        L.polyline(route.path, {
            color: routeColor,
            weight: 3,
            dashArray: '5, 10',
            opacity: 0.7
        }).bindTooltip(`${route.name}<br>Status: ${route.conservationStatus}<br>Season: ${route.seasonality}`)
        .addTo(environmentalLayer);
        
        // Add arrow to indicate direction
        const midIndex = Math.floor(route.path.length / 2);
        if (midIndex > 0) {
            const p1 = route.path[midIndex - 1];
            const p2 = route.path[midIndex];
            
            // Create arrow marker
            const arrowIcon = L.divIcon({
                className: 'arrow-icon',
                html: `<div style="color: ${routeColor}; transform: rotate(${Math.atan2(p2[0] - p1[0], p2[1] - p1[1]) * 180 / Math.PI}deg);">→</div>`,
                iconSize: [20, 20]
            });
            
            L.marker([p2[0], p2[1]], { icon: arrowIcon }).addTo(environmentalLayer);
        }
    });
    
    // Add the environmental layer to the map
    environmentalLayer.addTo(map);
    
    // Store the layer for later reference
    analysisLayers.environmental = environmentalLayer;
}

/**
 * Update the UI with environmental analysis results
 * @param {Object} environmentalData - Environmental analysis data
 */
function updateEnvironmentalUI(environmentalData) {
    // Update environmental sensitivity
    document.getElementById('environmental-sensitivity').textContent = environmentalData.environmentalSensitivity;
    
    // Update biodiversity risk
    document.getElementById('biodiversity-risk').textContent = environmentalData.biodiversityRisk;
    
    // Update carbon footprint
    document.getElementById('carbon-footprint').textContent = `${environmentalData.carbonFootprint} tons CO2`;
    
    // Update air quality index
    document.getElementById('air-quality-index').textContent = environmentalData.airQualityIndex;
    
    // Update water resource impact
    document.getElementById('water-resource-impact').textContent = environmentalData.waterResourceImpact;
    
    // Update deforestation risk
    document.getElementById('deforestation-risk').textContent = environmentalData.deforestationRisk;
    
    // Update legal compliance status
    document.getElementById('legal-compliance-status').textContent = environmentalData.legalComplianceStatus;
    
    // Update required permits
    document.getElementById('required-permits').textContent = environmentalData.requiredPermits > 0 ? 
        environmentalData.requiredPermits : 'None';
}

/**
 * Initialize environmental charts
 * @param {Object} environmentalData - Environmental analysis data
 */
function initializeEnvironmentalCharts(environmentalData) {
    // Initialize environmental sensitivity map
    const sensitivityCtx = document.getElementById('environmental-sensitivity-chart').getContext('2d');
    new Chart(sensitivityCtx, {
        type: 'pie',
        data: {
            labels: ['Wetlands', 'Forests', 'Agricultural', 'Other'],
            datasets: [{
                data: [
                    environmentalData.zones.wetlands.reduce((sum, zone) => sum + zone.size, 0),
                    environmentalData.zones.forests.reduce((sum, zone) => sum + zone.size, 0),
                    environmentalData.zones.agricultural.reduce((sum, zone) => sum + zone.size, 0),
                    10 // Other land types (fixed value for simplicity)
                ],
                backgroundColor: ['#2196F3', '#4CAF50', '#FFC107', '#9E9E9E']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Land Type Distribution (sq km)',
                    color: '#ffffff'
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ffffff'
                    }
                }
            }
        }
    });
    
    // Initialize biodiversity impact chart
    const biodiversityCtx = document.getElementById('biodiversity-impact-chart').getContext('2d');
    
    // Count species by conservation status
    const statusCounts = {
        'Least Concern': 0,
        'Near Threatened': 0,
        'Vulnerable': 0,
        'Endangered': 0,
        'Critically Endangered': 0
    };
    
    environmentalData.wildlifeRoutes.forEach(route => {
        statusCounts[route.conservationStatus]++;
    });
    
    new Chart(biodiversityCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                label: 'Species Count',
                data: Object.values(statusCounts),
                backgroundColor: [
                    '#4CAF50', // Least Concern - Green
                    '#8BC34A', // Near Threatened - Light Green
                    '#FFC107', // Vulnerable - Yellow
                    '#FF9800', // Endangered - Orange
                    '#F44336'  // Critically Endangered - Red
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Species by Conservation Status',
                    color: '#ffffff'
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * Perform optimized siting analysis for a location
 * @param {Object} location - {lat, lng} object with coordinates
 */
function performOptimizedSiting(location) {
    // Show loading state
    setSitingLoadingState();
    
    // In a real application, this would use multiple GIS datasets
    // For this demo, we'll simulate the siting analysis
    setTimeout(() => {
        // Generate siting data
        const sitingData = generateSitingData(location);
        
        // Visualize the siting data on the map
        visualizeSitingData(sitingData);
        
        // Update the UI with siting analysis results
        updateSitingUI(sitingData);
        
        // Initialize siting charts
        initializeSitingCharts(sitingData);
    }, 1000); // Simulate API delay
}

/**
 * Set loading state for siting analysis UI
 */
function setSitingLoadingState() {
    // Update UI elements to show loading state
    document.getElementById('solar-panel-placement').textContent = 'Loading...';
    document.getElementById('wind-turbine-placement').textContent = 'Loading...';
    document.getElementById('power-grid-accessibility').textContent = 'Loading...';
    document.getElementById('infrastructure-accessibility').textContent = 'Loading...';
    document.getElementById('land-ownership').textContent = 'Loading...';
    document.getElementById('roi-calculation').textContent = 'Loading...';
    document.getElementById('suitability-score').textContent = 'Loading...';
}

/**
 * Generate simulated siting data based on location
 * @param {Object} location - {lat, lng} object with coordinates
 * @returns {Object} - Siting analysis data
 */
function generateSitingData(location) {
    // Use location to seed the random generation for consistency
    const seed = (location.lat * 10 + location.lng) % 100;
    
    // Generate solar potential
    const solarIrradiance = 3.5 + Math.abs(Math.sin(seed) * 2.5); // 3.5-6 kWh/m²/day
    const solarShadingLoss = 5 + Math.abs(Math.cos(seed) * 15); // 5-20%
    
    // Generate wind potential
    const windSpeed = 4 + Math.abs(Math.sin(seed * 2) * 4); // 4-8 m/s
    const turbulence = Math.abs(Math.cos(seed * 2) * 20); // 0-20%
    
    // Generate grid accessibility
    const gridDistance = 0.5 + Math.abs(Math.sin(seed * 3) * 4.5); // 0.5-5 km
    const substationCapacity = 10 + Math.abs(Math.cos(seed * 3) * 40); // 10-50 MW
    
    // Generate infrastructure accessibility
    const roadDistance = 0.2 + Math.abs(Math.sin(seed * 4) * 1.8); // 0.2-2 km
    const maintenanceHubDistance = 5 + Math.abs(Math.cos(seed * 4) * 45); // 5-50 km
    
    // Generate land information
    const landOwnership = Math.random() < 0.3 ? 'Public' : 'Private';
    const landCost = 5000 + Math.abs(Math.sin(seed * 5) * 15000); // $5,000-$20,000 per acre
    
    // Generate ROI calculation
    const energyOutput = 2000 + Math.abs(Math.cos(seed * 5) * 3000); // 2000-5000 MWh/year
    const breakEvenPeriod = 5 + Math.abs(Math.sin(seed * 6) * 5); // 5-10 years
    
    // Calculate multi-factor suitability score (0-100)
    const solarFactor = (solarIrradiance - 3.5) / 2.5 * 25; // 0-25 points
    const windFactor = (windSpeed - 4) / 4 * 25; // 0-25 points
    const gridFactor = (5 - gridDistance) / 4.5 * 15; // 0-15 points
    const infrastructureFactor = (2 - roadDistance) / 1.8 * 10; // 0-10 points
    const landFactor = landOwnership === 'Public' ? 10 : (20000 - landCost) / 15000 * 10; // 0-10 points
    const roiFactor = (10 - breakEvenPeriod) / 5 * 15; // 0-15 points
    
    const suitabilityScore = Math.min(100, Math.max(0, 
        solarFactor + windFactor + gridFactor + infrastructureFactor + landFactor + roiFactor
    ));
    
    // Generate optimal placement locations
    const optimalLocations = generateOptimalLocations(location, seed, suitabilityScore);
    
    return {
        location: location,
        solar: {
            irradiance: solarIrradiance,
            shadingLoss: solarShadingLoss,
            optimalLocations: optimalLocations.solar
        },
        wind: {
            speed: windSpeed,
            turbulence: turbulence,
            optimalLocations: optimalLocations.wind
        },
        grid: {
            distance: gridDistance,
            substationCapacity: substationCapacity
        },
        infrastructure: {
            roadDistance: roadDistance,
            maintenanceHubDistance: maintenanceHubDistance
        },
        land: {
            ownership: landOwnership,
            cost: landCost
        },
        roi: {
            energyOutput: energyOutput,
            breakEvenPeriod: breakEvenPeriod
        },
        suitabilityScore: suitabilityScore
    };
}

/**
 * Generate optimal placement locations
 * @param {Object} location - Center point
 * @param {Number} seed - Random seed
 * @param {Number} suitabilityScore - Overall suitability score
 * @returns {Object} - Optimal locations for solar and wind
 */
function generateOptimalLocations(location, seed, suitabilityScore) {
    const locations = {
        solar: [],
        wind: []
    };
    
    // Number of locations depends on suitability score
    const solarCount = Math.max(1, Math.floor(suitabilityScore / 25));
    const windCount = Math.max(1, Math.floor(suitabilityScore / 33));
    
    // Generate solar panel locations
    for (let i = 0; i < solarCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 200 + Math.random() * 800; // 200-1000m
        
        const lat = location.lat + (Math.sin(angle) * distance) / 111000;
        const lng = location.lng + (Math.cos(angle) * distance) / (111000 * Math.cos(location.lat * Math.PI / 180));
        
        locations.solar.push({
            location: { lat, lng },
            capacity: 2 + Math.random() * 8, // 2-10 MW
            efficiency: 15 + Math.random() * 10, // 15-25%
            score: 60 + Math.random() * 40 // 60-100 score
        });
    }
    
    // Generate wind turbine locations
    for (let i = 0; i < windCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 500 + Math.random() * 1500; // 500-2000m
        
        const lat = location.lat + (Math.sin(angle) * distance) / 111000;
        const lng = location.lng + (Math.cos(angle) * distance) / (111000 * Math.cos(location.lat * Math.PI / 180));
        
        locations.wind.push({
            location: { lat, lng },
            capacity: 1.5 + Math.random() * 3.5, // 1.5-5 MW
            height: 80 + Math.random() * 40, // 80-120m
            score: 60 + Math.random() * 40 // 60-100 score
        });
    }
    
    return locations;
}

/**
 * Visualize siting data on the map
 * @param {Object} sitingData - Siting analysis data
 */
function visualizeSitingData(sitingData) {
    // Create a layer group for the siting visualization
    const sitingLayer = L.layerGroup();
    
    // Add solar panel locations
    sitingData.solar.optimalLocations.forEach(location => {
        const marker = L.marker([location.location.lat, location.location.lng], {
            icon: L.divIcon({
                className: 'solar-icon',
                html: `<div style="background-color: #FFC107; width: 15px; height: 15px; border-radius: 50%; border: 2px solid #FF9800;"></div>`,
                iconSize: [15, 15]
            })
        });
        
        marker.bindTooltip(
            `<strong>Optimal Solar Panel Location</strong><br>` +
            `Capacity: ${location.capacity.toFixed(1)} MW<br>` +
            `Efficiency: ${location.efficiency.toFixed(1)}%<br>` +
            `Score: ${location.score.toFixed(0)}/100`
        );
        
        marker.addTo(sitingLayer);
    });
    
    // Add wind turbine locations
    sitingData.wind.optimalLocations.forEach(location => {
        const marker = L.marker([location.location.lat, location.location.lng], {
            icon: L.divIcon({
                className: 'wind-icon',
                html: `<div style="background-color: #2196F3; width: 15px; height: 15px; border-radius: 50%; border: 2px solid #1976D2;"></div>`,
                iconSize: [15, 15]
            })
        });
        
        marker.bindTooltip(
            `<strong>Optimal Wind Turbine Location</strong><br>` +
            `Capacity: ${location.capacity.toFixed(1)} MW<br>` +
            `Height: ${location.height.toFixed(0)}m<br>` +
            `Score: ${location.score.toFixed(0)}/100`
        );
        
        marker.addTo(sitingLayer);
    });
    
    // Add power grid connection (simulated)
    const gridLine = L.polyline([
        [sitingData.location.lat, sitingData.location.lng],
        [sitingData.location.lat + 0.01, sitingData.location.lng + 0.01]
    ], {
        color: '#673AB7',
        weight: 3,
        dashArray: '5, 10'
    }).bindTooltip(`Power Grid Connection<br>Distance: ${sitingData.grid.distance.toFixed(1)}km`);
    
    gridLine.addTo(sitingLayer);
    
    // Add road access (simulated)
    const roadLine = L.polyline([
        [sitingData.location.lat, sitingData.location.lng],
        [sitingData.location.lat - 0.008, sitingData.location.lng - 0.012]
    ], {
        color: '#795548',
        weight: 4
    }).bindTooltip(`Road Access<br>Distance: ${sitingData.infrastructure.roadDistance.toFixed(1)}km`);
    
    roadLine.addTo(sitingLayer);
    
    // Add the siting layer to the map
    sitingLayer.addTo(map);
    
    // Store the layer for later reference
    analysisLayers.siting = sitingLayer;
}

/**
 * Update the UI with siting analysis results
 * @param {Object} sitingData - Siting analysis data
 */
function updateSitingUI(sitingData) {
    // Update solar panel placement
    document.getElementById('solar-panel-placement').textContent = 
        `${sitingData.solar.irradiance.toFixed(1)} kWh/m²/day, ${sitingData.solar.shadingLoss.toFixed(1)}% shading`;
    
    // Update wind turbine placement
    document.getElementById('wind-turbine-placement').textContent = 
        `${sitingData.wind.speed.toFixed(1)} m/s, ${sitingData.wind.turbulence.toFixed(1)}% turbulence`;
    
    // Update power grid accessibility
    document.getElementById('power-grid-accessibility').textContent = 
        `${sitingData.grid.distance.toFixed(1)}km, ${sitingData.grid.substationCapacity.toFixed(0)} MW capacity`;
    
    // Update infrastructure accessibility
    document.getElementById('infrastructure-accessibility').textContent = 
        `Road: ${sitingData.infrastructure.roadDistance.toFixed(1)}km, Maintenance: ${sitingData.infrastructure.maintenanceHubDistance.toFixed(1)}km`;
    
    // Update land ownership
    document.getElementById('land-ownership').textContent = 
        `${sitingData.land.ownership}, $${sitingData.land.cost.toFixed(0)} per acre`;
    
    // Update ROI calculation
    document.getElementById('roi-calculation').textContent = 
        `${sitingData.roi.energyOutput.toFixed(0)} MWh/year, ${sitingData.roi.breakEvenPeriod.toFixed(1)} years`;
    
    // Update suitability score
    document.getElementById('suitability-score').textContent = 
        `${sitingData.suitabilityScore.toFixed(0)}/100`;
}

/**
 * Initialize siting charts
 * @param {Object} sitingData - Siting analysis data
 */
function initializeSitingCharts(sitingData) {
    // Initialize suitability factors chart
    const factorsCtx = document.getElementById('suitability-factors-chart').getContext('2d');
    new Chart(factorsCtx, {
        type: 'radar',
        data: {
            labels: ['Solar Potential', 'Wind Potential', 'Grid Access', 'Infrastructure', 'Land Cost', 'ROI'],
            datasets: [{
                label: 'Site Suitability',
                data: [
                    sitingData.solar.irradiance / 6 * 100, // Normalize to 0-100
                    sitingData.wind.speed / 8 * 100,
                    (5 - sitingData.grid.distance) / 5 * 100,
                    (2 - sitingData.infrastructure.roadDistance) / 2 * 100,
                    sitingData.land.ownership === 'Public' ? 90 : (20000 - sitingData.land.cost) / 20000 * 100,
                    (10 - sitingData.roi.breakEvenPeriod) / 10 * 100
                ],
                backgroundColor: 'rgba(33, 150, 243, 0.2)',
                borderColor: 'rgba(33, 150, 243, 1)',
                pointBackgroundColor: 'rgba(33, 150, 243, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(33, 150, 243, 1)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.2)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)'
                    },
                    pointLabels: {
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff',
                        backdropColor: 'rgba(0, 0, 0, 0.7)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Multi-Factor Suitability Analysis',
                    color: '#ffffff'
                },
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Initialize ROI projection chart
    const roiCtx = document.getElementById('roi-projection-chart').getContext('2d');
    
    // Generate ROI projection data
    const years = Array.from({length: 15}, (_, i) => i + 1);
    const initialInvestment = sitingData.land.cost * 10; // Simulated initial cost
    const annualRevenue = sitingData.roi.energyOutput * 100; // Simulated revenue
    
    const cumulativeROI = years.map(year => {
        return -initialInvestment + (annualRevenue * year);
    });
    
    new Chart(roiCtx, {
        type: 'line',
        data: {
            labels: years.map(year => `Year ${year}`),
            datasets: [{
                label: 'Cumulative Return ($)',
                data: cumulativeROI,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Cumulative Return ($)',
                        color: '#ffffff'
                    },
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Return on Investment Projection',
                    color: '#ffffff'
                },
                annotation: {
                    annotations: {
                        breakEvenLine: {
                            type: 'line',
                            yMin: 0,
                            yMax: 0,
                            borderColor: '#FFC107',
                            borderWidth: 2,
                            label: {
                                content: 'Break Even',
                                enabled: true,
                                position: 'end',
                                backgroundColor: 'rgba(255, 193, 7, 0.8)'
                            }
                        }
                    }
                }
            }
        }
    });
}

// Initialize event listeners for analysis type selection
document.addEventListener('DOMContentLoaded', function() {
    // Get all analysis option elements
    const analysisOptions = document.querySelectorAll('.analysis-option');
    
    // Add click event listener to each option
    analysisOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            analysisOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Store the selected analysis type
            const analysisType = this.getAttribute('data-type');
            
            // When a location is selected, perform the selected analysis type
            map.on('click', function(e) {
                handleAnalysisTypeSelection(analysisType, e.latlng);
            });
            
            // Also update the analyze button to use the selected analysis type
            document.getElementById('analyzeArea').addEventListener('click', function() {
                const center = map.getCenter();
                handleAnalysisTypeSelection(analysisType, center);
            });
            
            // If coordinates are entered manually
            document.getElementById('analyzeLocation')?.addEventListener('click', function() {
                const lat = parseFloat(document.getElementById('latInput').value);
                const lng = parseFloat(document.getElementById('lngInput').value);
                
                if (!isNaN(lat) && !isNaN(lng)) {
                    handleAnalysisTypeSelection(analysisType, { lat, lng });
                }
            });
        });
    });
});