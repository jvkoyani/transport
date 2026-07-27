import { useEffect, useState } from 'react'
import { read, write } from '../db.js'

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
  logo: '', // base64 encoded image
  currency: 'INR',
  currencySymbol: '₹',
  locale: 'en-IN',
  primaryColor: '#2563eb',
  secondaryColor: '#4f46e5',
  accentColor: '#e0562d',
  invoiceFooter: 'This is a computer-generated report and does not require a signature.',
  termsConditions: 'Goods transported at owner\'s risk. Company not responsible for leakage, breakage or loss by fire/accident.',
}

export default function Setup() {
  const [settings, setSettings] = useState(() => {
    const stored = read('settings')
    return stored.length > 0 ? stored[0] : DEFAULT_SETTINGS
  })

  const [logoPreview, setLogoPreview] = useState(settings.logo)
  const [tab, setTab] = useState('company')
  const [saved, setSaved] = useState(false)

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }))

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target.result
      set('logo', base64)
      setLogoPreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const save = () => {
    write('settings', [settings])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const reset = () => {
    if (confirm('Reset to default settings?')) {
      setSettings(DEFAULT_SETTINGS)
      setLogoPreview(DEFAULT_SETTINGS.logo)
    }
  }

  return (
    <div>
      <header className="topbar">
        <h2 className="page-heading">Setup & Branding</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={reset}>
            🔄 Reset to Default
          </button>
          <button className="btn btn-primary" onClick={save}>
            💾 Save Settings
          </button>
        </div>
      </header>

      {saved && (
        <div className="save-notification">
          ✓ Settings saved successfully
        </div>
      )}

      <div className="page">
        <div className="setup-tabs">
          <button
            className={`setup-tab ${tab === 'company' ? 'active' : ''}`}
            onClick={() => setTab('company')}
          >
            🏢 Company
          </button>
          <button
            className={`setup-tab ${tab === 'branding' ? 'active' : ''}`}
            onClick={() => setTab('branding')}
          >
            🎨 Branding
          </button>
          <button
            className={`setup-tab ${tab === 'invoice' ? 'active' : ''}`}
            onClick={() => setTab('invoice')}
          >
            📄 Invoice
          </button>
          <button
            className={`setup-tab ${tab === 'bank' ? 'active' : ''}`}
            onClick={() => setTab('bank')}
          >
            🏦 Bank
          </button>
        </div>

        {/* Company Tab */}
        {tab === 'company' && (
          <div className="panel" style={{ maxWidth: 800 }}>
            <h3>Company Details</h3>
            <div className="grid grid-2">
              <label className="field">
                <span>Company Name *</span>
                <input
                  value={settings.companyName}
                  onChange={(e) => set('companyName', e.target.value)}
                />
              </label>
              <label className="field">
                <span>Tagline</span>
                <input
                  value={settings.tagline}
                  onChange={(e) => set('tagline', e.target.value)}
                  placeholder="e.g. Transport Contractors & Commission Agents"
                />
              </label>
            </div>

            <label className="field">
              <span>Address</span>
              <textarea
                rows="2"
                value={settings.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </label>

            <div className="grid grid-3">
              <label className="field">
                <span>Phone</span>
                <input
                  value={settings.phone}
                  onChange={(e) => set('phone', e.target.value)}
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  value={settings.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </label>
              <label className="field">
                <span>PAN</span>
                <input
                  value={settings.pan}
                  onChange={(e) => set('pan', e.target.value)}
                />
              </label>
            </div>

            <label className="field">
              <span>GSTIN</span>
              <input value={settings.gstin} onChange={(e) => set('gstin', e.target.value)} />
            </label>
          </div>
        )}

        {/* Branding Tab */}
        {tab === 'branding' && (
          <div className="panel" style={{ maxWidth: 800 }}>
            <h3>Branding & Theme</h3>

            <div className="logo-upload">
              <label className="field">
                <span>Company Logo</span>
                <div className="logo-preview">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" />
                  ) : (
                    <div className="logo-placeholder">No logo</div>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleLogoUpload} />
                {logoPreview && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      set('logo', '')
                      setLogoPreview('')
                    }}
                  >
                    Remove Logo
                  </button>
                )}
              </label>
            </div>

            <h4 style={{ marginTop: 24 }}>Color Theme</h4>
            <div className="grid grid-3">
              <label className="field">
                <span>Primary Color</span>
                <div className="color-input">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => set('primaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => set('primaryColor', e.target.value)}
                    placeholder="#2563eb"
                    style={{ flex: 1 }}
                  />
                </div>
              </label>
              <label className="field">
                <span>Secondary Color</span>
                <div className="color-input">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => set('secondaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => set('secondaryColor', e.target.value)}
                    placeholder="#4f46e5"
                    style={{ flex: 1 }}
                  />
                </div>
              </label>
              <label className="field">
                <span>Accent Color (Brand)</span>
                <div className="color-input">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => set('accentColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={settings.accentColor}
                    onChange={(e) => set('accentColor', e.target.value)}
                    placeholder="#e0562d"
                    style={{ flex: 1 }}
                  />
                </div>
              </label>
            </div>

            <h4 style={{ marginTop: 24 }}>Currency & Localization</h4>
            <div className="grid grid-3">
              <label className="field">
                <span>Currency</span>
                <input
                  value={settings.currency}
                  onChange={(e) => set('currency', e.target.value)}
                  placeholder="INR"
                />
              </label>
              <label className="field">
                <span>Currency Symbol</span>
                <input
                  value={settings.currencySymbol}
                  onChange={(e) => set('currencySymbol', e.target.value)}
                  placeholder="₹"
                />
              </label>
              <label className="field">
                <span>Locale</span>
                <select value={settings.locale} onChange={(e) => set('locale', e.target.value)}>
                  <option value="en-IN">Indian (en-IN)</option>
                  <option value="en-US">American (en-US)</option>
                  <option value="en-GB">British (en-GB)</option>
                  <option value="hi-IN">Hindi (hi-IN)</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Invoice Tab */}
        {tab === 'invoice' && (
          <div className="panel" style={{ maxWidth: 800 }}>
            <h3>Invoice & Report Settings</h3>

            <label className="field">
              <span>Invoice Footer Text</span>
              <textarea
                rows="2"
                value={settings.invoiceFooter}
                onChange={(e) => set('invoiceFooter', e.target.value)}
                placeholder="Text to appear at the bottom of invoices"
              />
            </label>

            <label className="field">
              <span>Terms & Conditions</span>
              <textarea
                rows="3"
                value={settings.termsConditions}
                onChange={(e) => set('termsConditions', e.target.value)}
                placeholder="Disclaimer text for consignment notes"
              />
            </label>

            <div className="info-box">
              <strong>ℹ️ These settings will appear on:</strong>
              <ul>
                <li>Bilty/LR (Lorry Receipt) prints</li>
                <li>Party Invoices</li>
                <li>Expense Reports</li>
                <li>Any printed or exported document</li>
              </ul>
            </div>
          </div>
        )}

        {/* Bank Tab */}
        {tab === 'bank' && (
          <div className="panel" style={{ maxWidth: 800 }}>
            <h3>Bank Account Details</h3>
            <p className="hint">Used on invoices for payment instructions</p>

            <div className="grid grid-2">
              <label className="field">
                <span>Bank Name</span>
                <input
                  value={settings.bankName}
                  onChange={(e) => set('bankName', e.target.value)}
                />
              </label>
              <label className="field">
                <span>Account Number</span>
                <input
                  value={settings.accountNo}
                  onChange={(e) => set('accountNo', e.target.value)}
                />
              </label>
            </div>

            <label className="field">
              <span>IFSC / RTGS Code</span>
              <input value={settings.ifsc} onChange={(e) => set('ifsc', e.target.value)} />
            </label>

            <div className="preview-box">
              <strong>Preview (on invoices):</strong>
              <p style={{ margin: '8px 0', fontSize: 12 }}>
                <strong>PAYMENTS SHOULD BE MADE INTO THE FAVOUR OF</strong>
                <br />
                M/s "{settings.companyName}"
                <br />
                Bank Name : {settings.bankName}
                <br />
                Account No. : {settings.accountNo}
                <br />
                IFSC/RTGS CODE: {settings.ifsc}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
