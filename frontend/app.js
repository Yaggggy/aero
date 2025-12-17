const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e0e11);

const camera = new THREE.PerspectiveCamera(
  60,
  (innerWidth - 260) / innerHeight,
  0.1,
  1000
);
camera.position.set(0, 30, 80);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth - 260, innerHeight);
renderer.domElement.style.left = "260px";
document.body.appendChild(renderer.domElement);

const light = new THREE.PointLight(0xffffff, 1);
light.position.set(50, 50, 50);
scene.add(light);

const geometry = new THREE.SphereGeometry(0.35, 8, 8);
const material = new THREE.MeshStandardMaterial({
  color: 0x66ccff,
  emissive: 0x112233,
});

const COUNT = 1000;
const mesh = new THREE.InstancedMesh(geometry, material, COUNT);
scene.add(mesh);

const dummy = new THREE.Object3D();

const ws = new WebSocket("ws://127.0.0.1:8000/ws");

ws.onmessage = (event) => {
  const drones = JSON.parse(event.data);
  drones.forEach((d, i) => {
    dummy.position.set(d.x, d.y, d.z);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
};

function setFormation(name) {
  fetch("http://127.0.0.1:8000/formation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

function setText() {
  const value = document.getElementById("textInput").value;
  fetch("http://127.0.0.1:8000/formation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "text", value }),
  });
}

function animate() {
  requestAnimationFrame(animate);
  camera.position.x = Math.sin(Date.now() * 0.0002) * 80;
  camera.position.z = Math.cos(Date.now() * 0.0002) * 80;
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
}

animate();

window.onresize = () => {
  camera.aspect = (innerWidth - 260) / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth - 260, innerHeight);
};
