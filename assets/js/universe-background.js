// Three.js Universe Scene with Stars, Galaxy, and Advanced Effects
let scene, camera, renderer, stars, galaxy, nebula;
const bigBangEffects = [];
const particles = [];

function init() {
    // Create scene and camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.position.z = 800;

    // Renderer setup with transparent background
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-1';
    document.body.appendChild(renderer.domElement);

    // Add elements to the scene
    createStars();
    createGalaxy();
    createNebula();
    createLighting();

    // Event listeners for interactivity
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('wheel', onMouseWheel);

    animate();
}

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true });

    const starVertices = [];
    for (let i = 0; i < 20000; i++) {
        starVertices.push(
            THREE.MathUtils.randFloatSpread(2000),
            THREE.MathUtils.randFloatSpread(2000),
            THREE.MathUtils.randFloatSpread(2000)
        );
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function createGalaxy() {
    const galaxyGeometry = new THREE.BufferGeometry();
    const galaxyMaterial = new THREE.PointsMaterial({ color: 0x44aaff, size: 0.7 });

    const galaxyVertices = [];
    for (let i = 0; i < 10000; i++) {
        const radius = THREE.MathUtils.randFloat(100, 400);
        const theta = THREE.MathUtils.randFloat(0, 2 * Math.PI);
        const phi = THREE.MathUtils.randFloat(-Math.PI / 2, Math.PI / 2);

        galaxyVertices.push(
            radius * Math.cos(theta) * Math.cos(phi),
            radius * Math.sin(phi),
            radius * Math.sin(theta) * Math.cos(phi)
        );
    }

    galaxyGeometry.setAttribute('position', new THREE.Float32BufferAttribute(galaxyVertices, 3));
    galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
    scene.add(galaxy);
}

function createNebula() {
    const nebulaTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/nebula.jpg');
    const nebulaMaterial = new THREE.SpriteMaterial({ map: nebulaTexture, transparent: true, opacity: 0.6 });
    nebula = new THREE.Sprite(nebulaMaterial);
    nebula.scale.set(2000, 2000, 1);
    scene.add(nebula);
}

function createLighting() {
    const light1 = new THREE.PointLight(0xff8800, 2, 1500);
    light1.position.set(500, 500, 500);
    scene.add(light1);

    const light2 = new THREE.PointLight(0x4488ff, 1.5, 2000);
    light2.position.set(-500, -500, -500);
    scene.add(light2);
}

function createBigBangEffect() {
    const bigBangGeometry = new THREE.SphereGeometry(5, 32, 32);
    const bigBangMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(`hsl(${Math.random() * 360}, 100%, 70%)`),
        transparent: true,
        opacity: 0.8
    });

    const bigBang = new THREE.Mesh(bigBangGeometry, bigBangMaterial);
    bigBang.position.set(
        THREE.MathUtils.randFloatSpread(1000),
        THREE.MathUtils.randFloatSpread(1000),
        THREE.MathUtils.randFloatSpread(1000)
    );

    // Add particle explosion
    for (let i = 0; i < 50; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshBasicMaterial({ color: bigBangMaterial.color })
        );
        particle.position.copy(bigBang.position);
        particles.push({
            mesh: particle,
            velocity: new THREE.Vector3(
                THREE.MathUtils.randFloatSpread(10),
                THREE.MathUtils.randFloatSpread(10),
                THREE.MathUtils.randFloatSpread(10)
            )
        });
        scene.add(particle);
    }

    bigBangEffects.push({ mesh: bigBang, scale: 0.1, opacity: 0.8 });
    scene.add(bigBang);
}

function updateBigBangEffects() {
    for (let i = bigBangEffects.length - 1; i >= 0; i--) {
        const effect = bigBangEffects[i];
        effect.mesh.scale.set(effect.scale, effect.scale, effect.scale);
        effect.scale += 0.05;
        effect.mesh.material.opacity = Math.max(0, effect.opacity -= 0.01);

        if (effect.opacity <= 0) {
            scene.remove(effect.mesh);
            bigBangEffects.splice(i, 1);
        }
    }

    // Update particle explosion
    particles.forEach((particle, index) => {
        particle.mesh.position.add(particle.velocity);
        particle.mesh.material.opacity -= 0.02;
        if (particle.mesh.material.opacity <= 0) {
            scene.remove(particle.mesh);
            particles.splice(index, 1);
        }
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    const mouseX = (event.clientX - window.innerWidth / 2) * 0.1;
    const mouseY = (event.clientY - window.innerHeight / 2) * 0.1;

    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
}

function onMouseWheel(event) {
    const zoomSpeed = 50;
    camera.position.z = Math.max(100, Math.min(1500, camera.position.z + event.deltaY * 0.1));
}

function animate() {
    requestAnimationFrame(animate);

    // Rotate stars and galaxy
    stars.rotation.x += 0.0002;
    stars.rotation.y += 0.0005;
    galaxy.rotation.x += 0.0003;
    galaxy.rotation.y += 0.0004;

    // Update effects
    updateBigBangEffects();

    // Random big bang effect
    if (Math.random() < 0.01) {
        createBigBangEffect();
    }

    renderer.render(scene, camera);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
