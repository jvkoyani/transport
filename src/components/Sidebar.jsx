import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

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
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout()
      navigate('/login')
    }
  }

  if (!isAuthenticated) return null

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/truck.svg" alt="" className="sidebar-logo" />
        <div className="sidebar-brand-text">
          <strong>PUSHPAK ROADLINES</strong>
          <small>Transport Contractors &amp; Commission Agents</small>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="sidebar-user">
          <div className="user-avatar">👤</div>
          <div className="user-info">
            <div className="user-mobile">{user.mobileNumber}</div>
            <div className="user-company">{user.companyName}</div>
          </div>
        </div>
      )}

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

      {/* Logout Button */}
      <div className="sidebar-footer">
        <button className="btn btn-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </aside>
  )
}
