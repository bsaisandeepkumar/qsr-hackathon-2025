// frontend/src/components/Menu.jsx
import React, { useEffect, useState } from "react";
import config from "../config";

export default function Menu({ onTicketCreated, onCartUpdated }) {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);

  // Load menu
  useEffect(() => {
    fetch(`${config.API_BASE_URL}/menu`)
      .then((r) => r.json())
      .then(setMenu)
      .catch((err) => {
        console.error("Failed loading menu", err);
        setMenu([]);
      });
  }, []);

  // --- CART ACTIONS ---
  const add = (item) => {
    const updated = [...cart, item];
    setCart(updated);
    onCartUpdated(updated); // notify App.jsx
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      alert("Select at least one item");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const profile = user?.profile || "in_store";

    try {
      const res = await fetch(`${config.API_BASE_URL}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          items: cart.map((c) => c.id),
        }),
      });

      if (!res.ok) {
        alert("Order failed");
        return;
      }

      const data = await res.json();
      onTicketCreated(data);
      setCart([]);
      onCartUpdated([]);
    } catch (err) {
      console.error("Order error", err);
      alert("Order request failed");
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow min-h-[600px]">
      <h2 className="text-xl font-semibold mb-4">Menu</h2>

      {/* MENU GRID ONLY — NO CART BELOW */}
      <div className="grid grid-cols-2 gap-3">
        {menu.map((item) => (
          <div key={item.id} className="p-3 border rounded-lg shadow-sm bg-gray-50">
            <div className="flex justify-between items-center">
              <strong>{item.name}</strong>
              <span className="text-gray-600">${item.price}</span>
            </div>
            <button
              onClick={() => add(item)}
              className="mt-3 px-3 py-1 bg-blue-600 text-white rounded w-full"
            >
              Add
            </button>
          </div>
        ))}
      </div>

      {/* Only the place order button — cart removed */}
      <div className="mt-6">
        <button
          onClick={placeOrder}
          className="px-4 py-2 bg-green-600 text-white rounded w-full"
          disabled={cart.length === 0}
        >
          Place Order
        </button>
      </div>
    </div>
  );
}
