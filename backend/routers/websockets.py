import asyncio
import json
import os
import redis.asyncio as redis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["WebSockets"])

# Use the same REDIS_URL used by celery/docker
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")

class ConnectionManager:
    def __init__(self):
        # Maps match_id to a list of connected websockets
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, match_id: str):
        await websocket.accept()
        if match_id not in self.active_connections:
            self.active_connections[match_id] = []
        self.active_connections[match_id].append(websocket)

    def disconnect(self, websocket: WebSocket, match_id: str):
        if match_id in self.active_connections:
            self.active_connections[match_id].remove(websocket)
            if len(self.active_connections[match_id]) == 0:
                del self.active_connections[match_id]

    async def broadcast_to_match(self, match_id: str, message: dict):
        if match_id in self.active_connections:
            for connection in self.active_connections[match_id]:
                try:
                    await connection.send_json(message)
                except:
                    # Ignore failing connections (e.g., client disconnected suddenly)
                    pass

manager = ConnectionManager()

async def redis_listener():
    """Listens to Redis Pub/Sub for live match updates and broadcasts via WebSockets."""
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    pubsub = redis_client.pubsub()
    await pubsub.psubscribe("match_updates:*")
    
    print("Started Redis Pub/Sub listener for WebSockets...")
    try:
        async for message in pubsub.listen():
            if message["type"] == "pmessage":
                channel = message["channel"]  # e.g., match_updates:1234
                match_id = channel.split(":")[1]
                data = json.loads(message["data"])
                await manager.broadcast_to_match(match_id, data)
    except asyncio.CancelledError:
        pass
    finally:
        await pubsub.close()
        await redis_client.close()

@router.websocket("/ws/match/{match_id}")
async def websocket_endpoint(websocket: WebSocket, match_id: str):
    await manager.connect(websocket, match_id)
    try:
        while True:
            # We don't expect much incoming data from clients, just keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, match_id)
