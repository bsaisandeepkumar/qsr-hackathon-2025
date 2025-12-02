// frontend/src/components/Register.jsx
import React, { useState } from "react";
import config from "../config";

export default function Register({ phone, onRegistered }) {
  const [name, setName] = useState("");

  const submit = async () => {
    if (!phone) {
      alert("Phone missing");
      return;
    }
    try {
      const res = await fetch(`${config.API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          name,
          // ❗ DO NOT send profile from FE anymore
        }),
      });

      const data = await res.json();

      if (data.status === "created" || data.status === "exists") {
        const user = {
          phone,
          name: name || null,
          profile: data.profile, // backend returns default
        };

        localStorage.setItem("user", JSON.stringify(user));
        onRegistered(user);
      } else {
        alert("Registration failed");
      }
    } catch (err) {
      console.error("Register failed", err);
      alert("Registration error");
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white shadow rounded">
      <h2 className="text-xl mb-4 font-semibold">Create Account</h2>
      <p className="mb-3 text-gray-600">
        Phone: <strong>{phone}</strong>
      </p>

      <input
        className="border p-2 w-full mb-4"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button
        onClick={submit}
        className="bg-green-600 text-white w-full py-2 rounded"
      >
        Create account
      </button>
    </div>
  );
}
