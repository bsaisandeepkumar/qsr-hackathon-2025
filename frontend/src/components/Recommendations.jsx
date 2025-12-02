import React, { useEffect, useState } from "react";
import config from "../config";

export default function Recommendations({ ticketId, user }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);

  const getRecommendations = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const res = await fetch(`${config.API_BASE_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: user.phone,
          profile: user.profile,
          ticketId: ticketId || null,
        }),
      });

      const data = await res.json();
      setRecs(data.recommendations || []);
    } catch (err) {
      console.error("Failed fetching recommendations", err);
    }

    setLoading(false);
  };

  // 🔥 Auto-load whenever user logs in or ticket changes
  useEffect(() => {
    getRecommendations();
  }, [user, ticketId, cart]);

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-medium mb-2">Recommended for you</h3>

      {loading && <p className="text-gray-500 text-sm">Loading recommendations...</p>}

      {!loading && recs.length === 0 && (
        <p className="text-gray-500 text-sm">No recommendations available</p>
      )}

      {recs.map((r, i) => (
        <div key={i} className="p-2 border rounded mb-2">
          <div className="font-semibold">{r.name}</div>
          <div className="text-sm text-gray-600">{r.reason}</div>
        </div>
      ))}
    </div>
  );
}
