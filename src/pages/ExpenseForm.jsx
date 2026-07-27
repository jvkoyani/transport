import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { read, insert, update, getById } from '../db.js'

const CATEGORIES = [
  'Fuel',
  'Maintenance',
  'Salary',
  'Rent',
  'Utilities',
  'Insurance',
  'Road Tax',
  'Toll',
  'Cleaning',
  'Other',
]

function nextRefNo() {
  const nums = read('expenses')
    .map((e) => parseInt(e.refNumber?.replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n))
  return 'EXP-' + String((nums.length ? Math.max(...nums) : 5000) + 1)
}

export default function ExpenseForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = getById('expenses', id)

  const [form, setForm] = useState(
    editing || {
      refNumber: nextRefNo(),
      date: new Date().toISOString().slice(0, 10),
      category: 'Fuel',
      description: '',
      amount: '',
      paidBy: '',
      paymentMethod: 'Cash',
      notes: '',
      receipt: '',
    },
  )

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = () => {
    if (!form.category) return alert('Select a category.')
    if (!form.amount) return alert('Enter amount.')
    if (editing) update('expenses', editing.id, form)
    else insert('expenses', form)
    navigate('/expense')
  }

  return (
    <div>
      <header className="topbar">
        <div className="form-title">
          <h2>{editing ? 'Edit' : 'Add'} Expense</h2>
          <button className="btn btn-back" onClick={() => navigate('/expense')}>
            ← Go Back
          </button>
        </div>
        <button className="btn btn-primary" onClick={save}>
          💾 SAVE
        </button>
      </header>

      <div className="page">
        <div className="panel" style={{ maxWidth: 720 }}>
          <div className="grid grid-3">
            <label className="field">
              <span>Reference No.</span>
              <input value={form.refNumber} onChange={(e) => set('refNumber', e.target.value)} />
            </label>
            <label className="field">
              <span>Date *</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
              />
            </label>
            <label className="field">
              <span>Category *</span>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>Description</span>
            <input
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="e.g. Fuel for GJ15AV3219"
            />
          </label>

          <div className="grid grid-3">
            <label className="field">
              <span>Amount *</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="0.00"
              />
            </label>
            <label className="field">
              <span>Paid By</span>
              <input
                value={form.paidBy}
                onChange={(e) => set('paidBy', e.target.value)}
                placeholder="e.g. Cash, Bank"
              />
            </label>
            <label className="field">
              <span>Payment Method</span>
              <select value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}>
                <option>Cash</option>
                <option>Cheque</option>
                <option>Bank Transfer</option>
                <option>Card</option>
                <option>Other</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Receipt / Invoice No.</span>
            <input
              value={form.receipt}
              onChange={(e) => set('receipt', e.target.value)}
              placeholder="e.g. INV-12345"
            />
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea
              rows="3"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any additional details…"
            />
          </label>
        </div>
      </div>
    </div>
  )
}
