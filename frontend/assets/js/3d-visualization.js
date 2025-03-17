// 3D Terrain Visualization Module
class TerrainVisualization {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.terrain = null;
        this.container = document.getElementById('terrain-3d-container');
        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(0, 50, 100);
        this.camera.lookAt(0, 0, 0);

        // Setup controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        this.scene.add(directionalLight);

        // Start animation loop
        this.animate();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createTerrain(elevationData) {
        if (this.terrain) {
            this.scene.remove(this.terrain);
        }

        const geometry = new THREE.PlaneGeometry(100, 100, 128, 128);
        const material = new THREE.MeshPhongMaterial({
            color: 0x3b7a57,
            wireframe: false,
            flatShading: true
        });

        // Apply elevation data to geometry
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = elevationData[Math.floor(i / 3)] || 0;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();

        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2;
        this.scene.add(this.terrain);
    }

    updateElevationColors(elevationData) {
        if (!this.terrain) return;

        const colors = new Float32Array(this.terrain.geometry.attributes.position.count * 3);
        const positions = this.terrain.geometry.attributes.position.array;

        for (let i = 0; i < positions.length; i += 3) {
            const elevation = positions[i + 2];
            const color = this.getElevationColor(elevation);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }

        this.terrain.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.terrain.material.vertexColors = true;
    }

    getElevationColor(elevation) {
        // Color gradient based on elevation
        if (elevation < 10) {
            return { r: 0.2, g: 0.8, b: 0.2 }; // Low elevation (green)
        } else if (elevation < 30) {
            return { r: 0.8, g: 0.8, b: 0.2 }; // Medium elevation (yellow)
        } else {
            return { r: 0.8, g: 0.2, b: 0.2 }; // High elevation (red)
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
}

// Export the visualization class
window.TerrainVisualization = TerrainVisualization;