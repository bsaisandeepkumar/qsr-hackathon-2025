// frontend/src/components/CartPanel.jsx
import React from "react";
import config from "../config";

export default function CartPanel({ cart = [], onCartUpdated = () => {}, onOrderPlaced }) {
  const remove = (index) => {
    const updated = cart.filter((_, i) => i !== index);
    onCartUpdated(updated);
  };

  const placeOrder = async () => {
    if (!Array.isArray(cart) || cart.length === 0) return;

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
        const text = await res.text();
        console.error("Order failed", res.status, text);
        alert("Order failed");
        return;
      }

      const data = await res.json();

      // Inform parent (if provided)
      if (typeof onOrderPlaced === "function") {
        onOrderPlaced(data);
      }

      // clear cart via parent
      onCartUpdated([]);
    } catch (err) {
      console.error("Order error", err);
      alert("Order failed");
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-lg font-semibold mb-3">🛒 Your Cart</h2>

      {cart.length === 0 ? (
        <p className="text-gray-500">No items yet</p>
      ) : (
        <ul className="space-y-2">
          {cart.map((item, index) => (
            <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>{item.name}</span>
              <button onClick={() => remove(index)} className="text-red-500 text-sm">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={placeOrder}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded w-full"
        disabled={cart.length === 0}
      >
        Place Order
      </button>
    </div>
  );
}
