import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from engine import SwarmEngine

asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

app = FastAPI()
engine = SwarmEngine(drone_count=1000)

@app.get("/health")
def health():
    return {"status": "ok", "drones": len(engine.drones)}

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
