import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { read } from '../db.js'
import { money } from '../invoice.js'
import { useCompanySettings } from '../hooks/useCompanySettings.js'
import { generateExpenseCSV, downloadCSV, printReport, buildReportStats } from '../utils/reportGenerator.js'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export default function ExpenseReport() {
  const navigate = useNavigate()
  const { period, month, year } = useParams()
  const settings = useCompanySettings()
  const expenses = read('expenses')

  const filtered = useMemo(() => {
    if (period === 'monthly' && month !== undefined && year !== undefined) {
      const m = Number(month)
      const y = Number(year)
      return expenses.filter((e) => {
        const d = new Date(e.date)
        return d.getMonth() === m && d.getFullYear() === y
      })
    } else if (period === 'yearly' && year !== undefined) {
      const y = Number(year)
      return expenses.filter((e) => {
        const d = new Date(e.date)
        return d.getFullYear() === y
      })
    }
    return expenses
  }, [period, month, year, expenses])

  const stats = useMemo(() => buildReportStats(filtered), [filtered])

  const title =
    period === 'monthly'
      ? `Expense Report — ${MONTHS[Number(month)]} ${year}`
      : `Expense Report — ${year}`

  const handleDownloadCSV = () => {
    const csv = generateExpenseCSV(filtered, title)
    const filename = `expenses-${period}-${year}${period === 'monthly' ? `-${month}` : ''}.csv`
    downloadCSV(csv, filename)
  }

  return (
    <div className="print-page">
      <div className="print-toolbar no-print">
        <button className="btn btn-ghost" onClick={() => navigate('/expense')}>
          ← Back
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={handleDownloadCSV}>
            📥 Download Excel
          </button>
          <button className="btn btn-primary" onClick={printReport}>
            🖨 Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="report">
        {/* Header */}
        <div className="report-head">
          <div className="report-company">
            <h1>{settings.companyName}</h1>
            <p className="report-tagline">{settings.tagline}</p>
            <p className="report-detail">{settings.address}</p>
            <p className="report-detail">Phone: {settings.phone} | Email: {settings.email}</p>
          </div>
          <div className="report-title">EXPENSE REPORT</div>
        </div>

        {/* Report period */}
        <div className="report-period">
          <h2>{title}</h2>
          <p>
            {filtered.length} expense record{filtered.length !== 1 ? 's' : ''} |
            Period: {period === 'monthly' ? MONTHS[Number(month)] + ' ' + year : 'Year ' + year}
          </p>
        </div>

        {/* Summary stats */}
        <div className="report-stats">
          <div className="stat-box">
            <span className="stat-label">Total Expenses</span>
            <span className="stat-value">₹{money(stats.total)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Records</span>
            <span className="stat-value">{stats.count}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Average per Record</span>
            <span className="stat-value">₹{money(stats.average)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Highest Category</span>
            <span className="stat-value">{stats.highest?.category || '—'}</span>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="report-section">
          <h3>Breakdown by Category</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.byCategory.map((s) => {
                const pct = stats.total > 0 ? ((s.amount / stats.total) * 100).toFixed(1) : 0
                return (
                  <tr key={s.category}>
                    <td>{s.category}</td>
                    <td align="right">₹{money(s.amount)}</td>
                    <td align="right">{pct}%</td>
                  </tr>
                )
              })}
              <tr className="total-row">
                <td>TOTAL</td>
                <td align="right">₹{money(stats.total)}</td>
                <td align="right">100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Detailed transactions */}
        <div className="report-section">
          <h3>Detailed Transactions</h3>
          {filtered.length === 0 ? (
            <p className="report-empty">No expenses found for this period.</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Paid By</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((e) => (
                    <tr key={e.id}>
                      <td>{e.date}</td>
                      <td>{e.category}</td>
                      <td>{e.description || '—'}</td>
                      <td align="right">₹{money(e.amount)}</td>
                      <td>{e.paidBy || '—'}</td>
                      <td>{e.paymentMethod || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="report-footer">
          <p>
            This is a computer-generated report. Report generated on{' '}
            {new Date().toLocaleDateString('en-IN')}
          </p>
          <p>FOR {settings.companyName}</p>
        </div>
      </div>
    </div>
  )
}
