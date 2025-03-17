// Map Visualization Module
let map;
let drawControl;
let markerClusterGroup;
let currentLayer = 'default';

// Initialize the map with default settings
function initMap() {
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize marker cluster group
    markerClusterGroup = L.markerClusterGroup();
    map.addLayer(markerClusterGroup);

    // Initialize drawing controls
    initDrawControls();

    // Initialize layer controls
    initLayerControls();

    // Add geocoding control
    initGeocoder();
}

// Initialize drawing controls for area selection
function initDrawControls() {
    const drawOptions = {
        position: 'topright',
        draw: {
            polygon: {
                allowIntersection: false,
                drawError: {
                    color: '#e1e100',
                    message: 'Invalid area selection!'
                },
                shapeOptions: {
                    color: '#2196F3'
                }
            },
            circle: false,
            rectangle: true,
            circlemarker: false,
            marker: true,
            polyline: false
        }
    };

    drawControl = new L.Control.Draw(drawOptions);
    map.addControl(drawControl);

    // Handle draw events
    map.on('draw:created', handleAreaSelection);
}

// Initialize layer controls for different data visualizations
function initLayerControls() {
    const layers = {
        'Solar Irradiance': L.layerGroup(),
        'Wind Speed': L.layerGroup(),
        'Land Suitability': L.layerGroup()
    };

    L.control.layers(null, layers, {
        position: 'topright',
        collapsed: false
    }).addTo(map);
}

// Initialize geocoding control for location search
function initGeocoder() {
    L.Control.geocoder({
        defaultMarkGeocode: false
    })
    .on('markgeocode', function(e) {
        const bbox = e.geocode.bbox;
        map.fitBounds([
            [bbox.getSouth(), bbox.getWest()],
            [bbox.getNorth(), bbox.getEast()]
        ]);
    })
    .addTo(map);
}

// Handle area selection from drawing tools
function handleAreaSelection(e) {
    const layer = e.layer;
    const type = e.layerType;
    const coordinates = layer.getLatLngs();

    // Add the layer to the map
    layer.addTo(map);

    // Trigger analysis for the selected area
    analyzeSelectedArea(coordinates, type);
}

// Analyze the selected area
async function analyzeSelectedArea(coordinates, type) {
    try {
        const response = await fetch('/api/site-selection/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                coordinates: coordinates,
                selectionType: type
            })
        });

        const data = await response.json();
        visualizeAnalysisResults(data);
    } catch (error) {
        console.error('Error analyzing area:', error);
        alert('Error analyzing selected area. Please try again.');
    }
}

// Visualize analysis results on the map
function visualizeAnalysisResults(data) {
    // Clear existing markers
    markerClusterGroup.clearLayers();

    // Add new markers based on analysis results
    data.sites.forEach(site => {
        const marker = L.marker([site.lat, site.lng], {
            title: `Site Score: ${site.score.toFixed(2)}`
        });

        const solarClass = getSolarPotentialClass(site.solarPotential);
        const windClass = getWindPotentialClass(site.windPotential);
        const landClass = getLandSuitabilityClass(site.landSuitability);

        marker.bindPopup(`
            <div class="analysis-popup">
                <h3>Site Analysis Results</h3>
                <div class="analysis-item ${solarClass}">
                    <strong>Solar Potential:</strong> ${site.solarPotential.toFixed(2)} kWh/m²/day
                    <span class="rating">${solarClass}</span>
                </div>
                <div class="analysis-item ${windClass}">
                    <strong>Wind Potential:</strong> ${site.windPotential.toFixed(2)} m/s
                    <span class="rating">${windClass}</span>
                </div>
                <div class="analysis-item ${landClass}">
                    <strong>Land Suitability:</strong> ${(site.landSuitability * 100).toFixed(1)}%
                    <span class="rating">${landClass}</span>
                </div>
                <div class="analysis-score">
                    <strong>Overall Score:</strong> ${site.score.toFixed(2)}/100
                </div>
                <div class="terrain-info">
                    <h4>Terrain Analysis Results 🌄</h4>
                    <div class="terrain-section">
                        <h5>Elevation Analysis:</h5>
                        <p>Elevation: ${site.elevation.toFixed(1)}m</p>
                        <p>Slope: ${site.slope.toFixed(1)}°</p>
                        <p>Surface Roughness: ${site.surfaceRoughness}</p>
                    </div>
                    <div class="terrain-section">
                        <h5>Soil Stability:</h5>
                        <p>Soil Type: ${site.soilType}</p>
                        <p>Foundation Strength: ${site.foundationStrength.toFixed(1)}%</p>
                        <p>Erosion Risk: ${site.erosionRisk}</p>
                    </div>
                    <div class="terrain-section">
                        <h5>Drainage Analysis:</h5>
                        <p>Flow Direction: ${site.flowDirection}</p>
                        <p>Flood Risk: ${site.floodRisk}</p>
                        <p>Water Table Depth: ${site.waterTableDepth.toFixed(1)}m</p>
                    </div>
                </div>
            </div>
        `);

        markerClusterGroup.addLayer(marker);
    });

    // Update the map view to show all markers
    const bounds = markerClusterGroup.getBounds();
    if (bounds.isValid()) {
        map.fitBounds(bounds);
    }
}

// Helper functions for classification
function getSolarPotentialClass(value) {
    if (value >= 5.5) return 'excellent';
    if (value >= 4.0) return 'good';
    if (value >= 3.0) return 'fair';
    return 'poor';
}

function getWindPotentialClass(value) {
    if (value >= 7.0) return 'excellent';
    if (value >= 5.0) return 'good';
    if (value >= 3.5) return 'fair';
    return 'poor';
}

function getLandSuitabilityClass(value) {
    if (value >= 0.8) return 'excellent';
    if (value >= 0.6) return 'good';
    if (value >= 0.4) return 'fair';
    return 'poor';
}

function getAspectDirection(aspect) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
    return directions[Math.round(aspect / 45)];
}

// Update map layer based on selected data type
function updateMapLayer(layerType) {
    currentLayer = layerType;
    
    // Clear existing layers
    map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) return;
        map.removeLayer(layer);
    });

    // Load and display new layer data
    loadLayerData(layerType);
}

// Load data for the selected layer type
async function loadLayerData(layerType) {
    try {
        const response = await fetch(`/api/site-selection/layer-data/${layerType}`);
        const data = await response.json();
        
        // Create and add the new layer
        createHeatmap(data);
    } catch (error) {
        console.error('Error loading layer data:', error);
        alert('Error loading layer data. Please try again.');
    }
}

// Create heatmap visualization
function createHeatmap(data) {
    const heatmapLayer = L.heatLayer(data.points, {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        gradient: {
            0.4: 'blue',
            0.6: 'lime',
            0.8: 'yellow',
            1.0: 'red'
        }
    }).addTo(map);
}

// Export functions for external use
export {
    initMap,
    updateMapLayer,
    visualizeAnalysisResults
};