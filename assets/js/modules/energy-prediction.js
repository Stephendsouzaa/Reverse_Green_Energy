/**
 * Energy Prediction Module
 * Handles energy potential and output prediction functionality
 */

/**
 * Machine Learning Model Simulation Functions
 */

/**
 * Predict solar energy output using ML model simulation
 * @param {object} siteData - Site data including location, panel specs, etc.
 * @param {object} options - Additional options for prediction
 * @returns {object} Predicted solar energy output
 */
function predictSolarEnergyOutput(siteData, options = {}) {
    const { 
        location, 
        panelSpecs = {}, 
        systemSize = 1000, // kW
        timeframe = 'annual' 
    } = siteData;
    
    const {
        efficiency = 0.2,
        tilt = null,
        azimuth = 180,
        degradationRate = 0.005, // 0.5% per year
        systemLosses = 0.14, // 14% system losses
        dcAcRatio = 1.2
    } = panelSpecs;
    
    const {
        includeConfidenceIntervals = true,
        confidenceLevel = 0.95,
        includeDegradation = true,
        years = 25
    } = options;
    
    // Calculate base solar irradiance (simplified model)
    const { lat, lon, elevation = 0 } = location;
    const absLat = Math.abs(lat);
    
    // Base irradiance calculation based on latitude
    let baseIrradiance;
    if (absLat < 23.5) { // Tropical
        baseIrradiance = 5.5; // kWh/m²/day
    } else if (absLat < 45) { // Temperate
        baseIrradiance = 4.5; // kWh/m²/day
    } else { // Polar
        baseIrradiance = 3.5; // kWh/m²/day
    }
    
    // Apply adjustments
    const elevationFactor = 1 + (elevation / 10000); // 1% increase per 100m
    const solarIrradiance = baseIrradiance * elevationFactor;
    
    // Calculate energy output
    const dailyEnergyPerKw = solarIrradiance * efficiency * (1 - systemLosses) * dcAcRatio;
    const annualEnergyPerKw = dailyEnergyPerKw * 365;
    const totalAnnualEnergy = annualEnergyPerKw * systemSize;
    
    // Calculate confidence intervals if requested
    let confidenceIntervals = null;
    if (includeConfidenceIntervals) {
        const standardDeviation = totalAnnualEnergy * 0.1; // Assume 10% standard deviation
        const zScore = confidenceLevel === 0.99 ? 2.576 :
                      confidenceLevel === 0.95 ? 1.96 :
                      confidenceLevel === 0.90 ? 1.645 : 1.96;
        
        const margin = standardDeviation * zScore;
        confidenceIntervals = {
            lower: totalAnnualEnergy - margin,
            upper: totalAnnualEnergy + margin,
            confidenceLevel: confidenceLevel
        };
    }
    
    // Calculate degradation over time if requested
    let degradationProfile = null;
    if (includeDegradation) {
        degradationProfile = Array.from({ length: years }, (_, i) => {
            const yearDegradation = Math.pow(1 - degradationRate, i);
            return {
                year: i + 1,
                energyOutput: totalAnnualEnergy * yearDegradation,
                cumulativeEnergy: i === 0 ? 
                    totalAnnualEnergy : 
                    degradationProfile[i-1].cumulativeEnergy + (totalAnnualEnergy * yearDegradation)
            };
        });
    }
    
    return {
        location: {
            lat: lat,
            lon: lon,
            elevation: elevation
        },
        systemSpecs: {
            size: systemSize,
            efficiency: efficiency,
            tilt: tilt,
            azimuth: azimuth,
            losses: systemLosses,
            dcAcRatio: dcAcRatio
        },
        energyOutput: {
            daily: dailyEnergyPerKw * systemSize,
            monthly: dailyEnergyPerKw * 30 * systemSize,
            annual: totalAnnualEnergy,
            specificYield: annualEnergyPerKw // kWh/kWp/year
        },
        confidenceIntervals: confidenceIntervals,
        degradationProfile: degradationProfile,
        factors: {
            solarIrradiance: solarIrradiance,
            elevation: elevationFactor
        }
    };
}

/**
 * Predict wind energy output using ML model simulation
 * @param {object} siteData - Site data including location, turbine specs, etc.
 * @param {object} options - Additional options for prediction
 * @returns {object} Predicted wind energy output
 */
function predictWindEnergyOutput(siteData, options = {}) {
    const { 
        location, 
        turbineSpecs = {}, 
        numberOfTurbines = 1,
        timeframe = 'annual' 
    } = siteData;
    
    const {
        hubHeight = 80, // meters
        rotorDiameter = 100, // meters
        cutInSpeed = 3.0, // m/s
        cutOutSpeed = 25.0, // m/s
        ratedSpeed = 12.0, // m/s
        ratedPower = 2000, // kW
        efficiency = 0.35
    } = turbineSpecs;
    
    const {
        includeConfidenceIntervals = true,
        confidenceLevel = 0.95,
        includeAvailability = true,
        years = 25
    } = options;
    
    // Calculate base wind speed (simplified model)
    const { lat, lon, elevation = 0, terrain = 'flat' } = location;
    const absLat = Math.abs(lat);
    
    // Base wind speed calculation based on latitude
    let baseWindSpeed;
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
    
    // Determine roughness length based on terrain
    const roughnessMap = {
        'water': 0.0002,
        'flat': 0.03,
        'rural': 0.1,
        'suburban': 0.4,
        'urban': 1.0,
        'forest': 0.5
    };
    const terrainRoughness = roughnessMap[terrain.toLowerCase()] || 0.03;
    
    // Adjust for elevation and height
    const elevationFactor = 1 + (elevation / 5000); // 1% increase per 50m
    const heightFactor = Math.log(hubHeight / terrainRoughness) / Math.log(10 / terrainRoughness);
    const windSpeed = baseWindSpeed * elevationFactor * heightFactor;
    
    // Calculate power output using simplified power curve
    let powerOutput;
    if (windSpeed < cutInSpeed || windSpeed > cutOutSpeed) {
        powerOutput = 0;
    } else if (windSpeed >= ratedSpeed) {
        powerOutput = ratedPower;
    } else {
        // Simplified cubic relationship between cut-in and rated speed
        const fraction = (windSpeed - cutInSpeed) / (ratedSpeed - cutInSpeed);
        powerOutput = ratedPower * Math.pow(fraction, 3);
    }
    
    // Apply efficiency factor
    powerOutput *= efficiency;
    
    // Calculate annual energy production
    // Assuming capacity factor based on wind speed
    let capacityFactor;
    if (windSpeed < 5.5) {
        capacityFactor = 0.25;
    } else if (windSpeed < 6.5) {
        capacityFactor = 0.3;
    } else if (windSpeed < 7.5) {
        capacityFactor = 0.35;
    } else if (windSpeed < 8.5) {
        capacityFactor = 0.4;
    } else {
        capacityFactor = 0.45;
    }
    
    const hoursPerYear = 8760;
    const annualEnergyPerTurbine = powerOutput * hoursPerYear * capacityFactor;
    const totalAnnualEnergy = annualEnergyPerTurbine * numberOfTurbines;
    
    // Calculate confidence intervals if requested
    let confidenceIntervals = null;
    if (includeConfidenceIntervals) {
        const standardDeviation = totalAnnualEnergy * 0.15; // Assume 15% standard deviation for wind
        const zScore = confidenceLevel === 0.99 ? 2.576 :
                      confidenceLevel === 0.95 ? 1.96 :
                      confidenceLevel === 0.90 ? 1.645 : 1.96;
        
        const margin = standardDeviation * zScore;
        confidenceIntervals = {
            lower: totalAnnualEnergy - margin,
            upper: totalAnnualEnergy + margin,
            confidenceLevel: confidenceLevel
        };
    }
    
    // Calculate availability profile if requested
    let availabilityProfile = null;
    if (includeAvailability) {
        // Assume 98% availability in year 1, decreasing by 0.2% per year
        availabilityProfile = Array.from({ length: years }, (_, i) => {
            const yearAvailability = Math.max(0.85, 0.98 - (i * 0.002));
            return {
                year: i + 1,
                availability: yearAvailability,
                energyOutput: totalAnnualEnergy * yearAvailability
            };
        });
    }
    
    return {
        location: {
            lat: lat,
            lon: lon,
            elevation: elevation,
            terrain: terrain
        },
        turbineSpecs: {
            model: `Generic ${ratedPower}kW`,
            hubHeight: hubHeight,
            rotorDiameter: rotorDiameter,
            ratedPower: ratedPower,
            cutInSpeed: cutInSpeed,
            cutOutSpeed: cutOutSpeed,
            ratedSpeed: ratedSpeed
        },
        windConditions: {
            averageSpeed: windSpeed,
            powerDensity: 0.5 * 1.225 * Math.pow(windSpeed, 3) // W/m²
        },
        energyOutput: {
            capacityFactor: capacityFactor,
            powerOutput: powerOutput * numberOfTurbines, // kW
            annual: totalAnnualEnergy, // kWh/year
            lifetime: totalAnnualEnergy * years * 0.92 // Assuming 8% lifetime losses
        },
        confidenceIntervals: confidenceIntervals,
        availabilityProfile: availabilityProfile,
        factors: {
            windSpeed: windSpeed,
            elevation: elevationFactor,
            height: heightFactor,
            terrain: terrainRoughness
        }
    };
}

/**
 * Predict hybrid (solar + wind) energy system output
 * @param {object} siteData - Site data including location, system specs, etc.
 * @param {object} options - Additional options for prediction
 * @returns {object} Predicted hybrid system energy output
 */
function predictHybridEnergyOutput(siteData, options = {}) {
    const { 
        location, 
        solarSpecs = {}, 
        windSpecs = {},
        storageSpecs = {}
    } = siteData;
    
    // Get individual predictions
    const solarPrediction = predictSolarEnergyOutput({
        location: location,
        panelSpecs: solarSpecs.panelSpecs,
        systemSize: solarSpecs.systemSize || 1000
    }, options);
    
    const windPrediction = predictWindEnergyOutput({
        location: location,
        turbineSpecs: windSpecs.turbineSpecs,
        numberOfTurbines: windSpecs.numberOfTurbines || 1
    }, options);
    
    // Calculate combined output
    const totalAnnualEnergy = solarPrediction.energyOutput.annual + windPrediction.energyOutput.annual;
    
    // Calculate seasonal distribution (simplified)
    const isNorthernHemisphere = location.lat >= 0;
    const seasonalDistribution = {
        winter: {
            solar: solarPrediction.energyOutput.annual * (isNorthernHemisphere ? 0.15 : 0.35),
            wind: windPrediction.energyOutput.annual * (isNorthernHemisphere ? 0.35 : 0.15)
        },
        spring: {
            solar: solarPrediction.energyOutput.annual * 0.25,
            wind: windPrediction.energyOutput.annual * 0.25
        },
        summer: {
            solar: solarPrediction.energyOutput.annual * (isNorthernHemisphere ? 0.35 : 0.15),
            wind: windPrediction.energyOutput.annual * (isNorthernHemisphere ? 0.15 : 0.35)
        },
        autumn: {
            solar: solarPrediction.energyOutput.annual * 0.25,
            wind: windPrediction.energyOutput.annual * 0.25
        }
    };
    
    // Calculate total for each season
    for (const season in seasonalDistribution) {
        seasonalDistribution[season].total = 
            seasonalDistribution[season].solar + 
            seasonalDistribution[season].wind;
    }
    
    // Calculate storage impact if specified
    let storageImpact = null;
    if (storageSpecs && storageSpecs.capacity) {
        const {
            capacity = 1000, // kWh
            efficiency = 0.85,
            depthOfDischarge = 0.8,
            cyclesPerDay = 1
        } = storageSpecs;
        
        const effectiveCapacity = capacity * depthOfDischarge;
        const annualThroughput = effectiveCapacity * cyclesPerDay * 365 * efficiency;
        
        // Simplified self-consumption improvement
        const baselineSelfConsumption = 0.3; // 30% without storage
        const improvedSelfConsumption = Math.min(0.9, baselineSelfConsumption + (capacity / totalAnnualEnergy) * 365 * 0.5);
        
        storageImpact = {
            effectiveCapacity: effectiveCapacity,
            annualThroughput: annualThroughput,
            selfConsumption: improvedSelfConsumption,
            gridIndependence: improvedSelfConsumption * 100 // percentage
        };
    }
    
    return {
        location: location,
        systemComposition: {
            solar: {
                capacity: solarSpecs.systemSize || 1000,
                contribution: solarPrediction.energyOutput.annual / totalAnnualEnergy
            },
            wind: {
                capacity: (windSpecs.turbineSpecs?.ratedPower || 2000) * (windSpecs.numberOfTurbines || 1),
                contribution: windPrediction.energyOutput.annual / totalAnnualEnergy
            },
            storage: storageSpecs.capacity ? {
                capacity: storageSpecs.capacity,
                type: storageSpecs.type || 'Lithium-Ion'
            } : null
        },
        energyOutput: {
            annual: {
                solar: solarPrediction.energyOutput.annual,
                wind: windPrediction.energyOutput.annual,
                total: totalAnnualEnergy
            },
            seasonal: seasonalDistribution
        },
        storageImpact: storageImpact,
        recommendations: generateHybridRecommendations(solarPrediction, windPrediction, storageSpecs)
    };
}

/**
 * Generate recommendations for hybrid system optimization
 * @param {object} solarPrediction - Solar energy prediction
 * @param {object} windPrediction - Wind energy prediction
 * @param {object} storageSpecs - Storage specifications
 * @returns {Array} Array of recommendations
 */
function generateHybridRecommendations(solarPrediction, windPrediction, storageSpecs) {
    const recommendations = [];
    
    // Calculate solar to wind ratio
    const solarContribution = solarPrediction.energyOutput.annual;
    const windContribution = windPrediction.energyOutput.annual;
    const totalEnergy = solarContribution + windContribution;
    const solarRatio = solarContribution / totalEnergy;
    
    // Recommend optimal ratio
    if (solarRatio > 0.8) {
        recommendations.push("Consider increasing wind capacity to improve seasonal balance and reduce intermittency.");
    } else if (solarRatio < 0.2) {
        recommendations.push("Consider increasing solar capacity to improve daytime generation and seasonal balance.");
    } else if (solarRatio > 0.6 && solarRatio < 0.8) {
        recommendations.push("Current solar-wind ratio is good, with solar dominance. Consider small wind capacity increase for better winter performance.");
    } else if (solarRatio > 0.4 && solarRatio < 0.6) {
        recommendations.push("Excellent solar-wind balance. This configuration provides good seasonal and diurnal coverage.");
    } else {
        recommendations.push("Current solar-wind ratio is good, with wind dominance. Consider small solar capacity increase for better summer performance.");
    }
    
    // Storage recommendations
    if (!storageSpecs || !storageSpecs.capacity) {
        recommendations.push("Adding energy storage would improve self-consumption and provide backup power capability.");
    } else if (storageSpecs.capacity < totalEnergy / 365) {
        recommendations.push("Current storage capacity is relatively low. Consider increasing for better daily energy shifting.");
    } else if (storageSpecs.capacity > totalEnergy / 90) {
        recommendations.push("Storage capacity is relatively high. Ensure economic viability with current electricity rates and incentives.");
    }
    
    // System sizing recommendation
    const solarCapacityFactor = solarPrediction.energyOutput.annual / (solarPrediction.systemSpecs.size * 8760);
    const windCapacityFactor = windPrediction.energyOutput.capacityFactor;
    
    if (solarCapacityFactor < 0.15) {
        recommendations.push("Solar resource is relatively low. Consider optimizing panel tilt or exploring alternative locations.");
    }
    
    if (windCapacityFactor < 0.25) {
        recommendations.push("Wind resource is relatively low. Consider increasing hub height or exploring alternative locations.");
    }
    
    return recommendations;
}

/**
 * Estimate energy output based on solar and wind data
 * @param {object} solarData - Solar irradiance data
 * @param {object} windData - Wind speed data
 * @returns {number} Estimated energy output in kWh
 */
function estimateEnergyOutput(solarData, windData) {
    // This is a simplified version of the more comprehensive functions above
    return (solarData.irradiance * 0.2) + (windData.speed * 0.3);
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        predictSolarEnergyOutput,
        predictWindEnergyOutput,
        predictHybridEnergyOutput,
        estimateEnergyOutput
    };
}
