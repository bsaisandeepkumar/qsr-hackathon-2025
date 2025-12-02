import React, { useEffect, useState } from "react";
import config from "../config";

const MOCK_MENU = [
 // BURGERS
  { id: "classic_burger", name: "Classic Burger", price: 6.99, tags: ["burger", "beef"] },
  { id: "cheese_burger", name: "Cheese Burger", price: 7.49, tags: ["burger", "beef"] },
  { id: "double_burger", name: "Double Burger", price: 8.99, tags: ["burger", "beef"] },
  { id: "veggie_burger", name: "Veggie Burger", price: 6.49, tags: ["burger", "veg"] },
  { id: "spicy_chicken_burger", name: "Spicy Chicken Burger", price: 7.99, tags: ["burger", "chicken", "spicy"] },

  // SIDES
  { id: "fries_small", name: "Small Fries", price: 2.49, tags: ["side"] },
  { id: "fries_large", name: "Large Fries", price: 3.49, tags: ["side"] },
  { id: "curly_fries", name: "Curly Fries", price: 3.99, tags: ["side"] },
  { id: "onion_rings", name: "Onion Rings", price: 3.99, tags: ["side"] },
  { id: "side_salad", name: "Side Salad", price: 3.49, tags: ["veg", "healthy", "side"] },

  // DRINKS
  { id: "cola_small", name: "Cola (Small)", price: 1.49, tags: ["drink"] },
  { id: "cola_large", name: "Cola (Large)", price: 2.49, tags: ["drink"] },
  { id: "orange_soda", name: "Orange Soda", price: 2.49, tags: ["drink"] },
  { id: "lemonade", name: "Fresh Lemonade", price: 2.99, tags: ["drink"] },
  { id: "iced_tea", name: "Iced Tea", price: 2.49, tags: ["drink", "healthy"] },
  { id: "coffee", name: "Coffee", price: 1.99, tags: ["drink", "hot"] },
  { id: "milkshake_chocolate", name: "Chocolate Milkshake", price: 3.99, tags: ["drink", "dessert"] },
  { id: "milkshake_strawberry", name: "Strawberry Milkshake", price: 3.99, tags: ["drink", "dessert"] },

  // CHICKEN ITEMS
  { id: "chicken_nuggets_6", name: "Chicken Nuggets (6 pc)", price: 4.99, tags: ["chicken"] },
  { id: "chicken_nuggets_12", name: "Chicken Nuggets (12 pc)", price: 7.99, tags: ["chicken"] },
  { id: "crispy_chicken_strips", name: "Crispy Chicken Strips", price: 6.99, tags: ["chicken"] },

  // HEALTHY ITEMS
  { id: "greek_salad", name: "Greek Salad", price: 6.49, tags: ["veg", "healthy"] },
  { id: "chicken_salad", name: "Chicken Salad", price: 7.49, tags: ["healthy", "chicken"] },
  { id: "veggie_wrap", name: "Veggie Wrap", price: 5.99, tags: ["veg", "healthy"] },
  { id: "chicken_wrap", name: "Chicken Wrap", price: 6.99, tags: ["healthy", "chicken"] },

  // KIDS MENU
  { id: "kids_burger", name: "Kids Burger Meal", price: 4.99, tags: ["kids"] },
  { id: "kids_nuggets", name: "Kids Nuggets Meal", price: 4.99, tags: ["kids"] },
  { id: "apple_slices", name: "Apple Slices", price: 1.29, tags: ["kids", "healthy"] },
  { id: "juice_box", name: "Juice Box", price: 1.29, tags: ["kids", "drink"] },

  // DESSERTS
  { id: "ice_cream", name: "Soft Serve Ice Cream", price: 1.99, tags: ["dessert"] },
  { id: "brownie", name: "Chocolate Brownie", price: 2.99, tags: ["dessert"] }
];

export default function Menu({ onTicketCreated, onCartUpdated }) {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
  if (onCartUpdated) onCartUpdated(cart);
}, [cart]);
  
  // load user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    fetch(`${config.API_BASE_URL}/menu`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMenu)
      .catch(() => setMenu(MOCK_MENU));
  }, []);

  const add = (item) => setCart((prev) => [...prev, item]);
  const remove = (index) =>
    setCart((prev) => prev.filter((_, i) => i !== index));

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

      if (!res.ok) {
        const text = await res.text();
        console.error("Order failed", res.status, text);
        alert("Order failed");
        return;
      }

      const data = await res.json();
      onTicketCreated(data); // notify parent
    } catch (err) {
      console.error("Order error", err);
      alert("Order request failed");
    }
  };

 return (
  <>
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-medium">
        Welcome, {user?.name || user?.phone || "Guest"}
      </h2>
    </div>

    <div className="bg-white p-4 rounded shadow">
      <div className="grid grid-cols-2 gap-3">
        {menu.map((item) => (
          <div key={item.id} className="p-3 border rounded flex flex-col">
            <div className="flex justify-between items-center">
              <strong>{item.name}</strong>
              <span className="text-gray-600">${item.price}</span>
            </div>
            <button
              onClick={() => add(item)}
              className="mt-3 px-3 py-1 bg-blue-600 text-white rounded"
            >
              Add
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t pt-4">
        <h3 className="font-medium">Cart</h3>
        {cart.length === 0 ? (
          <p className="text-gray-500">No items</p>
        ) : (
          <ul>
            {cart.map((c, i) => (
              <li key={i} className="flex justify-between py-1">
                <span>{c.name}</span>
                <button
                  onClick={() => remove(i)}
                  className="text-red-500 text-sm mr-3"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex justify-end">
          <button
            onClick={placeOrder}
            className="px-4 py-2 bg-green-600 text-white rounded"
            disabled={cart.length === 0}
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
   </>
  );
}
