import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

// Post-Processing Imports for the "Glow" effect
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

/* ---------- SCENE SETUP ---------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02020a); // Near black for better glow

const camera = new THREE.PerspectiveCamera(
  60,
  (window.innerWidth - 280) / window.innerHeight,
  0.1,
  2000
);
camera.position.set(0, 60, 150);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth - 280, window.innerHeight);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.left = "280px";
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

/* ---------- POST-PROCESSING (SUBTLE GLOW) ---------- */
const renderPass = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth - 280, window.innerHeight),
  0.4, // Strength: DROPPED from 1.5. This is the "little bit" you want.
  0.1, // Radius: Keeping this low prevents the drones from blurring together.
  0.8 // Threshold: Only glows where the color is very intense.
);

const composer = new EffectComposer(renderer);
composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

/* ---------- LIGHTING ---------- */
scene.add(new THREE.AmbientLight(0xffffff, 0.2));
const pointLight = new THREE.PointLight(0x00ffff, 2, 500);
pointLight.position.set(0, 50, 0);
scene.add(pointLight);

/* ---------- GROUND & GRID ---------- */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2000, 2000),
  new THREE.MeshStandardMaterial({
    color: 0x050510,
    roughness: 0.8,
    metalness: 0.2,
  })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -10;
scene.add(ground);

const grid = new THREE.GridHelper(1000, 100, 0x1a1a40, 0x1a1a40);
grid.position.y = -9.9;
scene.add(grid);

// Exposed to HTML
window.setGroundHeight = (val) => {
  const h = parseFloat(val);
  ground.position.y = h;
  grid.position.y = h + 0.1;
};

/* ---------- DRONE GEOMETRY ---------- */
function createDroneGeometry() {
  const geometries = [];
  const body = new THREE.CylinderGeometry(0.15, 0.2, 0.4, 8);
  geometries.push(body);

  for (let i = 0; i < 2; i++) {
    const arm = new THREE.BoxGeometry(1.2, 0.05, 0.05);
    arm.rotateY((i * Math.PI) / 2 + Math.PI / 4);
    geometries.push(arm);
  }
  return BufferGeometryUtils.mergeGeometries(geometries);
}

/* ---------- INSTANCED MESHES ---------- */
const COUNT = 1000;
// We boost emissiveIntensity to trigger the Bloom effect
const dotMat = new THREE.MeshStandardMaterial({
  color: 0x000000,
  emissive: 0x00ffff,
  emissiveIntensity: 2.5, // Lowered from 15-20. This makes it a soft glow.
});

const droneMat = new THREE.MeshStandardMaterial({
  color: 0x010101,
  emissive: 0x00ffff,
  emissiveIntensity: 1.5, // Subtle glow for the drone body
  metalness: 0.5,
  roughness: 0.5,
});

const dotMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.25, 8, 8),
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
const currentPositions = Array.from(
  { length: COUNT },
  () => new THREE.Vector3(0, 0, 0)
);

/* ---------- INTERFACE & STATE ---------- */
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

/* ---------- WEBSOCKET ---------- */
let dronesData = [];
const statusDot = document.getElementById("status-dot");
const ws = new WebSocket("ws://127.0.0.1:8000/ws");

ws.onopen = () => {
  if (statusDot) {
    statusDot.style.background = "#00ff88";
    statusDot.style.boxShadow = "0 0 10px #00ff88";
  }
};

ws.onmessage = (e) => {
  dronesData = JSON.parse(e.data);
};

ws.onclose = () => {
  if (statusDot) {
    statusDot.style.background = "#ff4444";
    statusDot.style.boxShadow = "0 0 10px #ff4444";
  }
};

/* ---------- API CALLS ---------- */
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

/* ---------- WIND & COMPASS ---------- */
let wind = { direction: new THREE.Vector3(1, 0, 0), strength: 2.0 };
const compassCanvas = document.getElementById("compass");
const ctx = compassCanvas.getContext("2d");

function updateWind() {
  const angle = Date.now() * 0.0005;
  wind.direction.set(Math.cos(angle), 0, Math.sin(angle));
  wind.strength = 2 + Math.sin(angle * 0.5) * 1.5;
}

function drawCompass() {
  if (!ctx) return;
  ctx.clearRect(0, 0, 200, 200);
  ctx.beginPath();
  ctx.arc(100, 100, 80, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0, 255, 255, 0.1)";
  ctx.lineWidth = 2;
  ctx.stroke();

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
  ctx.restore();
}

/* ---------- ANIMATION LOOP ---------- */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateWind();
  drawCompass();

  const activeMesh = droneMode === "dot" ? dotMesh : droneMesh;
  const time = Date.now() * 0.001;

  if (dronesData.length > 0) {
    dronesData.forEach((d, i) => {
      if (i >= COUNT) return;

      const targetPos = new THREE.Vector3(d.x, d.y, d.z);

      // Smooth interpolation
      const lerpFactor = 0.05 * speedMultiplier;
      currentPositions[i].lerp(targetPos, Math.min(lerpFactor, 1.0));

      dummy.position.copy(currentPositions[i]);

      // Advanced procedural flight jitter
      dummy.position.y += Math.sin(time * 2 + i) * 0.07;
      dummy.rotation.z = Math.sin(time * 3 + i) * 0.05;
      dummy.rotation.x = Math.cos(time * 3 + i) * 0.05;

      dummy.updateMatrix();
      activeMesh.setMatrixAt(i, dummy.matrix);
    });
    activeMesh.instanceMatrix.needsUpdate = true;
  }

  // Use the composer for the bloom render
  composer.render();
}

animate();

/* ---------- RESIZE ---------- */
window.addEventListener("resize", () => {
  const w = window.innerWidth - 280;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
});
