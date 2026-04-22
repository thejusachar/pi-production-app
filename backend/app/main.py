"""
Production Order Tracker - FastAPI Backend
A simple manufacturing production order management API.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from enum import Enum
import uuid
import os
from datetime import datetime

# ── App setup ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Production Order Tracker",
    description="Simple manufacturing production order management",
    version=os.getenv("APP_VERSION", "1.0.0"),
)

# Allow the React dev server (and production) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten this in real production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Data models ──────────────────────────────────────────────────────────────
class OrderStatus(str, Enum):
    PENDING    = "pending"
    IN_PROGRESS = "in_progress"
    DONE       = "done"

class OrderCreate(BaseModel):
    product_name: str
    quantity: int

class OrderUpdate(BaseModel):
    status: OrderStatus

class Order(BaseModel):
    id: str
    product_name: str
    quantity: int
    status: OrderStatus
    created_at: str

# ── In-memory "database" ─────────────────────────────────────────────────────
# NOTE: Data resets on container restart.
# In a real app you'd use PostgreSQL or SQLite here.
orders: List[Order] = [
    Order(
        id=str(uuid.uuid4()),
        product_name="Gear Assembly A",
        quantity=50,
        status=OrderStatus.DONE,
        created_at=datetime.utcnow().isoformat(),
    ),
    Order(
        id=str(uuid.uuid4()),
        product_name="Control Panel Unit",
        quantity=10,
        status=OrderStatus.IN_PROGRESS,
        created_at=datetime.utcnow().isoformat(),
    ),
    Order(
        id=str(uuid.uuid4()),
        product_name="Hydraulic Pump Cover",
        quantity=25,
        status=OrderStatus.PENDING,
        created_at=datetime.utcnow().isoformat(),
    ),
]

# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    """Health endpoint — used by Docker and CI to verify the service is up."""
    return {
        "status": "ok",
        "version": app.version,
        "service": "production-order-tracker",
    }

@app.get("/api/orders", response_model=List[Order])
def list_orders():
    """Return all production orders."""
    return orders

@app.post("/api/orders", response_model=Order, status_code=201)
def create_order(payload: OrderCreate):
    """Create a new production order."""
    order = Order(
        id=str(uuid.uuid4()),
        product_name=payload.product_name,
        quantity=payload.quantity,
        status=OrderStatus.PENDING,
        created_at=datetime.utcnow().isoformat(),
    )
    orders.append(order)
    return order

@app.patch("/api/orders/{order_id}", response_model=Order)
def update_order_status(order_id: str, payload: OrderUpdate):
    """Update the status of an existing order."""
    for order in orders:
        if order.id == order_id:
            order.status = payload.status
            return order
    raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

@app.delete("/api/orders/{order_id}", status_code=204)
def delete_order(order_id: str):
    """Delete a production order."""
    global orders
    original_len = len(orders)
    orders = [o for o in orders if o.id != order_id]
    if len(orders) == original_len:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
