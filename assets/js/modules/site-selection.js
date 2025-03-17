/**
 * Site Selection Module
 * Handles the AI-powered site selection functionality
 */

/**
 * Solar Irradiance Analysis Functions
 */

/**
 * Calculate solar irradiance potential based on location and terrain
 * @param {object} location - {lat, lon, elevation} object
 * @param {object} options - Additional options for calculation
 * @returns {object} Solar irradiance data
 */
function calculateSolarIrradiance(location, options = {}) {
    const { lat, lon, elevation = 0 } = location;
    const { 
        panelTilt = null, 
        panelAzimuth = 180, // South-facing in Northern Hemisphere
        shadingFactor = 0,
        panelEfficiency = 0.2, // 20% efficiency
        systemLosses = 0.14 // 14% system losses
    } = options;
    
    // Calculate optimal tilt based on latitude if not provided
    const optimalTilt = panelTilt || Math.abs(lat) * 0.76;
    
    // Adjust azimuth based on hemisphere (South-facing in Northern, North-facing in Southern)
    const adjustedAzimuth = lat >= 0 ? panelAzimuth : (panelAzimuth + 180) % 360;
    
    // Base irradiance calculation based on latitude (simplified model)
    let baseIrradiance;
    const absLat = Math.abs(lat);
    
    if (absLat < 23.5) { // Tropical
        baseIrradiance = 5.5; // kWh/m²/day
    } else if (absLat < 45) { // Temperate
        baseIrradiance = 4.5; // kWh/m²/day
    } else { // Polar
        baseIrradiance = 3.5; // kWh/m²/day
    }
    
    // Adjust for elevation (higher elevation = more irradiance)
    const elevationFactor = 1 + (elevation / 10000); // 1% increase per 100m
    
    // Adjust for tilt optimization (simplified model)
    const tiltOptimizationFactor = Math.cos(Math.abs(optimalTilt - absLat) * Math.PI / 180);
    
    // Adjust for shading
    const shadingAdjustment = 1 - shadingFactor;
    
    // Calculate final irradiance
    const irradiance = baseIrradiance * elevationFactor * tiltOptimizationFactor * shadingAdjustment;
    
    // Calculate energy production potential
    const dailyEnergyPerSqm = irradiance * panelEfficiency * (1 - systemLosses);
    const annualEnergyPerSqm = dailyEnergyPerSqm * 365;
    
    return {
        location: { lat, lon, elevation },
        panel: {
            tilt: optimalTilt,
            azimuth: adjustedAzimuth,
            efficiency: panelEfficiency
        },
        irradiance: {
            daily: parseFloat(irradiance.toFixed(2)), // kWh/m²/day
            annual: parseFloat((irradiance * 365).toFixed(2)) // kWh/m²/year
        },
        energyProduction: {
            dailyPerSqm: parseFloat(dailyEnergyPerSqm.toFixed(2)), // kWh/m²/day
            annualPerSqm: parseFloat(annualEnergyPerSqm.toFixed(2)), // kWh/m²/year
        },
        factors: {
            elevation: parseFloat(elevationFactor.toFixed(2)),
            tiltOptimization: parseFloat(tiltOptimizationFactor.toFixed(2)),
            shading: parseFloat(shadingAdjustment.toFixed(2))
        }
    };
}

/**
 * Calculate seasonal solar yield based on location
 * @param {object} location - {lat, lon} object
 * @returns {object} Seasonal solar yield data
 */
function calculateSeasonalSolarYield(location) {
    const { lat } = location;
    const isNorthernHemisphere = lat >= 0;
    
    // Define seasons based on hemisphere
    const seasons = isNorthernHemisphere ? 
        { winter: [12, 1, 2], spring: [3, 4, 5], summer: [6, 7, 8], autumn: [9, 10, 11] } :
        { winter: [6, 7, 8], spring: [9, 10, 11], summer: [12, 1, 2], autumn: [3, 4, 5] };
    
    // Base irradiance calculation
    const baseIrradiance = calculateSolarIrradiance(location).irradiance.daily;
    
    // Seasonal variation factors (simplified model)
    const seasonalFactors = {
        winter: isNorthernHemisphere ? 0.6 : 1.2,
        spring: 1.1,
        summer: isNorthernHemisphere ? 1.3 : 0.7,
        autumn: 1.0
    };
    
    // Calculate seasonal yields
    const seasonalYield = {};
    for (const [season, factor] of Object.entries(seasonalFactors)) {
        seasonalYield[season] = {
            dailyAverage: parseFloat((baseIrradiance * factor).toFixed(2)),
            months: seasons[season]
        };
    }
    
    return {
        location,
        baseIrradiance,
        hemisphere: isNorthernHemisphere ? 'Northern' : 'Southern',
        seasonalYield
    };
}

/**
 * Calculate optimal panel angle based on latitude and season
 * @param {number} latitude - Latitude in degrees
 * @param {string} season - Season (winter, spring, summer, autumn)
 * @returns {object} Optimal panel configuration
 */
function calculateOptimalPanelAngle(latitude, season = null) {
    const absLat = Math.abs(latitude);
    const isNorthernHemisphere = latitude >= 0;
    
    // Base tilt angle (latitude * 0.76 is a common rule of thumb)
    let optimalTilt = absLat * 0.76;
    
    // Seasonal adjustments if season is specified
    if (season) {
        const seasonalAdjustments = {
            winter: isNorthernHemisphere ? 15 : -15,
            summer: isNorthernHemisphere ? -15 : 15,
            spring: 0,
            autumn: 0
        };
        
        optimalTilt += seasonalAdjustments[season.toLowerCase()] || 0;
    }
    
    // Ensure tilt is within reasonable bounds (0-90 degrees)
    optimalTilt = Math.max(0, Math.min(90, optimalTilt));
    
    // Optimal azimuth (South in Northern Hemisphere, North in Southern)
    const optimalAzimuth = isNorthernHemisphere ? 180 : 0;
    
    return {
        tilt: parseFloat(optimalTilt.toFixed(1)),
        azimuth: optimalAzimuth,
        hemisphere: isNorthernHemisphere ? 'Northern' : 'Southern'
    };
}

/**
 * Wind Speed & Weather Analysis Functions
 */

/**
 * Analyze wind power potential based on location and terrain
 * @param {object} location - {lat, lon, elevation, terrain} object
 * @param {object} options - Additional options for calculation
 * @returns {object} Wind power potential data
 */
function analyzeWindPowerPotential(location, options = {}) {
    const { lat, lon, elevation = 0, terrain = 'flat' } = location;
    const { 
        turbineHeight = 80, // meters
        roughnessLength = null,
        turbineEfficiency = 0.35 // 35% efficiency
    } = options;
    
    // Determine roughness length based on terrain if not provided
    let terrainRoughness = roughnessLength;
    if (!terrainRoughness) {
        const roughnessMap = {
            'water': 0.0002,
            'flat': 0.03,
            'rural': 0.1,
            'suburban': 0.4,
            'urban': 1.0,
            'forest': 0.5
        };
        terrainRoughness = roughnessMap[terrain.toLowerCase()] || 0.03;
    }
    
    // Base wind speed calculation (simplified model based on latitude)
    let baseWindSpeed;
    const absLat = Math.abs(lat);
    
    if (absLat < 15) { // Equatorial
        baseWindSpeed = 3.0; // m/s
    } else if (absLat < 30) { // Tropical
        baseWindSpeed = 4.5; // m/s
    } else if (absLat < 45) { // Temperate
        baseWindSpeed = 6.0; // m/s
    } else if (absLat < 60) { // Subpolar
        baseWindSpeed = 7.0; // m/s
    } else { // Polar
        baseWindSpeed = 8.0; // m/s
    }
    
    // Adjust for elevation (higher elevation = more wind)
    const elevationFactor = 1 + (elevation / 5000); // 1% increase per 50m
    
    // Adjust for height using log wind profile
    const heightFactor = Math.log(turbineHeight / terrainRoughness) / Math.log(10 / terrainRoughness);
    
    // Calculate adjusted wind speed
    const windSpeed = baseWindSpeed * elevationFactor * heightFactor;
    
    // Calculate wind power density (P = 0.5 * air density * v^3)
    // Air density at sea level is approximately 1.225 kg/m³
    const airDensity = 1.225 * Math.exp(-elevation / 8000); // Adjust for elevation
    const windPowerDensity = 0.5 * airDensity * Math.pow(windSpeed, 3);
    
    // Calculate energy production potential
    // Assuming a typical wind turbine with 100m diameter (area = π * r²)
    const rotorDiameter = 100;
    const rotorArea = Math.PI * Math.pow(rotorDiameter / 2, 2);
    const turbinePower = windPowerDensity * rotorArea * turbineEfficiency;
    const annualEnergy = turbinePower * 8760 * 0.4; // 8760 hours/year, 0.4 capacity factor
    
    return {
        location: { lat, lon, elevation, terrain },
        turbine: {
            height: turbineHeight,
            efficiency: turbineEfficiency,
            rotorDiameter: rotorDiameter
        },
        wind: {
            speed: parseFloat(windSpeed.toFixed(2)), // m/s
            powerDensity: parseFloat(windPowerDensity.toFixed(2)) // W/m²
        },
        energyProduction: {
            power: parseFloat((turbinePower / 1000).toFixed(2)), // kW
            annualEnergy: parseFloat((annualEnergy / 1000000).toFixed(2)) // GWh/year
        },
        factors: {
            elevation: parseFloat(elevationFactor.toFixed(2)),
            height: parseFloat(heightFactor.toFixed(2)),
            terrain: parseFloat(terrainRoughness.toFixed(4))
        }
    };
}

/**
 * Analyze seasonal wind patterns
 * @param {object} location - {lat, lon} object
 * @returns {object} Seasonal wind pattern data
 */
function analyzeSeasonalWindPatterns(location) {
    const { lat } = location;
    const isNorthernHemisphere = lat >= 0;
    
    // Define seasons based on hemisphere
    const seasons = isNorthernHemisphere ? 
        { winter: [12, 1, 2], spring: [3, 4, 5], summer: [6, 7, 8], autumn: [9, 10, 11] } :
        { winter: [6, 7, 8], spring: [9, 10, 11], summer: [12, 1, 2], autumn: [3, 4, 5] };
    
    // Base wind speed calculation
    const baseWindSpeed = analyzeWindPowerPotential(location).wind.speed;
    
    // Seasonal variation factors (simplified model)
    const seasonalFactors = {
        winter: isNorthernHemisphere ? 1.3 : 0.9,
        spring: 1.1,
        summer: isNorthernHemisphere ? 0.8 : 1.2,
        autumn: 1.0
    };
    
    // Calculate seasonal patterns
    const seasonalPatterns = {};
    for (const [season, factor] of Object.entries(seasonalFactors)) {
        seasonalPatterns[season] = {
            averageSpeed: parseFloat((baseWindSpeed * factor).toFixed(2)),
            powerFactor: parseFloat(Math.pow(factor, 3).toFixed(2)), // Power scales with cube of wind speed
            months: seasons[season]
        };
    }
    
    return {
        location,
        baseWindSpeed,
        hemisphere: isNorthernHemisphere ? 'Northern' : 'Southern',
        seasonalPatterns
    };
}

/**
 * Land Suitability Analysis Functions
 */

/**
 * Calculate land suitability score based on multiple factors
 * @param {object} siteData - Site data including terrain, soil, etc.
 * @returns {object} Land suitability scores and analysis
 */
function analyzeLandSuitability(siteData) {
    const {
        slope = 5, // degrees
        soilType = 'loam',
        floodRisk = 'low',
        gridDistance = 10, // km
        roadDistance = 5, // km
        populationDistance = 20, // km
        landUse = 'agricultural',
        protectedArea = false,
        landCost = 5000 // $ per acre
    } = siteData;
    
    // Slope score (0-100)
    let slopeScore;
    if (slope < 3) slopeScore = 100;
    else if (slope < 5) slopeScore = 90;
    else if (slope < 10) slopeScore = 70;
    else if (slope < 15) slopeScore = 50;
    else if (slope < 20) slopeScore = 30;
    else slopeScore = 10;
    
    // Soil stability score (0-100)
    const soilScores = {
        'bedrock': 100,
        'gravel': 90,
        'sand': 70,
        'loam': 80,
        'clay': 60,
        'silt': 50,
        'peat': 30
    };
    const soilScore = soilScores[soilType.toLowerCase()] || 50;
    
    // Flood risk score (0-100)
    const floodScores = {
        'none': 100,
        'very low': 90,
        'low': 80,
        'medium': 50,
        'high': 20,
        'very high': 0
    };
    const floodScore = floodScores[floodRisk.toLowerCase()] || 50;
    
    // Infrastructure proximity scores (0-100)
    let gridScore;
    if (gridDistance < 1) gridScore = 100;
    else if (gridDistance < 5) gridScore = 90;
    else if (gridDistance < 10) gridScore = 80;
    else if (gridDistance < 20) gridScore = 60;
    else if (gridDistance < 50) gridScore = 40;
    else gridScore = 20;
    
    let roadScore;
    if (roadDistance < 1) roadScore = 100;
    else if (roadDistance < 2) roadScore = 90;
    else if (roadDistance < 5) roadScore = 80;
    else if (roadDistance < 10) roadScore = 60;
    else if (roadDistance < 20) roadScore = 40;
    else roadScore = 20;
    
    // Population distance score (balance between access and impact)
    let populationScore;
    if (populationDistance < 5) populationScore = 60; // Too close to population
    else if (populationDistance < 10) populationScore = 80;
    else if (populationDistance < 30) populationScore = 100;
    else if (populationDistance < 50) populationScore = 80;
    else populationScore = 60; // Too far from population
    
    // Land use suitability score (0-100)
    const landUseScores = {
        'desert': 100,
        'barren': 100,
        'grassland': 90,
        'shrubland': 85,
        'agricultural': 70,
        'forest': 40,
        'wetland': 20,
        'urban': 10,
        'protected': 0
    };
    const landUseScore = landUseScores[landUse.toLowerCase()] || 50;
    
    // Protected area penalty
    const protectedAreaScore = protectedArea ? 0 : 100;
    
    // Land cost score (0-100, lower cost = higher score)
    let landCostScore;
    if (landCost < 1000) landCostScore = 100;
    else if (landCost < 3000) landCostScore = 90;
    else if (landCost < 5000) landCostScore = 80;
    else if (landCost < 10000) landCostScore = 60;
    else if (landCost < 20000) landCostScore = 40;
    else landCostScore = 20;
    
    // Calculate weighted scores
    const weights = {
        slope: 0.15,
        soil: 0.10,
        flood: 0.15,
        grid: 0.15,
        road: 0.10,
        population: 0.05,
        landUse: 0.10,
        protected: 0.15,
        landCost: 0.05
    };
    
    const weightedScores = {
        slope: slopeScore * weights.slope,
        soil: soilScore * weights.soil,
        flood: floodScore * weights.flood,
        grid: gridScore * weights.grid,
        road: roadScore * weights.road,
        population: populationScore * weights.population,
        landUse: landUseScore * weights.landUse,
        protected: protectedAreaScore * weights.protected,
        landCost: landCostScore * weights.landCost
    };
    
    // Calculate overall score
    const overallScore = Object.values(weightedScores).reduce((sum, score) => sum + score, 0);
    
    // Generate recommendations
    const recommendations = [];
    if (slopeScore < 70) recommendations.push('Consider terrain leveling to improve site stability.');
    if (soilScore < 70) recommendations.push('Soil reinforcement may be required for optimal foundation stability.');
    if (floodScore < 70) recommendations.push('Implement flood mitigation measures and elevated equipment platforms.');
    if (gridScore < 70) recommendations.push('Budget for extended grid connection costs.');
    if (roadScore < 70) recommendations.push('Access road construction will be required, increasing initial costs.');
    if (protectedArea) recommendations.push('Site is in a protected area. Consider alternative locations.');
    
    return {
        overallScore: parseFloat(overallScore.toFixed(1)),
        categoryScores: {
            terrain: parseFloat(slopeScore.toFixed(1)),
            soilStability: parseFloat(soilScore.toFixed(1)),
            floodRisk: parseFloat(floodScore.toFixed(1)),
            gridProximity: parseFloat(gridScore.toFixed(1)),
            roadAccess: parseFloat(roadScore.toFixed(1)),
            populationProximity: parseFloat(populationScore.toFixed(1)),
            landUse: parseFloat(landUseScore.toFixed(1)),
            protectedStatus: parseFloat(protectedAreaScore.toFixed(1)),
            acquisitionCost: parseFloat(landCostScore.toFixed(1))
        },
        weightedScores: Object.fromEntries(
            Object.entries(weightedScores).map(([key, value]) => [key, parseFloat(value.toFixed(1))])
        ),
        suitabilityRating: getSuitabilityRating(overallScore),
        recommendations: recommendations
    };
}

/**
 * Get suitability rating based on score
 * @param {number} score - Overall suitability score
 * @returns {object} Suitability rating and description
 */
function getSuitabilityRating(score) {
    if (score >= 85) {
        return {
            rating: "Excellent",
            description: "This site has exceptional potential for renewable energy development with minimal constraints."
        };
    } else if (score >= 75) {
        return {
            rating: "Very Good",
            description: "This site has very good potential with only minor limitations that can be easily addressed."
        };
    } else if (score >= 65) {
        return {
            rating: "Good",
            description: "This site has good potential with some limitations that require standard mitigation measures."
        };
    } else if (score >= 55) {
        return {
            rating: "Moderate",
            description: "This site has moderate potential with several limitations that require significant mitigation."
        };
    } else if (score >= 45) {
        return {
            rating: "Fair",
            description: "This site has fair potential but faces substantial limitations requiring extensive mitigation."
        };
    } else if (score >= 35) {
        return {
            rating: "Poor",
            description: "This site has poor potential with major limitations that may be difficult to overcome."
        };
    } else {
        return {
            rating: "Unsuitable",
            description: "This site is not recommended for renewable energy development due to severe limitations."
        };
    }
}

/**
 * Integrated Site Selection Functions
 */

/**
 * Calculate comprehensive site suitability score
 * @param {object} siteData - Complete site data
 * @returns {object} Comprehensive suitability analysis
 */
function calculateSiteSuitability(siteData) {
    const { location, solarData, windData, landData } = siteData;
    
    // Calculate individual component scores
    const solarIrradiance = calculateSolarIrradiance(location);
    const windPotential = analyzeWindPowerPotential(location);
    const landSuitability = analyzeLandSuitability(landData);
    
    // Normalize solar score (0-100)
    const maxSolarIrradiance = 7.0; // kWh/m²/day
    const solarScore = Math.min(100, (solarIrradiance.irradiance.daily / maxSolarIrradiance) * 100);
    
    // Normalize wind score (0-100)
    const maxWindSpeed = 10.0; // m/s
    const windScore = Math.min(100, (windPotential.wind.speed / maxWindSpeed) * 100);
    
    // Get land suitability score
    const landScore = landSuitability.overallScore;
    
    // Calculate weighted overall score
    const weights = {
        solar: 0.4,
        wind: 0.3,
        land: 0.3
    };
    
    const weightedScores = {
        solar: solarScore * weights.solar,
        wind: windScore * weights.wind,
        land: landScore * weights.land
    };
    
    const overallScore = Object.values(weightedScores).reduce((sum, score) => sum + score, 0);
    
    // Determine site type recommendation
    let recommendedSiteType;
    if (solarScore > 75 && windScore < 50) {
        recommendedSiteType = "Solar Farm";
    } else if (windScore > 75 && solarScore < 50) {
        recommendedSiteType = "Wind Farm";
    } else if (solarScore > 60 && windScore > 60) {
        recommendedSiteType = "Hybrid (Solar + Wind)";
    } else if (solarScore > 50) {
        recommendedSiteType = "Solar Farm (Limited)";
    } else if (windScore > 50) {
        recommendedSiteType = "Wind Farm (Limited)";
    } else {
        recommendedSiteType = "Not Recommended for Renewable Energy";
    }
    
    return {
        location,
        overallScore: parseFloat(overallScore.toFixed(1)),
        componentScores: {
            solar: parseFloat(solarScore.toFixed(1)),
            wind: parseFloat(windScore.toFixed(1)),
            land: parseFloat(landScore.toFixed(1))
        },
        weightedScores: {
            solar: parseFloat(weightedScores.solar.toFixed(1)),
            wind: parseFloat(weightedScores.wind.toFixed(1)),
            land: parseFloat(weightedScores.land.toFixed(1))
        },
        suitabilityRating: getSiteRecommendation(overallScore),
        recommendedSiteType: recommendedSiteType,
        detailedAnalysis: {
            solar: solarIrradiance,
            wind: windPotential,
            land: landSuitability
        }
    };
}

/**
 * Select the best sites from a list based on comprehensive analysis
 * @param {Array} sites - Array of site data objects
 * @param {object} options - Selection options
 * @returns {Array} Ranked list of best sites
 */
function selectBestSites(sites, options = {}) {
    const { 
        minScore = 70,
        maxResults = 5,
        prioritizeSolar = false,
        prioritizeWind = false
    } = options;
    
    // Calculate suitability scores for all sites
    const analyzedSites = sites.map(site => {
        const analysis = calculateSiteSuitability(site);
        return {
            ...site,
            analysis
        };
    });
    
    // Filter by minimum score
    let filteredSites = analyzedSites.filter(site => site.analysis.overallScore >= minScore);
    
    // Sort sites based on priorities
    if (prioritizeSolar) {
        filteredSites.sort((a, b) => 
            (b.analysis.componentScores.solar * 2 + b.analysis.overallScore) - 
            (a.analysis.componentScores.solar * 2 + a.analysis.overallScore)
        );
    } else if (prioritizeWind) {
        filteredSites.sort((a, b) => 
            (b.analysis.componentScores.wind * 2 + b.analysis.overallScore) - 
            (a.analysis.componentScores.wind * 2 + a.analysis.overallScore)
        );
    } else {
        filteredSites.sort((a, b) => b.analysis.overallScore - a.analysis.overallScore);
    }
    
    // Limit results
    return filteredSites.slice(0, maxResults);
}

/**
 * Get site recommendation based on score
 * @param {number} score - Overall suitability score
 * @returns {object} Recommendation and description
 */
function getSiteRecommendation(score) {
    if (score >= 85) {
        return {
            recommendation: "Highly Recommended",
            description: "This site has excellent potential for renewable energy generation."
        };
    } else if (score >= 70) {
        return {
            recommendation: "Recommended",
            description: "This site has good potential for renewable energy generation."
        };
    } else if (score >= 50) {
        return {
            recommendation: "Suitable with Reservations",
            description: "This site has moderate potential but may require additional investment."
        };
    } else {
        return {
            recommendation: "Not Recommended",
            description: "This site has poor potential for renewable energy generation."
        };
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Solar analysis
        calculateSolarIrradiance,
        calculateSeasonalSolarYield,
        calculateOptimalPanelAngle,
        
        // Wind analysis
        analyzeWindPowerPotential,
        analyzeSeasonalWindPatterns,
        
        // Land analysis
        analyzeLandSuitability,
        getSuitabilityRating,
        
        // Integrated analysis
        calculateSiteSuitability,
        selectBestSites,
        getSiteRecommendation
    };
}
