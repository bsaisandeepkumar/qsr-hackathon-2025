// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Menu from "./components/Menu";
import Recommendations from "./components/Recommendations";
import KDS from "./components/KDS";
import CartPanel from "./components/CartPanel";

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("kiosk");
  const [currentTicket, setCurrentTicket] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const onLoginSuccess = (payload) => {
    if (payload.newUser) {
      setUser({ phone: payload.phone, newUser: true });
    } else {
      setUser(payload);
    }
  };

  const onRegistered = (userObj) => {
    setUser(userObj);
  };

 return (
  <div className="min-h-screen bg-gray-50 p-6">

    {/* Always visible header */}
    <header className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-semibold">
        SmartServe Demo
        {user && user.name ? ` — Welcome ${user.name}` : ""}
      </h1>

      {/* Buttons visible even if not logged in */}
      <div className="flex gap-3">
        <button
          onClick={() => setView("kiosk")}
          className={`px-3 py-1 rounded ${view === "kiosk" ? "bg-blue-600 text-white" : "bg-white border"}`}
        >
          Kiosk
        </button>

        <button
          onClick={() => setView("kds")}
          className={`px-3 py-1 rounded ${view === "kds" ? "bg-blue-600 text-white" : "bg-white border"}`}
        >
          KDS
        </button>

        {user && (
          <button
            onClick={() => {
              localStorage.removeItem("user");
              setUser(null);
            }}
            className="px-3 py-1 bg-red-500 text-white rounded"
          >
            Logout
          </button>
        )}
      </div>
    </header>

    {/* Main content */}
    {view === "kiosk" && (
      !user ? (
        <Login onLoginSuccess={onLoginSuccess} />
      ) : user.newUser ? (
        <Register phone={user.phone} onRegistered={onRegistered} />
      ) : (
        <main className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <Menu
              onTicketCreated={(t) => setCurrentTicket(t)}
              onCartUpdated={(c) => setCart(c)}
            />
          </div>

<div className="flex flex-col gap-4">
  <Recommendations
    ticketId={currentTicket?.id}
    user={JSON.parse(localStorage.getItem("user") || "null")}
    cart={cart}
  />
  <CartPanel
    cart={cart}
    onPlaceOrder={() => console.log("PLACE ORDER FROM PANEL")}
  />
</div>
        </main>
      )
    )}

    {view === "kds" && (
      <KDS ticketId={currentTicket?.id} />
    )}

  </div>
);
}
