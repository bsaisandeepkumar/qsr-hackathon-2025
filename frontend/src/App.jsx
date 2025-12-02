import React, { useState } from 'react'
import Menu from './components/Menu'
import Recommendations from './components/Recommendations'
import KDS from './components/KDS'

export default function App() {
  const [view, setView] = useState('kiosk') // kiosk | kds
  const [currentTicket, setCurrentTicket] = useState(null)
  const [currentProfile, setCurrentProfile] = useState("in_store")


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">SmartServe — Demo</h1>
        <div>
          <button
            onClick={() => setView('kiosk')}
            className={`px-3 py-1 mr-2 rounded ${view==='kiosk' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          >
            Kiosk
          </button>
          <button
            onClick={() => setView('kds')}
            className={`px-3 py-1 rounded ${view==='kds' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          >
            KDS
          </button>
        </div>
      </header>

      {view === 'kiosk' && (
        <main className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
           <Menu onTicketCreated={(ticket, profile) => {
    setCurrentTicket(ticket);
    setCurrentProfile(profile);
}} />
          </div>
          <div>
            <Recommendations ticketId={currentTicket?.id} profile={currentProfile} />
          </div>
        </main>
      )}

      {view === 'kds' && (
        <KDS ticketId={currentTicket?.id} />
      )}
    </div>
  )
}
