// Three.js Universe Scene with Stars, Galaxy, and Advanced Effects
let scene, camera, renderer, stars, galaxy, nebula;
const bigBangEffects = [];
const particles = [];

function init() {
    // Create scene and camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.position.z = 800;

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.id = 'three-background';
    document.body.insertBefore(renderer.domElement, document.body.firstChild);

    // Create stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 2,
        transparent: true
    });

    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Create galaxy
    const galaxyGeometry = new THREE.BufferGeometry();
    const galaxyMaterial = new THREE.PointsMaterial({
        color: 0x44ff88,
        size: 3,
        transparent: true,
        blending: THREE.AdditiveBlending
    });

    const galaxyVertices = [];
    const galaxyColors = [];
    for (let i = 0; i < 500; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 400 + 100;
        const x = Math.cos(angle) * radius;
        const y = (Math.random() - 0.5) * 50;
        const z = Math.sin(angle) * radius;
        galaxyVertices.push(x, y, z);

        const color = new THREE.Color();
        color.setHSL(Math.random(), 0.7, 0.7);
        galaxyColors.push(color.r, color.g, color.b);
    }

    galaxyGeometry.setAttribute('position', new THREE.Float32BufferAttribute(galaxyVertices, 3));
    galaxyGeometry.setAttribute('color', new THREE.Float32BufferAttribute(galaxyColors, 3));
    galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
    scene.add(galaxy);

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start animation
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Rotate stars
    stars.rotation.y += 0.0005;
    stars.rotation.z += 0.0002;

    // Rotate galaxy
    galaxy.rotation.y += 0.001;

    // Update camera position with slight movement
    camera.position.x = Math.sin(Date.now() * 0.0001) * 50;
    camera.position.y = Math.cos(Date.now() * 0.0001) * 50;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

// Initialize the scene
document.addEventListener('DOMContentLoaded', init);