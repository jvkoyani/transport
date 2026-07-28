import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/login.css'

export default function Login() {
  const navigate = useNavigate()
  const { sendOtp, verifyOtp, error, setError, isAuthenticated } = useAuth()

  const [step, setStep] = useState('phone') // phone, otp
  const [mobileNumber, setMobileNumber] = useState('9999999999')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [timer, setTimer] = useState(0)
  const [testOtp, setTestOtp] = useState('')

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/bilty')
    }
  }, [isAuthenticated])

  // Timer for resend OTP
  useEffect(() => {
    if (timer > 0) {
      const interval = setTimeout(() => setTimer(timer - 1), 1000)
      return () => clearTimeout(interval)
    }
  }, [timer])

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage('')
    setLoading(true)

    try {
      const data = await sendOtp(mobileNumber)
      setMessage('✓ OTP sent to your mobile number')
      setTestOtp(data.testOtp || '') // For testing in development
      setStep('otp')
      setTimer(60)
    } catch (err) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage('')
    setLoading(true)

    try {
      await verifyOtp(mobileNumber, otp)
      setMessage('✓ Login successful!')
      setTimeout(() => navigate('/bilty'), 500)
    } catch (err) {
      setError(err.message || 'Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError(null)
    setMessage('')
    setOtp('')
    setLoading(true)

    try {
      const data = await sendOtp(mobileNumber)
      setMessage('✓ New OTP sent')
      setTestOtp(data.testOtp || '')
      setTimer(60)
    } catch (err) {
      setError(err.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToPhone = () => {
    setStep('phone')
    setOtp('')
    setMessage('')
    setError(null)
    setTestOtp('')
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🚚 Transport Khata</h1>
          <p>Smart Transport ERP</p>
        </div>

        {/* Phone Number Step */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="login-form">
            <h2>Login with Mobile Number</h2>

            <div className="form-group">
              <label>Mobile Number *</label>
              <div className="phone-input">
                <span className="country-code">🇮🇳 +91</span>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  maxLength="10"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <small>Enter 10-digit mobile number</small>
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <div className="login-footer">
              <p>
                <strong>Demo Account:</strong> 9999999999
              </p>
            </div>
          </form>
        )}

        {/* OTP Verification Step */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="login-form">
            <h2>Verify OTP</h2>
            <p className="otp-info">OTP sent to +91 {mobileNumber}</p>

            <div className="form-group">
              <label>Enter OTP *</label>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength="6"
                disabled={loading}
                autoFocus
                className="otp-input"
              />
              <small>6-digit OTP</small>
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            {testOtp && (
              <div className="test-otp">
                <strong>🔧 Development Only:</strong> {testOtp}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="otp-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleBackToPhone}
                disabled={loading}
              >
                ← Change Number
              </button>

              <button
                type="button"
                className={`btn btn-ghost ${timer > 0 ? 'disabled' : ''}`}
                onClick={handleResendOtp}
                disabled={loading || timer > 0}
              >
                {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
              </button>
            </div>

            <div className="login-footer">
              <p>OTP valid for 5 minutes</p>
            </div>
          </form>
        )}
      </div>

      {/* Sidebar - Info */}
      <div className="login-sidebar">
        <div className="info-card">
          <h3>✨ Features</h3>
          <ul>
            <li>Mobile-based authentication</li>
            <li>OTP verification</li>
            <li>Secure token management</li>
            <li>Multi-user support</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>🚀 Ready to use</h3>
          <ul>
            <li>Bilty Management</li>
            <li>Party Invoicing</li>
            <li>Expense Tracking</li>
            <li>Report Generation</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
