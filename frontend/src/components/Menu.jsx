import React, { useEffect, useState } from "react";
import config from "../config";

export default function Menu({ user, onTicketCreated }) {
  const [menu, setMenu] = useState([]);
  const [filteredMenu, setFilteredMenu] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);

  const CATEGORIES = [
    { id: "all", label: "All" },
    { id: "main", label: "Burgers & Mains" },
    { id: "side", label: "Sides" },
    { id: "drink", label: "Drinks" },
    { id: "dessert", label: "Desserts" },
    { id: "healthy", label: "Healthy" },
    { id: "kids", label: "Kids" }
  ];

  useEffect(() => {
    fetch(`${config.API_BASE_URL}/menu`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setMenu(data);
        setFilteredMenu(data);
      })
      .catch((err) => {
        console.error("Failed loading menu", err);
      });
  }, []);

  // Handle category change
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredMenu(menu);
      return;
    }
    setFilteredMenu(menu.filter((item) => item.tags.includes(selectedCategory)));
  }, [selectedCategory, menu]);

  // Cart actions
  const addToCart = (item) => => {
  const updated = [...cart, item];
  setCart(updated);
  onCartUpdated(updated);   // send to App
};
  const removeFromCart = (index) =>
    {
  const updated = cart.filter((_, i) => i !== index);
  setCart(updated);
  onCartUpdated(updated);   // send to App
};

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
          items: cart
        })
      });

      if (!res.ok) {
        console.error("Order failed");
        alert("Order failed");
        return;
      }

      const data = await res.json();
      onTicketCreated(data);
    } catch (err) {
      console.error("Order error", err);
    }
  };

  return (
    <div className="p-4">
      {/* Greeting */}
      <h2 className="text-xl font-semibold mb-3">
        Welcome, {user?.name || user?.phone} 👋
      </h2>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-4 py-2 rounded-full text-sm border ${
              selectedCategory === c.id
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredMenu.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-3 flex flex-col"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-28 object-cover rounded"
            />

            <div className="mt-2 flex justify-between items-center">
              <h3 className="font-semibold text-sm">{item.name}</h3>
              <span className="text-gray-700 font-medium text-sm">
                ${item.price}
              </span>
            </div>

            <button
              onClick={() => addToCart(item)}
              className="mt-3 py-1 bg-blue-600 text-white rounded text-sm"
            >
              Add
            </button>
          </div>
        ))}
      </div>

      // Cart 
      <div className="mt-4">
  <button
    onClick={placeOrder}
    className="px-4 py-2 bg-green-600 text-white rounded w-full"
    disabled={cart.length === 0}
  >
    Place Order
  </button>
</div>

  );
}
