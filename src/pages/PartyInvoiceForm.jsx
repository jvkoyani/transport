import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { read, insert, update, getById } from '../db.js'

function nextNumber() {
  const nums = read('partyInvoices')
    .map((i) => parseInt(String(i.invoiceNumber).replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n))
  return 'PI-' + String((nums.length ? Math.max(...nums) : 1000) + 1)
}

const billAmount = (b) => Number(b.finalBiltyPayable) || Number(b.freightAmount) || 0

export default function PartyInvoiceForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = getById('partyInvoices', id)

  const parties = read('parties')
  const bilties = read('bilties')

  const [form, setForm] = useState(
    editing || {
      invoiceNumber: nextNumber(),
      date: new Date().toISOString().slice(0, 10),
      partyId: '',
      biltyIds: [],
      gstPct: '',
      notes: '',
    },
  )
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Bilties linked to the selected party (as consignor / consignee / paid-by)
  const partyBilties = useMemo(() => {
    if (!form.partyId) return []
    return bilties.filter(
      (b) =>
        b.consignorId === form.partyId ||
        b.consigneeId === form.partyId ||
        b.paidById === form.partyId,
    )
  }, [form.partyId, bilties])

  const toggle = (bid) =>
    setForm((f) => ({
      ...f,
      biltyIds: f.biltyIds.includes(bid)
        ? f.biltyIds.filter((x) => x !== bid)
        : [...f.biltyIds, bid],
    }))

  const calc = useMemo(() => {
    const selected = bilties.filter((b) => form.biltyIds.includes(b.id))
    const subtotal = selected.reduce((s, b) => s + billAmount(b), 0)
    const gst = (subtotal * (Number(form.gstPct) || 0)) / 100
    return { subtotal, gst, total: subtotal + gst }
  }, [form.biltyIds, form.gstPct, bilties])

  const save = () => {
    if (!form.partyId) return alert('Select a party.')
    if (form.biltyIds.length === 0) return alert('Select at least one bilty.')
    const payload = { ...form, ...calc }
    if (editing) update('partyInvoices', editing.id, payload)
    else insert('partyInvoices', payload)
    navigate('/party-invoice')
  }

  return (
    <div>
      <header className="topbar no-print">
        <div className="form-title">
          <h2>{editing ? 'Edit' : 'Create'} Party Invoice</h2>
          <button className="btn btn-back" onClick={() => navigate('/party-invoice')}>← Go Back</button>
        </div>
        <button className="btn btn-primary" onClick={save}>💾 SAVE</button>
      </header>

      <div className="page">
        <div className="panel" style={{ maxWidth: 900 }}>
          <div className="grid grid-3">
            <label className="field"><span>Invoice Number</span>
              <input value={form.invoiceNumber} onChange={(e) => set('invoiceNumber', e.target.value)} />
            </label>
            <label className="field"><span>Date</span>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </label>
            <label className="field"><span>Party *</span>
              <select value={form.partyId} onChange={(e) => set('partyId', e.target.value)}>
                <option value="">Select Party</option>
                {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          </div>

          <h4 className="mt">Select Bilties to bill</h4>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Bilty No.</th>
                  <th>Date</th>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {!form.partyId && (
                  <tr><td colSpan="6" className="empty-cell">Select a party to list its bilties.</td></tr>
                )}
                {form.partyId && partyBilties.length === 0 && (
                  <tr><td colSpan="6" className="empty-cell">No bilties found for this party.</td></tr>
                )}
                {partyBilties.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <input type="checkbox" style={{ width: 'auto' }}
                        checked={form.biltyIds.includes(b.id)} onChange={() => toggle(b.id)} />
                    </td>
                    <td className="strong">{b.biltyNumber}</td>
                    <td>{b.date}</td>
                    <td>{b.from} ➜ {b.to}</td>
                    <td>{getById('trucks', b.truckId)?.vehicleNumber || ''}</td>
                    <td>₹{billAmount(b).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-2 mt" style={{ maxWidth: 420 }}>
            <label className="field"><span>GST %</span>
              <input type="number" value={form.gstPct} onChange={(e) => set('gstPct', e.target.value)} placeholder="0" />
            </label>
          </div>

          <div className="totals-box">
            <div><span>Subtotal</span><strong>₹{calc.subtotal.toLocaleString('en-IN')}</strong></div>
            <div><span>GST</span><strong>₹{calc.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
            <div className="grand"><span>Total</span><strong>₹{calc.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
          </div>

          <label className="field mt"><span>Notes</span>
            <textarea rows="2" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </label>
        </div>
      </div>
    </div>
  )
}
