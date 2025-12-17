import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

/** * SCENE CONFIGURATION
 * Atmospheric fog and deep-space background
 */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02020a);
scene.fog = new THREE.FogExp2(0x02020a, 0.002);

const camera = new THREE.PerspectiveCamera(
  60,
  (window.innerWidth - 280) / window.innerHeight,
  0.1,
  2000
);
camera.position.set(0, 100, 250);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth - 280, window.innerHeight);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.left = "280px";
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

/**
 * POST-PROCESSING (THE GLOW)
 * UnrealBloomPass creates the LED-light bleed effect
 */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth - 280, window.innerHeight),
  0.7, // Strength
  0.15, // Radius
  0.85 // Threshold
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

/**
 * LIGHTING & ATMOSPHERE
 */
scene.add(new THREE.AmbientLight(0xffffff, 0.05));
const spotlight = new THREE.SpotLight(0x00ffff, 800, 600, Math.PI / 4, 0.5);
spotlight.position.set(0, 300, 100);
scene.add(spotlight);

// Starfield Generator
(function createStars() {
  const geom = new THREE.BufferGeometry();
  const coords = [];
  for (let i = 0; i < 5000; i++)
    coords.push(
      (Math.random() - 0.5) * 2000,
      (Math.random() - 0.5) * 2000,
      (Math.random() - 0.5) * 2000
    );
  geom.setAttribute("position", new THREE.Float32BufferAttribute(coords, 3));
  scene.add(
    new THREE.Points(
      geom,
      new THREE.PointsMaterial({
        size: 0.8,
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
      })
    )
  );
})();

/**
 * ENVIRONMENT
 * Reflective "Wet" asphalt ground
 */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2500, 2500),
  new THREE.MeshStandardMaterial({
    color: 0x050510,
    roughness: 0.1,
    metalness: 0.7,
  })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -10;
scene.add(ground);

const grid = new THREE.GridHelper(1000, 80, 0x1a1a40, 0x080815);
grid.position.y = -9.9;
scene.add(grid);

window.setGroundHeight = (v) => {
  ground.position.y = parseFloat(v);
  grid.position.y = parseFloat(v) + 0.1;
};

/**
 * DRONE ASSET GENERATION
 */
function createDroneGeom() {
  const parts = [];
  parts.push(new THREE.CylinderGeometry(0.15, 0.2, 0.4, 8)); // Body
  for (let i = 0; i < 2; i++) {
    const arm = new THREE.BoxGeometry(1.3, 0.04, 0.04);
    arm.rotateY((i * Math.PI) / 2 + Math.PI / 4);
    parts.push(arm);
  }
  return BufferGeometryUtils.mergeGeometries(parts);
}

const COUNT = 1000;
const dotMat = new THREE.MeshStandardMaterial({
  color: 0x000000,
  emissive: 0x00ffff,
  emissiveIntensity: 4,
});
const droneMat = new THREE.MeshStandardMaterial({
  color: 0x010101,
  emissive: 0x00ffff,
  emissiveIntensity: 2.5,
  metalness: 0.6,
  roughness: 0.3,
});

const dotMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.25, 8, 8),
  dotMat,
  COUNT
);
const droneMesh = new THREE.InstancedMesh(createDroneGeom(), droneMat, COUNT);
scene.add(dotMesh);

const curPos = Array.from({ length: COUNT }, () => new THREE.Vector3(0, 0, 0));
const dummy = new THREE.Object3D();
let droneMode = "dot",
  speedMultiplier = 1.0;

/**
 * NETWORKING & COMMANDS
 */
let dronesData = [];
const statusDot = document.getElementById("status-dot");
const ws = new WebSocket("ws://127.0.0.1:8000/ws");

ws.onopen = () =>
  statusDot &&
  ((statusDot.style.background = "#00ff88"),
  (statusDot.style.boxShadow = "0 0 12px #00ff88"));
ws.onmessage = (e) => (dronesData = JSON.parse(e.data));
ws.onclose = () =>
  statusDot &&
  ((statusDot.style.background = "#ff4444"),
  (statusDot.style.boxShadow = "0 0 12px #ff4444"));

window.setSpeed = (v) => (speedMultiplier = parseFloat(v));
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

window.setFormation = (n) =>
  fetch("http://127.0.0.1:8000/formation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: n }),
  });
window.setText = () => {
  const v = document.getElementById("textInput").value;
  fetch("http://127.0.0.1:8000/formation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "text", value: v }),
  });
};

/**
 * WIND SENSORS & TELEMETRY
 */
let wind = { dir: new THREE.Vector3(1, 0, 0), str: 2.0 };
const compass = document.getElementById("compass"),
  ctx = compass ? compass.getContext("2d") : null;

function updateTelemetry() {
  const angle = Date.now() * 0.0006;
  wind.dir.set(Math.cos(angle), 0, Math.sin(angle));
  wind.str = 2 + Math.sin(angle * 0.4) * 2;

  if (!ctx) return;
  ctx.clearRect(0, 0, 200, 200);
  ctx.beginPath();
  ctx.arc(100, 100, 80, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,255,255,0.15)";
  ctx.stroke();
  const wAngle = Math.atan2(wind.dir.z, wind.dir.x);
  ctx.save();
  ctx.translate(100, 100);
  ctx.rotate(wAngle);
  ctx.beginPath();
  ctx.moveTo(40, 0);
  ctx.lineTo(20, -10);
  ctx.lineTo(20, 10);
  ctx.closePath();
  ctx.fillStyle = "#00ffff";
  ctx.fill();
  ctx.restore();
}

/**
 * CORE ANIMATION ENGINE
 * Handles LERPing, Jitter, and Wind-Reactive tilting
 */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateTelemetry();

  const mesh = droneMode === "dot" ? dotMesh : droneMesh;
  const time = Date.now() * 0.001;

  if (dronesData.length > 0) {
    dronesData.forEach((d, i) => {
      if (i >= COUNT) return;
      const target = new THREE.Vector3(d.x, d.y, d.z);

      // Physics: Linear Interpolation (Smooth Movement)
      curPos[i].lerp(target, Math.min(0.05 * speedMultiplier, 1.0));
      dummy.position.copy(curPos[i]);

      // Emergent Behavior: Flight Turbulence & Wind Tilt
      const turbulence = Math.sin(time * 2 + i) * 0.08;
      const windInfluence = wind.str * 0.025;

      dummy.position.y += turbulence;
      dummy.rotation.set(
        Math.cos(time * 3 + i) * 0.05 + wind.dir.z * windInfluence,
        0,
        Math.sin(time * 3 + i) * 0.05 + wind.dir.x * windInfluence
      );

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
  composer.render();
}
animate();

window.addEventListener("resize", () => {
  const w = window.innerWidth - 280,
    h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
});
