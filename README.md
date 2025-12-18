# 🛸 AeroCanvas Pro | Drone Swarm Command

AeroCanvas Pro is a high-performance, real-time 3D drone swarm orchestrator. It features a professional HUD (Heads-Up Display) to control 1,000 autonomous drones, simulating complex light show formations with server-side physics and low-latency synchronization.



## ✨ Key Features

* **1,000 Agent Simulation:** High-performance rendering using Three.js Instanced Meshes.
* **Dynamic Formations:** Toggle between Circle, Grid, DNA Helix, and Spherical Fireworks patterns.
* **Text-to-Swarm:** Input any text to have the swarm procedurally arrange themselves into a 3D letter cloud.
* **Physics Engine:** Real-time steering, velocity capping, and wind-reactive tilting calculated on the backend.
* **Cinematic Visuals:** Integrated Bloom post-processing for neon LED glow effects and reflective ground textures.



## 🛠️ Tech Stack

* **Frontend:** Three.js (WebGL), JavaScript (ES6+), CSS3 (HUD Interface).
* **Backend:** Python 3.10+, FastAPI (WebSockets), NumPy (Vector Math), Pillow (Image Processing).

---

## 🚀 How to Run Locally

### 1. Prerequisites
Ensure you have **Python 3.10+** installed on your system.

### 2. Backend Setup
Navigate to the project root and install dependencies:
```bash
# It is recommended to use a virtual environment
pip install -r requirements.txt
