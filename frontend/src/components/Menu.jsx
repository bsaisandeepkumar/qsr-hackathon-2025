import React, { useEffect, useState } from 'react'
import config from "../config"

const MOCK_MENU = [
  { id: 'burger', name: 'Classic Burger', price: 6.99, tags: ['hot'] },
  { id: 'fries', name: 'Fries', price: 2.49, tags: ['side'] },
  { id: 'cola', name: 'Soft Drink', price: 1.99, tags: ['drink'] },
  { id: 'salad', name: 'Green Salad', price: 4.99, tags: ['veg'] }
]

export default function Menu({ onTicketCreated }) {
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState([])
  const [profile, setProfile] = useState('returning') // returning | new | veg

  useEffect(() => {
    // Attempt to fetch menu from backend; fallback to MOCK_MENU
    fetch('/menu')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setMenu)
      .catch(() => setMenu(MOCK_MENU))
  }, [])

  const add = (item) => setCart(prev => [...prev, item])
  const remove = (index) => setCart(prev => prev.filter((_,i)=>i!==index))

 // inside Menu component - ensure props include user and onTicketCreated
const placeOrder = async () => {
  if (selectedItems.length === 0) {
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
        items: selectedItems,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Order failed", res.status, text);
      alert("Order failed");
      return;
    }
    const data = await res.json();
    // notify parent. Keep signature: onTicketCreated(ticket)
    onTicketCreated(data); // App will set currentTicket and Recommendations use ticketId
  } catch (err) {
    console.error("Order error", err);
    alert("Order request failed");
  }
}

  return (
//    <div className="bg-white p-4 rounded shadow">
//      <div className="flex items-center justify-between mb-4">
//        <h2 className="text-xl font-medium">Menu</h2>
//        <div>
//          <label className="mr-2 text-sm">Profile</label>
//          <select value={profile} onChange={(e)=>setProfile(e.target.value)} className="border rounded px-2 py-1">
//            <option value="returning">Returning</option>
//            <option value="new">New</option>
//            <option value="veg">Veg</option>
//          </select>
//        </div>
//      </div>

      <div className="grid grid-cols-2 gap-3">
        {menu.map(item => (
          <div key={item.id} className="p-3 border rounded flex flex-col">
            <div className="flex justify-between items-center">
              <strong>{item.name}</strong>
              <span className="text-gray-600">${item.price}</span>
            </div>
            <div className="mt-2">
              <button onClick={()=>add(item)} className="mt-auto px-3 py-1 bg-blue-600 text-white rounded">Add</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t pt-4">
        <h3 className="font-medium">Cart</h3>
        {cart.length===0 ? <p className="text-gray-500">No items</p> : (
          <ul>
            {cart.map((c, i) => (
              <li key={i} className="flex justify-between py-1">
                <span>{c.name}</span>
                <div>
                  <button onClick={()=>remove(i)} className="text-red-500 text-sm mr-3">Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex justify-end">
          <button onClick={placeOrder} className="px-4 py-2 bg-green-600 text-white rounded" disabled={cart.length===0}>Place Order</button>
        </div>
      </div>
    </div>
  )
}
