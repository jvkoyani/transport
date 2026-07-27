import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { read, remove, getById } from '../db.js'

export default function LorryHireList() {
  const navigate = useNavigate()
  const [version, setVersion] = useState(0)
  const hires = read('lorryHires')

  const del = (id) => {
    if (confirm('Delete this lorry hire?')) {
      remove('lorryHires', id)
      setVersion((v) => v + 1)
    }
  }

  return (
    <div key={version}>
      <header className="topbar">
        <h2 className="page-heading">Lorry Hire</h2>
        <Link to="/lorry-hire/new" className="btn btn-primary">+ ADD</Link>
      </header>
      <div className="page">
        <div className="list-toolbar">
          <span className="count-badge">Lorry Hire ➜ {hires.length}</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hire No.</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Truck</th>
                <th>Bilty</th>
                <th>Hire Amount</th>
                <th>Advance</th>
                <th>Balance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {hires.length === 0 && (
                <tr><td colSpan="9" className="empty-cell">No lorry hires yet. Click <strong>+ ADD</strong>.</td></tr>
              )}
              {hires.map((h) => (
                <tr key={h.id}>
                  <td className="strong">{h.hireNumber}</td>
                  <td>{h.date}</td>
                  <td>{getById('suppliers', h.supplierId)?.name || ''}</td>
                  <td>{getById('trucks', h.truckId)?.vehicleNumber || ''}</td>
                  <td>{getById('bilties', h.biltyId)?.biltyNumber || ''}</td>
                  <td>₹{(Number(h.hireAmount) || 0).toLocaleString('en-IN')}</td>
                  <td>₹{(Number(h.advance) || 0).toLocaleString('en-IN')}</td>
                  <td className="strong">₹{(Number(h.balance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn icon-edit" onClick={() => navigate(`/lorry-hire/${h.id}/edit`)}>✎</button>
                      <button className="icon-btn icon-del" onClick={() => del(h.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
