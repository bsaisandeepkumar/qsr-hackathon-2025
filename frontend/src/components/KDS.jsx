import React, { useEffect, useState } from 'react'
import config from "../config";   // ⬅️ REQUIRED

export default function KDS({ ticketId }) {
  const [status, setStatus] = useState(null);

  // --------------------------------------------------
  // ADD THIS FUNCTION — Fixes "runScenario is not defined"
  // --------------------------------------------------
  const runScenario = async (type) => {
    let mock;

    switch (type) {
      case "ok":
        mock = {
          ticketId,
          status: "verified",
          verification: { status: "ok" }
        };
        break;

      case "mismatch":
        mock = {
          ticketId,
          status: "mismatch",
          verification: { status: "mismatch", missing: ["fries"] }
        };
        break;

      default:
        mock = { ticketId, status: "unknown" };
    }

    setStatus(mock);
  };
  // --------------------------------------------------


  useEffect(() => {
    if (!ticketId) return;
    let mounted = true;

    async function fetchStatus() {
      try {
        const res = await fetch(`${config.API_BASE_URL}/kds/${ticketId}`);
        const data = await res.json();
        if (mounted) setStatus(data);
      } catch (e) {
        if (mounted)
          setStatus({
            ticketId,
            status: "pending",
            verification: { status: "mismatch", missing: ["fries"] }
          });
      }
    }

    fetchStatus();
    const timer = setInterval(fetchStatus, 3000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [ticketId]);


  // No ticket yet
  if (!ticketId) {
    return (
      <div className="p-6 bg-white shadow rounded">
        <h2 className="text-xl font-bold mb-3">Kitchen Display System</h2>
        <p className="text-gray-600">No orders yet. Waiting...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-medium mb-3">KDS — Ticket {ticketId}</h2>

      <div className="mb-4">
        <div><strong>Status:</strong> {status?.status || "loading"}</div>
        <div><strong>Verification:</strong> {status?.verification?.status || "unknown"}
        </div>

{/* --- AI CAMERA VERIFICATION --- */}
<h3 className="text-lg font-semibold mt-6 mb-3">AI Camera Verification</h3>

<div className="grid grid-cols-4 gap-4">
  {/* Camera 1 */}
  <div className="bg-white p-3 rounded-lg shadow border">
    <p className="text-sm font-semibold mb-2 text-gray-700">Station 1</p>
    <div className="w-full aspect-square rounded-lg overflow-hidden bg-black">
      <img
        src="/camera-feed.gif"
        alt="Camera 1"
        className="w-full h-full object-cover"
      />
    </div>
  </div>

  {/* Camera 2 */}
  <div className="bg-white p-3 rounded-lg shadow border">
    <p className="text-sm font-semibold mb-2 text-gray-700">Station 2</p>
    <div className="w-full aspect-square rounded-lg overflow-hidden bg-black">
      <img
        src="/camera-feed.gif"
        alt="Camera 2"
        className="w-full h-full object-cover"
      />
    </div>
  </div>

  {/* Camera 3 */}
  <div className="bg-white p-3 rounded-lg shadow border">
    <p className="text-sm font-semibold mb-2 text-gray-700">Station 3</p>
    <div className="w-full aspect-square rounded-lg overflow-hidden bg-black">
      <img
        src="/camera-feed.gif"
        alt="Camera 3"
        className="w-full h-full object-cover"
      />
    </div>
  </div>

  {/* Camera 4 */}
  <div className="bg-white p-3 rounded-lg shadow border">
    <p className="text-sm font-semibold mb-2 text-gray-700">Station 4</p>
    <div className="w-full aspect-square rounded-lg overflow-hidden bg-black">
      <img
        src="/camera-feed.gif"
        alt="Camera 4"
        className="w-full h-full object-cover"
      />
    </div>
  </div>
</div>

        {/* Scenario Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => runScenario("ok")} className="bg-green-600 text-white py-2 rounded">
            ✔ Items Match
          </button>

          <button onClick={() => runScenario("mismatch")} className="bg-yellow-500 text-white py-2 rounded">
            ⚠ Mismatch
          </button>
        </div>
      </div>

      {/* Mismatch UI */}
      {status?.verification?.status === "mismatch" && (
        <div className="p-4 bg-red-100 border-l-4 border-red-500">
          <strong>Mismatch detected:</strong>
          <div>Missing: {status.verification.missing.join(", ")}</div>
        </div>
      )}

      {/* Verified UI */}
      {status?.verification?.status === "ok" && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500">
          <strong>All items verified. Ready to hand off.</strong>
        </div>
      )}
    </div>
  );
}
