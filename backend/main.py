import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect , Body
from engine import SwarmEngine
from fastapi.middleware.cors import CORSMiddleware

asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
engine = SwarmEngine(drone_count=1000)

@app.get("/health")
def health():
    return {"status": "ok", "drones": len(engine.drones)}

@app.post("/formation")
def change_formation(data: dict):
    name = data.get("name")
    value = data.get("value")
    engine.set_formation(name, value)
    return {"status": "ok", "formation": name}

@app.websocket("/ws")
async def swarm_socket(ws: WebSocket):
    await ws.accept()
    print("WebSocket connected")
    try:
        while True:
            engine.tick()
            await ws.send_json(engine.snapshot())
            await asyncio.sleep(1 / 60)
    except WebSocketDisconnect:
        print("Client disconnected")
