import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { read, remove } from '../db.js'
import { money } from '../invoice.js'

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

export default function ExpenseList() {
  const navigate = useNavigate()
  const [version, setVersion] = useState(0)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const expenses = useMemo(() => read('expenses'), [version])

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false
      const q = search.trim().toLowerCase()
      if (!q) return true
      return [e.description, e.category, e.date].join(' ').toLowerCase().includes(q)
    })
  }, [expenses, search, categoryFilter])

  const summary = useMemo(() => {
    const byCategory = {}
    expenses.forEach((e) => {
      if (!byCategory[e.category]) byCategory[e.category] = 0
      byCategory[e.category] += Number(e.amount) || 0
    })
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0)
    return { byCategory, total }
  }, [expenses])

  const del = (id) => {
    if (confirm('Delete this expense?')) {
      remove('expenses', id)
      setVersion((v) => v + 1)
    }
  }

  return (
    <div key={version}>
      <header className="topbar">
        <input
          className="topbar-search"
          placeholder="Search expenses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => navigate('/expense/new')}>
          + ADD EXPENSE
        </button>
      </header>

      <div className="page">
        {/* Summary cards */}
        <div className="expense-summary">
          <div className="expense-card total">
            <span className="card-label">Total Expenses</span>
            <span className="card-amount">₹{money(summary.total)}</span>
          </div>
          {Object.entries(summary.byCategory)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .map(([cat, amt]) => (
              <div
                key={cat}
                className="expense-card"
                onClick={() => setCategoryFilter(cat)}
                style={{ cursor: 'pointer' }}
              >
                <span className="card-label">{cat}</span>
                <span className="card-amount">₹{money(amt)}</span>
              </div>
            ))}
        </div>

        {/* Filters */}
        <div className="list-toolbar">
          <span className="count-badge">Expenses ➜ {expenses.length}</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Paid By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    No expenses yet. Click <strong>+ ADD EXPENSE</strong>.
                  </td>
                </tr>
              )}
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td>
                    <span className={`badge category-${e.category.toLowerCase()}`}>{e.category}</span>
                  </td>
                  <td>{e.description}</td>
                  <td className="strong">₹{money(e.amount)}</td>
                  <td>{e.paidBy || '—'}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-btn icon-edit"
                        onClick={() => navigate(`/expense/${e.id}/edit`)}
                      >
                        ✎
                      </button>
                      <button className="icon-btn icon-del" onClick={() => del(e.id)}>
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
