# backend/main.py
import os
import json
import sqlite3
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# logging config (assumes you have logging_config/logger.py)
from logging_config.logger import init_logging, get_logger, CorrelationIdMiddleware

# recommender and cv modules (assumed present)
from recommender.vector_recommender import get_recommendations_vector
from cv.detector import detect_items

# db helper
from db import init_db, get_conn, DB_FILE

# init logging and DB
init_logging()
log = get_logger("backend")
init_db()

app = FastAPI(title="SmartServe Backend (Hackathon Demo)")
app.add_middleware(CorrelationIdMiddleware)

# cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Pydantic models
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

class LoginRequest(BaseModel):
    phone: str

class RegisterRequest(BaseModel):
    phone: str
    name: Optional[str] = None

# ---------------------------
# Helpers (tickets)
# ---------------------------
def insert_ticket(profile: str, items: List[str]) -> Dict[str, Any]:
    conn = get_conn()
    cur = conn.cursor()
    created_at = datetime.utcnow().isoformat()
    cur.execute( "INSERT INTO users (phone, name, profile) VALUES (?, ?, ?)",
    (phone, name, "in_store"),)
    ticket_id = cur.lastrowid
    conn.commit()
    conn.close()
    return {"id": ticket_id, "created_at": created_at, "profile": profile, "items": items, "status": "created"}

def get_ticket(ticket_id: int) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, created_at, profile, items, status FROM tickets WHERE id = ?", (ticket_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {"id": row[0], "created_at": row[1], "profile": row[2], "items": json.loads(row[3]), "status": row[4]}

def set_ticket_status(ticket_id: int, status: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE tickets SET status = ? WHERE id = ?", (status, ticket_id))
    conn.commit()
    conn.close()

# ---------------------------
# Endpoints
# ---------------------------

@app.get("/menu")
async def get_menu(request: Request):
    # MENU is expected to be defined elsewhere or load from file; simple inline menu kept
    MENU = [
       # BURGERS
  { id: "classic_burger", name: "Classic Burger", price: 6.99, tags: ["burger", "beef"] },
  { id: "cheese_burger", name: "Cheese Burger", price: 7.49, tags: ["burger", "beef"] },
  { id: "double_burger", name: "Double Burger", price: 8.99, tags: ["burger", "beef"] },
  { id: "veggie_burger", name: "Veggie Burger", price: 6.49, tags: ["burger", "veg"] },
  { id: "spicy_chicken_burger", name: "Spicy Chicken Burger", price: 7.99, tags: ["burger", "chicken", "spicy"] },

 # SIDES
  { id: "fries_small", name: "Small Fries", price: 2.49, tags: ["side"] },
  { id: "fries_large", name: "Large Fries", price: 3.49, tags: ["side"] },
  { id: "curly_fries", name: "Curly Fries", price: 3.99, tags: ["side"] },
  { id: "onion_rings", name: "Onion Rings", price: 3.99, tags: ["side"] },
  { id: "side_salad", name: "Side Salad", price: 3.49, tags: ["veg", "healthy", "side"] },

 # DRINKS
  { id: "cola_small", name: "Cola (Small)", price: 1.49, tags: ["drink"] },
  { id: "cola_large", name: "Cola (Large)", price: 2.49, tags: ["drink"] },
  { id: "orange_soda", name: "Orange Soda", price: 2.49, tags: ["drink"] },
  { id: "lemonade", name: "Fresh Lemonade", price: 2.99, tags: ["drink"] },
  { id: "iced_tea", name: "Iced Tea", price: 2.49, tags: ["drink", "healthy"] },
  { id: "coffee", name: "Coffee", price: 1.99, tags: ["drink", "hot"] },
  { id: "milkshake_chocolate", name: "Chocolate Milkshake", price: 3.99, tags: ["drink", "dessert"] },
  { id: "milkshake_strawberry", name: "Strawberry Milkshake", price: 3.99, tags: ["drink", "dessert"] },

 # CHICKEN ITEMS
  { id: "chicken_nuggets_6", name: "Chicken Nuggets (6 pc)", price: 4.99, tags: ["chicken"] },
  { id: "chicken_nuggets_12", name: "Chicken Nuggets (12 pc)", price: 7.99, tags: ["chicken"] },
  { id: "crispy_chicken_strips", name: "Crispy Chicken Strips", price: 6.99, tags: ["chicken"] },

 # HEALTHY ITEMS
  { id: "greek_salad", name: "Greek Salad", price: 6.49, tags: ["veg", "healthy"] },
  { id: "chicken_salad", name: "Chicken Salad", price: 7.49, tags: ["healthy", "chicken"] },
  { id: "veggie_wrap", name: "Veggie Wrap", price: 5.99, tags: ["veg", "healthy"] },
  { id: "chicken_wrap", name: "Chicken Wrap", price: 6.99, tags: ["healthy", "chicken"] },

 # KIDS MENU
  { id: "kids_burger", name: "Kids Burger Meal", price: 4.99, tags: ["kids"] },
  { id: "kids_nuggets", name: "Kids Nuggets Meal", price: 4.99, tags: ["kids"] },
  { id: "apple_slices", name: "Apple Slices", price: 1.29, tags: ["kids", "healthy"] },
  { id: "juice_box", name: "Juice Box", price: 1.29, tags: ["kids", "drink"] },

 # DESSERTS
  { id: "ice_cream", name: "Soft Serve Ice Cream", price: 1.99, tags: ["dessert"] },
  { id: "brownie", name: "Chocolate Brownie", price: 2.99, tags: ["dessert"] }
    ]
    log.info("Menu requested", extra={"correlation_id": request.state.correlation_id})
    return MENU

# ---------------------------
# Auth: Login & Register
# ---------------------------

@app.post("/auth/login")
async def auth_login(req: LoginRequest, request: Request):
    phone = req.phone.strip()
    log.info(f"Login attempt for phone={phone}", extra={"correlation_id": request.state.correlation_id})
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, phone, name, profile FROM users WHERE phone = ?", (phone,))
    row = cur.fetchone()
    conn.close()
    if row:
        user = {"id": row[0], "phone": row[1], "name": row[2], "profile": row[3]}
        log.info(f"Login success for phone={phone}", extra={"correlation_id": request.state.correlation_id})
        return {"exists": True, "user": user}
    else:
        log.info(f"Login not found phone={phone}", extra={"correlation_id": request.state.correlation_id})
        return {"exists": False}

@app.post("/auth/register")
async def auth_register(req: RegisterRequest, request: Request):
    phone = req.phone.strip()
    name = req.name or None
    profile = "in_store"   # default profile for all new accounts

    log.info(f"Register request phone={phone} profile={profile}", extra={"correlation_id": request.state.correlation_id})

    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO users (phone, name, profile) VALUES (?, ?, ?)", (phone, name, profile))
        conn.commit()
        conn.close()
        log.info(f"Registered user phone={phone}", extra={"correlation_id": request.state.correlation_id})
        return {"status": "created", "phone": phone, "profile": "in_store"}
    except sqlite3.IntegrityError:
        conn.close()
        log.warning(f"Register attempt for existing phone={phone}", extra={"correlation_id": request.state.correlation_id})
        return {"status": "exists", "phone": phone}
    except Exception as e:
        conn.close()
        log.error(f"Register failed phone={phone} error={e}", extra={"correlation_id": request.state.correlation_id})
        raise HTTPException(status_code=500, detail="Registration failed")

# ---------------------------
# Recommendation (uses DB profile)
# ---------------------------

@app.post("/recommend")
async def recommend(req: RecommendRequest, request: Request):
    log.info(f"Recommend called user={req.user} ticketId={req.ticketId}", extra={"correlation_id": request.state.correlation_id})

    # Load stored profile from DB (if user provided)
    stored_profile = None
    if req.user:
        try:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT profile FROM users WHERE phone = ?", (req.user,))
            row = cur.fetchone()
            conn.close()
            if row:
                stored_profile = row[0]
                log.info(f"Loaded stored profile for user={req.user}: {stored_profile}", extra={"correlation_id": request.state.correlation_id})
        except Exception as e:
            log.error(f"DB lookup failed for user={req.user}: {e}", extra={"correlation_id": request.state.correlation_id})

    effective_profile = stored_profile if stored_profile else req.profile

    context_items = []
    if req.ticketId:
        ticket = get_ticket(req.ticketId)
        if ticket:
            context_items = ticket["items"]

    recs = get_recommendations_vector(
        user=req.user,
        profile=effective_profile,
        timestamp=req.time,
        context_ticket_items=context_items,
        top_k=3
    )

    log.info(f"Final recommendations (profile={effective_profile}) -> {recs}", extra={"correlation_id": request.state.correlation_id})

    return {"recommendations": recs}

# ---------------------------
# Order & KDS & Verify (existing code)
# ---------------------------

@app.post("/order")
async def create_order(req: OrderRequest, request: Request):
    log.info(f"Create order: profile={req.profile} items={req.items}", extra={"correlation_id": request.state.correlation_id})
    if not req.items:
        raise HTTPException(status_code=400, detail="No items provided")
    ticket = insert_ticket(req.profile, req.items)
    set_ticket_status(ticket["id"], "in_kitchen")
    log.info(f"Order created ticket_id={ticket['id']}", extra={"correlation_id": request.state.correlation_id})
    return {"id": ticket["id"], "status": "in_kitchen", "items": ticket["items"]}

@app.get("/kds/{ticket_id}")
async def kds_status(ticket_id: int, request: Request):
    log.info(f"KDS status check ticket_id={ticket_id}", extra={"correlation_id": request.state.correlation_id})
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
    log.info(f"KDS returning ticket={ticket} verification={verification}", extra={"correlation_id": request.state.correlation_id})
    return {"ticketId": ticket_id, "status": ticket["status"], "verification": verification}

@app.post("/verify")
async def verify(ticket_id: int, sample_hint: str = None, request: Request = None):
    log.info(f"Verify called ticket_id={ticket_id} hint={sample_hint}", extra={"correlation_id": request.state.correlation_id if request else None})
    ticket = get_ticket(ticket_id)
    if not ticket:
        log.warning("Ticket not found", extra={"correlation_id": request.state.correlation_id if request else None})
        return {"status": "error", "msg": "ticket not found"}
    img_path = "cv/sample.jpg"
    detected = detect_items(img_path, sample_hint)
    expected = ticket["items"]
    missing = [i for i in expected if i not in detected]
    extra_items = [d for d in detected if d not in expected]
    if not missing and not extra_items:
        set_ticket_status(ticket_id, "verified")
        log.info(f"Verification success for ticket {ticket_id}", extra={"correlation_id": request.state.correlation_id if request else None})
        result = {"status": "ok", "verified": True, "expected": expected, "detected": detected}
    else:
        set_ticket_status(ticket_id, "mismatch")
        log.warning(f"Verification mismatch ticket={ticket_id} missing={missing} extra={extra_items}", extra={"correlation_id": request.state.correlation_id if request else None})
        result = {"status": "mismatch", "verified": False, "expected": expected, "detected": detected, "missing": missing, "extra": extra_items}
    # write file so kds can read
    with open(f"verification_{ticket_id}.json", "w") as f:
        json.dump(result, f)
    return result
