import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { read, insert, update, getById, newId } from '../db.js'
import Modal from '../components/Modal.jsx'

const emptyMaterial = () => ({
  id: newId(),
  materialName: '',
  packingType: '',
  quantity: '',
  weightQuantity: '',
  weight: '',
  invoiceNumber: '',
  invoiceDate: '',
  hsnCode: '',
  valueOfGoods: '',
  privateMark: '',
})

function nextBiltyNumber() {
  const nums = read('bilties')
    .map((b) => parseInt(b.biltyNumber, 10))
    .filter((n) => !isNaN(n))
  return String((nums.length ? Math.max(...nums) : 4363) + 1)
}

export default function BiltyForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = getById('bilties', id)

  const [parties, setParties] = useState(read('parties'))
  const [trucks, setTrucks] = useState(read('trucks'))
  const [drivers, setDrivers] = useState(read('drivers'))
  const [modal, setModal] = useState(null) // 'truck' | 'driver' | 'consignor' | 'consignee' | 'paidBy'
  const [showFreight, setShowFreight] = useState(true)

  const [form, setForm] = useState(
    editing || {
      biltyNumber: nextBiltyNumber(),
      date: new Date().toISOString().slice(0, 10),
      from: '',
      to: '',
      truckId: '',
      shipmentMode: 'Road',
      vehicleSize: '',
      driverId: '',
      ewayBillNo: '',
      containerNo: '',
      ewayBillExpiry: '',
      consignorId: '',
      consigneeId: '',
      paidById: '',
      materials: [emptyMaterial()],
      insured: false,
      actualWeight: '',
      chargedWeight: '',
      rateType: 'FIXED',
      freightAmount: '',
      cgst: '',
      sgst: '',
      igst: '',
      charges: [],
      paymentType: 'To Be Billed',
      gstPaidBy: 'Transporter',
    },
  )

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // ---- Materials ----
  const setMaterial = (mid, key, value) =>
    setForm((f) => ({
      ...f,
      materials: f.materials.map((m) => (m.id === mid ? { ...m, [key]: value } : m)),
    }))
  const addMaterial = () =>
    setForm((f) => ({ ...f, materials: [...f.materials, emptyMaterial()] }))
  const removeMaterial = (mid) =>
    setForm((f) => ({
      ...f,
      materials: f.materials.length > 1 ? f.materials.filter((m) => m.id !== mid) : f.materials,
    }))

  // ---- Charges ----
  const addCharge = () =>
    setForm((f) => ({ ...f, charges: [...f.charges, { id: newId(), label: '', amount: '' }] }))
  const setCharge = (cid, key, value) =>
    setForm((f) => ({
      ...f,
      charges: f.charges.map((c) => (c.id === cid ? { ...c, [key]: value } : c)),
    }))
  const removeCharge = (cid) =>
    setForm((f) => ({ ...f, charges: f.charges.filter((c) => c.id !== cid) }))

  // ---- Freight calculations ----
  const calc = useMemo(() => {
    const freight = Number(form.freightAmount) || 0
    const taxPct = (Number(form.cgst) || 0) + (Number(form.sgst) || 0) + (Number(form.igst) || 0)
    const tax = (freight * taxPct) / 100
    const biltyAmount = freight + tax
    const totalCharges = form.charges.reduce((s, c) => s + (Number(c.amount) || 0), 0)
    const finalPayable = biltyAmount + totalCharges
    return { tax, biltyAmount, totalCharges, finalPayable }
  }, [form.freightAmount, form.cgst, form.sgst, form.igst, form.charges])

  const save = () => {
    if (!form.from.trim() || !form.to.trim()) {
      alert('From and To are required.')
      return
    }
    const payload = {
      ...form,
      tax: calc.tax,
      biltyAmount: calc.biltyAmount,
      totalCharges: calc.totalCharges,
      finalBiltyPayable: calc.finalPayable,
    }
    if (editing) update('bilties', editing.id, payload)
    else insert('bilties', payload)
    navigate('/bilty')
  }

  return (
    <div>
      <header className="topbar">
        <div className="form-title">
          <h2>Create Bilty</h2>
          <button className="btn btn-back" onClick={() => navigate('/bilty')}>
            ← Go Back
          </button>
        </div>
        <button className="btn btn-primary" onClick={save}>
          💾 SAVE
        </button>
      </header>

      <div className="page bilty-form">
        {/* ------- Column 1: Bilty Details + Parties ------- */}
        <div className="form-col">
          <section className="panel">
            <h3 className="panel-title">Bilty Details</h3>
            <div className="grid grid-2">
              <Field label="Bilty Number *">
                <input value={form.biltyNumber} onChange={(e) => set('biltyNumber', e.target.value)} />
              </Field>
              <Field label="Date *">
                <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
              </Field>
              <Field label="From *">
                <input value={form.from} onChange={(e) => set('from', e.target.value)} placeholder="Origin" />
              </Field>
              <Field label="To *">
                <input value={form.to} onChange={(e) => set('to', e.target.value)} placeholder="Destination" />
              </Field>
            </div>

            <FieldRowLabel label="Truck Number" onAdd={() => setModal('truck')} />
            <select value={form.truckId} onChange={(e) => set('truckId', e.target.value)}>
              <option value="">Select Vehicle</option>
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.vehicleNumber} — {t.type}
                </option>
              ))}
            </select>

            <div className="grid grid-2 mt">
              <Field label="Shipment Mode *">
                <select value={form.shipmentMode} onChange={(e) => set('shipmentMode', e.target.value)}>
                  <option>Road</option>
                  <option>Rail</option>
                  <option>Air</option>
                  <option>Sea</option>
                </select>
              </Field>
              <Field label="Vehicle Size">
                <input value={form.vehicleSize} onChange={(e) => set('vehicleSize', e.target.value)} />
              </Field>
            </div>

            <FieldRowLabel label="Driver" onAdd={() => setModal('driver')} />
            <select value={form.driverId} onChange={(e) => set('driverId', e.target.value)}>
              <option value="">Select Driver</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.phone}
                </option>
              ))}
            </select>

            <div className="grid grid-2 mt">
              <Field label="E-way Bill No.">
                <input value={form.ewayBillNo} onChange={(e) => set('ewayBillNo', e.target.value)} />
              </Field>
              <Field label="Container No.">
                <input value={form.containerNo} onChange={(e) => set('containerNo', e.target.value)} />
              </Field>
            </div>
            <Field label="E-way Bill Expiry Date">
              <input type="date" value={form.ewayBillExpiry} onChange={(e) => set('ewayBillExpiry', e.target.value)} />
            </Field>
          </section>

          <section className="panel">
            <h3 className="panel-title">Consignor &amp; Consignee Details</h3>
            <FieldRowLabel label="Consignor:" onAdd={() => setModal('consignor')} />
            <select value={form.consignorId} onChange={(e) => set('consignorId', e.target.value)}>
              <option value="">Select Consignor</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <FieldRowLabel label="Consignee:" onAdd={() => setModal('consignee')} />
            <select value={form.consigneeId} onChange={(e) => set('consigneeId', e.target.value)}>
              <option value="">Select Consignee</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <FieldRowLabel label="Paid By:" onAdd={() => setModal('paidBy')} />
            <select value={form.paidById} onChange={(e) => set('paidById', e.target.value)}>
              <option value="">Select Party</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </section>
        </div>

        {/* ------- Column 2: Material Details ------- */}
        <div className="form-col">
          <section className="panel">
            <h3 className="panel-title">Material Details</h3>
            {form.materials.map((m, i) => (
              <div key={m.id} className="material-block">
                {form.materials.length > 1 && (
                  <div className="material-head">
                    <span>Item {i + 1}</span>
                    <button className="link-danger" onClick={() => removeMaterial(m.id)}>
                      Remove
                    </button>
                  </div>
                )}
                <input
                  className="mb"
                  placeholder="Material Name"
                  value={m.materialName}
                  onChange={(e) => setMaterial(m.id, 'materialName', e.target.value)}
                />
                <div className="grid grid-2">
                  <input placeholder="Packing Type" value={m.packingType} onChange={(e) => setMaterial(m.id, 'packingType', e.target.value)} />
                  <input placeholder="Quantity" value={m.quantity} onChange={(e) => setMaterial(m.id, 'quantity', e.target.value)} />
                  <input placeholder="Weight/Quantity" value={m.weightQuantity} onChange={(e) => setMaterial(m.id, 'weightQuantity', e.target.value)} />
                  <input placeholder="Weight" value={m.weight} onChange={(e) => setMaterial(m.id, 'weight', e.target.value)} />
                  <input placeholder="Invoice Number" value={m.invoiceNumber} onChange={(e) => setMaterial(m.id, 'invoiceNumber', e.target.value)} />
                  <input type="date" placeholder="Invoice Date" value={m.invoiceDate} onChange={(e) => setMaterial(m.id, 'invoiceDate', e.target.value)} />
                  <input placeholder="HSN Code" value={m.hsnCode} onChange={(e) => setMaterial(m.id, 'hsnCode', e.target.value)} />
                  <input placeholder="Value of Goods" value={m.valueOfGoods} onChange={(e) => setMaterial(m.id, 'valueOfGoods', e.target.value)} />
                </div>
                <input
                  className="mt"
                  placeholder="Private Mark"
                  value={m.privateMark}
                  onChange={(e) => setMaterial(m.id, 'privateMark', e.target.value)}
                />
              </div>
            ))}
            <button className="btn btn-dark full mt" onClick={addMaterial}>
              + Add Items
            </button>

            <div className="insurance">
              <h4>Insurance Details</h4>
              <label className="radio">
                <input type="radio" checked={!form.insured} onChange={() => set('insured', false)} />
                Not Insured
              </label>
              <label className="radio">
                <input type="radio" checked={form.insured} onChange={() => set('insured', true)} />
                Insured
              </label>
            </div>
          </section>
        </div>

        {/* ------- Column 3: Freight Details ------- */}
        <div className="form-col">
          <section className="panel">
            <div className="panel-head-row">
              <h3 className="panel-title">Freight Details</h3>
              <label className="toggle">
                <span>Hide</span>
                <input type="checkbox" checked={showFreight} onChange={(e) => setShowFreight(e.target.checked)} />
              </label>
            </div>

            {showFreight && (
              <>
                <div className="grid grid-2">
                  <Field label="Actual Weight">
                    <input value={form.actualWeight} onChange={(e) => set('actualWeight', e.target.value)} />
                  </Field>
                  <Field label="Charged Weight">
                    <input value={form.chargedWeight} onChange={(e) => set('chargedWeight', e.target.value)} />
                  </Field>
                </div>
                <Field label="Rate Type *">
                  <select value={form.rateType} onChange={(e) => set('rateType', e.target.value)}>
                    <option>FIXED</option>
                    <option>PER KG</option>
                    <option>PER TON</option>
                    <option>PER QUANTITY</option>
                  </select>
                </Field>
                <Field label="Freight Amount">
                  <input type="number" value={form.freightAmount} onChange={(e) => set('freightAmount', e.target.value)} placeholder="0" />
                </Field>
                <div className="grid grid-2">
                  <Field label="CGST %">
                    <input type="number" value={form.cgst} onChange={(e) => set('cgst', e.target.value)} placeholder="0" />
                  </Field>
                  <Field label="SGST %">
                    <input type="number" value={form.sgst} onChange={(e) => set('sgst', e.target.value)} placeholder="0" />
                  </Field>
                  <Field label="IGST %">
                    <input type="number" value={form.igst} onChange={(e) => set('igst', e.target.value)} placeholder="0" />
                  </Field>
                  <Field label="TAX">
                    <input value={calc.tax.toFixed(2)} readOnly />
                  </Field>
                </div>
                <Field label="Bilty Amount">
                  <input value={calc.biltyAmount.toFixed(2)} readOnly />
                </Field>

                <div className="charges">
                  {form.charges.map((c) => (
                    <div key={c.id} className="charge-row">
                      <input placeholder="Charge label" value={c.label} onChange={(e) => setCharge(c.id, 'label', e.target.value)} />
                      <input type="number" placeholder="Amount" value={c.amount} onChange={(e) => setCharge(c.id, 'amount', e.target.value)} />
                      <button className="btn-remove" onClick={() => removeCharge(c.id)}>×</button>
                    </div>
                  ))}
                </div>
                <button className="btn btn-outline full" onClick={addCharge}>
                  + Add Charge
                </button>

                <Field label="Total Charges">
                  <input value={calc.totalCharges.toFixed(2)} readOnly />
                </Field>
                <Field label="Final Bilty Payable">
                  <input className="highlight" value={calc.finalPayable.toFixed(2)} readOnly />
                </Field>

                <div className="grid grid-2">
                  <Field label="Payment Type *">
                    <select value={form.paymentType} onChange={(e) => set('paymentType', e.target.value)}>
                      <option>To Be Billed</option>
                      <option>Paid</option>
                      <option>To Pay</option>
                    </select>
                  </Field>
                  <Field label="GST Paid By *">
                    <select value={form.gstPaidBy} onChange={(e) => set('gstPaidBy', e.target.value)}>
                      <option>Transporter</option>
                      <option>Consignor</option>
                      <option>Consignee</option>
                    </select>
                  </Field>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* ---- Quick add modals ---- */}
      {modal === 'truck' && (
        <QuickAdd
          title="Add Truck"
          fields={[
            { key: 'vehicleNumber', label: 'Vehicle Number', required: true },
            { key: 'type', label: 'Type' },
            { key: 'size', label: 'Size' },
            { key: 'capacity', label: 'Capacity (tons)' },
          ]}
          onClose={() => setModal(null)}
          onSave={(data) => {
            const rec = insert('trucks', data)
            setTrucks(read('trucks'))
            set('truckId', rec.id)
            setModal(null)
          }}
        />
      )}
      {modal === 'driver' && (
        <QuickAdd
          title="Add Driver"
          fields={[
            { key: 'name', label: 'Driver Name', required: true },
            { key: 'phone', label: 'Phone' },
            { key: 'license', label: 'License No.' },
          ]}
          onClose={() => setModal(null)}
          onSave={(data) => {
            const rec = insert('drivers', data)
            setDrivers(read('drivers'))
            set('driverId', rec.id)
            setModal(null)
          }}
        />
      )}
      {(modal === 'consignor' || modal === 'consignee' || modal === 'paidBy') && (
        <QuickAdd
          title="Add Party"
          fields={[
            { key: 'name', label: 'Party Name', required: true },
            { key: 'city', label: 'City' },
            { key: 'gstin', label: 'GSTIN' },
            { key: 'phone', label: 'Phone' },
          ]}
          onClose={() => setModal(null)}
          onSave={(data) => {
            const rec = insert('parties', data)
            setParties(read('parties'))
            if (modal === 'consignor') set('consignorId', rec.id)
            if (modal === 'consignee') set('consigneeId', rec.id)
            if (modal === 'paidBy') set('paidById', rec.id)
            setModal(null)
          }}
        />
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function FieldRowLabel({ label, onAdd }) {
  return (
    <div className="field-row-label">
      <span>{label}</span>
      <button className="btn-mini" onClick={onAdd} type="button">
        + Add
      </button>
    </div>
  )
}

function QuickAdd({ title, fields, onSave, onClose }) {
  const [data, setData] = useState({})
  const submit = () => {
    const missing = fields.find((f) => f.required && !(data[f.key] || '').trim())
    if (missing) {
      alert(missing.label + ' is required.')
      return
    }
    onSave(data)
  }
  return (
    <Modal title={title} onClose={onClose}>
      {fields.map((f) => (
        <label className="field" key={f.key}>
          <span>
            {f.label}
            {f.required ? ' *' : ''}
          </span>
          <input
            value={data[f.key] || ''}
            onChange={(e) => setData((d) => ({ ...d, [f.key]: e.target.value }))}
          />
        </label>
      ))}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit}>Save</button>
      </div>
    </Modal>
  )
}
