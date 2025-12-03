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
  <>
    {!user ? (
      <Login onLoginSuccess={onLoginSuccess} />
    ) : user.newUser ? (
      <Register phone={user.phone} onRegistered={onRegistered} />
    ) : (
      <div className="min-h-screen bg-gray-50 p-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            SmartServe ({user.name || user.phone})
          </h1>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              setUser(null);
            }}
            className="px-3 py-1 bg-red-500 text-white rounded"
          >
            Logout
          </button>
        </header>

        {view === "kiosk" && (
          <main className="grid grid-cols-3 gap-6">
            {/* LEFT COLUMN */}
            <div className="col-span-2">
              <Menu
                user={user}
                onTicketCreated={setCurrentTicket}
                onCartUpdated={setCart}
              />
            </div>

            {/* RIGHT COLUMN */}
            <div className="col-span-1 flex flex-col gap-6">
              <Recommendations
                ticketId={currentTicket?.id}
                user={user}
                cart={cart}
              />
              <CartPanel
                cart={cart}
                onCartUpdated={setCart}
                onOrderPlaced={setCurrentTicket}
              />
            </div>
          </main>
        )}

        {view === "kds" && <KDS ticketId={currentTicket?.id} />}
      </div>
    )}
  </>
);
}
