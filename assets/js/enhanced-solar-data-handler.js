// Enhanced Solar Data Handler Module
const EnhancedSolarDataHandler = {
    solarLayer: null,
    analysisLayer: null,

    async fetchSolarData(lat = null, lon = null) {
        try {
            if (!lat || !lon) {
                lat = document.getElementById('latInput').value;
                lon = document.getElementById('lngInput').value;
            }

            if (!lat || !lon) {
                throw new Error('Please select a location first');
            }

            const response = await fetch(`/api/solar/enhanced-solar-data?lat=${lat}&lon=${lon}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch solar data');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching solar data:', error);
            throw new Error(error.message || 'Unable to fetch solar data. Please try again later.');
        }
    },

    displaySolarData(map, data) {
        try {
            // Clear existing layers
            if (this.solarLayer) map.removeLayer(this.solarLayer);
            if (this.analysisLayer) map.removeLayer(this.analysisLayer);

            // Create detailed popup content
            const popupContent = this.createDetailedPopup(data);

            // Create a custom marker with the analysis results
            const marker = L.marker([data.latitude, data.longitude]);
            marker.bindPopup(popupContent);

            // Create analysis visualization layer
            this.analysisLayer = this.createAnalysisLayer(data);
            
            // Add layers to map
            this.solarLayer = L.layerGroup([marker]);
            map.addLayer(this.solarLayer);
            map.addLayer(this.analysisLayer);

            // Update analysis panel
            this.updateAnalysisPanel(data);

            return true;
        } catch (error) {
            console.error('Error displaying solar data:', error);
            throw new Error('Error displaying solar data on the map');
        }
    },

    createDetailedPopup(data) {
        return `
            <div class="solar-popup">
                <h3 class="text-lg font-bold mb-2">Solar Potential Analysis</h3>
                <div class="grid grid-cols-2 gap-2">
                    <div class="font-semibold">Daily Energy Yield:</div>
                    <div>${data.dailyEnergyYield.toFixed(2)} kWh/m²</div>
                    
                    <div class="font-semibold">Annual Energy Yield:</div>
                    <div>${data.annualEnergyYield.toFixed(2)} kWh/m²</div>
                    
                    <div class="font-semibold">Optimal Tilt:</div>
                    <div>${data.optimalTilt.toFixed(1)}°</div>
                    
                    <div class="font-semibold">Optimal Azimuth:</div>
                    <div>${data.optimalAzimuth.toFixed(1)}°</div>
                    
                    <div class="font-semibold">Peak Sun Hours:</div>
                    <div>${data.peakSunHours.toFixed(1)} hrs</div>
                    
                    <div class="font-semibold">Performance Ratio:</div>
                    <div>${(data.performanceRatio * 100).toFixed(1)}%</div>
                </div>
            </div>
        `;
    },

    createAnalysisLayer(data) {
        // Create a circle representing the analysis area
        const analysisCircle = L.circle([data.latitude, data.longitude], {
            radius: 500,  // 500m radius
            color: this.getSolarPotentialColor(data.suitabilityScore),
            fillColor: this.getSolarPotentialColor(data.suitabilityScore),
            fillOpacity: 0.3
        });

        return L.layerGroup([analysisCircle]);
    },

    getSolarPotentialColor(score) {
        if (score >= 0.8) return '#2ecc71';  // Excellent - Green
        if (score >= 0.6) return '#f1c40f';  // Good - Yellow
        if (score >= 0.4) return '#e67e22';  // Moderate - Orange
        return '#e74c3c';  // Poor - Red
    },

    updateAnalysisPanel(data) {
        const solarAnalysis = document.getElementById('solarAnalysis');
        if (!solarAnalysis) return;

        solarAnalysis.innerHTML = `
            <div class="bg-white p-4 rounded shadow">
                <h3 class="text-lg font-bold mb-4">Solar Potential Analysis</h3>
                
                <div class="space-y-4">
                    <div>
                        <h4 class="font-semibold mb-2">Energy Generation Potential</h4>
                        <div class="grid grid-cols-2 gap-2">
                            <div>Daily Yield:</div>
                            <div>${data.dailyEnergyYield.toFixed(2)} kWh/m²</div>
                            <div>Annual Yield:</div>
                            <div>${data.annualEnergyYield.toFixed(2)} kWh/m²</div>
                        </div>
                    </div>

                    <div>
                        <h4 class="font-semibold mb-2">Optimal Installation</h4>
                        <div class="grid grid-cols-2 gap-2">
                            <div>Panel Tilt:</div>
                            <div>${data.optimalTilt.toFixed(1)}°</div>
                            <div>Panel Azimuth:</div>
                            <div>${data.optimalAzimuth.toFixed(1)}°</div>
                        </div>
                    </div>

                    <div>
                        <h4 class="font-semibold mb-2">Performance Metrics</h4>
                        <div class="grid grid-cols-2 gap-2">
                            <div>Peak Sun Hours:</div>
                            <div>${data.peakSunHours.toFixed(1)} hrs</div>
                            <div>Performance Ratio:</div>
                            <div>${(data.performanceRatio * 100).toFixed(1)}%</div>
                            <div>Shading Loss:</div>
                            <div>${(data.shadingLoss * 100).toFixed(1)}%</div>
                        </div>
                    </div>

                    <div>
                        <h4 class="font-semibold mb-2">Site Suitability</h4>
                        <div class="grid grid-cols-2 gap-2">
                            <div>Overall Score:</div>
                            <div>${(data.suitabilityScore * 100).toFixed(1)}%</div>
                            <div>Land Type:</div>
                            <div>${data.landType}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Show the analysis results container
        document.getElementById('analysisResults').classList.remove('hidden');
    }
};

export default EnhancedSolarDataHandler;