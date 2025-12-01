# main.py
import os
import asyncio
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import json

# Optional import for real CV inference
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
    # choose a small model if available
    YOLO_MODEL = YOLO("yolov8n.pt")
except Exception:
    YOLO_AVAILABLE = False
    YOLO_MODEL = None

DB_FILE = "smartserve.db"
MENU = [
    {"id": "burger", "name": "Classic Burger", "price": 6.99, "tags": ["hot","main"]},
    {"id": "fries", "name": "Fries", "price": 2.49, "tags": ["side"]},
    {"id": "cola", "name": "Soft Drink", "price": 1.99, "tags": ["drink"]},
    {"id": "salad", "name": "Green Salad", "price": 4.99, "tags": ["veg","light"]},
    {"id": "soup", "name": "Tomato Soup", "price": 3.49, "tags": ["hot","starter"]}
]

# Initialize DB
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT,
        profile TEXT,
        items TEXT,
        status TEXT
    )
    """)
    conn.commit()
    conn.close()

init_db()

app = FastAPI(title="SmartServe Backend (Hackathon Demo)")

# allow CORS from local frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class RecommendRequest(BaseModel):
    user: Optional[str] = "anonymous"
    time: Optional[str] = None
    ticketId: Optional[int] = None
    profile: Optional[str] = "returning"

class RecommendResponse(BaseModel):
    recommendations: List[Dict[str, Any]]

class OrderRequest(BaseModel):
    profile: str
    items: List[str]
    timestamp: Optional[int] = None

class OrderResponse(BaseModel):
    id: int
    status: str
    items: List[str]

class VerificationRequest(BaseModel):
    ticket_id: int
    method: Optional[str] = "mock"  # or "model"
    sample_hint: Optional[str] = None

# Helpers
def insert_ticket(profile: str, items: List[str]) -> Dict[str, Any]:
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    created_at = datetime.utcnow().isoformat()
    cur.execute("INSERT INTO tickets (created_at, profile, items, status) VALUES (?, ?, ?, ?)",
                (created_at, profile, json.dumps(items), "created"))
    ticket_id = cur.lastrowid
    conn.commit()
    conn.close()
    return {"id": ticket_id, "created_at": created_at, "profile": profile, "items": items, "status": "created"}

def get_ticket(ticket_id: int) -> Optional[Dict[str, Any]]:
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("SELECT id, created_at, profile, items, status FROM tickets WHERE id = ?", (ticket_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {"id": row[0], "created_at": row[1], "profile": row[2], "items": json.loads(row[3]), "status": row[4]}

def set_ticket_status(ticket_id: int, status: str):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("UPDATE tickets SET status = ? WHERE id = ?", (status, ticket_id))
    conn.commit()
    conn.close()

# Endpoints
@app.get("/menu")
async def get_menu():
    return MENU

from recommender.vector_recommender import get_recommendations_vector

@app.post("/recommend")
async def recommend(req: RecommendRequest):
    context_items = []
    if req.ticketId:
        ticket = get_ticket(req.ticketId)
        if ticket:
            context_items = ticket["items"]

    # Use vector recommender
    recs = get_recommendations_vector(
        user=req.user,
        profile=req.profile,
        timestamp=req.time,
        context_ticket_items=context_items,
        top_k=3
    )
    return {"recommendations": recs}

@app.post("/order")
async def create_order(req: OrderRequest):
    if not req.items:
        raise HTTPException(status_code=400, detail="No items provided")
    ticket = insert_ticket(req.profile, req.items)
    # set status to 'in_kitchen' to simulate progression
    set_ticket_status(ticket["id"], "in_kitchen")
    return {"id": ticket["id"], "status": "in_kitchen", "items": ticket["items"]}

@app.get("/kds/{ticket_id}")
async def kds_status(ticket_id: int):
    ticket = get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    # For demo: simulate verification result if it exists (store in file), else default
    # We'll try to read a verification result file for that ticket
    vfile = f"verification_{ticket_id}.json"
    verification = None
    if os.path.exists(vfile):
        with open(vfile, "r") as f:
            verification = json.load(f)
    else:
        # default: pending verification
        verification = {"status": "pending", "missing": []}
    return {"ticketId": ticket_id, "status": ticket["status"], "verification": verification}

def write_verification(ticket_id: int, result: Dict[str, Any]):
    vfile = f"verification_{ticket_id}.json"
    with open(vfile, "w") as f:
        json.dump(result, f)

from cv.detector import detect_items

@app.post("/verify")
async def verify(ticket_id: int, sample_hint: str = None):
    # Fetch order/ticket from your in-memory DB or SQLite
    ticket = get_ticket(ticket_id)
    if not ticket:
        return {"status": "error", "msg": "ticket not found"}

    # For demo, use a placeholder image
    # (You can replace with a real uploaded image in the future)
    img_path = "cv/sample.jpg"

    # Run detection (YOLO > SSD > Mock)
    detected = detect_items(img_path, sample_hint)

    expected = ticket["items"]

    missing = [i for i in expected if i not in detected]
    extra = [d for d in detected if d not in expected]

    if not missing and not extra:
        ticket["status"] = "verified"
        return {
            "status": "ok",
            "verified": True,
            "expected": expected,
            "detected": detected
        }

    ticket["status"] = "mismatch"
    ticket["issues"] = {"missing": missing, "extra": extra}

    return {
        "status": "mismatch",
        "verified": False,
        "expected": expected,
        "detected": detected,
        "missing": missing,
        "extra": extra
    }
