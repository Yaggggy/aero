import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

/* ---------- SCENE SETUP ---------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0c2b); // Deep space blue

const camera = new THREE.PerspectiveCamera(
  60,
  (window.innerWidth - 260) / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 40, 100);

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
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(50, 100, 50);
scene.add(sunLight);

/* ---------- GROUND & GRID ---------- */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000),
  new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    roughness: 0.8,
    metalness: 0.2,
  })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -10;
scene.add(ground);

const grid = new THREE.GridHelper(500, 50, 0x444466, 0x222244);
grid.position.y = -9.9;
scene.add(grid);

window.setGroundHeight = (val) => {
  const h = parseFloat(val);
  ground.position.y = h;
  grid.position.y = h + 0.1;
};

/* ---------- DRONE GEOMETRY ---------- */
function createDroneGeometry() {
  const geometries = [];

  // Main Body
  const body = new THREE.CylinderGeometry(0.15, 0.2, 0.4, 8);
  geometries.push(body);

  // X-Frame Arms
  for (let i = 0; i < 2; i++) {
    const arm = new THREE.BoxGeometry(1.0, 0.05, 0.05);
    arm.rotateY((i * Math.PI) / 2 + Math.PI / 4);
    geometries.push(arm);
  }

  return BufferGeometryUtils.mergeGeometries(geometries);
}

/* ---------- INSTANCED MESHES ---------- */
const COUNT = 1000;
const dotMat = new THREE.MeshStandardMaterial({
  color: 0x00ffff,
  emissive: 0x005555,
});
const droneMat = new THREE.MeshStandardMaterial({
  color: 0x00ffff,
  metalness: 0.6,
  roughness: 0.2,
});

const dotMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.3, 8, 8),
  dotMat,
  COUNT
);
const droneMesh = new THREE.InstancedMesh(
  createDroneGeometry(),
  droneMat,
  COUNT
);

scene.add(dotMesh); // Default view
let droneMode = "dot";
const dummy = new THREE.Object3D();

// Store current positions for smooth LERPing
const currentPositions = Array.from(
  { length: COUNT },
  () => new THREE.Vector3(0, 0, 0)
);

/* ---------- STATE & CONTROLS ---------- */
let speedMultiplier = 1.0;
window.setSpeed = (v) => {
  speedMultiplier = parseFloat(v);
};

window.toggleDroneView = () => {
  droneMode = droneMode === "dot" ? "drone" : "dot";
  if (droneMode === "dot") {
    scene.remove(droneMesh);
    scene.add(dotMesh);
  } else {
    scene.remove(dotMesh);
    scene.add(droneMesh);
  }
};

/* ---------- WEBSOCKET & API ---------- */
let dronesData = [];
const ws = new WebSocket("ws://127.0.0.1:8000/ws");
ws.onmessage = (e) => {
  dronesData = JSON.parse(e.data);
};

window.setFormation = (name) => {
  fetch("http://127.0.0.1:8000/formation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
};

window.setText = () => {
  const val = document.getElementById("textInput").value;
  fetch("http://127.0.0.1:8000/formation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "text", value: val }),
  });
};

/* ---------- WIND SYSTEM ---------- */
let wind = { direction: new THREE.Vector3(1, 0, 0), strength: 2.0 };
const compassCanvas = document.getElementById("compass");
const ctx = compassCanvas.getContext("2d");

function updateWind() {
  const angle = Date.now() * 0.0005;
  wind.direction.set(Math.cos(angle), 0, Math.sin(angle));
  wind.strength = 2 + Math.sin(angle * 0.5) * 1.5;
}

function drawCompass() {
  ctx.clearRect(0, 0, 200, 200);

  // Outer Ring
  ctx.beginPath();
  ctx.arc(100, 100, 80, 0, Math.PI * 2);
  ctx.strokeStyle = "#2d345e";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Wind Arrow
  const angle = Math.atan2(wind.direction.z, wind.direction.x);
  ctx.save();
  ctx.translate(100, 100);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(40, 0);
  ctx.lineTo(20, -10);
  ctx.lineTo(20, 10);
  ctx.closePath();
  ctx.fillStyle = "#00ffff";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-40, 0);
  ctx.lineTo(40, 0);
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#8892b0";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${wind.strength.toFixed(1)} m/s`, 100, 160);
}

/* ---------- ANIMATION LOOP ---------- */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateWind();
  drawCompass();

  const activeMesh = droneMode === "dot" ? dotMesh : droneMesh;

  if (dronesData.length > 0) {
    dronesData.forEach((d, i) => {
      if (i >= COUNT) return;

      // Target comes from Backend Data
      const targetPos = new THREE.Vector3(d.x, d.y, d.z);

      // Speed Multiplier affects the LERP factor (responsiveness)
      // Lower = sluggish/smooth, Higher = snappy
      const lerpFactor = 0.05 * speedMultiplier;
      currentPositions[i].lerp(targetPos, Math.min(lerpFactor, 1.0));

      dummy.position.copy(currentPositions[i]);

      // Subtle hover jitter
      dummy.position.y += Math.sin(Date.now() * 0.002 + i) * 0.05;

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
