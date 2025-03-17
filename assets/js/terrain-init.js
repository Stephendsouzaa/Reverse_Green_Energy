// Initialize 3D Terrain Visualization

document.addEventListener('DOMContentLoaded', function() {
    // Initialize terrain visualization when the page loads
    const terrainContainer = document.getElementById('terrain-3d-container');
    if (!terrainContainer) return;

    // Create terrain visualization instance
    const terrainVis = new TerrainVisualization('terrain-3d-container');

    // Generate sample height data for testing
    const heightData = generateSampleTerrainData();

    // Load terrain with sample data
    terrainVis.loadTerrain(heightData);

    // Hide loading indicator
    const loadingElement = document.getElementById('terrain-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }

    // Setup control buttons
    setupTerrainControls(terrainVis);
});

// Generate sample terrain height data
function generateSampleTerrainData() {
    const size = 100; // 100x100 grid
    const heightData = new Float32Array(size * size);

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const index = i * size + j;
            // Generate some interesting terrain using multiple sine waves
            heightData[index] = 
                Math.sin(i * 0.1) * Math.cos(j * 0.1) * 2 +
                Math.sin(i * 0.05) * Math.cos(j * 0.05) * 4 +
                Math.sin(i * 0.02) * Math.cos(j * 0.02) * 6;
        }
    }

    return heightData;
}

// Setup terrain control buttons
function setupTerrainControls(terrainVis) {
    // Rotate view button
    const rotateButton = document.getElementById('rotate-terrain');
    if (rotateButton) {
        rotateButton.addEventListener('click', () => {
            terrainVis.camera.position.applyAxisAngle(
                new THREE.Vector3(0, 1, 0),
                Math.PI / 4
            );
        });
    }

    // Reset view button
    const resetButton = document.getElementById('reset-view');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            terrainVis.camera.position.set(50, 50, 50);
            terrainVis.camera.lookAt(0, 0, 0);
        });
    }

    // Toggle layers button
    const toggleButton = document.getElementById('toggle-layers');
    if (toggleButton) {
        let wireframe = false;
        toggleButton.addEventListener('click', () => {
            wireframe = !wireframe;
            if (terrainVis.terrain) {
                terrainVis.terrain.material.wireframe = wireframe;
            }
        });
    }
}