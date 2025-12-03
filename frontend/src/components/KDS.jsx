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
    <div><strong>Verification:</strong> {status?.verification?.status || "unknown"}</div>
  </div>

  {/* --- AI CAMERA VERIFICATION --- */}
  <h3 className="text-lg font-semibold mt-6 mb-3">AI Camera Verification</h3>

  <div className="grid grid-cols-4 gap-4">

    {/* -------- Station 1 -------- */}
<div className="p-4 bg-gray-100 rounded-lg shadow-md">
  <h2 className="text-xl font-semibold mb-2">AI Camera Verification – Station 1</h2>

  <p className="text-sm">Ticket:</p>
  <p className="text-sm">Status: in_kitchen</p>
  <p className="text-sm mb-3">Verification: pending</p>

  <img
    src="/station1.png"
    alt="Station 1 Camera"
    className="w-full h-auto rounded-md mb-3"
  />

  {/* Station-specific button */}
  <button className="bg-red-500 text-white px-4 py-2 rounded-lg w-full">
    Mismatch
  </button>
</div>

   {/* -------- Station 2 -------- */}
<div className="p-4 bg-gray-100 rounded-lg shadow-md">
  <h2 className="text-xl font-semibold mb-2">AI Camera Verification – Station 2</h2>

  <p className="text-sm">Ticket:</p>
  <p className="text-sm">Status: in_kitchen</p>
  <p className="text-sm mb-3">Verification: pending</p>

  <img
    src="/station2.png"
    alt="Station 2 Camera"
    className="w-full h-auto rounded-md mb-3"
  />

  {/* Station-specific button */}
  <button className="bg-green-500 text-white px-4 py-2 rounded-lg w-full">
    Match
  </button>
</div>
{/* -------- Station 3 -------- */}
<div className="p-4 bg-gray-100 rounded-lg shadow-md">
  <h2 className="text-xl font-semibold mb-2">AI Camera Verification – Station 3</h2>

  <p className="text-sm">Ticket:</p>
  <p className="text-sm">Status: in_kitchen</p>
  <p className="text-sm mb-3">Verification: pending</p>

  <img
    src="/station3.png"
    alt="Station 3 Camera"
    className="w-full h-auto rounded-md mb-3"
  />

  {/* Station-specific button */}
  <button className="bg-green-500 text-white px-4 py-2 rounded-lg w-full">
    Match
  </button>
</div>

  {/* -------- Station 4 -------- */}
<div className="p-4 bg-gray-100 rounded-lg shadow-md">
  <h2 className="text-xl font-semibold mb-2">AI Camera Verification – Station 4</h2>

  <p className="text-sm">Ticket:</p>
  <p className="text-sm">Status: in_kitchen</p>
  <p className="text-sm mb-3">Verification: pending</p>

  <img
    src="/station4.png"
    alt="Station 4 Camera"
    className="w-full h-auto rounded-md mb-3"
  />

  {/* Station-specific button */}
  <button className="bg-green-500 text-white px-4 py-2 rounded-lg w-full">
    Match
  </button>
</div>

  </div>
</div>
    )
}
