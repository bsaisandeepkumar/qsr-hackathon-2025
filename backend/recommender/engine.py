# recommender/engine.py

from typing import List, Dict, Any
from datetime import datetime

from .data_loader import load_menu, load_inventory, load_user_history
from .rules import score_by_time, score_by_profile, score_by_history, score_by_inventory


def get_recommendations(
    user: str = "anonymous",
    profile: str = "returning",
    timestamp: str | None = None,
    context_ticket_items: List[str] | None = None
) -> List[Dict[str, Any]]:

    menu = load_menu()
    inventory = load_inventory()
    history = load_user_history(user)

    # Determine time-of-day
    if timestamp:
        try:
            hour = datetime.fromisoformat(timestamp).hour
        except:
            hour = datetime.now().hour
    else:
        hour = datetime.now().hour

    scored_items = []

    for item in menu:
        base_score = 0
        base_score += score_by_time(item, hour)
        base_score += score_by_profile(item, profile)
        base_score += score_by_history(item, history)
        base_score += score_by_inventory(item["id"], inventory)

        # Upsell logic for the active ticket
        if context_ticket_items:
            if "burger" in context_ticket_items and item["id"] == "fries":
                base_score += 8
            if "salad" in context_ticket_items and item["id"] == "soup":
                base_score += 5

        scored_items.append((item, base_score))

    # Sort by descending score
    sorted_items = sorted(scored_items, key=lambda x: x[1], reverse=True)

    # Convert to final output (top 3 items)
    recommendations = [
        {
            "id": item["id"],
            "name": item["name"],
            "reason": "Recommended based on context"
        }
        for item, score in sorted_items[:3]
    ]

    return recommendations
