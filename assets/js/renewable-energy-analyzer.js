// Renewable Energy Analysis Module
const RenewableEnergyAnalyzer = {
    solarData: null,
    windData: null,

    async analyzeSolarPotential(lat, lon) {
        try {
            const response = await fetch(`/api/solar/detailed-analysis?lat=${lat}&lon=${lon}`);
            if (!response.ok) {
                throw new Error('Failed to fetch solar analysis data');
            }
            const data = await response.json();
            this.solarData = {
                irradiance: {
                    direct: data.dni || 0,
                    diffuse: data.dhi || 0,
                    global: data.ghi || 0
                },
                panel: {
                    efficiency: data.panelEfficiency || 15,
                    temperature: data.panelTemp || 25,
                    degradation: data.annualDegradation || 0.5
                },
                shading: {
                    lossFactor: data.shadingLoss || 0,
                    nearbyObstructions: data.obstructions || []
                },
                terrain: {
                    slope: data.terrainSlope || 0,
                    aspect: data.terrainAspect || 0,
                    elevation: data.elevation || 0
                },
                environmental: {
                    co2Reduction: this.calculateCO2Reduction(data.annualEnergy || 0),
                    landImpact: this.assessLandImpact(data.area || 0)
                }
            };
            return this.solarData;
        } catch (error) {
            console.error('Solar analysis error:', error);
            throw new Error('Solar potential analysis failed');
        }
    },

    async analyzeWindPotential(lat, lon) {
        try {
            const response = await fetch(`/api/wind/detailed-analysis?lat=${lat}&lon=${lon}`);
            if (!response.ok) {
                throw new Error('Failed to fetch wind analysis data');
            }
            const data = await response.json();
            this.windData = {
                speed: {
                    average: data.avgWindSpeed || 0,
                    maximum: data.maxWindSpeed || 0,
                    frequency: data.speedFrequency || []
                },
                direction: {
                    dominant: data.dominantDirection || 0,
                    distribution: data.directionDistribution || []
                },
                turbulence: {
                    intensity: data.turbulenceIntensity || 0,
                    classification: this.classifyTurbulence(data.turbulenceIntensity || 0)
                },
                powerDensity: {
                    average: data.powerDensity || 0,
                    seasonal: data.seasonalPowerDensity || []
                },
                environmental: {
                    noiseLevel: data.estimatedNoise || 0,
                    birdImpact: data.birdMigrationRisk || 'low'
                }
            };
            return this.windData;
        } catch (error) {
            console.error('Wind analysis error:', error);
            throw new Error('Wind potential analysis failed');
        }
    },

    calculateCO2Reduction(annualEnergy) {
        // Average CO2 emissions per kWh from fossil fuels (in kg)
        const CO2_PER_KWH = 0.4;
        return annualEnergy * CO2_PER_KWH;
    },

    assessLandImpact(area) {
        // Basic land impact assessment
        if (area < 1000) return 'Minimal';
        if (area < 5000) return 'Moderate';
        return 'Significant';
    },

    classifyTurbulence(intensity) {
        if (intensity < 0.1) return 'Low';
        if (intensity < 0.2) return 'Moderate';
        return 'High';
    },

    generateDetailedReport() {
        if (!this.solarData || !this.windData) {
            throw new Error('Analysis data not available');
        }

        return {
            solarPotential: {
                ...this.solarData,
                recommendation: this.generateSolarRecommendation()
            },
            windPotential: {
                ...this.windData,
                recommendation: this.generateWindRecommendation()
            },
            combinedAssessment: this.assessCombinedPotential()
        };
    },

    generateSolarRecommendation() {
        const irradiance = this.solarData.irradiance.global;
        if (irradiance > 5) return 'Excellent solar potential. Highly recommended for solar installation.';
        if (irradiance > 4) return 'Good solar potential. Suitable for solar installation.';
        if (irradiance > 3) return 'Moderate solar potential. Solar installation possible with reduced efficiency.';
        return 'Limited solar potential. Consider alternative renewable sources.';
    },

    generateWindRecommendation() {
        const avgSpeed = this.windData.speed.average;
        if (avgSpeed > 7) return 'Excellent wind potential. Ideal for wind turbine installation.';
        if (avgSpeed > 5) return 'Good wind potential. Suitable for wind power generation.';
        if (avgSpeed > 3) return 'Moderate wind potential. Small wind turbines may be viable.';
        return 'Limited wind potential. Solar power may be a better option.';
    },

    assessCombinedPotential() {
        const solarScore = this.calculateSolarScore();
        const windScore = this.calculateWindScore();
        
        if (solarScore > 0.7 && windScore > 0.7) {
            return 'Excellent site for hybrid renewable energy system';
        } else if (solarScore > 0.7) {
            return 'Primarily suitable for solar installation';
        } else if (windScore > 0.7) {
            return 'Primarily suitable for wind installation';
        }
        return 'Limited renewable energy potential';
    },

    calculateSolarScore() {
        const irradiance = this.solarData.irradiance.global;
        const maxIrradiance = 7; // Maximum expected irradiance
        return Math.min(irradiance / maxIrradiance, 1);
    },

    calculateWindScore() {
        const avgSpeed = this.windData.speed.average;
        const optimalSpeed = 10; // Optimal wind speed
        return Math.min(avgSpeed / optimalSpeed, 1);
    }
};

export default RenewableEnergyAnalyzer;