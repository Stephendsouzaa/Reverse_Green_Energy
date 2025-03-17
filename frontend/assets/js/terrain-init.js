// Terrain Initialization Module
class TerrainInitializer {
    constructor() {
        this.visualization = null;
        this.elevationData = null;
        this.init();
    }

    init() {
        // Initialize 3D visualization
        this.visualization = new TerrainVisualization();
        // Hide loading state
        document.getElementById('terrain-loading').style.display = 'none';
        // Hide placeholder
        document.getElementById('terrain-placeholder').style.display = 'none';

        // Add event listeners for controls
        this.setupControls();
    }

    setupControls() {
        // Rotate view button
        document.getElementById('rotate-terrain').addEventListener('click', () => {
            if (this.visualization.controls) {
                this.visualization.controls.autoRotate = !this.visualization.controls.autoRotate;
            }
        });

        // Reset view button
        document.getElementById('reset-view').addEventListener('click', () => {
            if (this.visualization.camera) {
                this.visualization.camera.position.set(0, 50, 100);
                this.visualization.camera.lookAt(0, 0, 0);
            }
        });

        // Toggle layers button
        document.getElementById('toggle-layers').addEventListener('click', () => {
            if (this.visualization.terrain) {
                this.visualization.terrain.material.wireframe = !this.visualization.terrain.material.wireframe;
            }
        });
    }

    async loadTerrainData(lat, lng) {
        try {
            // Show loading state
            document.getElementById('terrain-loading').style.display = 'flex';

            // Simulate loading elevation data (replace with actual API call)
            this.elevationData = await this.fetchElevationData(lat, lng);

            // Create terrain with loaded data
            this.visualization.createTerrain(this.elevationData);
            this.visualization.updateElevationColors(this.elevationData);

            // Hide loading state
            document.getElementById('terrain-loading').style.display = 'none';
        } catch (error) {
            console.error('Error loading terrain data:', error);
            document.getElementById('terrain-loading').style.display = 'none';
        }
    }

    async fetchElevationData(lat, lng) {
        // Simulate API call to get elevation data
        // Replace with actual elevation API integration
        return new Promise((resolve) => {
            setTimeout(() => {
                // Generate sample elevation data
                const size = 128 * 128;
                const data = new Float32Array(size);
                for (let i = 0; i < size; i++) {
                    const x = (i % 128) / 128 - 0.5;
                    const y = Math.floor(i / 128) / 128 - 0.5;
                    const distance = Math.sqrt(x * x + y * y);
                    data[i] = Math.sin(distance * 10) * 10 + Math.random() * 2;
                }
                resolve(data);
            }, 1000);
        });
    }
}

// Initialize terrain when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.terrainInit = new TerrainInitializer();
});