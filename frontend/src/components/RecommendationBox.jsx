import React, { useState } from "react";

export default function RecommendationBox() {
  const [recs, setRecs] = useState([]);

  const getRecommendations = async () => {
    try {
      const res = await fetch("${config.API_BASE_URL}/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: "anonymous",
          profile: "returning"
        }),
      });
      const data = await res.json();
      setRecs(data.recommendations || []);
    } catch (err) {
      console.error("Failed to fetch recommendations", err);
    }
  };

  return (
    <div className="p-4 border rounded shadow mt-4">
      <button
        onClick={getRecommendations}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Get Recommendations
      </button>

      {recs.length > 0 && (
        <ul className="mt-3 space-y-2">
          {recs.map((r) => (
            <li key={r.id} className="border p-2 rounded">
              <strong>{r.name}</strong> — {r.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
