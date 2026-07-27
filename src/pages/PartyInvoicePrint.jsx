import { useParams, useNavigate } from 'react-router-dom'
import { getById } from '../db.js'
import { buildInvoice, money, amountInWords, fmtDate } from '../invoice.js'
import { useCompanySettings } from '../hooks/useCompanySettings.js'

export default function PartyInvoicePrint() {
  const { id, format } = useParams()
  const navigate = useNavigate()
  const settings = useCompanySettings()
  const inv = getById('partyInvoices', id)

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
  const showAnnexure = format !== 'no-annex'

  return (
    <div className="print-page">
      <div className="print-toolbar no-print">
        <button className="btn btn-ghost" onClick={() => navigate(`/party-invoice/${id}`)}>← Back</button>
        <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print / Save as PDF</button>
      </div>

      <div className="invoice">
        {/* ========== MAIN INVOICE ========== */}
        <div className="invoice-main">
          {/* Header */}
          <table className="invoice-head">
            <tbody>
              <tr>
                <td colSpan="2">
                  <div className="company-head">
                    <div>
                      <h1>{settings.companyName}</h1>
                      <p className="tagline">{settings.tagline}</p>
                      <p className="detail">{settings.address}</p>
                      <p className="detail">Phone: {settings.phone} | E-mail: {settings.email}</p>
                      <p className="detail">PAN No.: {settings.pan}</p>
                      <p className="detail">GSTIN: {settings.gstin}</p>
                    </div>
                    <div className="invoice-title">TAX INVOICE</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Customer & Invoice Details */}
          <table className="invoice-details" cellPadding="6" cellSpacing="0">
            <tbody>
              <tr className="row-2col">
                <td colSpan="1">
                  <strong>Customer :</strong> {party?.name || '—'}<br />
                  <strong>Address :</strong> {party?.city || '—'}<br />
                  <strong>GSTIN :</strong> {party?.gstin || '—'}
                </td>
                <td colSpan="1">
                  <strong>Invoice Number :</strong> {inv.invoiceNumber}<br />
                  <strong>Invoice Date :</strong> {inv.date}<br />
                  <strong>Invoice Branch :</strong> {settings.address.split(',')[0]}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Line items table */}
          <table className="invoice-items-table" cellPadding="6" cellSpacing="0">
            <thead>
              <tr>
                <th>LR No.</th>
                <th>Date</th>
                <th>Route</th>
                <th>Consignor</th>
                <th>Consignee</th>
                <th>Truck No.</th>
                <th>Freight</th>
                <th>Charges</th>
                <th>Deduction</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {computed.lines.map((line) => (
                <tr key={line.biltyId}>
                  <td align="center">{line.lrNo}</td>
                  <td align="center">{line.date}</td>
                  <td>{line.route}</td>
                  <td>{line.consignor}</td>
                  <td>{line.consignee}</td>
                  <td align="center">{line.truckNo}</td>
                  <td align="right">{money(line.freight)}</td>
                  <td align="right">{money(line.charges)}</td>
                  <td align="right">{money(line.deduction)}</td>
                  <td align="right"><strong>{money(line.amount)}</strong></td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan="6"><strong>Total</strong></td>
                <td align="right"><strong>{money(computed.freightTotal)}</strong></td>
                <td align="right"><strong>{money(computed.chargesTotal)}</strong></td>
                <td align="right"><strong>{money(computed.deductionTotal)}</strong></td>
                <td align="right"><strong>{money(computed.taxable)}</strong></td>
              </tr>
            </tbody>
          </table>

          {/* Bank & Tax details */}
          <table className="invoice-footer">
            <tbody>
              <tr>
                <td style={{ width: '50%', verticalAlign: 'top' }}>
                  <p>
                    <strong>PAYMENTS SHOULD BE MADE INTO THE FAVOUR OF</strong><br />
                    M/s "{settings.companyName}"<br />
                    Bank Name : {settings.bankName}<br />
                    Account No. : {settings.accountNo}<br />
                    IFSC/RTGS CODE: {settings.ifsc}
                  </p>
                </td>
                <td style={{ verticalAlign: 'top' }}>
                  <table className="tax-summary">
                    <tbody>
                      {computed.intra ? (
                        <>
                          <tr>
                            <td>CGST ({computed.gstPct / 2}%)</td>
                            <td align="right">{money(computed.cgst)}</td>
                          </tr>
                          <tr>
                            <td>SGST ({computed.gstPct / 2}%)</td>
                            <td align="right">{money(computed.sgst)}</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td>IGST ({computed.gstPct}%)</td>
                          <td align="right">{money(computed.igst)}</td>
                        </tr>
                      )}
                      <tr>
                        <td>Total Tax</td>
                        <td align="right">{money(computed.totalTax)}</td>
                      </tr>
                      <tr style={{ fontWeight: 'bold', borderTop: '2px solid #000' }}>
                        <td>Amount</td>
                        <td align="right">{money(computed.billAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Remarks & Signature */}
          <table className="invoice-remarks">
            <tbody>
              <tr>
                <td style={{ width: '50%' }}>
                  <p>
                    <strong>Remarks:</strong>
                  </p>
                  <p>
                    <strong>Amount In Words:</strong><br />
                    {amountInWords(computed.billAmount)}
                  </p>
                </td>
                <td style={{ verticalAlign: 'bottom', textAlign: 'center' }}>
                  <p>Checked By</p>
                  <p style={{ height: 60 }}></p>
                </td>
                <td style={{ verticalAlign: 'bottom', textAlign: 'center' }}>
                  <p>Received By</p>
                  <p style={{ height: 60 }}></p>
                </td>
                <td style={{ verticalAlign: 'bottom', textAlign: 'center' }}>
                  <p>FOR {settings.companyName}</p>
                  <p style={{ height: 60 }}></p>
                  <p>Authorised Signatory</p>
                </td>
              </tr>
            </tbody>
          </table>

          <p className="invoice-footer-text">
            {settings.invoiceFooter}
          </p>
        </div>

        {/* ========== ANNEXURE (conditional) ========== */}
        {showAnnexure && (
          <div className="invoice-annexure page-break">
            <h2 className="annexure-title">Annexure</h2>
            <table className="invoice-items-table" cellPadding="6" cellSpacing="0">
              <thead>
                <tr>
                  <th>LR No.</th>
                  <th>Date</th>
                  <th>Route</th>
                  <th>Consignee</th>
                  <th>Truck No.</th>
                </tr>
              </thead>
              <tbody>
                {computed.lines.map((line) => (
                  <tr key={line.biltyId}>
                    <td align="center">{line.lrNo}</td>
                    <td align="center">{line.date}</td>
                    <td>{line.route}</td>
                    <td>{line.consignee}</td>
                    <td align="center">{line.truckNo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="invoice-powered">
          Powered By <strong>{settings.companyName}</strong>
        </div>
      </div>
    </div>
  )
}
