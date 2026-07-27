import { getById } from './db.js'

export const money = (n) =>
  (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
export function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return iso
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
}

// Build the full computed view of a party invoice from its stored record.
export function buildInvoice(inv) {
  const partyName = (id) => getById('parties', id)?.name || ''
  const truckNo = (id) => getById('trucks', id)?.vehicleNumber || ''

  const lines = (inv.biltyIds || [])
    .map((bid) => getById('bilties', bid))
    .filter(Boolean)
    .map((b) => {
      const freight = Number(b.freightAmount) || 0
      const charges = Number(b.totalCharges) || 0
      const deduction = 0
      return {
        biltyId: b.id,
        lrNo: b.biltyNumber,
        date: fmtDate(b.date),
        route: `${b.from} To ${b.to}`,
        consignor: partyName(b.consignorId),
        consignee: partyName(b.consigneeId),
        truckNo: truckNo(b.truckId),
        freight,
        charges,
        deduction,
        amount: freight + charges - deduction,
      }
    })

  const freightTotal = lines.reduce((s, l) => s + l.freight, 0)
  const chargesTotal = lines.reduce((s, l) => s + l.charges, 0)
  const deductionTotal = lines.reduce((s, l) => s + l.deduction, 0)
  const taxable = lines.reduce((s, l) => s + l.amount, 0)

  const gstPct = Number(inv.gstPct) || 0
  const intra = (inv.gstType || 'Intra') === 'Intra'
  const cgst = intra ? (taxable * (gstPct / 2)) / 100 : 0
  const sgst = intra ? (taxable * (gstPct / 2)) / 100 : 0
  const igst = intra ? 0 : (taxable * gstPct) / 100
  const totalTax = cgst + sgst + igst
  const billAmount = taxable + totalTax

  const advanceTotal = (inv.advances || []).reduce((s, a) => s + (Number(a.amount) || 0), 0)
  const extraChargeTotal = (inv.extraCharges || []).reduce((s, c) => s + (Number(c.amount) || 0), 0)
  const paymentTotal = (inv.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const balance = billAmount - advanceTotal + extraChargeTotal - paymentTotal

  return {
    lines,
    freightTotal,
    chargesTotal,
    deductionTotal,
    taxable,
    gstPct,
    intra,
    cgst,
    sgst,
    igst,
    totalTax,
    billAmount,
    advanceTotal,
    extraChargeTotal,
    paymentTotal,
    balance,
  }
}

// ---- Indian-format amount to words (rupees + paise) ----
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigits(n) {
  if (n < 20) return ONES[n]
  return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '')
}

function threeDigits(n) {
  const h = Math.floor(n / 100)
  const rest = n % 100
  let out = ''
  if (h) out += ONES[h] + ' Hundred'
  if (rest) out += (out ? ' And ' : '') + twoDigits(rest)
  return out
}

function inWords(num) {
  if (num === 0) return 'Zero'
  const crore = Math.floor(num / 10000000)
  num %= 10000000
  const lakh = Math.floor(num / 100000)
  num %= 100000
  const thousand = Math.floor(num / 1000)
  num %= 1000
  const hundred = num
  let out = ''
  if (crore) out += twoDigits(crore) + ' Crore '
  if (lakh) out += twoDigits(lakh) + ' Lakh '
  if (thousand) out += twoDigits(thousand) + ' Thousand '
  if (hundred) out += threeDigits(hundred)
  return out.trim()
}

export function amountInWords(amount) {
  const rupees = Math.floor(amount)
  const paise = Math.round((amount - rupees) * 100)
  let words = 'INR ' + inWords(rupees) + ' Rupees'
  if (paise) words += ' And ' + inWords(paise) + ' Paise'
  return words + ' Only'
}
