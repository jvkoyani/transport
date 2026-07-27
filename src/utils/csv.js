// Parse CSV text (handles quoted fields, commas in values, etc)
export function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return { headers: [], rows: [] }

  const headers = parseCSVLine(lines[0])
  const rows = lines.slice(1).map((line) => {
    const values = parseCSVLine(line)
    const obj = {}
    headers.forEach((h, i) => {
      obj[h.toLowerCase().trim()] = values[i] || ''
    })
    return obj
  })

  return { headers, rows }
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++ // skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result.map((s) => s.trim())
}

// Map CSV column names to expected field keys
export function mapCSVToFields(rows, fieldKeys) {
  return rows.map((row) => {
    const obj = {}
    fieldKeys.forEach((key) => {
      // Try exact match, then lowercase, then first match
      let val = row[key] || row[key.toLowerCase()] || ''
      if (!val) {
        const matched = Object.entries(row).find(([k]) =>
          k.toLowerCase().includes(key.toLowerCase()),
        )
        if (matched) val = matched[1]
      }
      obj[key] = val
    })
    return obj
  })
}
