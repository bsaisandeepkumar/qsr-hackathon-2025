# recommender/rules.py

from datetime import datetime
from typing import Dict, List, Any

def score_by_time(item: Dict[str, Any], hour: int) -> int:
    # breakfast: soup & salad isn't ideal
    if 7 <= hour <= 10 and "light" in item.get("tags", []):
        return 2
    if 11 <= hour <= 14 and "main" in item.get("tags", []):
        return 5
    if 18 <= hour <= 21 and "hot" in item.get("tags", []):
        return 3
    return 1

def score_by_profile(item: Dict[str, Any], profile: str) -> int:
    if profile == "veg" and "veg" in item.get("tags", []):
        return 7
    if profile == "new":
        return 2  # promote trending items for new users
    if profile == "returning":
        return 3
    return 1

def score_by_history(item: Dict[str, Any], history: List[str]) -> int:
    # if user repeatedly orders burgers → upsell variants
    if item["id"] in history:
        return 4
    if "burger" in history and item["id"] == "fries":
        return 6  # classic combo
    return 1

def score_by_inventory(item_id: str, inventory: Dict[str, bool]) -> int:
    return 5 if inventory.get(item_id, False) else -999  # hide unavailable items
