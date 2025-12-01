# main.py

from logging_config.logger import init_logging, get_logger, CorrelationIdMiddleware

# Initialize logging
init_logging()
log = get_logger("backend")

import os
import asyncio
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import json

# Optional YOLO import
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
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
    {"id": "soup", "name": "Tomato Soup", "price": 3.49, "tags": ["hot","starter"]},
]

# ---------------------------
# DB Initialization
# ---------------------------

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

# ---------------------------
# FastAPI app initialization
# ---------------------------

app = FastAPI(title="SmartServe Backend (Hackathon Demo)")

# Add Correlation ID middleware
app.add_middleware(CorrelationIdMiddleware)

# Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Pydantic Models
# ---------------------------

class RecommendRequest(BaseModel):
    user: Optional[str] = "anonymous"
    time: Optional[str] = None
    ticketId: Optional[int] = None
    profile: Optional[str] = "returning"

class OrderRequest(BaseModel):
    profile: str
    items: List[str]
    timestamp: Optional[int] = None

# ---------------------------
# DB Helpers
# ---------------------------

def insert_ticket(profile: str, items: List[str]) -> Dict[str, Any]:
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    created_at = datetime.utcnow().isoformat()
    cur.execute(
        "INSERT INTO tickets (created_at, profile, items, status) VALUES (?, ?, ?, ?)",
        (created_at, profile, json.dumps(items), "created")
    )
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
    return {
        "id": row[0],
        "created_at": row[1],
        "profile": row[2],
        "items": json.loads(row[3]),
        "status": row[4]
    }

def set_ticket_status(ticket_id: int, status: str):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("UPDATE tickets SET status = ? WHERE id = ?", (status, ticket_id))
    conn.commit()
    conn.close()

# ---------------------------
# Endpoints
# ---------------------------

@app.get("/menu")
async def get_menu(request: Request):
    log.info("Menu requested", extra={"correlation_id": request.state.correlation_id})
    return MENU

# ---- Recommender ----
from recommender.vector_recommender import get_recommendations_vector

@app.post("/recommend")
async def recommend(req: RecommendRequest, request: Request):
    log.info(
        f"Recommend called user={req.user} profile={req.profile} ticketId={req.ticketId}",
        extra={"correlation_id": request.state.correlation_id},
    )

    context_items = []
    if req.ticketId:
        ticket = get_ticket(req.ticketId)
        if ticket:
            context_items = ticket["items"]

    recs = get_recommendations_vector(
        user=req.user,
        profile=req.profile,
        timestamp=req.time,
        context_ticket_items=context_items,
        top_k=3
    )

    log.info(
        f"Recommendation result={recs}",
        extra={"correlation_id": request.state.correlation_id},
    )

    return {"recommendations": recs}

# ---- Order ----
@app.post("/order")
async def create_order(req: OrderRequest, request: Request):
    log.info(
        f"Create order: profile={req.profile} items={req.items}",
        extra={"correlation_id": request.state.correlation_id},
    )

    if not req.items:
        raise HTTPException(status_code=400, detail="No items provided")

    ticket = insert_ticket(req.profile, req.items)
    set_ticket_status(ticket["id"], "in_kitchen")

    log.info(
        f"Order created ticket_id={ticket['id']}",
        extra={"correlation_id": request.state.correlation_id},
    )

    return {"id": ticket["id"], "status": "in_kitchen", "items": ticket["items"]}

# ---- KDS ----
@app.get("/kds/{ticket_id}")
async def kds_status(ticket_id: int, request: Request):
    log.info(
        f"KDS status check ticket_id={ticket_id}",
        extra={"correlation_id": request.state.correlation_id},
    )

    ticket = get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    vfile = f"verification_{ticket_id}.json"
    verification = None

    if os.path.exists(vfile):
        with open(vfile, "r") as f:
            verification = json.load(f)
    else:
        verification = {"status": "pending", "missing": []}

    log.info(
        f"KDS returning ticket={ticket} verification={verification}",
        extra={"correlation_id": request.state.correlation_id},
    )

    return {"ticketId": ticket_id, "status": ticket["status"], "verification": verification}

# ---- CV Verification ----
from cv.detector import detect_items

@app.post("/verify")
async def verify(ticket_id: int, sample_hint: str = None, request: Request):
    log.info(
        f"Verify called ticket_id={ticket_id} hint={sample_hint}",
        extra={"correlation_id": request.state.correlation_id},
    )

    ticket = get_ticket(ticket_id)
    if not ticket:
        log.warning("Ticket not found", extra={"correlation_id": request.state.correlation_id})
        return {"status": "error", "msg": "ticket not found"}

    img_path = "cv/sample.jpg"
    detected = detect_items(img_path, sample_hint)
    expected = ticket["items"]

    log.info(
        f"CV detected={detected} expected={expected}",
        extra={"correlation_id": request.state.correlation_id},
    )

    missing = [i for i in expected if i not in detected]
    extra_items = [d for d in detected if d not in expected]

    if not missing and not extra_items:
        set_ticket_status(ticket_id, "verified")
        log.info(
            f"Verification success for ticket {ticket_id}",
            extra={"correlation_id": request.state.correlation_id},
        )
        return {"status": "ok", "verified": True, "expected": expected, "detected": detected}

    set_ticket_status(ticket_id, "mismatch")

    log.warning(
        f"Verification mismatch ticket={ticket_id} missing={missing} extra={extra_items}",
        extra={"correlation_id": request.state.correlation_id},
    )

    return {
        "status": "mismatch",
        "verified": False,
        "expected": expected,
        "detected": detected,
        "missing": missing,
        "extra": extra_items,
    }
