// 3D Terrain Visualization with Three.js

class TerrainVisualization {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.terrain = null;
        this.sunLight = null;
        this.windParticles = [];

        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(50, 50, 50);
        this.camera.lookAt(0, 0, 0);

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        // Add directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(100, 100, 0);
        this.sunLight.castShadow = true;
        this.scene.add(this.sunLight);

        // Add controls
        const controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Start animation
        this.animate();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    loadTerrain(heightData) {
        // Remove existing terrain if any
        if (this.terrain) {
            this.scene.remove(this.terrain);
        }

        // Create terrain geometry
        const geometry = new THREE.PlaneGeometry(100, 100, 99, 99);
        const vertices = geometry.attributes.position.array;

        // Apply height data
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = heightData[i / 3] * 20; // Scale height for better visualization
        }

        // Create terrain material
        const material = new THREE.MeshPhongMaterial({
            color: 0x3c8f3c,
            wireframe: false,
            flatShading: true
        });

        // Create terrain mesh
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.castShadow = true;
        this.terrain.receiveShadow = true;

        this.scene.add(this.terrain);
    }

    setTimeOfDay(date) {
        // Calculate sun position based on time
        const hours = date.getHours();
        const angle = (hours / 24) * Math.PI * 2;

        this.sunLight.position.x = Math.cos(angle) * 100;
        this.sunLight.position.y = Math.sin(angle) * 100;

        // Adjust light intensity based on time
        const intensity = Math.sin(angle);
        this.sunLight.intensity = Math.max(0.2, intensity);
    }

    addWindVisualization(windSpeed, windDirection) {
        // Clear existing wind particles
        this.windParticles.forEach(particle => this.scene.remove(particle));
        this.windParticles = [];

        // Create wind particles
        const particleCount = Math.floor(windSpeed * 10);
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                Math.random() * 100 - 50,
                Math.random() * 20,
                Math.random() * 100 - 50
            );
            particle.userData.velocity = new THREE.Vector3(
                Math.cos(windDirection) * windSpeed,
                0,
                Math.sin(windDirection) * windSpeed
            );
            this.scene.add(particle);
            this.windParticles.push(particle);
        }
    }

    updateWindParticles() {
        this.windParticles.forEach(particle => {
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.1));

            // Reset particle position when it goes out of bounds
            if (particle.position.x > 50) particle.position.x = -50;
            if (particle.position.x < -50) particle.position.x = 50;
            if (particle.position.z > 50) particle.position.z = -50;
            if (particle.position.z < -50) particle.position.z = 50;
        });
    }

    addSolarPanels(positions) {
        const panelGeometry = new THREE.BoxGeometry(5, 0.2, 3);
        const panelMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a75ff,
            shininess: 100
        });

        positions.forEach(pos => {
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.position.set(pos.x, pos.y + 2, pos.z); // Elevate panels above terrain
            panel.rotation.x = -Math.PI / 6; // Tilt panels for optimal angle
            panel.castShadow = true;
            panel.receiveShadow = true;
            this.scene.add(panel);
        });
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update wind particles
        this.updateWindParticles();

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}