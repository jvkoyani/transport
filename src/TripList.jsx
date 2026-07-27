const statusColors = {
  Scheduled: 'badge-blue',
  'In Transit': 'badge-amber',
  Delivered: 'badge-green',
}

const STATUSES = ['Scheduled', 'In Transit', 'Delivered']

export default function TripList({ trips, onDelete, onStatusChange }) {
  if (trips.length === 0) {
    return (
      <div className="card empty">
        <div className="empty-icon">🚚</div>
        <h3>No trips yet</h3>
        <p>Create your first trip to see it listed here.</p>
      </div>
    )
  }

  return (
    <div className="trip-grid">
      {trips.map((trip) => {
        const totalWeight = trip.products.reduce(
          (s, p) => s + (Number(p.weight) || 0),
          0,
        )
        return (
          <article className="card trip" key={trip.id}>
            <header className="trip-head">
              <div className="route">
                <strong>{trip.from}</strong>
                <span className="arrow">→</span>
                <strong>{trip.to}</strong>
              </div>
              <select
                className={`badge ${statusColors[trip.status] || ''}`}
                value={trip.status}
                onChange={(e) => onStatusChange(trip.id, e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </header>

            <div className="trip-meta">
              <span>📅 {trip.date}</span>
              <span>🚛 {trip.truck.number}</span>
              <span>{trip.truck.type}</span>
              {trip.truck.driver && <span>👤 {trip.truck.driver}</span>}
              {trip.freight && <span>💰 ₹{Number(trip.freight).toLocaleString('en-IN')}</span>}
            </div>

            <table className="product-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {trip.products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>
                      {p.quantity || '—'} {p.quantity ? p.unit : ''}
                    </td>
                    <td>{p.weight ? `${p.weight} kg` : '—'}</td>
                  </tr>
                ))}
              </tbody>
              {totalWeight > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="2">Total weight</td>
                    <td>{totalWeight.toLocaleString('en-IN')} kg</td>
                  </tr>
                </tfoot>
              )}
            </table>

            {trip.notes && <p className="trip-notes">📝 {trip.notes}</p>}

            <footer className="trip-foot">
              <button className="btn-delete" onClick={() => onDelete(trip.id)}>
                Delete
              </button>
            </footer>
          </article>
        )
      })}
    </div>
  )
}
