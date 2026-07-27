import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { read, insert, update, getById } from '../db.js'

function nextNumber() {
  const nums = read('lorryHires')
    .map((i) => parseInt(String(i.hireNumber).replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n))
  return 'LH-' + String((nums.length ? Math.max(...nums) : 2000) + 1)
}

export default function LorryHireForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = getById('lorryHires', id)

  const suppliers = read('suppliers')
  const trucks = read('trucks')
  const bilties = read('bilties')

  const [form, setForm] = useState(
    editing || {
      hireNumber: nextNumber(),
      date: new Date().toISOString().slice(0, 10),
      supplierId: '',
      truckId: '',
      biltyId: '',
      hireAmount: '',
      advance: '',
      commissionPct: '',
      notes: '',
    },
  )
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const calc = useMemo(() => {
    const hire = Number(form.hireAmount) || 0
    const advance = Number(form.advance) || 0
    const commission = (hire * (Number(form.commissionPct) || 0)) / 100
    return { commission, balance: hire - advance - commission }
  }, [form.hireAmount, form.advance, form.commissionPct])

  const save = () => {
    if (!form.truckId) return alert('Select a truck.')
    if (!form.hireAmount) return alert('Enter hire amount.')
    const payload = { ...form, ...calc }
    if (editing) update('lorryHires', editing.id, payload)
    else insert('lorryHires', payload)
    navigate('/lorry-hire')
  }

  return (
    <div>
      <header className="topbar">
        <div className="form-title">
          <h2>{editing ? 'Edit' : 'Create'} Lorry Hire</h2>
          <button className="btn btn-back" onClick={() => navigate('/lorry-hire')}>← Go Back</button>
        </div>
        <button className="btn btn-primary" onClick={save}>💾 SAVE</button>
      </header>

      <div className="page">
        <div className="panel" style={{ maxWidth: 720 }}>
          <div className="grid grid-2">
            <label className="field"><span>Hire Number</span>
              <input value={form.hireNumber} onChange={(e) => set('hireNumber', e.target.value)} />
            </label>
            <label className="field"><span>Date</span>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </label>
            <label className="field"><span>Supplier</span>
              <select value={form.supplierId} onChange={(e) => set('supplierId', e.target.value)}>
                <option value="">Select Supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="field"><span>Truck *</span>
              <select value={form.truckId} onChange={(e) => set('truckId', e.target.value)}>
                <option value="">Select Truck</option>
                {trucks.map((t) => <option key={t.id} value={t.id}>{t.vehicleNumber} — {t.type}</option>)}
              </select>
            </label>
            <label className="field"><span>Against Bilty</span>
              <select value={form.biltyId} onChange={(e) => set('biltyId', e.target.value)}>
                <option value="">Select Bilty</option>
                {bilties.map((b) => (
                  <option key={b.id} value={b.id}>{b.biltyNumber} — {b.from} ➜ {b.to}</option>
                ))}
              </select>
            </label>
          </div>

          <h4 className="mt">Hire &amp; Payment</h4>
          <div className="grid grid-3">
            <label className="field"><span>Hire Amount *</span>
              <input type="number" value={form.hireAmount} onChange={(e) => set('hireAmount', e.target.value)} placeholder="0" />
            </label>
            <label className="field"><span>Advance Paid</span>
              <input type="number" value={form.advance} onChange={(e) => set('advance', e.target.value)} placeholder="0" />
            </label>
            <label className="field"><span>Commission %</span>
              <input type="number" value={form.commissionPct} onChange={(e) => set('commissionPct', e.target.value)} placeholder="0" />
            </label>
          </div>

          <div className="totals-box">
            <div><span>Commission</span><strong>₹{calc.commission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
            <div className="grand"><span>Balance Payable</span><strong>₹{calc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
          </div>

          <label className="field mt"><span>Notes</span>
            <textarea rows="2" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </label>
        </div>
      </div>
    </div>
  )
}
