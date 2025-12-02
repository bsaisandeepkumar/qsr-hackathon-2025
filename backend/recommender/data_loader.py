# recommender/data_loader.py

import json
import os
from datetime import datetime
from typing import List, Dict, Any

MENU_FILE = os.path.join(os.path.dirname(__file__), "..", "menu", "menu.json")

def load_menu():
    with open(MENU_FILE, "r") as f:
        return json.load(f)

# Menu dataset
MENU = [
    {"id": "burger", "name": "Classic Burger", "price": 6.99, "tags": ["main", "hot"]},
    {"id": "cheese_burger", "name": "Cheese Burger", "price": 7.99, "tags": ["main", "hot"]},
    {"id": "fries", "name": "Fries", "price": 2.49, "tags": ["side"]},
    {"id": "cola", "name": "Soft Drink", "price": 1.99, "tags": ["drink"]},
    {"id": "salad", "name": "Green Salad", "price": 4.99, "tags": ["veg"]},
    {"id": "soup", "name": "Tomato Soup", "price": 3.49, "tags": ["hot"]}
]

# Mock real-time inventory
MOCK_INVENTORY = {
    "burger": True,
    "cheese_burger": True,
    "fries": True,
    "cola": True,
    "salad": True,
    "soup": True
}

def load_menu() -> List[Dict[str, Any]]:
    return MENU

def load_inventory() -> Dict[str, bool]:
    return MOCK_INVENTORY

def load_user_history(user_id: str) -> List[str]:
    """
    Mock order history. You can later replace with real SQLite queries.
    """
    mock_data = {
        "anonymous": ["burger", "fries"],
        "returning_user": ["cheese_burger", "cola"],
        "veg_user": ["salad", "soup"],
    }
    return mock_data.get(user_id, [])
