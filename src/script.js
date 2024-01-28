import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import CANNON from "cannon";

/**
 * Debug
 */
const gui = new GUI();

const debugObject = {};

debugObject.createSphere = () => {
  createSphere(Math.random(), {
    x: (Math.random() - 0.5) * 2,
    y: 3,
    z: (Math.random() - 0.5) * 2,
  });
};

debugObject.createBox = () => {
  createBox(Math.random(), Math.random(), Math.random(), {
    x: (Math.random() - 0.5) * 2,
    y: 3,
    z: (Math.random() - 0.5) * 2,
  });
};

gui.add(debugObject, "createSphere");
gui.add(debugObject, "createBox");

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

var axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const hitSound = new Audio("/sounds/hit.mp3");

const playHitSound = (event) => {
  const impactStrenght = event.contact.getImpactVelocityAlongNormal();

  if (impactStrenght > 1.5) {
    hitSound.currentTime = 0;
    hitSound.play();
  }
};

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();

const environmentMapTexture = cubeTextureLoader.load([
  "/textures/environmentMaps/0/px.png",
  "/textures/environmentMaps/0/nx.png",
  "/textures/environmentMaps/0/py.png",
  "/textures/environmentMaps/0/ny.png",
  "/textures/environmentMaps/0/pz.png",
  "/textures/environmentMaps/0/nz.png",
]);

/**
 * Physics
 */
const world = new CANNON.World();

world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world);

// Physics materials
const defaultMaterial = new CANNON.Material("default");

const defaultContactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.1,
    restitution: 0.1,
  }
);

world.addContactMaterial(defaultContactMaterial);
world.defaultContactMaterial = defaultContactMaterial;
// Sphere psysic

// Floor physics (its infinite floor basicly)
const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body({
  mass: 0,
  shape: floorShape,
});
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
world.addBody(floorBody);

/**
 * Floor
 */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000),
  new THREE.MeshStandardMaterial({
    color: "#012030",
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture,
    envMapIntensity: 0.5,
  })
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(-8, 8, 8);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor("#13678A", 1);

const sphereMaterial = new THREE.MeshStandardMaterial({
  metalness: 0.3,
  roughness: 0.4,
  envMap: environmentMapTexture,
});
const sphereGeometry = new THREE.SphereGeometry(1, 20, 20);

const objectsToUpdate = [];

const spheresToUpdate = [];

/**
 * Physics shapes
 */
function createSphere(radius, position) {
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.scale.set(radius, radius, radius);
  sphere.castShadow = true;
  sphere.position.copy(position);
  scene.add(sphere);

  // Physics
  const sphereShape = new CANNON.Sphere(radius);
  const sphereBody = new CANNON.Body({
    mass: 1,
    material: defaultMaterial,
    position: new CANNON.Vec3(0, 3, 0),
    shape: sphereShape,
  });
  sphereBody.position.copy(position);
  world.addBody(sphereBody);

  spheresToUpdate.push({ mesh: sphere, body: sphereBody });
}

const boxMaterial = new THREE.MeshStandardMaterial({
  metalness: 0.3,
  roughness: 0.4,
  envMap: environmentMapTexture,
});
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

function createBox(width, height, depth, position) {
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.scale.set(width, height, depth);
  box.castShadow = true;
  box.position.copy(position);
  scene.add(box);

  // Physics
  const boxShape = new CANNON.Box(
    new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5)
  );
  const boxBody = new CANNON.Body({
    mass: 0.2,
    material: defaultMaterial,
    position: new CANNON.Vec3(0, 0, 0),
    shape: boxShape,
  });
  boxBody.position.copy(position);
  boxBody.addEventListener("collide", playHitSound);
  world.addBody(boxBody);
  objectsToUpdate.push({ mesh: box, body: boxBody });
}

for (let i = 0; i < 10; i++) {
  let y = i;
  if (y > 0) {
    y += i / 10;
  }
  createBox(1, 1, 1, { x: y, y: 0, z: 0 });
  createBox(1, 1, 1, { x: y, y: 1, z: 0 });
  createBox(1, 1, 1, { x: y, y: 2, z: 0 });
}

createSphere(0.5, { x: 2, y: 0, z: 5 });

window.addEventListener("keydown", () => {
  console.log(objectsToUpdate[0].body);
  spheresToUpdate[0].body.applyLocalForce(
    new CANNON.Vec3(0, 500, -1000),
    new CANNON.Vec3(0, 0, 0)
  );
});

/**
 * Animate
 */
const clock = new THREE.Clock();
let oldElapsedTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  for (let object of objectsToUpdate) {
    object.mesh.position.copy(object.body.position);
    object.mesh.quaternion.copy(object.body.quaternion);
  }

  for (let object of spheresToUpdate) {
    object.mesh.position.copy(object.body.position);
  }

  world.step(1 / 60, deltaTime, 3);

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
