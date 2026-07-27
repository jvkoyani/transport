import { useState } from 'react'
import Modal from './Modal.jsx'
import { parseCSV, mapCSVToFields } from '../utils/csv.js'

export default function BulkImportModal({ title, fieldKeys, onImport, onClose }) {
  const [input, setInput] = useState('')
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')

  const parseAndPreview = () => {
    setError('')
    try {
      if (!input.trim()) {
        setError('Paste CSV data or upload a file.')
        return
      }

      const { rows } = parseCSV(input)
      if (rows.length === 0) {
        setError('No data found. Make sure you include headers.')
        return
      }

      const mapped = mapCSVToFields(rows, fieldKeys)
      setPreview(mapped)
    } catch (err) {
      setError('Parse error: ' + err.message)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setInput(ev.target.result)
    }
    reader.readAsText(file)
  }

  const doImport = () => {
    if (!preview || preview.length === 0) return
    onImport(preview)
    onClose()
  }

  const downloadTemplate = () => {
    const csv = fieldKeys.join(',') + '\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase()}-template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal title={`Bulk Import — ${title}`} onClose={onClose}>
      {!preview ? (
        <>
          <p className="modal-hint">
            Paste CSV data or upload a file. Expected columns: <code>{fieldKeys.join(', ')}</code>
          </p>

          <label className="field">
            <span>CSV Data</span>
            <textarea
              rows="8"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`${fieldKeys.join('\t')}\nvalue1\tvalue2\t...`}
            />
          </label>

          <label className="field">
            <span>Or upload a file</span>
            <input type="file" accept=".csv,.xlsx,.txt" onChange={handleFileUpload} />
          </label>

          {error && <p className="error-msg">{error}</p>}

          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={downloadTemplate}>
              📥 Download Template
            </button>
            <button className="btn btn-primary" onClick={parseAndPreview}>
              Preview
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="modal-hint">
            Found <strong>{preview.length}</strong> record(s). Review and confirm to import.
          </p>

          <div className="bulk-preview">
            <table className="data-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  {fieldKeys.map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {fieldKeys.map((k) => (
                      <td key={k}>{row[k]}</td>
                    ))}
                  </tr>
                ))}
                {preview.length > 5 && (
                  <tr>
                    <td colSpan={fieldKeys.length} style={{ textAlign: 'center', color: '#64748b' }}>
                      … and {preview.length - 5} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setPreview(null)}>
              ← Back
            </button>
            <button className="btn btn-primary" onClick={doImport}>
              ✓ Import {preview.length} Records
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
