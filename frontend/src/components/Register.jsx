import React, { useState } from "react";
import config from "../config";

export default function Register({ phone, onRegistered }) {
  const [profile, setProfile] = useState("in_store");

  const submit = async () => {
    const res = await fetch(`${config.API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, profile }),
    });

    const data = await res.json();
    onRegistered({ phone, profile });
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white shadow rounded">
      <h2 className="text-xl mb-4 font-semibold">Create Account</h2>

      <p className="mb-3 text-gray-600">
        Phone: <strong>{phone}</strong>
      </p>

      <label className="block mb-2">Choose your profile:</label>
      <select
        className="border p-2 w-full mb-4"
        value={profile}
        onChange={(e) => setProfile(e.target.value)}
      >
        <option value="in_store">In-Store</option>
        <option value="returning">Returning Customer</option>
        <option value="health_focus">Health Focus</option>
        <option value="kid_friendly">Kid Friendly</option>
      </select>

      <button
        onClick={submit}
        className="bg-green-600 text-white w-full py-2 rounded"
      >
        Create account
      </button>
    </div>
  );
}
