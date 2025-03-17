// enhanced-background.js - Advanced Three.js background for Reverse Green Energy Project

let scene, camera, renderer;
let stars, galaxyParticles, energyRings = [];
let solarPanels = [], windTurbines = [];
let energyFlowParticles = [];
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let clock = new THREE.Clock();
let raycaster, mouse;
let earth, earthGroup;
let dataPoints = [];
let energyGrid;
let hoverObjects = [];
let selectedObject = null;
let energyFlowLines = [];
let liveDataWidgets = [];
let particleSystem;

// Theme-based colors
let colors = {
    nebula: 0x00C8FF,  // Default neon blue
    galaxy: 0x22C55E,  // Default eco green
    stars: 0xFFFFFF,   // Default white
    accent: 0xFFD700,  // Default solar yellow
    energy: 0x4ADE80,  // Energy flow color
    solar: 0xFCD34D,   // Solar panel color
    wind: 0x93C5FD,    // Wind turbine color
    earth: 0x1E40AF,   // Earth base color
    grid: 0x00FFFF,    // Energy grid color
    highlight: 0xFF4500 // Highlight color for interactions
};

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0003);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 500;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('bg-canvas'),
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Ensure the canvas is positioned behind all content
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '-1';
        canvas.style.pointerEvents = 'none';
    }
    
    // Setup raycaster for interactivity
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Create scene elements
    createStarField();
    createGalaxy();
    createEnergyRings();
    createEarth();
    createEnergyGrid();
    createSolarPanels();
    createWindTurbines();
    createEnergyFlowParticles();
    createDataPoints();
    createLiveDataWidgets();
    
    // Add event listeners
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onMouseClick);
    window.addEventListener('resize', onWindowResize);
    
    // Make the updateThreeBackground function available globally
    window.updateThreeBackground = updateColors;
    
    // Start animation loop
    animate();
}

// Create star field
function createStarField() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: colors.stars,
        size: 1.2,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });
    
    const starVertices = [];
    for (let i = 0; i < 15000; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);
        starVertices.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

// Create galaxy effect
function createGalaxy() {
    const galaxyGeometry = new THREE.BufferGeometry();
    const galaxyMaterial = new THREE.PointsMaterial({
        color: colors.galaxy,
        size: 1.5,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.8,
        sizeAttenuation: true
    });
    
    const galaxyVertices = [];
    const galaxyColors = [];
    const color = new THREE.Color();
    
    // Create spiral galaxy pattern
    const arms = 3;
    const turns = 3;
    
    for (let i = 0; i < 8000; i++) {
        // Spiral math
        const angle = Math.random() * Math.PI * 2;
        const radius = THREE.MathUtils.randFloat(50, 300);
        const armAngle = (angle + (radius / 300) * turns * Math.PI * 2) % (Math.PI * 2);
        const armIndex = Math.floor(armAngle / (Math.PI * 2) * arms);
        
        // Add some randomness to make it look natural
        const spreadFactor = 0.2;
        const x = radius * Math.cos(angle) + THREE.MathUtils.randFloatSpread(radius * spreadFactor);
        const y = radius * Math.sin(angle) + THREE.MathUtils.randFloatSpread(radius * spreadFactor);
        const z = THREE.MathUtils.randFloatSpread(50);
        
        galaxyVertices.push(x, y, z);
        
        // Color gradient from center to edge
        const colorFactor = radius / 300;
        if (armIndex % 2 === 0) {
            color.setHSL(0.6, 1, 0.5 + colorFactor * 0.5); // Blue-ish
        } else {
            color.setHSL(0.3, 1, 0.5 + colorFactor * 0.5); // Green-ish
        }
        
        galaxyColors.push(color.r, color.g, color.b);
    }
    
    galaxyGeometry.setAttribute('position', new THREE.Float32BufferAttribute(galaxyVertices, 3));
    galaxyGeometry.setAttribute('color', new THREE.Float32BufferAttribute(galaxyColors, 3));
    galaxyMaterial.vertexColors = true;
    
    galaxyParticles = new THREE.Points(galaxyGeometry, galaxyMaterial);
    scene.add(galaxyParticles);
}

// Create energy rings
function createEnergyRings() {
    for (let i = 0; i < 5; i++) {
        const geometry = new THREE.TorusGeometry(100 + i * 50, 2, 16, 100);
        const material = new THREE.MeshBasicMaterial({ 
            color: colors.nebula,
            transparent: true,
            opacity: 0.3 - (i * 0.05),
            wireframe: true
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.y = Math.random() * Math.PI;
        
        energyRings.push(ring);
        scene.add(ring);
    }
}

// Create interactive Earth
function createEarth() {
    earthGroup = new THREE.Group();
    
    // Earth sphere
    const earthGeometry = new THREE.SphereGeometry(80, 64, 64);
    const earthTexture = new THREE.TextureLoader().load('/assets/images/earth-blue-marble.jpg');
    const bumpTexture = new THREE.TextureLoader().load('/assets/images/earth-bump.jpg');
    const cloudsTexture = new THREE.TextureLoader().load('/assets/images/earth-clouds.png');
    
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.5,
        shininess: 5,
        emissive: new THREE.Color(colors.earth),
        emissiveIntensity: 0.1
    });
    
    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earth);
    
    // Cloud layer
    const cloudGeometry = new THREE.SphereGeometry(82, 64, 64);
    const cloudMaterial = new THREE.MeshPhongMaterial({
        map: cloudsTexture,
        transparent: true,
        opacity: 0.4
    });
    
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    earthGroup.add(clouds);
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(85, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            c: { type: 'f', value: 0.2 },
            p: { type: 'f', value: 6 },
            glowColor: { type: 'c', value: new THREE.Color(0x00a2ff) },
            viewVector: { type: 'v3', value: camera.position }
        },
        vertexShader: `
            uniform vec3 viewVector;
            uniform float c;
            uniform float p;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize(normal);
                vec3 vNormel = normalize(viewVector);
                intensity = pow(c - dot(vNormal, vNormel), p);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                vec3 glow = glowColor * intensity;
                gl_FragColor = vec4(glow, 1.0);
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    earthGroup.add(glowMesh);
    
    // Position the Earth
    earthGroup.position.set(0, 0, -200);
    earthGroup.rotation.x = 0.2;
    scene.add(earthGroup);
    
    // Make Earth interactive
    hoverObjects.push(earth);
}

// Create energy grid around Earth
function createEnergyGrid() {
    const gridGeometry = new THREE.IcosahedronGeometry(90, 2);
    const gridMaterial = new THREE.MeshBasicMaterial({
        color: colors.grid,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    
    energyGrid = new THREE.Mesh(gridGeometry, gridMaterial);
    energyGrid.position.copy(earthGroup.position);
    scene.add(energyGrid);
}

// Create solar panel models
function createSolarPanels() {
    // Create a group for solar panels
    const solarGroup = new THREE.Group();
    
    // Create solar panel geometry
    const panelGeometry = new THREE.BoxGeometry(20, 1, 30);
    const frameMaterial = new THREE.MeshPhongMaterial({
        color: 0x888888,
        shininess: 100
    });
    
    const panelMaterial = new THREE.MeshPhongMaterial({
        color: colors.solar,
        shininess: 200,
        emissive: colors.solar,
        emissiveIntensity: 0.2
    });
    
    // Create multiple solar panels in different positions
    for (let i = 0; i < 5; i++) {
        const panel = new THREE.Group();
        
        // Create frame
        const frame = new THREE.Mesh(panelGeometry, frameMaterial);
        
        // Create panel surface
        const surface = new THREE.Mesh(
            new THREE.BoxGeometry(18, 0.5, 28),
            panelMaterial
        );
        surface.position.y = 0.5;
        
        panel.add(frame);
        panel.add(surface);
        
        // Position the panel
        const angle = (i / 5) * Math.PI * 2;
        const radius = 250;
        panel.position.set(
            Math.cos(angle) * radius,
            -100 + Math.random() * 50,
            Math.sin(angle) * radius
        );
        
        // Rotate to face center
        panel.lookAt(0, panel.position.y, 0);
        panel.rotation.x = -Math.PI / 6; // Tilt for sun exposure
        
        // Add to group
        solarGroup.add(panel);
        solarPanels.push(panel);
        
        // Make panels interactive
        hoverObjects.push(panel);
    }
    
    scene.add(solarGroup);
}

// Create wind turbine models
function createWindTurbines() {
    // Create a group for wind turbines
    const turbineGroup = new THREE.Group();
    
    // Create turbine materials
    const poleMaterial = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
        shininess: 30
    });
    
    const bladeMaterial = new THREE.MeshPhongMaterial({
        color: colors.wind,
        shininess: 50,
        transparent: true,
        opacity: 0.9
    });
    
    // Create multiple wind turbines
    for (let i = 0; i < 4; i++) {
        const turbine = new THREE.Group();
        
        // Create pole
        const poleGeometry = new THREE.CylinderGeometry(2, 3, 80, 12);
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 40; // Half height
        
        // Create nacelle (hub)
        const nacelleGeometry = new THREE.BoxGeometry(10, 5, 5);
        const nacelle = new THREE.Mesh(nacelleGeometry, poleMaterial);
        nacelle.position.y = 80;
        
        // Create blades
        const bladeGroup = new THREE.Group();
        bladeGroup.position.y = 80;
        
        for (let j = 0; j < 3; j++) {
            const bladeGeometry = new THREE.BoxGeometry(2, 40, 3);
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.position.y = 20; // Half of blade length
            blade.rotation.z = (j / 3) * Math.PI * 2;
            bladeGroup.add(blade);
        }
        
        // Add all parts to turbine
        turbine.add(pole);
        turbine.add(nacelle);
        turbine.add(bladeGroup);
        
        // Position the turbine
        const angle = (i / 4) * Math.PI * 2;
        const radius = 350;
        turbine.position.set(
            Math.cos(angle) * radius,
            -40, // Base at ground level
            Math.sin(angle) * radius
        );
        
        // Store blade group for animation
        turbine.userData.blades = bladeGroup;
        
        // Add to group
        turbineGroup.add(turbine);
        windTurbines.push(turbine);
        
        // Make turbines interactive
        hoverObjects.push(turbine);
    }
    
    scene.add(turbineGroup);
}

// Create energy flow particles
function createEnergyFlowParticles() {
    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
        color: colors.energy,
        size: 3,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
        // Random starting positions in a sphere
        const radius = THREE.MathUtils.randFloat(100, 400);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
        
        // Store velocity for animation
        velocities.push({
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2,
            z: (Math.random() - 0.5) * 2,
            speed: THREE.MathUtils.randFloat(0.5, 2)
        });
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.userData.velocities = velocities;
    
    energyFlowParticles.push(particles);
    scene.add(particles);
}

// Create data visualization points
function createDataPoints() {
    const pointsGroup = new THREE.Group();
    
    // Create data point materials
    const solarPointMaterial = new THREE.MeshPhongMaterial({
        color: colors.solar,
        emissive: colors.solar,
        emissiveIntensity: 0.5,
        shininess: 100
    });
    
    const windPointMaterial = new THREE.MeshPhongMaterial({
        color: colors.wind,
        emissive: colors.wind,
        emissiveIntensity: 0.5,
        shininess: 100
    });
    
    // Sample data locations (latitude, longitude, type, value)
    const dataLocations = [
        { lat: 34.0522, lng: -118.2437, type: 'solar', value: 0.8 }, // Los Angeles
        { lat: 40.7128, lng: -74.0060, type: 'wind', value: 0.7 },   // New York
        { lat: 51.5074, lng: -0.1278, type: 'solar', value: 0.5 },   // London
        { lat: 35.6762, lng: 139.6503, type: 'wind', value: 0.9 },   // Tokyo
        { lat: -33.8688, lng: 151.2093, type: 'solar', value: 0.85 }, // Sydney
        { lat: 19.4326, lng: -99.1332, type: 'wind', value: 0.6 },   // Mexico City
        { lat: 55.7558, lng: 37.6173, type: 'solar', value: 0.4 },   // Moscow
        { lat: -22.9068, lng: -43.1729, type: 'wind', value: 0.75 }  // Rio de Janeiro
    ];
    
    // Create data points at each location
    dataLocations.forEach(location => {
        // Convert lat/lng to 3D position
        const position = latLngToVector3(location.lat, location.lng, 90);
        
        // Create point geometry based on value
        const size = 2 + (location.value * 3);
        const pointGeometry = new THREE.SphereGeometry(size, 16, 16);
        
        // Select material based on type
        const material = location.type === 'solar' ? solarPointMaterial : windPointMaterial;
        
        // Create mesh
        const point = new THREE.Mesh(pointGeometry, material);
        point.position.copy(position);
        
        // Add pulse effect
        const pulseMesh = createPulseEffect(position, location.type === 'solar' ? colors.solar : colors.wind);
        pointsGroup.add(pulseMesh);
        
        // Store data for interactivity
        point.userData = {
            type: location.type,
            value: location.value,
            location: `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`,
            pulse: pulseMesh
        };
        
        // Add to group and interactive objects
        pointsGroup.add(point);
        dataPoints.push(point);
        hoverObjects.push(point);
    });
    
    // Position the group relative to Earth
    pointsGroup.position.copy(earthGroup.position);
    scene.add(pointsGroup);
}

// Create pulse effect for data points
function createPulseEffect(position, color) {
    const pulseGeometry = new THREE.SphereGeometry(1, 16, 16);
    const pulseMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4
    });
    
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.position.copy(position);
    pulse.scale.set(1, 1, 1);
    
    // Store animation data
    pulse.userData = {
        baseScale: 1,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseMin: 1,
        pulseMax: 2 + Math.random()
    };
    
    return pulse;
}

// Create live data widgets
function createLiveDataWidgets() {
    // This would typically connect to real data sources
    // For demo purposes, we'll create floating 3D elements
    
    const widgetGroup = new THREE.Group();
    
    // Create widget materials
    const widgetMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    
    // Create widgets at different positions
    for (let i = 0; i < 3; i++) {
        const widget = new THREE.Group();
        
        // Create panel
        const panelGeometry = new THREE.PlaneGeometry(40, 20);
        const panel = new THREE.Mesh(panelGeometry, widgetMaterial);
        
        // Position widget
        const angle = (i / 3) * Math.PI * 2;
        const radius = 500;
        widget.position.set(
            Math.cos(angle) * radius,
            100 + (i * 50),
            Math.sin(angle) * radius
        );
        
        // Make widget face camera
        widget.lookAt(0, widget.position.y, 0);
        
        widget.add(panel);
        widgetGroup.add(widget);
        liveDataWidgets.push(widget);
    }
    
    scene.add(widgetGroup);
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

// Handle mouse movement
function onMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 0.05;
    mouseY = (event.clientY - windowHalfY) * 0.05;
    
    // Update mouse position for raycaster
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Check for hover interactions
    checkHoverInteractions();
}

// Handle mouse click
function onMouseClick(event) {
    // Cast ray to find intersected objects
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(hoverObjects, true);
    
    if (intersects.length > 0) {
        // Find the actual parent object that's in our hoverObjects array
        let selectedObj = intersects[0].object;
        while (selectedObj.parent && !hoverObjects.includes(selectedObj)) {
            selectedObj = selectedObj.parent;
        }
        
        if (hoverObjects.includes(selectedObj)) {
            // Toggle selection
            if (selectedObject === selectedObj) {
                // Deselect
                resetObjectHighlight(selectedObject);
                selectedObject = null;
            } else {
                // Select new object
                if (selectedObject) {
                    resetObjectHighlight(selectedObject);
                }
                
                selectedObject = selectedObj;
                highlightObject(selectedObject);
                
                // Show data for selected object
                showObjectData(selectedObject);
            }
        }
    } else if (selectedObject) {
        // Deselect when clicking empty space
        resetObjectHighlight(selectedObject);
        selectedObject = null;
    }
}

// Check for hover interactions
function checkHoverInteractions() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(hoverObjects, true);
    
    // Reset all hover states
    hoverObjects.forEach(obj => {
        if (obj !== selectedObject) {
            resetObjectHighlight(obj);
        }
    });
    
    // Apply hover effect to intersected object
    if (intersects.length > 0) {
        // Find the actual parent object that's in our hoverObjects array
        let hoveredObj = intersects[0].object;
        while (hoveredObj.parent && !hoverObjects.includes(hoveredObj)) {
            hoveredObj = hoveredObj.parent;
        }
        
        if (hoverObjects.includes(hoveredObj) && hoveredObj !== selectedObject) {
            highlightObject(hoveredObj, true);
        }
    }
}

// Highlight an object
function highlightObject(obj, isHover = false) {
    // Apply different highlight based on object type
    if (obj === earth) {
        // Earth highlight
        obj.material.emissiveIntensity = isHover ? 0.3 : 0.5;
    } else if (solarPanels.includes(obj)) {
        // Solar panel highlight
        obj.children.forEach(child => {
            if (child.material.emissive) {
                child.material.emissiveIntensity = isHover ? 0.4 : 0.6;
            }
        });
    } else if (windTurbines.includes(obj)) {
        // Wind turbine highlight
        obj.children.forEach(child => {
            if (child.material && child.material.color) {
                if (isHover) {
                    child.material.emissive = new THREE.Color(colors.highlight);
                    child.material.emissiveIntensity = 0.3;
                } else {
                    child.material.emissive = new THREE.Color(colors.highlight);
                    child.material.emissiveIntensity = 0.5;
                }
            }
        });
    } else if (dataPoints.includes(obj)) {
        // Data point highlight
        obj.scale.set(1.3, 1.3, 1.3);
        if (obj.userData.pulse