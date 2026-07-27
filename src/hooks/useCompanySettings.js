import { useMemo } from 'react'
import { read } from '../db.js'

const DEFAULT_SETTINGS = {
  companyName: 'PUSHPAK ROADLINES',
  tagline: 'Transport Contractors & Commission Agents',
  address: 'SHOP NO.: F-1, SHREE RANG PLAZA, PLOT NO. 109/28, PANOLI GIDC, ANKLESHWAR, BHARUCH, GUJARAT - 394116',
  phone: '9825532516',
  email: 'pushpakroadlines2019@gmail.com',
  pan: 'AAXFP5355J',
  gstin: '24AAXFP5355J1ZL',
  bankName: 'HDFC BANK',
  accountNo: '50200041283027',
  ifsc: 'HDFC0000255',
  logo: '',
  currency: 'INR',
  currencySymbol: '₹',
  locale: 'en-IN',
  primaryColor: '#2563eb',
  secondaryColor: '#4f46e5',
  accentColor: '#e0562d',
  invoiceFooter: 'This is a computer-generated report and does not require a signature.',
  termsConditions: 'Goods transported at owner\'s risk. Company not responsible for leakage, breakage or loss by fire/accident.',
}

export function useCompanySettings() {
  return useMemo(() => {
    const stored = read('settings')
    return stored.length > 0 ? { ...DEFAULT_SETTINGS, ...stored[0] } : DEFAULT_SETTINGS
  }, [])
}
