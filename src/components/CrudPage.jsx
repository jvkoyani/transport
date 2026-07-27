import { useState } from 'react'
import { read, insert, update, remove } from '../db.js'
import Modal from './Modal.jsx'
import BulkImportModal from './BulkImportModal.jsx'

// Generic master-data page: a titled list + add/edit modal + bulk import.
export default function CrudPage({ title, collection, columns }) {
  const [rows, setRows] = useState(read(collection))
  const [editing, setEditing] = useState(null) // record or {} for new
  const [search, setSearch] = useState('')
  const [showBulk, setShowBulk] = useState(false)

  const refresh = () => setRows(read(collection))

  const save = (data) => {
    if (editing.id) update(collection, editing.id, data)
    else insert(collection, data)
    refresh()
    setEditing(null)
  }

  const del = (id) => {
    if (confirm('Delete this record?')) {
      remove(collection, id)
      refresh()
    }
  }

  const bulkImport = (records) => {
    if (records.length === 0) return
    let imported = 0
    records.forEach((rec) => {
      const missing = columns.find((c) => c.required && !String(rec[c.key] || '').trim())
      if (!missing) {
        insert(collection, rec)
        imported++
      }
    })
    alert(`Imported ${imported} of ${records.length} records.${imported < records.length ? ' Some were skipped due to missing required fields.' : ''}`)
    refresh()
  }

  const q = search.trim().toLowerCase()
  const filtered = q
    ? rows.filter((r) =>
        columns.some((c) => String(r[c.key] || '').toLowerCase().includes(q)),
      )
    : rows

  return (
    <div>
      <header className="topbar">
        <input
          className="topbar-search"
          placeholder={`Search ${title}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setShowBulk(true)}>
            📤 Bulk Import
          </button>
          <button className="btn btn-primary" onClick={() => setEditing({})}>
            + ADD
          </button>
        </div>
      </header>

      <div className="page">
        <div className="list-toolbar">
          <span className="count-badge">
            {title} ➜ {rows.length}
          </span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="empty-cell">
                    No records. Click <strong>+ ADD</strong> to create one.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id}>
                  {columns.map((c) => (
                    <td key={c.key}>{r[c.key]}</td>
                  ))}
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn icon-edit" onClick={() => setEditing(r)}>
                        ✎
                      </button>
                      <button className="icon-btn icon-del" onClick={() => del(r.id)}>
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

      {showBulk && (
        <BulkImportModal
          title={title}
          fieldKeys={columns.map((c) => c.key)}
          onImport={bulkImport}
          onClose={() => setShowBulk(false)}
        />
      )}

      {editing && (
        <RecordModal
          title={`${editing.id ? 'Edit' : 'Add'} ${title}`}
          columns={columns}
          record={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  )
}

function RecordModal({ title, columns, record, onClose, onSave }) {
  const [data, setData] = useState(record)
  const submit = () => {
    const missing = columns.find((c) => c.required && !String(data[c.key] || '').trim())
    if (missing) {
      alert(missing.label + ' is required.')
      return
    }
    onSave(data)
  }
  return (
    <Modal title={title} onClose={onClose}>
      {columns.map((c) => (
        <label className="field" key={c.key}>
          <span>
            {c.label}
            {c.required ? ' *' : ''}
          </span>
          <input
            value={data[c.key] || ''}
            onChange={(e) => setData((d) => ({ ...d, [c.key]: e.target.value }))}
          />
        </label>
      ))}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={submit}>
          Save
        </button>
      </div>
    </Modal>
  )
}
