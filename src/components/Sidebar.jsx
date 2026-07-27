import { NavLink } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/party', label: 'Party', icon: '👥' },
  { to: '/supplier', label: 'Supplier', icon: '🧾' },
  { to: '/truck', label: 'Truck', icon: '🚚' },
  { to: '/driver', label: 'Driver', icon: '🪪' },
  { to: '/bilty', label: 'Bilty', icon: '📒' },
  { to: '/tracking', label: 'Tracking', icon: '📍' },
  { to: '/party-invoice', label: 'Party Invoice', icon: '📑' },
  { to: '/lorry-hire', label: 'Lorry Hire', icon: '💵' },
  { to: '/expense', label: 'Expenses', icon: '💸' },
  { to: '/account-manager', label: 'Account Manager', icon: '🗂️' },
  { to: '/setup', label: 'Setup', icon: '⚙️' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/truck.svg" alt="" className="sidebar-logo" />
        <div className="sidebar-brand-text">
          <strong>PUSHPAK ROADLINES</strong>
          <small>Transport Contractors &amp; Commission Agents</small>
        </div>
      </div>
      <nav className="sidebar-nav">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            <span className="nav-icon">{it.icon}</span>
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
