import { money } from '../invoice.js'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

// Generate CSV string from expenses
export function generateExpenseCSV(expenses, title) {
  const rows = [
    [title],
    [],
    ['Date', 'Category', 'Description', 'Amount', 'Paid By', 'Payment Method', 'Receipt No.', 'Notes'],
  ]

  expenses.forEach((e) => {
    rows.push([
      e.date,
      e.category,
      e.description || '',
      Number(e.amount) || 0,
      e.paidBy || '',
      e.paymentMethod || '',
      e.receipt || '',
      e.notes || '',
    ])
  })

  // Summary
  const byCategory = {}
  let total = 0
  expenses.forEach((e) => {
    const amt = Number(e.amount) || 0
    byCategory[e.category] = (byCategory[e.category] || 0) + amt
    total += amt
  })

  rows.push([])
  rows.push(['SUMMARY BY CATEGORY'])
  Object.entries(byCategory).forEach(([cat, amt]) => {
    rows.push([cat, '', '', amt])
  })
  rows.push(['TOTAL', '', '', total])

  // Convert to CSV
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell || '')
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
        })
        .join(','),
    )
    .join('\n')
}

// Download CSV file
export function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// Trigger browser print for PDF
export function printReport() {
  window.print()
}

// Build summary stats for a report
export function buildReportStats(expenses) {
  const byCategory = {}
  let total = 0
  let count = 0

  expenses.forEach((e) => {
    const amt = Number(e.amount) || 0
    byCategory[e.category] = (byCategory[e.category] || 0) + amt
    total += amt
    count += 1
  })

  const sortedByAmount = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => ({ category: cat, amount: amt }))

  const average = count > 0 ? total / count : 0
  const highest = sortedByAmount[0]
  const lowest = sortedByAmount[sortedByAmount.length - 1]

  return {
    total,
    count,
    average,
    byCategory: sortedByAmount,
    highest,
    lowest,
  }
}
