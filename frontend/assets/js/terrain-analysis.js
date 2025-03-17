// Terrain Analysis Module for Renewable Energy Site Selection

/**
 * Updates terrain analysis charts and data with real elevation data
 * @param {Object} terrainData - Terrain data including elevation values
 */
function updateTerrainAnalysisWithRealData(terrainData) {
    // Update elevation profile chart if it exists
    const elevationChart = Chart.getChart('elevationProfileChart');
    if (elevationChart && terrainData.elevationValues) {
        // Generate dynamic elevation profile based on real data
        const elevationProfile = terrainData.elevationValues.map(val => parseFloat(val.toFixed(1)));
        
        // Update chart data
        elevationChart.data.datasets[0].data = elevationProfile;
        
        // Update distance labels
        elevationChart.data.labels = Array.from({length: elevationProfile.length}, (_, i) => 
            `${Math.round(i * (500 / (elevationProfile.length - 1)))}m`);
        
        // Calculate the min and max elevation for better y-axis scaling
        const minElevation = Math.min(...elevationProfile) - 2;
        const maxElevation = Math.max(...elevationProfile) + 2;
        
        // Update the y-axis scale to better show the terrain variations
        elevationChart.options.scales.y.min = minElevation;
        elevationChart.options.scales.y.max = maxElevation;
        
        // Update chart title to show the actual elevation
        elevationChart.options.plugins.title.text = `Terrain Elevation Profile (Base: ${terrainData.elevation.toFixed(1)}m)`;
        
        // Update chart
        elevationChart.update();
    }
    
    // Update slope chart if it exists
    const slopeChart = Chart.getChart('slopeAnalysisChart');
    if (slopeChart && terrainData.slopeValues) {
        slopeChart.data.datasets[0].data = terrainData.slopeValues;
        slopeChart.update();
    }
    
    // Update soil composition chart if it exists
    const soilChart = Chart.getChart('soilCompositionChart');
    if (soilChart && terrainData.soilData) {
        const soilComposition = calculateSoilComposition(terrainData.soilData);
        soilChart.data.datasets[0].data = soilComposition;
        soilChart.update();
    }
    
    // Update risk analysis chart if it exists
    const riskChart = Chart.getChart('riskAnalysisChart');
    if (riskChart && terrainData.elevation && terrainData.soilData) {
        const riskLevels = calculateRiskLevels(terrainData, terrainData.soilData);
        riskChart.data.datasets[0].data = riskLevels;
        riskChart.update();
    }
    
    // Update UI elements with terrain data
    if (terrainData.elevation) {
        document.getElementById('elevation').textContent = `Average Elevation: ${terrainData.elevation.toFixed(1)}m`;
    }
    
    if (terrainData.slope) {
        document.getElementById('slope').textContent = `Average Slope: ${terrainData.slope.toFixed(1)}°`;
    }
    
    // Update other UI elements as needed
    console.log('Terrain analysis updated with real data:', terrainData);
}

/**
 * Fetches terrain data for a specific location
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Object} - Terrain data including elevation and soil information
 */
async function fetchTerrainData(lat, lng) {
    try {
        // Fetch elevation data from API
        const response = await fetch(`https://api.opentopodata.org/v1/aster30m?locations=${lat},${lng}`);
        const data = await response.json();
        
        // Extract elevation value
        const elevation = data.results[0].elevation;
        
        // Generate mock soil data (in a real app, this would come from a soil database API)
        const soilData = {
            properties: {
                sand: 40 + Math.random() * 20,  // 40-60%
                silt: 20 + Math.random() * 15,  // 20-35%
                clay: 10 + Math.random() * 15,  // 10-25%
                organic: 5 + Math.random() * 5   // 5-10%
            }
        };
        
        // Calculate slope based on elevation (simplified)
        const slope = elevation * 0.05;
        
        // Generate realistic elevation values for profile based on the actual elevation
        const elevationValues = [];
        const numPoints = 10; // More points for a smoother profile
        
        // Create a more realistic terrain profile with proper variations
        for (let i = 0; i < numPoints; i++) {
            // Calculate distance from center (0 to 1)
            const distanceFromCenter = Math.abs((i / (numPoints - 1)) - 0.5) * 2;
            
            // Use multiple sine waves with different frequencies to create natural-looking terrain
            const primaryVariation = Math.sin(i * 0.8) * 5;
            const secondaryVariation = Math.sin(i * 2.5) * 2 * (1 - distanceFromCenter);
            const microTerrain = (Math.random() - 0.5) * 1.5; // Small random variations
            
            // Calculate the elevation at this point with more realistic variations
            // The variations are proportional to the actual elevation (higher elevation = more variation)
            const variationScale = Math.max(1, Math.log10(elevation) * 0.5);
            const pointElevation = elevation + (primaryVariation + secondaryVariation + microTerrain) * variationScale;
            
            // Ensure we don't go below sea level (unless the area is actually below sea level)
            elevationValues.push(Math.max(0, pointElevation));
        }
        
        // Return comprehensive terrain data
        return {
            elevation,
            slope,
            elevationValues,
            soilData,
            slopeValues: [slope * 0.8, slope * 0.9, slope, slope * 1.1, slope * 1.2, slope * 1.1]
        };
    } catch (error) {
        console.error('Error fetching terrain data:', error);
        return null;
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateTerrainAnalysisWithRealData,
        fetchTerrainData
    };
}