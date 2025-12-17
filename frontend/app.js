import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import * as BufferGeometryUtils from "https://unpkg.com/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.js";

/* ---------- SCENE SETUP ---------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0c2b);

const camera = new THREE.PerspectiveCamera(
  60,
  (window.innerWidth - 260) / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 30, 80);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth - 260, window.innerHeight);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.left = "260px";
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 10, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

/* ---------- LIGHTING ---------- */
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(50, 100, 50);
scene.add(light);

/* ---------- GROUND ---------- */
let groundHeight = -10;
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = groundHeight;
scene.add(ground);

const grid = new THREE.GridHelper(500, 50, 0x999999, 0x999999);
grid.position.y = groundHeight + 0.1;
scene.add(grid);

window.setGroundHeight = (value) => {
  const maxGround = -10; // starting position
  const minGround = -200; // maximum downward

  const percentage = parseFloat(value) / 100;
  groundHeight = maxGround + percentage * (minGround - maxGround);
  ground.position.y = groundHeight;
  grid.position.y = groundHeight + 0.1;
};

/* ---------- WIND INDICATOR ---------- */
// let wind = { direction: new THREE.Vector3(1, 0, 0), strength: 5 };
// const windArrow = new THREE.ArrowHelper(
//   wind.direction,
//   new THREE.Vector3(-80, 5, -80),
//   20,
//   0x00ffcc
// );
// scene.add(windArrow);

/* ---------- DRONE GEOMETRY ---------- */
function createDroneGeometry() {
  const geometries = [];

  const bodyGeom = new THREE.CylinderGeometry(0.15, 0.2, 0.4, 8);
  geometries.push(bodyGeom);

  for (let i = 0; i < 2; i++) {
    const armGeom = new THREE.BoxGeometry(0.8, 0.05, 0.05);
    armGeom.rotateY((i * Math.PI) / 2);
    geometries.push(armGeom);
  }

  return BufferGeometryUtils.mergeGeometries(geometries);
}

/* ---------- MATERIALS & MESHES ---------- */
const dotMaterial = new THREE.MeshStandardMaterial({
  color: 0x66ccff,
  emissive: 0x112233,
});
const droneMaterial = new THREE.MeshStandardMaterial({
  color: 0x00ffff,
  emissive: 0x111155,
  metalness: 0.3,
  roughness: 0.4,
});

const COUNT = 1000;
const dotMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.35, 8, 8),
  dotMaterial,
  COUNT
);
const droneMesh = new THREE.InstancedMesh(
  createDroneGeometry(),
  droneMaterial,
  COUNT
);

scene.add(dotMesh); // Default view
let droneMode = "dot";
const dummy = new THREE.Object3D();

/* ---------- INTERFACE FUNCTIONS ---------- */
window.toggleDroneView = function () {
  droneMode = droneMode === "dot" ? "drone" : "dot";
  if (droneMode === "dot") {
    scene.remove(droneMesh);
    scene.add(dotMesh);
  } else {
    scene.remove(dotMesh);
    scene.add(droneMesh);
  }
};

let speedMultiplier = 1.0;
window.setSpeed = (value) => {
  speedMultiplier = parseFloat(value);
};

/* ---------- WEBSOCKET & API ---------- */
let drones = [];

const ws = new WebSocket("ws://127.0.0.1:8000/ws");
ws.onmessage = (event) => {
  drones = JSON.parse(event.data);
};

window.setFormation = (name) => {
  fetch("http://127.0.0.1:8000/formation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
};

window.setText = () => {
  const value = document.getElementById("textInput").value;
  fetch("http://127.0.0.1:8000/formation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "text", value }),
  });
};

/* ---------- DRONE STATE ---------- */
const dronePositions = Array(COUNT)
  .fill()
  .map(() => new THREE.Vector3(0, 0, 0));

/* ---------- ANIMATION LOOP ---------- */
const MIN_DIST = 0.6; // collision avoidance

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  const activeMesh = droneMode === "dot" ? dotMesh : droneMesh;

  if (drones.length > 0) {
    drones.forEach((d, i) => {
      if (i >= COUNT) return;

      // Target position follows backend exactly (no height restriction)
      let target = new THREE.Vector3(
        d.x + (Math.random() - 0.5) * 0.2,
        d.y * speedMultiplier, // no clamping, free height
        d.z + (Math.random() - 0.5) * 0.2
      );

      // Collision avoidance in X/Z plane only
      for (let j = 0; j < i; j++) {
        const delta = new THREE.Vector3().subVectors(
          dronePositions[i],
          dronePositions[j]
        );
        const dist = delta.length();
        if (dist < MIN_DIST) {
          delta.y = 0;
          delta.normalize().multiplyScalar(MIN_DIST - dist);
          target.add(delta);
        }
      }

      dronePositions[i].lerp(target, 0.05 * speedMultiplier);

      dummy.position.copy(dronePositions[i]);
      dummy.updateMatrix();
      activeMesh.setMatrixAt(i, dummy.matrix);
    });
    activeMesh.instanceMatrix.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

animate();

/* ---------- RESIZE ---------- */
window.addEventListener("resize", () => {
  camera.aspect = (window.innerWidth - 260) / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth - 260, window.innerHeight);
});
