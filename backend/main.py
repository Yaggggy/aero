import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from engine import SwarmEngine
from fastapi import Body

asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

app = FastAPI()
engine = SwarmEngine(drone_count=1000)

@app.get("/health")
def health():
    return {"status": "ok", "drones": len(engine.drones)}

@app.post("/formation")
def change_formation(data: dict = Body(...)):
    name = data.get("name")
    engine.set_formation(name)
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
