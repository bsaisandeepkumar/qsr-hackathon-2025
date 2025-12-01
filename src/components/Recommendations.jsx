import React, { useEffect, useState } from 'react'

const MOCK_RECS = [
  { id: 'fries', name: 'Fries', reason: 'Popular side' },
  { id: 'cola', name: 'Soft Drink', reason: 'Complements Burger' },
  { id: 'salad', name: 'Green Salad', reason: 'Light option' }
]

export default function Recommendations({ ticketId }) {
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch recommendations using ticketId or poll context
    const body = {
      user: 'anonymous',
      time: new Date().toISOString(),
      ticketId
    }
    setLoading(true)
    fetch('/recommend', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setRecs(data.recommendations || data))
      .catch(() => setRecs(MOCK_RECS))
      .finally(()=>setLoading(false))
  }, [ticketId])

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-lg font-medium mb-3">Recommended</h2>
      {loading ? <p>Loading...</p> : (
        <ul className="space-y-2">
          {recs.map(r => (
            <li key={r.id} className="border rounded p-2 flex justify-between items-center">
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-sm text-gray-500">{r.reason}</div>
              </div>
              <button className="px-3 py-1 bg-yellow-500 rounded">Add</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
