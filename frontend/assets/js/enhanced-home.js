/**
 * enhanced-home.js
 * Ultra-modern 3D interactive background for Reverse Green Energy Project homepage
 * Implements advanced visualization features with Three.js
 */

let scene, camera, renderer;
let earth, earthGroup, energyGrid;
let stars, galaxyParticles, energyRings = [];
let solarPanels = [], windTurbines = [];
let energyFlowParticles = [];
let dataPoints = [];
let liveDataWidgets = [];
let energyFlowLines = [];
let hoverObjects = [];
let selectedObject = null;
let particleSystem;

let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let clock = new THREE.Clock();
let raycaster, mouse;

// Theme-based colors
let colors = {
    nebula: 0x00C8FF,  // Neon blue
    galaxy: 0x22C55E,  // Eco green
    stars: 0xFFFFFF,   // White
    accent: 0xFFD700,  // Solar yellow
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
    // Create solar panel locations
    const locations = [
        { lat: 35.6762, lng: 139.6503 },  // Tokyo
        { lat: 37.7749, lng: -122.4194 }, // San Francisco
        { lat: -22.9068, lng: -43.1729 }, // Rio de Janeiro
        { lat: 51.5074, lng: -0.1278 },   // London
        { lat: -33.8688, lng: 151.2093 }  // Sydney
    ];
    
    locations.forEach(location => {
        const position = latLngToVector3(location.lat, location.lng, 90);
        
        // Create solar panel group
        const solarPanel = new THREE.Group();
        
        // Panel base
        const panelGeometry = new THREE.BoxGeometry(5, 0.5, 8);
        const panelMaterial = new THREE.MeshPhongMaterial({ 
            color: colors.solar,
            emissive: colors.solar,
            emissiveIntensity: 0.3,
            shininess: 100
        });
        
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        solarPanel.add(panel);
        
        // Add glow effect
        const glowMaterial = new THREE.SpriteMaterial({ 
            map: new THREE.TextureLoader().load('/assets/images/glow.png'),
            color: colors.solar,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        const glow = new THREE.Sprite(glowMaterial);
        glow.scale.set(15, 15, 1);
        solarPanel.add(glow);
        
        // Position and orient the solar panel
        solarPanel.position.copy(position);
        solarPanel.lookAt(earthGroup.position);
        
        // Add to scene and collection
        scene.add(solarPanel);
        solarPanels.push(solarPanel);
        hoverObjects.push(panel);
    });
}

// Create wind turbine models
function createWindTurbines() {
    // Create wind turbine locations
    const locations = [
        { lat: 40.7128, lng: -74.0060 },  // New York
        { lat: 55.7558, lng: 37.6173 },    // Moscow
        { lat: 28.6139, lng: 77.2090 },    // New Delhi
        { lat: -34.6037, lng: -58.3816 },  // Buenos Aires
        { lat: 59.3293, lng: 18.0686 }     // Stockholm
    ];
    
    locations.forEach(location => {
        const position = latLngToVector3(location.lat, location.lng, 90);
        
        // Create turbine group
        const turbine = new THREE.Group();
        
        // Turbine base
        const baseGeometry = new THREE.CylinderGeometry(1, 1, 15, 8);
        const baseMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFFFFF,
            shininess: 50
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        turbine.add(base);
        
        // Turbine head
        const headGeometry = new THREE.BoxGeometry(3, 3, 5);
        const headMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xCCCCCC,
            shininess: 80
        });
        
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 8;
        turbine.add(head);
        
        // Turbine blades
        const bladesGroup = new THREE.Group();
        bladesGroup.position.y = 8;
        bladesGroup.position.z = 2.5;
        
        for (let i = 0; i < 3; i++) {
            const bladeGeometry = new THREE.BoxGeometry(1, 20, 0.2);
            const bladeMaterial = new THREE.MeshPhongMaterial({ 
                color: colors.wind,
                emissive: colors.wind,
                emissiveIntensity: 0.3,
                shininess: 100
            });
            
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.position.y = 10;
            blade.rotation.z = (Math.PI * 2 / 3) * i;
            
            bladesGroup.add(blade);
        }
        
        turbine.add(bladesGroup);
        
        // Add glow effect
        const glowMaterial = new THREE.SpriteMaterial({ 
            map: new THREE.TextureLoader().load('/assets/images/glow.png'),
            color: colors.wind,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        const glow = new THREE.Sprite(glowMaterial);
        glow.scale.set(20, 20, 1);
        glow.position.y = 8;
        turbine.add(glow);
        
        // Position and orient the turbine
        turbine.position.copy(position);
        turbine.lookAt(earthGroup.position);
        turbine.rotateX(Math.PI / 2); // Adjust to stand upright
        
        // Add to scene and collection
        scene.add(turbine);
        windTurbines.push({ turbine, blades: bladesGroup });
        hoverObjects.push(head);
    });
}

// Create energy flow particles
function createEnergyFlowParticles() {
    // Create particle system for energy flow
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 1000;
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const color = new THREE.Color();
    
    for (let i = 0; i < particleCount; i++) {
        // Random position in a sphere around Earth
        const radius = THREE.MathUtils.randFloat(100, 150);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta) + earthGroup.position.x;
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + earthGroup.position.y;
        positions[i * 3 + 2] = radius * Math.cos(phi) + earthGroup.position.z;
        
        // Color based on position (gradient from green to blue)
        const colorFactor = Math.random();
        color.setHSL(colorFactor * 0.3 + 0.3, 1, 0.5);
        
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        
        // Random size
        sizes[i] = THREE.MathUtils.randFloat(0.5, 2.5);
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Custom shader material for energy particles
    const particlesMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            pointTexture: { value: new THREE.TextureLoader().load('/assets/images/particle.png') }
        },
        vertexShader: `
            uniform float time;
            attribute float size;
            varying vec3 vColor;
            void main() {
                vColor = color;
                vec3 pos = position;
                
                // Add some movement
                float noise = sin(position.x * 0.05 + time) * cos(position.y * 0.05 + time) * sin(position.z * 0.05 + time);
                pos.x += noise * 5.0;
                pos.y += noise * 5.0;
                pos.z += noise * 5.0;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform sampler2D pointTexture;
            varying vec3 vColor;
            void main() {
                gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
            }
        `,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
        vertexColors: true
    });
    
    particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleSystem);
}

// Create data points representing energy hotspots
function createDataPoints() {
    // Data point locations (high energy potential areas)
    const locations = [
        { lat: 23.4241, lng: -110.2864, type: 'solar', value: 85 }, // Baja California
        { lat: 36.7783, lng: -119.4179, type: 'solar', value: 92 }, // California
        { lat: 31.9686, lng: -99.9018, type: 'wind', value: 78 },  // Texas
        { lat: 41.8781, lng: -87.6298, type: 'wind', value: 81 },  // Chicago
        { lat: 35.6762, lng: 139.6503, type: 'solar', value: 88 },  // Tokyo
        { lat: 51.1657, lng: 10.4515, type: 'wind', value: 90 },   // Germany
        { lat: -33.8688, lng: 151.2093, type: 'solar', value: 95 }, // Sydney
        { lat: -30.5595, lng: 22.9375, type: 'solar', value: 97 }   // South Africa
    ];
    
    locations.forEach(location => {
        const position = latLngToVector3(location.lat, location.lng, 95);
        
        // Create data point marker
        const markerGeometry = new THREE.SphereGeometry(2, 16, 16);
        const markerMaterial = new THREE.MeshPhongMaterial({
            color: location.type === 'solar' ? colors.solar : colors.wind,
            emissive: location.type === 'solar' ? colors.solar : colors.wind,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(position);
        
        // Add pulse effect
        const pulseGeometry = new THREE.SphereGeometry(2, 16, 16);
        const pulseMaterial = new THREE.MeshBasicMaterial({
            color: location.type === 'solar' ? colors.solar : colors.wind,
            transparent: true,
            opacity: 0.4
        });
        
        const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
        pulse.scale.set(1, 1, 1);
        marker.add(pulse);
        
        // Add data value label
        const dataValue = location.value;
        marker.userData = {
            type: location.type,
            value: dataValue,
            pulse: pulse,
            originalScale: 1,
            targetScale: 2.5,
            scaleSpeed: 0.02,
            growing: true
        };
        
        scene.add(marker);
        dataPoints.push(marker);
        hoverObjects.push(marker);
    });
}

// Create live data widgets
function createLiveDataWidgets() {
    // Create floating data widgets around Earth
    const widgetPositions = [
        { x: 200, y: 100, z: -100 },
        { x: -200, y: -100, z: -150 },
        { x: -150, y: 150, z: -200 },
        { x: 100, y: -150, z: -250 }
    ];
    
    widgetPositions.forEach((position, index) => {
        // Create widget container
        const widget = new THREE.Group();
        widget.position.set(position.x, position.y, position.z);
        
        // Create widget background panel
        const panelGeometry = new THREE.PlaneGeometry(40, 30);
        const panelMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        widget.add(panel);
        
        // Add border glow
        const borderGeometry = new THREE.PlaneGeometry(42, 32);
        const borderMaterial = new THREE.MeshBasicMaterial({
            color: index % 2 === 0 ? colors.nebula : colors.accent,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const border = new THREE.Mesh(borderGeometry, borderMaterial);
        border.position.z = -0.1;
        widget.add(border);
        
        // Add widget data (simulated with simple geometries)
        const dataTypes = ['solar', 'wind', 'grid', 'efficiency'];
        const dataType = dataTypes[index % dataTypes.length];
        
        // Add widget title
        const titleGeometry = new THREE.PlaneGeometry(30, 5);
        const titleMaterial = new THREE.MeshBasicMaterial({
            color: index % 2 === 0 ? colors.nebula : colors.accent,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        const title = new THREE.Mesh(titleGeometry, titleMaterial);
        title.position.y = 10;
        widget.add(title);
        
        // Add data visualization (simplified)
        if (dataType === 'solar' || dataType === 'wind') {
            // Create bar chart
            for (let i = 0; i < 5; i++) {
                const height = THREE.MathUtils.randFloat(5, 15);
                const barGeometry = new THREE.BoxGeometry(4, height, 1);
                const barMaterial = new THREE.MeshBasicMaterial({
                    color: dataType === 'solar' ? colors.solar : colors.wind,
                    transparent: true,
                    opacity: 0.8
                });
                
                const bar = new THREE.Mesh(barGeometry, barMaterial);
                bar.position.x = (i - 2) * 6;
                bar.position.y = -5;
                bar.position.y += height / 2;
                widget.add(bar);
            }
        } else {
            // Create circular gauge
            const gaugeGeometry = new THREE.RingGeometry(8, 10, 32);
            const gaugeMaterial = new THREE.MeshBasicMaterial({
                color: dataType === 'grid' ? colors.grid : colors.energy,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            
            const gauge = new THREE.Mesh(gaugeGeometry, gaugeMaterial);
            gauge.position.y = -5;
            widget.add(gauge);
            
            // Add gauge needle
            const needleGeometry = new THREE.PlaneGeometry(1, 10);
            const needleMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            
            const needle = new THREE.Mesh(needleGeometry, needleMaterial);
            needle.position.y = -5;
            needle.rotation.z = THREE.MathUtils.randFloat(0, Math.PI);
            widget.add(needle);
        }
        
        // Make widget face the camera
        widget.lookAt(camera.position);
        
        // Add to scene and collection
        scene.add(widget);
        liveDataWidgets.push({
            widget,
            originalPosition: widget.position.clone(),
            rotationSpeed: THREE.MathUtils.randFloat(0.001, 0.003),
            oscillationSpeed: THREE.MathUtils.randFloat(0.01, 0.02),
            oscillationDistance: THREE.MathUtils.randFloat(2, 5),
            oscillationOffset: Math.random() * Math.PI * 2
        });
    });
}

// Convert latitude and longitude to 3D position
function latLngToVector3(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z).add(earthGroup.position);
}

// Handle mouse movement for interactive effects
function onMouseMove(event) {
    // Update mouse position for raycasting
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update target position for parallax effect
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;
    
    // Raycast to detect interactive objects
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(hoverObjects);
    
    // Reset all objects to normal state
    hoverObjects.forEach(obj => {
        if (obj.material && obj !== selectedObject) {
            obj.material.emissiveIntensity = 0.3;
        }
    });
    
    // Highlight hovered object
    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.material && object !== selectedObject) {
            object.material.emissiveIntensity = 0.8;
            document.body.style.cursor = 'pointer';
        }
    } else {
        document.body.style.cursor = 'default';
    }
}

// Handle mouse click for object selection
function onMouseClick(event) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(hoverObjects);
    
    if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // Deselect previously selected object
        if (selectedObject) {
            selectedObject.material.emissiveIntensity = 0.3;
            selectedObject.material.color.set(selectedObject.userData.originalColor);
        }
        
        // Select new object
        selectedObject = object;
        selectedObject.userData.originalColor = selectedObject.material.color.clone();
        selectedObject.material.emissiveIntensity = 1.0;
        selectedObject.material.color.set(colors.highlight);
        
        // Trigger data display in the UI
        if (object.userData && object.userData.type) {
            showDataInfo(object.userData);
        }
    } else if (selectedObject) {
        // Deselect if clicking empty space
        selectedObject.material.emissiveIntensity = 0.3;
        selectedObject.material.color.set(selectedObject.userData.originalColor);
        selectedObject = null;
        hideDataInfo();
    }
}

// Show data information in the UI
function showDataInfo(data) {
    // This would connect to the actual UI elements
    console.log('Selected:', data);
    
    // Example of updating UI elements
    if (data.type === 'solar') {
        document.getElementById('solar-counter').textContent = data.value || Math.floor(Math.random() * 1000);
    } else if (data.type === 'wind') {
        document.getElementById('wind-counter').textContent = data.value || Math.floor(Math.random() * 800);
    }
}

// Hide data information
function hideDataInfo() {
    // Reset UI elements
    console.log('Deselected');
}

// Handle window resize
function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();
    
    // Rotate Earth and clouds
    if (earthGroup) {
        earthGroup.rotation.y += 0.001;
    }
    
    // Rotate energy grid
    if (energyGrid) {
        energyGrid.rotation.y -= 0.0005;
        energyGrid.rotation.z += 0.0003;
    }
    
    // Animate energy rings
    energyRings.forEach((ring, i) => {
        ring.rotation.z += 0.001 * (i % 2 ? 1 : -1);
        ring.rotation.x += 0.0005 * (i % 3 ? 1 : -1);
    });
    
    // Animate galaxy particles
    if (galaxyParticles) {
        galaxyParticles.rotation.y += 0.0002;
    }
    
    // Animate stars with parallax effect
    if (stars) {
        stars.rotation.y += 0.0001;
        stars.rotation.x += (targetY - stars.rotation.x) * 0.01;
        stars.rotation.y += (targetX - stars.rotation.y) * 0.01;
    }
    
    // Animate wind turbine blades
    windTurbines.forEach(turbine => {
        turbine.blades.rotation.z += 0.03;
    });
    
    // Animate solar panels with subtle movement
    solarPanels.forEach(panel => {
        panel.rotation.z = Math.sin(elapsedTime * 0.5) * 0.1;
    });
    
    // Animate data points (pulse effect)
    dataPoints.forEach(point => {
        if (point.userData.pulse) {
            const pulse = point.userData.pulse;
            
            if (point.userData.growing) {
                pulse.scale.x += point.userData.scaleSpeed;
                pulse.scale.y += point.userData.scaleSpeed;
                pulse.scale.z += point.userData.scaleSpeed;
                
                if (pulse.scale.x >= point.userData.targetScale) {
                    point.userData.growing = false;
                }
            } else {
                pulse.scale.x -= point.userData.scaleSpeed;
                pulse.scale.y -= point.userData.scaleSpeed;
                pulse.scale.z -= point.userData.scaleSpeed;
                
                if (pulse.scale.x <= point.userData.originalScale) {
                    point.userData.growing = true;
                }
            }
            
            // Adjust opacity based on scale
            pulse.material.opacity = 0.6 - ((pulse.scale.x - 1) / 3);
        }
    });
    
    // Animate live data widgets
    liveDataWidgets.forEach(widget => {
        // Make widgets always face the camera
        widget.widget.lookAt(camera.position);
        
        // Add floating motion
        const time = elapsedTime + widget.oscillationOffset;
        widget.widget.position.y = widget.originalPosition.y + Math.sin(time * widget.oscillationSpeed) * widget.oscillationDistance;
    });
    
    // Animate energy flow particles
    if (particleSystem && particleSystem.material.uniforms) {
        particleSystem.material.uniforms.time.value = elapsedTime;
    }
    
    // Update raycasting for interactive objects
    if (mouse.x !== 0 && mouse.y !== 0) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(hoverObjects);
        
        document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
    }
    
    // Render the scene
    renderer.render(scene, camera);
}

// Function to update background colors based on theme
function updateColors(newColors) {
    colors.nebula = newColors.nebula || colors.nebula;
    colors.galaxy = newColors.galaxy || colors.galaxy;
    colors.stars = newColors.stars || colors.stars;
    colors.accent = newColors.accent || colors.accent;
    colors.energy = newColors.energy || colors.energy;
    colors.solar = newColors.solar || colors.solar;
    colors.wind = newColors.wind || colors.wind;
    
    // Update materials
    if (stars && stars.material) {
        stars.material.color.set(colors.stars);
    }
    
    if (galaxyParticles && galaxyParticles.material) {
        galaxyParticles.material.color.set(colors.galaxy);
    }
    
    energyRings.forEach(ring => {
        if (ring.material) {
            ring.material.color.set(colors.nebula);
        }
    });
    
    // Update other elements
    if (energyGrid && energyGrid.material) {
        energyGrid.material.color.set(colors.grid);
    }
    
    // Update solar panels
    solarPanels.forEach(panel => {
        const meshes = panel.children.filter(child => child.isMesh);
        meshes.forEach(mesh => {
            if (mesh.material) {
                mesh.material.color.set(colors.solar);
                if (mesh.material.emissive) {
                    mesh.material.emissive.set(colors.solar);
                }
            }
        });
    });
    
    // Update wind turbines
    windTurbines.forEach(turbine => {
        const blades = turbine.blades.children;
        blades.forEach(blade => {
            if (blade.material) {
                blade.material.color.set(colors.wind);
                if (blade.material.emissive) {
                    blade.material.emissive.set(colors.wind);
                }
            }
        });
    });
}

// Make the updateThreeBackground function available globally
window.updateThreeBackground = updateColors;

// Initialize the scene when the window loads
window.addEventListener('load', init);