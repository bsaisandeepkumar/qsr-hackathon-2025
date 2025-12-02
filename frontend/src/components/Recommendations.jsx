import React, { useState } from "react";

export default function Recommendations({ ticketId }) {
  const [recs, setRecs] = useState([]);

  const getRecommendations = async () => {
    try {
      const res = await fetch(`${config.API_BASE_URL}/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: "anonymous",
          profile: "returning",
          ticketId: ticketId || null,
        }),
      });

      const data = await res.json();
      setRecs(data.recommendations || []);
    } catch (err) {
      console.error("Failed fetching recommendations", err);
    }
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-lg font-semibold mb-3">Suggestions</h2>

      {/* Add the missing button here */}
      <button
        onClick={getRecommendations}
        className="mb-4 px-3 py-2 bg-blue-600 text-white rounded w-full"
      >
        Get Recommendations
      </button>

      {/* Render results */}
      {recs.length > 0 ? (
        <ul className="space-y-2">
          {recs.map((r, idx) => (
            <li key={idx} className="border p-2 rounded">
              <strong>{r.name}</strong> — {r.reason}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No recommendations yet.</p>
      )}
    </div>
  );
}
