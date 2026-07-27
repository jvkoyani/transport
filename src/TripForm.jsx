import { useState } from 'react'
import { newId } from './storage.js'

const emptyProduct = () => ({ id: newId(), name: '', quantity: '', unit: 'Boxes', weight: '' })

const emptyTrip = () => ({
  from: '',
  to: '',
  date: new Date().toISOString().slice(0, 10),
  truck: { number: '', type: 'Open Body', driver: '', phone: '', capacity: '' },
  products: [emptyProduct()],
  freight: '',
  notes: '',
})

export default function TripForm({ onSave, onCancel }) {
  const [trip, setTrip] = useState(emptyTrip())
  const [errors, setErrors] = useState({})

  const setField = (path, value) => {
    setTrip((t) => {
      const next = structuredClone(t)
      const keys = path.split('.')
      let ref = next
      for (let i = 0; i < keys.length - 1; i++) ref = ref[keys[i]]
      ref[keys[keys.length - 1]] = value
      return next
    })
  }

  const setProduct = (id, key, value) => {
    setTrip((t) => ({
      ...t,
      products: t.products.map((p) => (p.id === id ? { ...p, [key]: value } : p)),
    }))
  }

  const addProduct = () =>
    setTrip((t) => ({ ...t, products: [...t.products, emptyProduct()] }))

  const removeProduct = (id) =>
    setTrip((t) => ({
      ...t,
      products: t.products.length > 1 ? t.products.filter((p) => p.id !== id) : t.products,
    }))

  const validate = () => {
    const e = {}
    if (!trip.from.trim()) e.from = 'Origin is required'
    if (!trip.to.trim()) e.to = 'Destination is required'
    if (!trip.truck.number.trim()) e.truckNumber = 'Truck number is required'
    if (!trip.products.some((p) => p.name.trim())) e.products = 'Add at least one product'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    if (!validate()) return
    onSave({
      ...trip,
      id: newId(),
      createdAt: Date.now(),
      status: 'Scheduled',
      products: trip.products.filter((p) => p.name.trim()),
    })
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="form-head">
        <h2>New Trip</h2>
        <p>Record a consignment with route, truck and product details.</p>
      </div>

      {/* Route */}
      <section className="fieldset">
        <h3>Route</h3>
        <div className="grid grid-3">
          <label className="field">
            <span>From (Origin) *</span>
            <input
              value={trip.from}
              onChange={(e) => setField('from', e.target.value)}
              placeholder="e.g. Ahmedabad"
              className={errors.from ? 'error' : ''}
            />
            {errors.from && <em>{errors.from}</em>}
          </label>
          <label className="field">
            <span>To (Destination) *</span>
            <input
              value={trip.to}
              onChange={(e) => setField('to', e.target.value)}
              placeholder="e.g. Mumbai"
              className={errors.to ? 'error' : ''}
            />
            {errors.to && <em>{errors.to}</em>}
          </label>
          <label className="field">
            <span>Dispatch Date</span>
            <input
              type="date"
              value={trip.date}
              onChange={(e) => setField('date', e.target.value)}
            />
          </label>
        </div>
      </section>

      {/* Truck */}
      <section className="fieldset">
        <h3>Truck Details</h3>
        <div className="grid grid-3">
          <label className="field">
            <span>Truck Number *</span>
            <input
              value={trip.truck.number}
              onChange={(e) => setField('truck.number', e.target.value.toUpperCase())}
              placeholder="GJ-01-AB-1234"
              className={errors.truckNumber ? 'error' : ''}
            />
            {errors.truckNumber && <em>{errors.truckNumber}</em>}
          </label>
          <label className="field">
            <span>Truck Type</span>
            <select
              value={trip.truck.type}
              onChange={(e) => setField('truck.type', e.target.value)}
            >
              <option>Open Body</option>
              <option>Container</option>
              <option>Trailer</option>
              <option>Tanker</option>
              <option>Tipper</option>
              <option>Refrigerated</option>
            </select>
          </label>
          <label className="field">
            <span>Capacity (tons)</span>
            <input
              type="number"
              min="0"
              value={trip.truck.capacity}
              onChange={(e) => setField('truck.capacity', e.target.value)}
              placeholder="e.g. 16"
            />
          </label>
          <label className="field">
            <span>Driver Name</span>
            <input
              value={trip.truck.driver}
              onChange={(e) => setField('truck.driver', e.target.value)}
              placeholder="e.g. Ramesh Bhai"
            />
          </label>
          <label className="field">
            <span>Driver Phone</span>
            <input
              value={trip.truck.phone}
              onChange={(e) => setField('truck.phone', e.target.value)}
              placeholder="10-digit mobile"
            />
          </label>
          <label className="field">
            <span>Freight (₹)</span>
            <input
              type="number"
              min="0"
              value={trip.freight}
              onChange={(e) => setField('freight', e.target.value)}
              placeholder="e.g. 25000"
            />
          </label>
        </div>
      </section>

      {/* Products */}
      <section className="fieldset">
        <div className="fieldset-head">
          <h3>Product Details</h3>
          <button type="button" className="btn btn-ghost" onClick={addProduct}>
            + Add Product
          </button>
        </div>
        {errors.products && <em className="row-error">{errors.products}</em>}
        <div className="products">
          {trip.products.map((p, i) => (
            <div className="product-row" key={p.id}>
              <span className="product-index">{i + 1}</span>
              <input
                placeholder="Product name"
                value={p.name}
                onChange={(e) => setProduct(p.id, 'name', e.target.value)}
              />
              <input
                type="number"
                min="0"
                placeholder="Qty"
                value={p.quantity}
                onChange={(e) => setProduct(p.id, 'quantity', e.target.value)}
              />
              <select value={p.unit} onChange={(e) => setProduct(p.id, 'unit', e.target.value)}>
                <option>Boxes</option>
                <option>Bags</option>
                <option>Pallets</option>
                <option>Pieces</option>
                <option>Drums</option>
                <option>Rolls</option>
              </select>
              <input
                type="number"
                min="0"
                placeholder="Weight (kg)"
                value={p.weight}
                onChange={(e) => setProduct(p.id, 'weight', e.target.value)}
              />
              <button
                type="button"
                className="btn-remove"
                onClick={() => removeProduct(p.id)}
                aria-label="Remove product"
                disabled={trip.products.length === 1}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="fieldset">
        <label className="field">
          <span>Notes</span>
          <textarea
            rows="2"
            value={trip.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="Any special instructions…"
          />
        </label>
      </section>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save Trip
        </button>
      </div>
    </form>
  )
}
