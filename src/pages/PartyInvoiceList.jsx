import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { read, remove, getById } from '../db.js'

export default function PartyInvoiceList() {
  const navigate = useNavigate()
  const [version, setVersion] = useState(0)
  const invoices = read('partyInvoices')

  const del = (id) => {
    if (confirm('Delete this invoice?')) {
      remove('partyInvoices', id)
      setVersion((v) => v + 1)
    }
  }

  return (
    <div key={version}>
      <header className="topbar">
        <h2 className="page-heading">Party Invoice</h2>
        <Link to="/party-invoice/new" className="btn btn-primary">+ ADD</Link>
      </header>
      <div className="page">
        <div className="list-toolbar">
          <span className="count-badge">Party Invoice ➜ {invoices.length}</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Date</th>
                <th>Party</th>
                <th>Bilties</th>
                <th>Subtotal</th>
                <th>GST</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr><td colSpan="8" className="empty-cell">No invoices yet. Click <strong>+ ADD</strong>.</td></tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="strong">{inv.invoiceNumber}</td>
                  <td>{inv.date}</td>
                  <td>{getById('parties', inv.partyId)?.name || ''}</td>
                  <td>{(inv.biltyIds || []).length}</td>
                  <td>₹{(inv.subtotal || 0).toLocaleString('en-IN')}</td>
                  <td>₹{(inv.gst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="strong">₹{(inv.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn icon-edit" onClick={() => navigate(`/party-invoice/${inv.id}/edit`)}>✎</button>
                      <button className="icon-btn icon-del" onClick={() => del(inv.id)}>🗑</button>
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
