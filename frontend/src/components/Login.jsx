import React, { useState } from "react";
import config from "../config";

export default function Login({ onLoginSuccess }) {
  const [phone, setPhone] = useState("");

  const handleLogin = async () => {
    const res = await fetch(`${config.API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();

    if (data.exists) {
      onLoginSuccess({ phone: data.phone, profile: data.profile });
    } else {
      onLoginSuccess({ phone, newUser: true });
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white shadow rounded">
      <h2 className="text-xl mb-4 font-semibold">Login</h2>

      <input
        className="border p-2 w-full mb-4"
        placeholder="Enter phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white w-full py-2 rounded"
      >
        Continue
      </button>
    </div>
  );
}
