import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { read, remove, getById } from '../db.js'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return iso
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export default function BiltyList() {
  const navigate = useNavigate()
  const [version, setVersion] = useState(0)
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState('all')

  const bilties = useMemo(() => read('bilties'), [version])
  const partyInvoices = useMemo(() => read('partyInvoices'), [version])
  const lorryHires = useMemo(() => read('lorryHires'), [version])

  const partyName = (id) => getById('parties', id)?.name || ''
  const truckNumber = (id) => getById('trucks', id)?.vehicleNumber || ''
  const invoiceForBilty = (bid) =>
    partyInvoices.find((inv) => (inv.biltyIds || []).includes(bid))?.invoiceNumber || ''
  const hireForBilty = (bid) =>
    lorryHires.find((h) => h.biltyId === bid)?.hireNumber || ''

  const filtered = useMemo(() => {
    return bilties.filter((b) => {
      if (month !== 'all') {
        const d = new Date(b.date)
        if (isNaN(d) || d.getMonth() !== Number(month)) return false
      }
      const q = search.trim().toLowerCase()
      if (!q) return true
      const hay = [
        b.biltyNumber,
        b.from,
        b.to,
        truckNumber(b.truckId),
        partyName(b.consignorId),
        partyName(b.consigneeId),
        partyName(b.paidById),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [bilties, search, month])

  const del = (id) => {
    if (confirm('Delete this bilty?')) {
      remove('bilties', id)
      setVersion((v) => v + 1)
    }
  }

  return (
    <div>
      <header className="topbar">
        <input
          className="topbar-search"
          placeholder="Search Bilty"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Link to="/bilty/new" className="btn btn-primary">
          + ADD
        </Link>
      </header>

      <div className="page">
        <div className="list-toolbar">
          <span className="count-badge">👥 Bilty ➜ {bilties.length}</span>
          <div className="filters">
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="all">All Months</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select defaultValue="all">
              <option value="all">All Bilty</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bilty Number</th>
                <th>Date</th>
                <th>Party Invoice</th>
                <th>Lorry Hire</th>
                <th>Vehicle</th>
                <th>Route</th>
                <th>Consignor</th>
                <th>Consignee</th>
                <th>Paid By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="10" className="empty-cell">
                    No bilties yet. Click <strong>+ ADD</strong> to create one.
                  </td>
                </tr>
              )}
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td className="strong">{b.biltyNumber}</td>
                  <td>{fmtDate(b.date)}</td>
                  <td>{invoiceForBilty(b.id)}</td>
                  <td>{hireForBilty(b.id)}</td>
                  <td>{truckNumber(b.truckId)}</td>
                  <td className="route-cell">
                    {b.from} <span className="route-arrow">➜</span> {b.to}
                  </td>
                  <td>{partyName(b.consignorId)}</td>
                  <td>{partyName(b.consigneeId)}</td>
                  <td>{partyName(b.paidById)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-btn icon-pdf"
                        title="PDF / Print LR"
                        onClick={() => navigate(`/bilty/${b.id}/print`)}
                      >
                        PDF
                      </button>
                      <button
                        className="icon-btn icon-edit"
                        title="Edit"
                        onClick={() => navigate(`/bilty/${b.id}/edit`)}
                      >
                        ✎
                      </button>
                      <button className="icon-btn icon-del" title="Delete" onClick={() => del(b.id)}>
                        🗑
                      </button>
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
