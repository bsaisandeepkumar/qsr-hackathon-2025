import React, { useEffect, useState } from "react";
import config from "../config";

export default function Menu({ onTicketCreated, onCartUpdated, user }) {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);

  // Fetch menu from backend
  useEffect(() => {
    fetch(`${config.API_BASE_URL}/menu`)
      .then((r) => r.json())
      .then(setMenu)
      .catch((err) => {
        console.error("Failed loading menu", err);
      });
  }, []);

  // Add item to cart
  const add = (item) => {
    const updated = [...cart, item];
    setCart(updated);
    onCartUpdated?.(updated);
  };

  // Remove item from cart
  const remove = (index) => {
    const updated = cart.filter((_, i) => i !== index);
    setCart(updated);
    onCartUpdated?.(updated);
  };

  // Place order
  const placeOrder = async () => {
    if (cart.length === 0) {
      alert("Select at least one item");
      return;
    }

    const profileToUse = user?.profile || "in_store";

    try {
      const res = await fetch(`${config.API_BASE_URL}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profileToUse,
          items: cart.map((c) => c.id),
        }),
      });

      const data = await res.json();
      onTicketCreated(data);
      setCart([]);
      onCartUpdated([]);
    } catch (err) {
      console.error("Order error", err);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* ------------------- LEFT: MENU GRID ------------------- */}
      <div className="col-span-2">
        <h2 className="text-2xl font-semibold mb-4">
          Welcome{user?.name ? `, ${user.name}` : ""} 👋  
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {menu.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-3 flex flex-col"
            >
              <img
                src={item.image || "/placeholder.png"}
                alt={item.name}
                className="rounded-lg w-full h-36 object-cover"
              />

              <div className="mt-3 flex justify-between items-center">
                <h3 className="font-semibold">{item.name}</h3>
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                  ${item.price}
                </span>
              </div>

              {/* Tags */}
              <div className="mt-2 flex flex-wrap gap-1 text-xs text-gray-600">
                {item.tags?.map((t) => (
                  <span
                    key={t}
                    className="bg-gray-100 border px-2 py-0.5 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <button
                onClick={() => add(item)}
                className="mt-3 bg-green-600 text-white w-full py-2 rounded-lg hover:bg-green-700 transition"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------- RIGHT: CART PANEL ------------------- */}
      <div className="sticky top-4 bg-white shadow rounded-xl p-5 h-fit">
        <h3 className="text-xl font-medium mb-3">Your Cart 🛒</h3>

        {cart.length === 0 ? (
          <p className="text-gray-500">Your cart is empty</p>
        ) : (
          <ul className="space-y-2">
            {cart.map((c, i) => (
              <li
                key={i}
                className="flex justify-between items-center border-b pb-2"
              >
                <span>{c.name}</span>
                <button
                  className="text-red-500 text-sm"
                  onClick={() => remove(i)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg disabled:bg-gray-400"
          disabled={cart.length === 0}
          onClick={placeOrder}
        >
          Place Order
        </button>
      </div>
    </div>
  );
}
