# 🛸 AeroCanvas Pro | Drone Swarm Command

AeroCanvas Pro is a **high-performance, real-time 3D drone swarm orchestration system** designed to simulate and visualize large-scale autonomous drone formations.  
It combines a **FastAPI-based backend swarm engine** with a **Three.js-powered 3D frontend**, enabling smooth, low-latency control of **1,000+ drones** in real time.

The project is inspired by modern drone light shows, air-traffic simulations, and swarm robotics research — focusing on **clarity, performance, and deterministic control** rather than heavy physics engines.

---

## 🎥 Demo Video

> A short demo showcasing live formation switching, speed control, drone rendering modes, and environmental visuals.

<video src="https://github.com/user-attachments/assets/e3c2538c-0388-4f04-90f6-758c5f2e0409" controls width="100%"></video>

---

## 🖼️ Screenshots

### 3D Swarm View with HUD Controls

![AeroCanvas Screenshot](https://github.com/user-attachments/assets/250e907a-8a10-4235-acea-fc4ede812c37)

---

## ✨ Key Features

### 🚁 Large-Scale Swarm Simulation
- Simulates **1,000 autonomous drones** concurrently.
- Designed for scalability using **GPU instancing** on the frontend.
- Stable performance even at high frame rates (~60 FPS).

### 🔁 Dynamic Formations
- Switch formations in real time without restarting the system.
- Supported formations include:
  - Circle
  - Grid
  - Helix / DNA-style curves
  - Text-based formations (procedural letter layouts)

### 🔤 Text-to-Swarm System
- Enter any text and the swarm reorganizes itself to form characters.
- Useful for sky-text simulations and light-show choreography concepts.

### 🎮 Professional HUD (Heads-Up Display)
- Formation selection buttons
- Speed control slider
- Drone rendering toggle (dot ↔ drone model)
- Designed for clarity and live experimentation

### 🌬️ Wind Direction Visualization
- 2D compass overlay showing:
  - Cardinal directions (N, E, S, W)
  - Wind direction vector
  - Wind speed that changes over time
- Wind is visualized for realism and situational awareness.

### 🎨 Cinematic Visuals
- Dark sky background for maximum contrast
- Light-colored ground plane for depth perception
- Clearly visible drone colors for night-scene aesthetics

---


### Backend Responsibilities
- Owns **all drone state**
- Calculates formations and animation timing
- Streams positions continuously via WebSocket

### Frontend Responsibilities
- Renders drones in 3D space
- Handles camera movement and UI controls
- Never alters swarm logic (render-only)

This separation ensures:
- Deterministic behavior
- Easy scaling
- Clean debugging

---

## 🛠️ Tech Stack

### Frontend
- **Three.js** — WebGL 3D rendering
- **JavaScript (ES6+)**
- **CSS3** — HUD and overlays
- **InstancedMesh** — GPU-efficient drone rendering

### Backend
- **Python 3.10+**
- **FastAPI** — REST + WebSocket server
- **AsyncIO** — real-time simulation loop
- **NumPy** — vector math and formations
- **Pillow** — text rasterization for text formations

---


---

## 🚀 How to Run Locally

### 1️⃣ Prerequisites
- Python **3.10 or higher**
- A modern browser (Chrome / Edge / Firefox)

---

### 2️⃣ Backend Setup

Navigate to the backend directory and install dependencies:

```bash
pip install -r requirements.txt


uvicorn app.main:app --reload



---

If you want next:
- 📦 **CI/CD setup**
- 🌐 **Railway deployment**
- 🧠 **Advanced swarm behaviors**
- 🎼 **Music-synced formations**

Just tell me.



