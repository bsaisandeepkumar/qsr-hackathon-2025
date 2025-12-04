import React, { useEffect, useState } from "react";
import config from "../config";

export default function KDS({ ticketId }) {
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState(null);

  // Mock scenario handler
  const runScenario = async (type) => {
    let mock;

    switch (type) {
      case "ok":
        mock = {
          ticketId,
          status: "verified",
          verification: { status: "ok" },
        };
        break;

      case "mismatch":
        mock = {
          ticketId,
          status: "mismatch",
          verification: { status: "mismatch", missing: ["fries"] },
        };
        break;

      default:
        mock = { ticketId, status: "unknown" };
    }

    setStatus(mock);
  };

  // Load ticket details
  useEffect(() => {
    if (!ticketId) return;
    fetchTicket(ticketId);
  }, [ticketId]);

  const fetchTicket = async (id) => {
    try {
      const res = await fetch(`${config.API_BASE_URL}/ticket/${id}`);
      const data = await res.json();
      setTicket(data.ticket);
    } catch (err) {
      console.error("Failed loading ticket", err);
    }
  };

  // Fetch status
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
            verification: { status: "mismatch", missing: ["fries"] },
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

  // If no ticket
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
{/* -------- ORDERED ITEMS -------- */}
{ticket?.items?.length > 0 && (
  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
    <h3 className="text-lg font-semibold mb-2">Ordered Items</h3>
    <ul className="list-disc ml-5 text-sm">
      {ticket.items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  </div>
)}

      {/* -------- AI CAMERA VERIFICATION -------- */}
      <h3 className="text-lg font-semibold mt-6 mb-3">
        AI Camera Verification
      </h3>

      <div className="grid grid-cols-4 gap-4">
        {/* -------- Station 1 -------- */}
        <div className="p-4 bg-gray-100 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Station 1</h2>

          <p className="text-sm">Ticket: {ticketId}</p>
          <p className="text-sm">Status: {status?.status || "loading"}</p>
          <p className="text-sm">
            Verification: {status?.verification?.status || "unknown"}
          </p>

          <img
            src="/camera-feed_1.jpg"
            alt="Station 1 Camera"
            className="w-full h-auto rounded-md mb-3"
          />

          <button
            onClick={() => runScenario("mismatch")}
            className="bg-red-500 text-white px-4 py-2 rounded-lg w-full"
          >
            Mismatch
          </button>
        </div>

        {/* -------- Station 2 -------- */}
        <div className="p-4 bg-gray-100 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Station 2</h2>

          <p className="text-sm">Ticket: {ticketId - 1}</p>
          <p className="text-sm">Status: Delivered</p>
          <p className="text-sm mb-3">Verification: Completed</p>

          <img
            src="/camera-feed_2.png"
            alt="Station 2 Camera"
            className="w-full h-auto rounded-md mb-3"
          />

          <button className="bg-green-500 text-white px-4 py-2 rounded-lg w-full">
            Match
          </button>
        </div>

        {/* -------- Station 3 -------- */}
        <div className="p-4 bg-gray-100 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Station 3</h2>

          <p className="text-sm">Ticket: {ticketId - 2}</p>
          <p className="text-sm">Status: Delivered</p>
          <p className="text-sm mb-3">Verification: Completed</p>

          <img
            src="/camera-feed_3.png"
            alt="Station 3 Camera"
            className="w-full h-auto rounded-md mb-3"
          />

          <button className="bg-green-500 text-white px-4 py-2 rounded-lg w-full">
            Match
          </button>
        </div>

        {/* -------- Station 4 -------- */}
        <div className="p-4 bg-gray-100 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Station 4</h2>

          <p className="text-sm">Ticket: {ticketId - 3}</p>
          <p className="text-sm">Status: Delivered</p>
          <p className="text-sm mb-3">Verification: Completed</p>

          <img
            src="/camera-feed_4.png"
            alt="Station 4 Camera"
            className="w-full h-auto rounded-md mb-3"
          />

          <button className="bg-green-500 text-white px-4 py-2 rounded-lg w-full">
            Match
          </button>
        </div>
      </div>
    </div>
  );
}
