import React, { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Menu from "./components/Menu";
import Recommendations from "./components/Recommendations";
import KDS from "./components/KDS";

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Login onLoginSuccess={setUser} />;
  }

  if (user.newUser) {
    return <Register phone={user.phone} onRegistered={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          SmartServe — Welcome {user.phone}
        </h1>
      </header>

      <main className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Menu user={user} />
        </div>

        <Recommendations user={user} />
      </main>
    </div>
  );
}
