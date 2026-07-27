import { useEffect, useMemo, useState } from 'react'
import TripForm from './TripForm.jsx'
import TripList from './TripList.jsx'
import { loadTrips, saveTrips } from './storage.js'

export default function App() {
  const [trips, setTrips] = useState(loadTrips)
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    saveTrips(trips)
  }, [trips])

  const addTrip = (trip) => {
    setTrips((t) => [trip, ...t])
    setShowForm(false)
  }

  const deleteTrip = (id) => {
    if (confirm('Delete this trip?')) setTrips((t) => t.filter((x) => x.id !== id))
  }

  const changeStatus = (id, status) =>
    setTrips((t) => t.map((x) => (x.id === id ? { ...x, status } : x)))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return trips
    return trips.filter((t) =>
      [t.from, t.to, t.truck.number, t.truck.driver, ...t.products.map((p) => p.name)]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [trips, query])

  const stats = useMemo(() => {
    const inTransit = trips.filter((t) => t.status === 'In Transit').length
    const delivered = trips.filter((t) => t.status === 'Delivered').length
    const freight = trips.reduce((s, t) => s + (Number(t.freight) || 0), 0)
    return { total: trips.length, inTransit, delivered, freight }
  }, [trips])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/truck.svg" alt="" className="logo" />
          <span>
            Transport <span className="brand-accent">Khata</span>
          </span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Close' : '+ New Trip'}
        </button>
      </header>

      <main className="container">
        <section className="stats">
          <div className="stat">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Trips</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.inTransit}</span>
            <span className="stat-label">In Transit</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.delivered}</span>
            <span className="stat-label">Delivered</span>
          </div>
          <div className="stat">
            <span className="stat-value">₹{stats.freight.toLocaleString('en-IN')}</span>
            <span className="stat-label">Total Freight</span>
          </div>
        </section>

        {showForm && <TripForm onSave={addTrip} onCancel={() => setShowForm(false)} />}

        <div className="list-head">
          <h2>Trips</h2>
          <input
            className="search"
            placeholder="Search route, truck, product…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <TripList trips={filtered} onDelete={deleteTrip} onStatusChange={changeStatus} />
      </main>

      <footer className="app-foot">
        Transport Khata · Smart Transport ERP · Data saved locally in your browser
      </footer>
    </div>
  )
}
