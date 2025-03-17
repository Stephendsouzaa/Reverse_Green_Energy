// Initialize map and layers
let map, heatmapLayer, gridLayer, protectedAreasLayer, populationLayer;
let is3DMode = false;

// Initialize the map
function initMap() {
    map = L.map('map-container').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Initialize layers
    heatmapLayer = L.layerGroup().addTo(map);
    gridLayer = L.layerGroup().addTo(map);
    protectedAreasLayer = L.layerGroup();
    populationLayer = L.layerGroup();

    // Add layer controls
    setupLayerControls();
    setupToolControls();
}

// Setup layer controls
function setupLayerControls() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const layerName = e.target.nextElementSibling.textContent;
            toggleLayer(layerName, e.target.checked);
        });
    });
}

// Toggle layer visibility
function toggleLayer(layerName, visible) {
    switch(layerName) {
        case 'Energy Potential':
            updateHeatmap(visible);
            break;
        case 'Grid Infrastructure':
            updateGridInfrastructure(visible);
            break;
        case 'Protected Areas':
            updateProtectedAreas(visible);
            break;
        case 'Population Density':
            updatePopulationDensity(visible);
            break;
    }
}

// Setup tool controls
function setupToolControls() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tool = e.target.dataset.tool;
            activateTool(tool);
        });
    });
}

// Activate selected tool
function activateTool(tool) {
    switch(tool) {
        case 'select':
            enableAreaSelection();
            break;
        case 'measure':
            enableMeasurement();
            break;
        case '3d':
            toggle3DView();
            break;
        case 'annotate':
            enableAnnotation();
            break;
    }
}

// Update heatmap layer
function updateHeatmap(visible) {
    if (visible) {
        fetch('/api/energy-potential')
            .then(response => response.json())
            .then(data => {
                // Create heatmap using the energy potential data
                const heatmapData = data.map(point => [
                    point.lat,
                    point.lng,
                    point.value
                ]);
                L.heatLayer(heatmapData).addTo(heatmapLayer);
            });
    } else {
        heatmapLayer.clearLayers();
    }
}

// Update grid infrastructure layer
function updateGridInfrastructure(visible) {
    if (visible) {
        fetch('/api/grid-infrastructure')
            .then(response => response.json())
            .then(data => {
                // Add transmission lines and substations
                data.forEach(item => {
                    if (item.type === 'line') {
                        L.polyline(item.coordinates, { color: 'red' }).addTo(gridLayer);
                    } else if (item.type === 'substation') {
                        L.circle(item.coordinates, { radius: 500 }).addTo(gridLayer);
                    }
                });
            });
    } else {
        gridLayer.clearLayers();
    }
}

// Enable area selection
function enableAreaSelection() {
    const drawControl = new L.Control.Draw({
        draw: {
            polygon: true,
            rectangle: true,
            circle: true,
            marker: false,
            polyline: false
        }
    });
    map.addControl(drawControl);
}

// Toggle 3D view
function toggle3DView() {
    is3DMode = !is3DMode;
    if (is3DMode) {
        // Initialize Three.js scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        
        // Add terrain and overlay
        fetch('/api/terrain-data')
            .then(response => response.json())
            .then(data => {
                // Create 3D terrain mesh
                const geometry = new THREE.PlaneGeometry(100, 100, 100, 100);
                const material = new THREE.MeshPhongMaterial({ color: 0x808080 });
                const terrain = new THREE.Mesh(geometry, material);
                scene.add(terrain);
            });
    } else {
        // Return to 2D view
        initMap();
    }
}

// Initialize environmental impact charts
function initEnvironmentalCharts() {
    const ctx = document.getElementById('environmental-charts').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Wildlife Impact', 'Noise Level', 'Land Use Change'],
            datasets: [{
                label: 'Environmental Impact Scores',
                data: [65, 45, 80],
                backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe']
            }]
        }
    });
}

// Export report
document.getElementById('export-report').addEventListener('click', () => {
    // Generate PDF report with maps and analysis
    const reportData = {
        maps: map.getCenter(),
        environmentalData: getEnvironmentalData(),
        siteAnalytics: getSiteAnalytics(),
        temporalAnalysis: getTemporalAnalysis()
    };
    
    generateReport(reportData);
});

// Share results
document.getElementById('share-results').addEventListener('click', () => {
    // Generate shareable link
    const state = {
        center: map.getCenter(),
        zoom: map.getZoom(),
        layers: getActiveLayers(),
        annotations: getAnnotations()
    };
    
    generateShareableLink(state);
});

// Initialize the component
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initEnvironmentalCharts();
});