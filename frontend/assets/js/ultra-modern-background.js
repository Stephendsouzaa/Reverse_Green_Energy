/**
 * ultra-modern-background.js
 * Advanced 3D interactive background for Reverse Green Energy Project
 * Implements high-performance visualization with Three.js
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

// Theme-based colors with enhanced palette
let colors = {
    nebula: 0x00C8FF,      // Neon blue
    galaxy: 0x22C55E,      // Eco green
    stars: 0xFFFFFF,       // White
    accent: 0xFFD700,      // Solar yellow
    energy: 0x4ADE80,      // Energy flow color
    solar: 0xFCD34D,       // Solar panel color
    wind: 0x93C5FD,        // Wind turbine color
    earth: 0x1E40AF,       // Earth base color
    grid: 0x00FFFF,        // Energy grid color
    highlight: 0xFF4500,   // Highlight color for interactions
    glow: 0x7DD3FC        // Glow effect color
};

// Initialize the scene
function init() {
    // Create scene with enhanced fog
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0002);
    
    // Create camera with improved perspective
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 500;
    
    // Create renderer with enhanced settings
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('bg-canvas'),
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
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
        canvas.style.pointerEvents = 'auto'; // Enable pointer events for interactivity
    }
    
    // Setup raycaster for enhanced interactivity
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Create scene elements with improved visuals
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
    
    // Add event listeners with passive option for better performance
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('click', onMouseClick);
    window.addEventListener('resize', onWindowResize, { passive: true });
    
    // Start animation loop
    animate();
}

// Create enhanced star field with depth variation
function createStarField() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: colors.stars,
        size: 1.2,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });
    
    const starCount = 15000;
    const starVertices = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        starVertices[i3] = THREE.MathUtils.randFloatSpread(2000);
        starVertices[i3 + 1] = THREE.MathUtils.randFloatSpread(2000);
        starVertices[i3 + 2] = THREE.MathUtils.randFloatSpread(2000);
        
        // Vary star sizes for more realistic look
        starSizes[i] = Math.random() * 1.5 + 0.5;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starVertices, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    
    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

// Create enhanced galaxy with improved color distribution
function createGalaxy() {
    const galaxyGeometry = new THREE.BufferGeometry();
    const galaxyMaterial = new THREE.PointsMaterial({
        color: colors.galaxy,
        size: 1.5,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.8,
        sizeAttenuation: true,
        vertexColors: true
    });
    
    const particleCount = 8000;
    const galaxyVertices = new Float32Array(particleCount * 3);
    const galaxyColors = new Float32Array(particleCount * 3);
    const color = new THREE.Color();
    
    // Create spiral galaxy pattern with more defined arms
    const arms = 3;
    const turns = 3;
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Spiral math with improved distribution
        const angle = Math.random() * Math.PI * 2;
        const radius = THREE.MathUtils.randFloat(50, 300);
        const armAngle = (angle + (radius / 300) * turns * Math.PI * 2) % (Math.PI * 2);
        const armIndex = Math.floor(armAngle / (Math.PI * 2) * arms);
        
        // Add some randomness to make it look natural
        const spreadFactor = 0.2;
        galaxyVertices[i3] = radius * Math.cos(angle) + THREE.MathUtils.randFloatSpread(radius * spreadFactor);
        galaxyVertices[i3 + 1] = radius * Math.sin(angle) + THREE.MathUtils.randFloatSpread(radius * spreadFactor);
        galaxyVertices[i3 + 2] = THREE.MathUtils.randFloatSpread(50);
        
        // Enhanced color gradient from center to edge
        const colorFactor = radius / 300;
        if (armIndex % 3 === 0) {
            color.setHSL(0.6, 1, 0.5 + colorFactor * 0.5); // Blue-ish
        } else if (armIndex % 3 === 1) {
            color.setHSL(0.3, 1, 0.5 + colorFactor * 0.5); // Green-ish
        } else {
            color.setHSL(0.15, 1, 0.5 + colorFactor * 0.5); // Yellow-ish
        }
        
        galaxyColors[i3] = color.r;
        galaxyColors[i3 + 1] = color.g;
        galaxyColors[i3 + 2] = color.b;
    }
    
    galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(galaxyVertices, 3));
    galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(galaxyColors, 3));
    
    galaxyParticles = new THREE.Points(galaxyGeometry, galaxyMaterial);
    scene.add(galaxyParticles);
}

// Create energy rings with enhanced glow effect
function createEnergyRings() {
    for (let i = 0; i < 5; i++) {
        const ringGeometry = new THREE.TorusGeometry(100 + i * 50, 2, 16, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: colors.nebula,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.y = Math.random() * Math.PI;
        scene.add(ring);
        energyRings.push(ring);
    }
}

// Create stylized Earth
function createEarth() {
    earthGroup = new THREE.Group();
    
    // Earth sphere
    const earthGeometry = new THREE.SphereGeometry(50, 64, 64);
    const earthMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            baseColor: { value: new THREE.Color(colors.earth) },
            glowColor: { value: new THREE.Color(colors.glow) },
            gridColor: { value: new THREE.Color(colors.grid) }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec2 vUv;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 baseColor;
            uniform vec3 glowColor;
            uniform vec3 gridColor;
            varying vec3 vNormal;
            varying vec2 vUv;
            
            float grid(vec2 uv, float res) {
                vec2 grid = fract(uv * res);
                return (step(0.98, grid.x) + step(0.98, grid.y)) * 0.5;
            }
            
            void main() {
                // Base color
                vec3 color = baseColor;
                
                // Grid pattern
                float lat = grid(vec2(vUv.x, 0.0), 36.0) * 0.3;
                float lon = grid(vec2(0.0, vUv.y), 18.0) * 0.3;
                float gridPattern = lat + lon;
                
                // Atmosphere glow on edges
                float atmosphere = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
                
                // Combine effects
                color = mix(color, gridColor, gridPattern);
                color = mix(color, glowColor, atmosphere * 0.6);
                
                // Pulse effect
                float pulse = 0.5 + 0.5 * sin(time * 0.5);
                color = mix(color, glowColor, atmosphere * pulse * 0.3);
                
                gl_FragColor = vec4(color, 1.0);
            }
        `
    });
    
    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earth);
    
    // Atmosphere glow
    const glowGeometry = new THREE.SphereGeometry(55, 64, 64);
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            glowColor: { value: new THREE.Color(colors.glow) },
            time: { value: 0 }
        },
        vertexShader: `
            varying vec3 vNormal;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            uniform float time;
            varying vec3 vNormal;
            
            void main() {
                float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
                float pulse = 0.8 + 0.2 * sin(time * 0.5);
                gl_FragColor = vec4(glowColor, intensity * pulse);
            }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    earthGroup.add(glow);
    
    // Position the earth group
    earthGroup.position.set(-150, -50, -100);
    earthGroup.rotation.x = Math.PI / 6;
    scene.add(earthGroup);
}
    }
}

// Create interactive Earth with enhanced textures and effects
function createEarth() {
    earthGroup = new THREE.Group();
    
    // Earth sphere with improved textures
    const earthGeometry = new THREE.SphereGeometry(80, 64, 64);
    const earthTexture = new THREE.TextureLoader().load('/assets/images/earth-blue-marble.jpg');
    const bumpTexture = new THREE.TextureLoader().load('/assets/images/earth-bump.jpg');
    const specularTexture = new THREE.TextureLoader().load('/assets/images/earth-specular.jpg');
    
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.5,
        specularMap: specularTexture,
        specular: new THREE.Color(0x333333),
        shininess: 25
    });
    
    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earth);
    
    // Add atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(82, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x0077ff,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earthGroup.add(atmosphere);
    
    // Add clouds layer
    const cloudsGeometry = new THREE.SphereGeometry(81, 64, 64);
    const cloudsTexture = new THREE.TextureLoader().load('/assets/images/earth-clouds.png');
    const cloudsMaterial = new THREE.MeshBasicMaterial({
        map: cloudsTexture,
        transparent: true,
        opacity: 0.4
    });
    
    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    earthGroup.add(clouds);
    
    // Position the earth group
    earthGroup.position.set(0, 0, 0);
    earthGroup.rotation.x = 0.1;
    scene.add(earthGroup);
    
    // Make earth interactive
    hoverObjects.push(earth);
}

// Create energy grid connecting Earth to other elements
function createEnergyGrid() {
    const gridGeometry = new THREE.IcosahedronGeometry(85, 1);
    const gridMaterial = new THREE.MeshBasicMaterial({
        color: colors.grid,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    
    energyGrid = new THREE.Mesh(gridGeometry, gridMaterial);
    earthGroup.add(energyGrid);
}

// Create solar panels with enhanced visual effects
function createSolarPanels() {
    // Create solar panel locations around Earth
    const locations = [
        { lat: 35, lng: -120, scale: 1.2 },  // California
        { lat: 40, lng: 10, scale: 1 },      // Europe
        { lat: -30, lng: 150, scale: 1.1 },   // Australia
        { lat: 25, lng: 80, scale: 0.9 },     // India
        { lat: -10, lng: -50, scale: 1 }      // Brazil
    ];
    
    locations.forEach(location => {
        const position = latLngToVector3(location.lat, location.lng, 82);
        
        // Create solar panel group
        const solarGroup = new THREE.Group();
        
        // Solar panel base
        const panelGeometry = new THREE.BoxGeometry(5 * location.scale, 5 * location.scale, 0.5);
        const panelMaterial = new THREE.MeshPhongMaterial({
            color: colors.solar,
            shininess: 100,
            emissive: colors.solar,
            emissiveIntensity: 0.2
        });
        
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        solarGroup.add(panel);
        
        // Add panel details
        const gridGeometry = new THREE.PlaneGeometry(4.5 * location.scale, 4.5 * location.scale);
        const gridMaterial = new THREE.MeshBasicMaterial({
            color: 0x111111