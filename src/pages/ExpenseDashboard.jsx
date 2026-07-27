import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { read } from '../db.js'
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function ExpenseDashboard() {
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [sortCategoryBy, setSortCategoryBy] = useState('amount-desc') // amount-desc, amount-asc, name

  const expenses = useMemo(() => read('expenses'), [])

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.date)
      return d.getMonth() === month && d.getFullYear() === year
    })
  }, [expenses, month, year])

  const stats = useMemo(() => {
    const byCategory = {}
    const total = filtered.reduce((s, e) => {
      const amt = Number(e.amount) || 0
      byCategory[e.category] = (byCategory[e.category] || 0) + amt
      return s + amt
    }, 0)
    return { byCategory, total }
  }, [filtered])

  const allTimeTotal = useMemo(() => {
    return expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  }, [expenses])

  const categoryStats = useMemo(() => {
    let result = CATEGORIES.map((cat) => {
      const amt = expenses
        .filter((e) => e.category === cat)
        .reduce((s, e) => s + (Number(e.amount) || 0), 0)
      return { category: cat, amount: amt }
    }).filter((s) => s.amount > 0)

    // Apply sorting
    if (sortCategoryBy === 'amount-desc') {
      result.sort((a, b) => b.amount - a.amount)
    } else if (sortCategoryBy === 'amount-asc') {
      result.sort((a, b) => a.amount - b.amount)
    } else if (sortCategoryBy === 'name') {
      result.sort((a, b) => a.category.localeCompare(b.category))
    }

    return result
  }, [expenses, sortCategoryBy])

  return (
    <div>
      <header className="topbar">
        <h2 className="page-heading">Company Expenses</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/expense/list" className="btn btn-ghost">
            📋 View List
          </Link>
          <Link to="/expense/new" className="btn btn-primary">
            + ADD EXPENSE
          </Link>
        </div>
      </header>

      <div className="page">
        {/* Period selector + Download buttons */}
        <div className="period-selector-group">
          <div className="period-selector">
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{ maxWidth: 140 }}
            >
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="report-buttons">
            <Link
              to={`/expense/report/monthly/${year}/${month}`}
              className="btn btn-outline"
              style={{ fontSize: 13 }}
            >
              📄 Monthly Report
            </Link>
            <Link
              to={`/expense/report/yearly/${year}`}
              className="btn btn-outline"
              style={{ fontSize: 13 }}
            >
              📋 Yearly Report
            </Link>
          </div>
        </div>

        {/* Current period summary */}
        <div className="expense-summary">
          <div className="expense-card total">
            <span className="card-label">
              {MONTHS[month]} {year}
            </span>
            <span className="card-amount">₹{money(stats.total)}</span>
          </div>
          {Object.entries(stats.byCategory)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .map(([cat, amt]) => (
              <div key={cat} className="expense-card">
                <span className="card-label">{cat}</span>
                <span className="card-amount">₹{money(amt)}</span>
              </div>
            ))}
        </div>

        {/* All-time breakdown */}
        <div className="expense-breakdown">
          <div className="breakdown-head">
            <h3>All-Time Breakdown by Category</h3>
            <select value={sortCategoryBy} onChange={(e) => setSortCategoryBy(e.target.value)} className="filter-select" style={{ maxWidth: 160, fontSize: 12 }}>
              <option value="amount-desc">Amount (High)</option>
              <option value="amount-asc">Amount (Low)</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
          <div className="breakdown-grid">
            {categoryStats.map((s) => {
              const pct = ((s.amount / allTimeTotal) * 100).toFixed(1)
              return (
                <div key={s.category} className="breakdown-item">
                  <div className="breakdown-bar">
                    <div className="breakdown-fill" style={{ width: pct + '%' }}></div>
                  </div>
                  <div className="breakdown-label">
                    <span>{s.category}</span>
                    <span className="breakdown-pct">{pct}%</span>
                  </div>
                  <div className="breakdown-amount">₹{money(s.amount)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent expenses */}
        <div>
          <h3>Recent Expenses</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {expenses
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 10)
                  .map((e) => (
                    <tr key={e.id}>
                      <td>{e.date}</td>
                      <td>
                        <span className={`badge category-${e.category.toLowerCase()}`}>
                          {e.category}
                        </span>
                      </td>
                      <td>{e.description || '—'}</td>
                      <td className="strong">₹{money(e.amount)}</td>
                      <td>{e.paymentMethod || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
