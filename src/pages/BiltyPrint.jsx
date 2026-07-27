import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getById } from '../db.js'
import { useCompanySettings } from '../hooks/useCompanySettings.js'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return iso
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
const money = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })

export default function BiltyPrint() {
  const { id } = useParams()
  const navigate = useNavigate()
  const settings = useCompanySettings()
  const b = getById('bilties', id)

  useEffect(() => {
    document.title = b ? `Bilty ${b.biltyNumber} — LR` : 'Bilty'
  }, [b])

  if (!b) {
    return (
      <div className="page">
        <p>Bilty not found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/bilty')}>Back</button>
      </div>
    )
  }

  const consignor = getById('parties', b.consignorId)
  const consignee = getById('parties', b.consigneeId)
  const paidBy = getById('parties', b.paidById)
  const truck = getById('trucks', b.truckId)
  const driver = getById('drivers', b.driverId)
  const materials = b.materials || []

  return (
    <div className="print-page">
      <div className="print-toolbar no-print">
        <button className="btn btn-ghost" onClick={() => navigate('/bilty')}>← Back</button>
        <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print / Save as PDF</button>
      </div>

      <div className="lr">
        <div className="lr-head">
          <div className="lr-company">
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="lr-logo" />
            ) : (
              <img src="/truck.svg" alt="" className="lr-logo" />
            )}
            <div>
              <h1>{settings.companyName}</h1>
              <p>{settings.tagline}</p>
              <p className="lr-sub">GSTIN: {settings.gstin} · Mob: {settings.phone}</p>
            </div>
          </div>
          <div className="lr-title">
            <span>LORRY RECEIPT</span>
            <table className="lr-meta">
              <tbody>
                <tr><td>LR / Bilty No.</td><td><strong>{b.biltyNumber}</strong></td></tr>
                <tr><td>Date</td><td>{fmtDate(b.date)}</td></tr>
                <tr><td>Payment</td><td>{b.paymentType || '—'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="lr-parties">
          <div className="lr-box">
            <h4>Consignor (From)</h4>
            <strong>{consignor?.name || '—'}</strong>
            <p>{consignor?.city || ''}</p>
            <p>{consignor?.gstin ? 'GSTIN: ' + consignor.gstin : ''}</p>
          </div>
          <div className="lr-box">
            <h4>Consignee (To)</h4>
            <strong>{consignee?.name || '—'}</strong>
            <p>{consignee?.city || ''}</p>
            <p>{consignee?.gstin ? 'GSTIN: ' + consignee.gstin : ''}</p>
          </div>
        </div>

        <div className="lr-route">
          <div><span>From</span><strong>{b.from}</strong></div>
          <div className="lr-route-arrow">➜</div>
          <div><span>To</span><strong>{b.to}</strong></div>
          <div><span>Vehicle No.</span><strong>{truck?.vehicleNumber || '—'}</strong></div>
          <div><span>Vehicle Type</span><strong>{truck?.type || '—'}</strong></div>
          <div><span>Driver</span><strong>{driver?.name || '—'}</strong></div>
        </div>

        <div className="lr-route lr-route-2">
          <div><span>Shipment Mode</span><strong>{b.shipmentMode || '—'}</strong></div>
          <div><span>E-way Bill</span><strong>{b.ewayBillNo || '—'}</strong></div>
          <div><span>Container No.</span><strong>{b.containerNo || '—'}</strong></div>
          <div><span>Insurance</span><strong>{b.insured ? 'Insured' : 'Not Insured'}</strong></div>
          <div><span>Paid By</span><strong>{paidBy?.name || '—'}</strong></div>
        </div>

        <table className="lr-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Material</th>
              <th>Packing</th>
              <th>Qty</th>
              <th>Weight</th>
              <th>Invoice No.</th>
              <th>HSN</th>
              <th>Value of Goods</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 && (
              <tr><td colSpan="8" className="lr-empty">No material details</td></tr>
            )}
            {materials.map((m, i) => (
              <tr key={m.id || i}>
                <td>{i + 1}</td>
                <td>{m.materialName}</td>
                <td>{m.packingType}</td>
                <td>{m.quantity}</td>
                <td>{m.weight}</td>
                <td>{m.invoiceNumber}</td>
                <td>{m.hsnCode}</td>
                <td>{m.valueOfGoods}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="lr-bottom">
          <div className="lr-notes">
            <h4>Private Mark</h4>
            <p>{materials.map((m) => m.privateMark).filter(Boolean).join(', ') || '—'}</p>
            <p className="lr-terms">
              {settings.termsConditions}
            </p>
          </div>
          <table className="lr-freight">
            <tbody>
              <tr><td>Freight Amount</td><td>{money(b.freightAmount)}</td></tr>
              <tr><td>Tax</td><td>{money(b.tax)}</td></tr>
              <tr><td>Bilty Amount</td><td>{money(b.biltyAmount)}</td></tr>
              <tr><td>Other Charges</td><td>{money(b.totalCharges)}</td></tr>
              <tr className="lr-total">
                <td>Final Bilty Payable</td>
                <td>{money(b.finalBiltyPayable)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="lr-sign">
          <div>Receiver's Signature</div>
          <div>For {settings.companyName}</div>
        </div>
      </div>
    </div>
  )
}
