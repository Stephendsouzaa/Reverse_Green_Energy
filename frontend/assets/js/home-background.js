/**
 * home-background.js
 * 3D animated background for Reverse Green Energy Project home page
 * Using Three.js for creating an interactive Earth with solar panels and wind turbines
 */

let scene, camera, renderer;
let earthMesh, particles;
let raycaster, mouse;
let animationFrame;

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('bg-canvas'),
        antialias: true,
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(15, 15, 15);
    scene.add(pointLight);
    
    // Create Earth
    createEarth();
    
    // Create particles (stars)
    createParticles();
    
    // Create energy icons (solar panels and wind turbines)
    createEnergyIcons();
    
    // Setup mouse interaction
    setupMouseInteraction();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
}

// Create Earth sphere
function createEarth() {
    const earthGeometry = new THREE.SphereGeometry(10, 64, 64);
    
    // Earth texture
    const earthTexture = new THREE.TextureLoader().load('/assets/images/earth-blue-marble.jpg');
    const bumpTexture = new THREE.TextureLoader().load('/assets/images/earth-bump.jpg');
    const cloudsTexture = new THREE.TextureLoader().load('/assets/images/earth-clouds.png');
    
    // Earth material with bump mapping for terrain
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.5,
        shininess: 5
    });
    
    // Create Earth mesh
    earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthMesh.rotation.x = 0.2;
    scene.add(earthMesh);
    
    // Add cloud layer
    const cloudGeometry = new THREE.SphereGeometry(10.3, 64, 64);
    const cloudMaterial = new THREE.MeshPhongMaterial({
        map: cloudsTexture,
        transparent: true,
        opacity: 0.4
    });
    
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(cloudMesh);
    
    // Animate clouds separately
    function animateClouds() {
        cloudMesh.rotation.y += 0.0005;
        requestAnimationFrame(animateClouds);
    }
    
    animateClouds();
}

// Create background particles (stars)
function createParticles() {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);
    
    // Colors for particles
    const colors = [
        new THREE.Color(0xFFD700), // Solar yellow
        new THREE.Color(0x22C55E), // Eco green
        new THREE.Color(0x00C8FF)  // Neon blue
    ];
    
    for (let i = 0; i < particlesCount * 3; i += 3) {
        // Position
        posArray[i] = (Math.random() - 0.5) * 100;
        posArray[i+1] = (Math.random() - 0.5) * 100;
        posArray[i+2] = (Math.random() - 0.5) * 100;
        
        // Color
        const color = colors[Math.floor(Math.random() * colors.length)];
        colorsArray[i] = color.r;
        colorsArray[i+1] = color.g;
        colorsArray[i+2] = color.b;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.2,
        transparent: true,
        opacity: 0.8,
        vertexColors: true,
        blending: THREE.AdditiveBlending
    });
    
    particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
}

// Create energy icons (solar panels and wind turbines)
function createEnergyIcons() {
    // Predefined locations for energy icons (latitude, longitude)
    const energyLocations = [
        { lat: 35.6762, lng: 139.6503, type: 'solar' },  // Tokyo
        { lat: 40.7128, lng: -74.0060, type: 'wind' },   // New York
        { lat: 51.5074, lng: -0.1278, type: 'solar' },   // London
        { lat: -33.8688, lng: 151.2093, type: 'wind' },  // Sydney
        { lat: 37.7749, lng: -122.4194, type: 'solar' }, // San Francisco
        { lat: 55.7558, lng: 37.6173, type: 'wind' },    // Moscow
        { lat: -22.9068, lng: -43.1729, type: 'solar' }, // Rio de Janeiro
        { lat: 28.6139, lng: 77.2090, type: 'wind' }     // New Delhi
    ];
    
    // Create icons at each location
    energyLocations.forEach(location => {
        const position = latLngToVector3(location.lat, location.lng, 10.5);
        
        // Create different icon based on type
        if (location.type === 'solar') {
            createSolarPanel(position);
        } else {
            createWindTurbine(position);
        }
    });
}

// Convert latitude and longitude to 3D position
function latLngToVector3(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
}

// Create a solar panel icon
function createSolarPanel(position) {
    const solarGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.1);
    const solarMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFFD700,
        emissive: 0xFFD700,
        emissiveIntensity: 0.5,
        shininess: 100
    });
    
    const solarPanel = new THREE.Mesh(solarGeometry, solarMaterial);
    solarPanel.position.copy(position);
    
    // Orient the solar panel to face outward from the center of the earth
    solarPanel.lookAt(0, 0, 0);
    solarPanel.rotateY(Math.PI); // Rotate to face outward
    
    scene.add(solarPanel);
    
    // Add glow effect
    const glowMaterial = new THREE.SpriteMaterial({ 
        map: new THREE.TextureLoader().load('/assets/images/glow.png'),
        color: 0xFFD700,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(2, 2, 1);
    solarPanel.add(glow);
    
    // Animate the solar panel
    function animateSolarPanel() {
        solarPanel.rotation.z += 0.01;
        requestAnimationFrame(animateSolarPanel);
    }
    
    animateSolarPanel();
}

// Create a wind turbine icon
function createWindTurbine(position) {
    // Turbine base
    const baseGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
    const baseMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    
    // Turbine blades
    const bladesGroup = new THREE.Group();
    
    for (let i = 0; i < 3; i++) {
        const bladeGeometry = new THREE.BoxGeometry(0.1, 0.7, 0.05);
        const bladeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x00C8FF,
            emissive: 0x00C8FF,
            emissiveIntensity: 0.3
        });
        
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.y = 0.35;
        blade.rotation.z = (Math.PI * 2 / 3) * i;
        
        bladesGroup.add(blade);
    }
    
    // Create turbine group
    const turbine = new THREE.Group();
    turbine.add(base);
    turbine.add(bladesGroup);
    
    // Position the turbine
    turbine.position.copy(position);
    
    // Orient the turbine to face outward from the center of the earth
    turbine.lookAt(0, 0, 0);
    turbine.rotateY(Math.PI); // Rotate to face outward
    
    scene.add(turbine);
    
    // Animate the turbine blades
    function animateTurbine() {
        bladesGroup.rotation.z += 0.05;
        requestAnimationFrame(animateTurbine);
    }
    
    animateTurbine();
}

// Setup mouse interaction for parallax effect
function setupMouseInteraction() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    document.addEventListener('mousemove', (event) => {
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    animationFrame = requestAnimationFrame(animate);
    
    // Rotate Earth
    if (earthMesh) {
        earthMesh.rotation.y += 0.001;
    }
    
    // Rotate particles
    if (particles) {
        particles.rotation.y += 0.0003;
    }
    
    // Parallax effect based on mouse position
    if (mouse) {
        camera.position.x += (mouse.x * 5 - camera.position.x) * 0.05;
        camera.position.y += (-mouse.y * 5 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
    }
    
    renderer.render(scene, camera);
}

// Clean up function to stop animation when leaving the page
function cleanup() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    
    window.removeEventListener('resize', onWindowResize);
    
    // Remove all event listeners
    document.removeEventListener('mousemove', null);
    
    // Clear scene
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the home page
    if (document.getElementById('bg-canvas')) {
        init();
        
        // Add cleanup on page navigation
        window.addEventListener('beforeunload', cleanup);
    }
});