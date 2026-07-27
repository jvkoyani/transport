export default function Placeholder({ title }) {
  return (
    <div>
      <header className="topbar">
        <h2 className="page-heading">{title}</h2>
      </header>
      <div className="page">
        <div className="placeholder">
          <div className="placeholder-icon">🚧</div>
          <h3>{title}</h3>
          <p>This module is part of the roadmap. The Bilty module is fully functional.</p>
        </div>
      </div>
    </div>
  )
}
