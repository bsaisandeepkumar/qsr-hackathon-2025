import React, { useEffect, useState } from 'react'

export default function KDS({ ticketId }) {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (!ticketId) return
    let mounted = true

    async function fetchStatus() {
      try {
        const res = await fetch(`/kds/${ticketId}`)
        const data = await res.json()
        if (mounted) setStatus(data)
      } catch (e) {
        // fallback mock
        if (mounted) setStatus({ ticketId, status: 'pending', verification: { status: 'mismatch', missing: ['fries'] } })
      }
    }

    fetchStatus()
    const timer = setInterval(fetchStatus, 3000)
    return () => { mounted = false; clearInterval(timer) }
  }, [ticketId])

  if (!ticketId) {
    return <div className="bg-white p-4 rounded shadow">No active ticket. Place an order first.</div>
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-medium mb-3">KDS — Ticket {ticketId}</h2>
      <div className="mb-4">
        <div><strong>Status:</strong> {status?.status || 'loading'}</div>
        <div><strong>Verification:</strong> {status?.verification?.status || 'unknown'}</div>
      </div>

      {status?.verification?.status === 'mismatch' && (
        <div className="p-4 bg-red-100 border-l-4 border-red-500">
          <strong>Mismatch detected:</strong>
          <div>Missing items: {status.verification.missing.join(', ')}</div>
          <div className="mt-2">
            <button className="px-3 py-1 bg-red-600 text-white rounded mr-2">Hold Order</button>
            <button className="px-3 py-1 bg-orange-500 text-white rounded">Reassign</button>
          </div>
        </div>
      )}

      {status?.verification?.status === 'ok' && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500">
          <strong>All items verified. Ready to hand off.</strong>
        </div>
      )}
    </div>
  )
}
