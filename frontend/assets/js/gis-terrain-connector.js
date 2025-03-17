// GIS Terrain Connector Module
class GISTerrainConnector {
    constructor() {
        this.terrainInit = window.terrainInit;
        this.currentLocation = null;
        this.setupMapListeners();
        this.initializeMapLayers();
    }

    setupMapListeners() {
        // Listen for map click events
        document.addEventListener('map-location-selected', (event) => {
            const { lat, lng } = event.detail;
            this.updateTerrain({ lat, lng });
        });

        // Listen for visualization tab changes
        const tabs = document.querySelectorAll('[role="tab"]');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.handleTabChange(tab.getAttribute('data-tab'));
            });
        });
    }

    initializeMapLayers() {
        // Initialize map layers for different visualizations
        this.elevationLayer = L.layerGroup();
        this.slopeLayer = L.layerGroup();
        this.drainageLayer = L.layerGroup();
        this.riskLayer = L.layerGroup();
    }

    async updateTerrain(location) {
        this.currentLocation = location;
        await this.terrainInit.loadTerrainData(location.lat, location.lng);
        this.updateVisualizationData(location);
    }

    updateVisualizationData(location) {
        // Update all visualization layers
        this.updateElevationMap(location);
        this.updateSlopeAnalysis(location);
        this.updateDrainagePattern(location);
        this.updateRiskZones(location);

        // Update terrain analysis data
        this.updateTerrainAnalysisData(location);
    }

    updateElevationMap(location) {
        this.elevationLayer.clearLayers();
        
        // Create a grid of elevation points
        const gridSize = 50;
        const cellSize = 0.001; // Approximately 100m at equator

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const lat = location.lat + (i - gridSize/2) * cellSize;
                const lng = location.lng + (j - gridSize/2) * cellSize;
                const elevation = this.calculateElevation(lat, lng);
                
                // Create colored circle based on elevation
                const color = this.getElevationColor(elevation);
                L.circle([lat, lng], {
                    radius: 50,
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.5
                }).addTo(this.elevationLayer);
            }
        }
    }

    updateSlopeAnalysis(location) {
        this.slopeLayer.clearLayers();
        
        // Calculate and visualize slope gradients
        const gridSize = 40;
        const cellSize = 0.001;

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const lat = location.lat + (i - gridSize/2) * cellSize;
                const lng = location.lng + (j - gridSize/2) * cellSize;
                const slope = this.calculateSlope(lat, lng);
                
                const color = this.getSlopeColor(slope);
                L.circle([lat, lng], {
                    radius: 50,
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.5
                }).addTo(this.slopeLayer);
            }
        }
    }

    updateDrainagePattern(location) {
        this.drainageLayer.clearLayers();
        
        // Visualize water flow patterns
        const flowLines = this.calculateWaterFlow(location);
        flowLines.forEach(line => {
            L.polyline(line, {
                color: '#0066cc',
                weight: 2,
                opacity: 0.6
            }).addTo(this.drainageLayer);
        });
    }

    updateRiskZones(location) {
        this.riskLayer.clearLayers();
        
        // Create risk zone polygons
        const riskAreas = this.calculateRiskAreas(location);
        riskAreas.forEach(area => {
            L.polygon(area.coordinates, {
                color: this.getRiskColor(area.risk),
                fillOpacity: 0.3
            }).addTo(this.riskLayer);
        });
    }

    calculateElevation(lat, lng) {
        // Simulate elevation calculation
        // Replace with actual elevation API data
        const distance = Math.sqrt(
            Math.pow(lat - this.currentLocation.lat, 2) +
            Math.pow(lng - this.currentLocation.lng, 2)
        );
        return Math.sin(distance * 1000) * 100 + Math.random() * 20;
    }

    calculateSlope(lat, lng) {
        // Simulate slope calculation
        const elevation = this.calculateElevation(lat, lng);
        const neighborElevation = this.calculateElevation(lat + 0.001, lng + 0.001);
        return Math.abs(elevation - neighborElevation) / 0.001;
    }

    calculateWaterFlow(location) {
        // Simulate water flow patterns
        const flowLines = [];
        for (let i = 0; i < 10; i++) {
            const line = [];
            let currentLat = location.lat + (Math.random() - 0.5) * 0.01;
            let currentLng = location.lng + (Math.random() - 0.5) * 0.01;
            
            for (let j = 0; j < 5; j++) {
                line.push([currentLat, currentLng]);
                currentLat += (Math.random() - 0.5) * 0.001;
                currentLng += (Math.random() - 0.5) * 0.001;
            }
            flowLines.push(line);
        }
        return flowLines;
    }

    calculateRiskAreas(location) {
        // Simulate risk area calculation
        const riskAreas = [];
        const risks = ['high', 'medium', 'low'];
        
        risks.forEach(risk => {
            const center = [location.lat, location.lng];
            const points = this.generatePolygonPoints(center, risk);
            riskAreas.push({ risk, coordinates: points });
        });
        
        return riskAreas;
    }

    generatePolygonPoints([centerLat, centerLng], risk) {
        const points = [];
        const sides = 6;
        const radius = risk === 'high' ? 0.002 : risk === 'medium' ? 0.004 : 0.006;
        
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides);
            points.push([
                centerLat + radius * Math.cos(angle),
                centerLng + radius * Math.sin(angle)
            ]);
        }
        return points;
    }

    getElevationColor(elevation) {
        if (elevation < 30) return '#2ecc71'; // Low elevation (green)
        if (elevation < 70) return '#f1c40f'; // Medium elevation (yellow)
        return '#e74c3c'; // High elevation (red)
    }

    getSlopeColor(slope) {
        if (slope < 15) return '#3498db'; // Flat (blue)
        if (slope < 30) return '#e67e22'; // Moderate (orange)
        return '#c0392b'; // Steep (red)
    }

    getRiskColor(risk) {
        if (risk === 'low') return '#2ecc71';
        if (risk === 'medium') return '#f1c40f';
        return '#e74c3c';
    }

    handleTabChange(tabId) {
        // Hide all content
        document.querySelectorAll('[role="tabpanel"]').forEach(panel => {
            panel.classList.add('hidden');
        });

        // Show selected content
        const selectedPanel = document.getElementById(tabId);
        if (selectedPanel) {
            selectedPanel.classList.remove('hidden');
        }

        // Update visualization if needed
        if (this.currentLocation) {
            this.updateVisualizationData(this.currentLocation);
        }
    }

    updateTerrainAnalysisData(location) {
        // Update landslide susceptibility
        const landslideRisk = document.getElementById('landslide-risk');
        if (landslideRisk) landslideRisk.textContent = 'Medium';

        // Update groundwater depth
        const groundwaterDepth = document.getElementById('groundwater-depth');
        if (groundwaterDepth) groundwaterDepth.textContent = '7.9m';
    }
}

// Initialize the connector when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.terrainConnector = new GISTerrainConnector();
});