# recommender/vector_recommender.py

from logging_config.logger import get_logger
reclog = get_logger("recommender")

import time
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
    Vector-based semantic recommendation using FAISS or fallback.
    """

    start_time = time.time()

    try:
        # ------------------------------
        # Log input context
        # ------------------------------
        reclog.info(
            "Recommender invoked",
            extra={
                "user": user,
                "profile": profile,
                "timestamp": timestamp,
                "context_items": context_ticket_items,
                "top_k": top_k
            }
        )

        menu = load_menu()

        # ------------------------------
        # Build natural language query
        # ------------------------------
        parts = [f"profile: {profile}"]

        if context_ticket_items:
            parts.append("contains: " + " ".join(context_ticket_items))

        if timestamp:
            parts.append(f"time: {timestamp}")

        query_text = " | ".join(parts) if parts else "recommended items"

        reclog.info("Constructed query", extra={"query_text": query_text})

        # ------------------------------
        # Vector search
        # ------------------------------
        results = search_similar_by_text(query_text, top_k=top_k)

        reclog.info(
            "Vector search complete",
            extra={"returned_ids": [r["id"] for r in results]}
        )

        # ------------------------------
        # Build response with explanation
        # ------------------------------
        out = []
        for r in results:
            reason = "Matches your context"
            if (
                context_ticket_items
                and any(
                    ci in r.get("tags", [])
                    or ci == r["id"]
                    for ci in context_ticket_items
                )
            ):
                reason = "Complements your order"

            out.append({
                "id": r["id"],
                "name": r["name"],
                "reason": reason
            })

        # ------------------------------
        # Final timing + output log
        # ------------------------------
        latency_ms = round((time.time() - start_time) * 1000, 2)
        reclog.info(
            "Recommendation generation complete",
            extra={
                "latency_ms": latency_ms,
                "count": len(out),
                "result_ids": [o["id"] for o in out]
            }
        )

        return out

    except Exception as e:
        reclog.exception("Recommender failed", extra={"error": str(e)})
        return []
