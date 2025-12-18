import asyncio
import os
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.app.engine import SwarmEngine


if os.name == 'nt':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

app = FastAPI()

# --- CORS SETUP ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the 1000-drone engine
engine = SwarmEngine(drone_count=1000)

@app.get("/health")
def health():
    """Check if the server is alive"""
    return {"status": "ok", "drones": len(engine.drones)}

@app.post("/formation")
async def change_formation(data: dict):
    """Receive formation commands from the HUD"""
    name = data.get("name")
    value = data.get("value")
    engine.set_formation(name, value)
    return {"status": "ok", "formation": name}

@app.websocket("/ws")
async def swarm_socket(ws: WebSocket):
    """High-speed telemetry stream for Three.js"""
    await ws.accept()
    print("Uplink Established: WebSocket connected")
    try:
        while True:
            engine.tick()
            
            await ws.send_json(engine.snapshot())
            
            await asyncio.sleep(1 / 30) 
            
    except WebSocketDisconnect:
        print("Uplink Lost: Client disconnected")


if __name__ == "__main__":
  
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=False)