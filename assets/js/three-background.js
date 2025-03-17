import * as THREE from 'three';

let scene, camera, renderer, stars, darkStars, galaxy, nebula;
let zoomDirection = 1;
const bigBangEffects = [];
const particles = [];

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.position.z = 800;

    renderer = new THREE.WebGLRenderer({ 
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-1';
    document.body.appendChild(renderer.domElement);

    createStars();
    createDarkStars();
    createGalaxy();
    createNebula();
    createLighting();

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('wheel', onMouseWheel);

    animate();
}

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.7,
        transparent: true,
        vertexColors: true
    });

    const starVertices = [];
    const starColors = [];
    for (let i = 0; i < 30000; i++) {
        starVertices.push(
            THREE.MathUtils.randFloatSpread(2000),
            THREE.MathUtils.randFloatSpread(2000),
            THREE.MathUtils.randFloatSpread(2000)
        );

        const color = new THREE.Color();
        color.setHSL(0.6, 0.8, THREE.MathUtils.randFloat(0.6, 1));
        starColors.push(color.r, color.g, color.b);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function createDarkStars() {
    const darkStarGeometry = new THREE.BufferGeometry();
    const darkStarMaterial = new THREE.PointsMaterial({
        color: 0x222222,
        size: 0.4,
        transparent: true,
        opacity: 0.8
    });

    const darkStarVertices = [];
    for (let i = 0; i < 40000; i++) {
        darkStarVertices.push(
            THREE.MathUtils.randFloatSpread(2500),
            THREE.MathUtils.randFloatSpread(2500),
            THREE.MathUtils.randFloatSpread(2500)
        );
    }

    darkStarGeometry.setAttribute('position', new THREE.Float32BufferAttribute(darkStarVertices, 3));
    darkStars = new THREE.Points(darkStarGeometry, darkStarMaterial);
    scene.add(darkStars);
}

function createGalaxy() {
    const galaxyGeometry = new THREE.BufferGeometry();
    const galaxyMaterial = new THREE.PointsMaterial({
        color: 0x44aaff,
        size: 0.7,
        transparent: true,
        vertexColors: true
    });

    const galaxyVertices = [];
    const galaxyColors = [];
    for (let i = 0; i < 15000; i++) {
        const radius = THREE.MathUtils.randFloat(100, 400);
        const theta = THREE.MathUtils.randFloat(0, 2 * Math.PI);
        const phi = THREE.MathUtils.randFloat(-Math.PI / 4, Math.PI / 4);

        galaxyVertices.push(
            radius * Math.cos(theta) * Math.cos(phi),
            radius * Math.sin(phi),
            radius * Math.sin(theta) * Math.cos(phi)
        );

        const color = new THREE.Color();
        color.setHSL(THREE.MathUtils.randFloat(0.5, 0.7), 0.9, THREE.MathUtils.randFloat(0.4, 0.8));
        galaxyColors.push(color.r, color.g, color.b);
    }

    galaxyGeometry.setAttribute('position', new THREE.Float32BufferAttribute(galaxyVertices, 3));
    galaxyGeometry.setAttribute('color', new THREE.Float32BufferAttribute(galaxyColors, 3));
    galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
    scene.add(galaxy);
}

function createNebula() {
    const nebulaTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/nebula.jpg');
    const nebulaMaterial = new THREE.SpriteMaterial({
        map: nebulaTexture,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    });
    nebula = new THREE.Sprite(nebulaMaterial);
    nebula.scale.set(2000, 2000, 1);
    scene.add(nebula);
}

function createLighting() {
    const light1 = new THREE.PointLight(0xff8800, 1.5, 1500);
    light1.position.set(500, 500, 500);
    scene.add(light1);

    const light2 = new THREE.PointLight(0x4488ff, 1, 2000);
    light2.position.set(-500, -500, -500);
    scene.add(light2);
}

function createBigBangEffect() {
    const bigBangGeometry = new THREE.SphereGeometry(5, 32, 32);
    const bigBangMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(`hsl(${Math.random() * 360}, 100%, 70%)`),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const bigBang = new THREE.Mesh(bigBangGeometry, bigBangMaterial);
    bigBang.position.set(
        THREE.MathUtils.randFloatSpread(1000),
        THREE.MathUtils.randFloatSpread(1000),
        THREE.MathUtils.randFloatSpread(1000)
    );

    for (let i = 0; i < 100; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            new THREE.MeshBasicMaterial({
                color: bigBangMaterial.color,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            })
        );
        particle.position.copy(bigBang.position);
        particles.push({
            mesh: particle,
            velocity: new THREE.Vector3(
                THREE.MathUtils.randFloatSpread(15),
                THREE.MathUtils.randFloatSpread(15),
                THREE.MathUtils.randFloatSpread(15)
            ),
            acceleration: new THREE.Vector3(0, -0.1, 0)
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
        effect.scale += 0.08;
        effect.mesh.material.opacity = Math.max(0, effect.opacity -= 0.015);

        if (effect.opacity <= 0) {
            scene.remove(effect.mesh);
            bigBangEffects.splice(i, 1);
        }
    }

    particles.forEach((particle, index) => {
        particle.velocity.add(particle.acceleration);
        particle.mesh.position.add(particle.velocity);
        particle.mesh.material.opacity -= 0.015;
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
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    stars.rotation.y += mouseX * 0.0002;
    stars.rotation.x += mouseY * 0.0002;
    darkStars.rotation.y += mouseX * 0.0001;
    darkStars.rotation.x += mouseY * 0.0001;
}

function onMouseWheel(event) {
    camera.position.z += event.deltaY * 0.1;
    camera.position.z = Math.max(200, Math.min(2000, camera.position.z));
}

function animate() {
    requestAnimationFrame(animate);

    camera.position.z += zoomDirection * 1.5;
    if (camera.position.z >= 2000 || camera.position.z <= 200) {
        zoomDirection *= -1;
    }

    stars.rotation.x += 0.0002;
    stars.rotation.y += 0.0003;
    darkStars.rotation.x += 0.0001;
    darkStars.rotation.y += 0.0002;
    galaxy.rotation.y += 0.0002;

    stars.material.size = 0.7 + Math.sin(Date.now() * 0.001) * 0.2;
    darkStars.material.size = 0.4 + Math.sin(Date.now() * 0.0015) * 0.1;

    if (Math.random() < 0.003) {
        createBigBangEffect();
    }
    updateBigBangEffects();

    renderer.render(scene, camera);
}

export { init };