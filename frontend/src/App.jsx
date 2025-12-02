// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Menu from "./components/Menu";
import Recommendations from "./components/Recommendations";
import KDS from "./components/KDS";

export default function App() {
  const [user, setUser] = useState(null); // {phone, profile, name}
  const [view, setView] = useState("kiosk");
  const [currentTicket, setCurrentTicket] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  // login result handler
  const onLoginSuccess = (payload) => {
    // payload may be {phone, newUser:true} or full user object
    if (payload.newUser) {
      setUser({ phone: payload.phone, newUser: true });
    } else {
      setUser(payload);
    }
  };

  const onRegistered = (userObj) => {
    setUser(userObj);
  };

  // menu's onTicketCreated should now be (ticket, profile)
  return (
    <>
      {!user ? (
        <Login onLoginSuccess={onLoginSuccess} />
      ) : user.newUser ? (
        <Register phone={user.phone} onRegistered={onRegistered} />
      ) : (
        <div className="min-h-screen bg-gray-50 p-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">SmartServe ({user.phone})</h1>
            <div>
              <button onClick={() => { localStorage.removeItem("user"); setUser(null); }} className="px-3 py-1 bg-red-500 text-white rounded">Logout</button>
            </div>
          </header>

          {view === "kiosk" && (
            <main className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <Menu 
  onTicketCreated={(t) => setCurrentTicket(t)}
  onCartUpdated={(c) => setCart(c)}
/>
              </div>
              <div>
<Recommendations 
  ticketId={currentTicket?.id}
  user={JSON.parse(localStorage.getItem("user") || "null")}
  cart={cart}
/>
    </div>
            </main>
          )}

          {view === "kds" && (
            <KDS ticketId={currentTicket?.id} />
          )}
        </div>
      )}
    </>
  );
}
