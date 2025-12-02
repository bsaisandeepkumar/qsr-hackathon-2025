// frontend/src/components/CartPanel.jsx
import React from "react";

export default function CartPanel({ cart, setCart }) {
  const remove = (index) => {
    const updated = cart.filter((_, i) => i !== index);
    setCart(updated);
  };

  return (
    <div className="p-4 bg-white shadow rounded border">
      <h3 className="text-lg font-semibold mb-3">🛒 Your Cart</h3>

      {cart.length === 0 ? (
        <p className="text-gray-500">No items yet</p>
      ) : (
        <ul className="space-y-2">
          {cart.map((item, index) => (
            <li
              key={index}
              className="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <span>{item.name}</span>
              <button
                onClick={() => remove(index)}
                className="text-red-500 text-sm"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
