// frontend/src/components/Login.jsx
import React, { useState } from "react";
import config from "../config";

export default function Login({ onLoginSuccess }) {
  const [phone, setPhone] = useState("");

  const handleLogin = async () => {
    if (!phone) {
      alert("Enter phone number");
      return;
    }
    try {
      const res = await fetch(`${config.API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.exists) {
        // store user in localStorage for session persistence
        localStorage.setItem("user", JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        // new user flow: notify caller that registration needed
        onLoginSuccess({ phone, newUser: true });
      }
    } catch (err) {
      console.error("Login request failed", err);
      alert("Login error");
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white shadow rounded">
      <h2 className="text-xl mb-4 font-semibold">Login</h2>
      <input
        className="border p-2 w-full mb-4"
        placeholder="Phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <button onClick={handleLogin} className="bg-blue-600 text-white w-full py-2 rounded">
        Continue
      </button>
    </div>
  );
}
