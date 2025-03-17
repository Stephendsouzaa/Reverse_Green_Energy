// Map Controls and Visualization Features
let map, heatmapLayer, layerControl;
const layers = {};

// Initialize the map with 3D terrain capabilities
function initMap() {
    map = L.map('map', {
        center: [0, 0],
        zoom: 2,
        zoomControl: true,
        preferCanvas: true
    });

    // Add base layers
    layers.base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize layer groups
    layers.heatmap = L.layerGroup().addTo(map);
    layers.infrastructure = L.layerGroup().addTo(map);
    layers.environmental = L.layerGroup().addTo(map);
    layers.annotations = L.layerGroup().addTo(map);

    // Initialize drawing controls
    initDrawingTools();
    initLayerControls();
    setupEventListeners();
}

// Initialize drawing and selection tools
function initDrawingTools() {
    const drawControl = new L.Control.Draw({
        draw: {
            polygon: true,
            rectangle: true,
            circle: true,
            marker: true,
            polyline: true
        },
        edit: {
            featureGroup: layers.annotations
        }
    });
    map.addControl(drawControl);
}

// Setup layer controls and legend
function initLayerControls() {
    const baseMaps = {
        'OpenStreetMap': layers.base,
        'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/api/MapServer/tile/{z}/{y}/{x}')
    };

    const overlayMaps = {
        'Energy Potential': layers.heatmap,
        'Infrastructure': layers.infrastructure,
        'Environmental': layers.environmental,
        'Annotations': layers.annotations
    };

    layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
}

// Update heatmap data
function updateHeatmap(data) {
    layers.heatmap.clearLayers();
    const heatData = data.map(point => [
        point.lat,
        point.lng,
        point.value
    ]);
    L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        gradient: {
            0.4: 'blue',
            0.6: 'lime',
            0.8: 'yellow',
            1.0: 'red'
        }
    }).addTo(layers.heatmap);
}

// Setup event listeners for map interactions
function setupEventListeners() {
    map.on('draw:created', (e) => {
        const layer = e.layer;
        layers.annotations.addLayer(layer);
        // Trigger analysis for the selected area
        analyzeSelectedArea(layer);
    });

    map.on('zoomend', () => {
        updateLayerVisibility();
    });
}

// Analyze selected area for energy potential
function analyzeSelectedArea(layer) {
    const bounds = layer.getBounds();
    // Implement analysis logic here
    // This will be connected to the backend for actual calculations
}

// Update layer visibility based on zoom level
function updateLayerVisibility() {
    const zoom = map.getZoom();
    // Implement dynamic layer visibility logic
}

// Export map view for reports
function exportMapView() {
    // Implement export functionality
    // This will generate reports and presentations
}

// Initialize offline capabilities
function initOfflineCapabilities() {
    // Implement service worker and caching strategy
}

// Initialize the map when the DOM is ready
document.addEventListener('DOMContentLoaded', initMap);