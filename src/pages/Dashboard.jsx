import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { read } from '../db.js'

export default function Dashboard() {
  const stats = useMemo(() => {
    const bilties = read('bilties')
    const freight = bilties.reduce((s, b) => s + (Number(b.finalBiltyPayable) || 0), 0)
    return {
      bilties: bilties.length,
      parties: read('parties').length,
      trucks: read('trucks').length,
      drivers: read('drivers').length,
      freight,
    }
  }, [])

  const cards = [
    { label: 'Total Bilties', value: stats.bilties, to: '/bilty', icon: '📒' },
    { label: 'Parties', value: stats.parties, to: '/party', icon: '👥' },
    { label: 'Trucks', value: stats.trucks, to: '/truck', icon: '🚚' },
    { label: 'Drivers', value: stats.drivers, to: '/driver', icon: '🪪' },
  ]

  return (
    <div>
      <header className="topbar">
        <h2 className="page-heading">Dashboard</h2>
        <Link to="/bilty/new" className="btn btn-primary">
          + New Bilty
        </Link>
      </header>
      <div className="page">
        <div className="dash-cards">
          {cards.map((c) => (
            <Link key={c.label} to={c.to} className="dash-card">
              <span className="dash-icon">{c.icon}</span>
              <span className="dash-value">{c.value}</span>
              <span className="dash-label">{c.label}</span>
            </Link>
          ))}
          <div className="dash-card">
            <span className="dash-icon">💰</span>
            <span className="dash-value">₹{stats.freight.toLocaleString('en-IN')}</span>
            <span className="dash-label">Total Freight Payable</span>
          </div>
        </div>
      </div>
    </div>
  )
}
