# recommender/vector_recommender.py
from logging_config.logger import get_logger
reclog = get_logger("recommender")

from typing import List, Dict, Any
from .vector_index import build_index, search_similar_by_text
from .data_loader import load_menu

# ensure index built at import
build_index()

def get_recommendations_vector(
    user: str = "anonymous",
    profile: str = "returning",
    timestamp: str | None = None,
    context_ticket_items: List[str] | None = None,
    top_k: int = 3
) -> List[Dict[str, Any]]:
    """
    Build a query text from context and user profile, then do semantic nearest neighbor search
    over menu items, returning top_k ranked items.
    """

    menu = load_menu()
    # Build a short query: combine history/profile/context -> natural language string
    parts = []
    parts.append(f"profile: {profile}")
    if context_ticket_items:
        parts.append("contains: " + " ".join(context_ticket_items))
    if timestamp:
        parts.append(f"time: {timestamp}")
    query_text = " | ".join(parts) if parts else "recommended items"

    # search
    results = search_similar_by_text(query_text, top_k=top_k)

    # attach simple reason heuristic
    out = []
    for r in results:
        reason = "Matches your context"
        if context_ticket_items and any(ci in r.get("tags", []) or ci == r["id"] for ci in context_ticket_items):
            reason = "Complements your order"
        out.append({"id": r["id"], "name": r["name"], "reason": reason})
    return out
