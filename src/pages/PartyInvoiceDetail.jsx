import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getById, update, newId } from '../db.js'
import { buildInvoice, money } from '../invoice.js'

export default function PartyInvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const inv = getById('partyInvoices', id)

  useEffect(() => {
    if (inv) document.title = `Invoice ${inv.invoiceNumber}`
  }, [inv])

  if (!inv) {
    return (
      <div className="page">
        <p>Invoice not found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/party-invoice')}>Back</button>
      </div>
    )
  }

  const party = getById('parties', inv.partyId)
  const computed = buildInvoice(inv)

  return (
    <div>
      <header className="topbar">
        <div className="form-title">
          <h2>Party Invoice</h2>
          <Link to="/party-invoice" className="btn btn-back">← Go Back</Link>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => navigate(`/party-invoice/${id}/print`)}>
            🖨 Print
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/party-invoice/${id}/edit`)}>
            ✎ Edit
          </button>
          <button className="btn btn-danger" onClick={() => {
            if (confirm('Delete?')) {
              navigate('/party-invoice')
            }
          }}>DELETE</button>
        </div>
      </header>

      <div className="page">
        <div style={{ maxWidth: 900 }}>
          {/* Header */}
          <div className="invoice-header">
            <div>
              <h3>Bill Number</h3>
              <p className="big">{inv.invoiceNumber}</p>
            </div>
            <div>
              <h3>Bill Date</h3>
              <p className="big">{inv.date}</p>
            </div>
            <div>
              <h3>Party Name</h3>
              <p className="big">{party?.name || '—'}</p>
            </div>
            <div>
              <h3>Bill Amount</h3>
              <p className="big">₹{money(computed.billAmount)}</p>
            </div>
          </div>

          {/* Customer Amount section */}
          <div className="panel">
            <h4>Customer Amount</h4>
            <p className="panel-amount">₹{money(computed.billAmount)}</p>

            {/* Advances */}
            <div className="invoice-section">
              <div className="invoice-section-head">
                <span>(-) Advance</span>
                <button
                  className="btn-mini"
                  onClick={() => {
                    const amount = prompt('Advance amount:')
                    if (amount) {
                      const adv = [...(inv.advances || []), { id: newId(), amount }]
                      update('partyInvoices', id, { advances: adv })
                    }
                  }}
                >
                  + Add Advance
                </button>
              </div>
              {(!inv.advances || inv.advances.length === 0) ? (
                <p className="section-empty">0.00</p>
              ) : (
                <ul className="invoice-items">
                  {inv.advances.map((a) => (
                    <li key={a.id}>
                      <span>₹{money(a.amount)}</span>
                      <button
                        className="link-danger"
                        onClick={() => {
                          const adv = inv.advances.filter((x) => x.id !== a.id)
                          update('partyInvoices', id, { advances: adv })
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="section-total">₹{money(computed.advanceTotal)}</p>
            </div>

            {/* Extra Charges */}
            <div className="invoice-section">
              <div className="invoice-section-head">
                <span>(+) Charges</span>
                <button
                  className="btn-mini"
                  onClick={() => {
                    const desc = prompt('Charge description:')
                    const amount = prompt('Amount:')
                    if (desc && amount) {
                      const ch = [...(inv.extraCharges || []), { id: newId(), desc, amount }]
                      update('partyInvoices', id, { extraCharges: ch })
                    }
                  }}
                >
                  + Add Charge
                </button>
              </div>
              {(!inv.extraCharges || inv.extraCharges.length === 0) ? (
                <p className="section-empty">0.00</p>
              ) : (
                <ul className="invoice-items">
                  {inv.extraCharges.map((c) => (
                    <li key={c.id}>
                      <span>{c.desc}</span>
                      <span>₹{money(c.amount)}</span>
                      <button
                        className="link-danger"
                        onClick={() => {
                          const ch = inv.extraCharges.filter((x) => x.id !== c.id)
                          update('partyInvoices', id, { extraCharges: ch })
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="section-total">₹{money(computed.extraChargeTotal)}</p>
            </div>

            {/* Payments */}
            <div className="invoice-section">
              <div className="invoice-section-head">
                <span>(-) Payments</span>
                <button
                  className="btn-mini"
                  onClick={() => {
                    const desc = prompt('Payment method:')
                    const amount = prompt('Amount:')
                    if (desc && amount) {
                      const pmt = [...(inv.payments || []), { id: newId(), desc, amount }]
                      update('partyInvoices', id, { payments: pmt })
                    }
                  }}
                >
                  + Add Payment
                </button>
              </div>
              {(!inv.payments || inv.payments.length === 0) ? (
                <p className="section-empty">0.00</p>
              ) : (
                <ul className="invoice-items">
                  {inv.payments.map((p) => (
                    <li key={p.id}>
                      <span>{p.desc}</span>
                      <span>₹{money(p.amount)}</span>
                      <button
                        className="link-danger"
                        onClick={() => {
                          const pmt = inv.payments.filter((x) => x.id !== p.id)
                          update('partyInvoices', id, { payments: pmt })
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="section-total">₹{money(computed.paymentTotal)}</p>
            </div>

            {/* Balance */}
            <div className="invoice-balance">
              <span>Balance</span>
              <span className="balance-amount">₹{money(computed.balance)}</span>
            </div>
          </div>

          {/* Document Links */}
          <div className="panel">
            <h4>Document</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn-outline full"
                onClick={() => navigate(`/party-invoice/${id}/print`)}
              >
                VIEW — Party Invoice Copy
              </button>
              <button
                className="btn btn-outline full"
                onClick={() => navigate(`/party-invoice/${id}/print-no-annex`)}
              >
                VIEW — Party Invoice Copy (Without Annexure)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
