// Risk Analysis Module for Renewable Energy Site Selection

/**
 * Calculates comprehensive risk levels based on terrain and soil data
 * @param {Object} terrainData - Terrain data including elevation, slope, etc.
 * @param {Object} soilData - Soil composition data
 * @returns {Array} - Array of risk values for different risk categories
 */
function calculateRiskLevels(terrainData, soilData) {
    // Calculate individual risk factors
    const erosionRisk = calculateErosionRisk(terrainData, soilData);
    const floodRisk = calculateFloodRisk(terrainData);
    const landslideRisk = calculateLandslideRisk(terrainData, soilData);
    const seismicRisk = calculateSeismicRisk(terrainData);
    
    // Return array of risk values for chart display
    return [erosionRisk, floodRisk, landslideRisk, seismicRisk];
}

/**
 * Calculates erosion risk based on terrain elevation and soil sand content
 * @param {Object} terrainData - Terrain data
 * @param {Object} soilData - Soil data
 * @returns {Number} - Erosion risk value (0-100)
 */
function calculateErosionRisk(terrainData, soilData) {
    return Math.min(100, terrainData.elevation * 0.1 + (soilData.properties.sand / 10));
}

/**
 * Calculates flood risk based on terrain elevation
 * @param {Object} terrainData - Terrain data
 * @returns {Number} - Flood risk value (0-100)
 */
function calculateFloodRisk(terrainData) {
    return Math.max(0, 100 - terrainData.elevation * 0.2);
}

/**
 * Calculates landslide risk based on terrain elevation and soil clay content
 * @param {Object} terrainData - Terrain data
 * @param {Object} soilData - Soil data
 * @returns {Number} - Landslide risk value (0-100)
 */
function calculateLandslideRisk(terrainData, soilData) {
    return Math.min(100, terrainData.elevation * 0.15 + (soilData.properties.clay / 5));
}

/**
 * Calculates seismic risk based on terrain elevation
 * @param {Object} terrainData - Terrain data
 * @returns {Number} - Seismic risk value (0-100)
 */
function calculateSeismicRisk(terrainData) {
    return Math.min(100, terrainData.elevation * 0.05);
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateRiskLevels,
        calculateErosionRisk,
        calculateFloodRisk,
        calculateLandslideRisk,
        calculateSeismicRisk
    };
}