import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import sqlite3 from 'sqlite3'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

dotenv.config()

const app = express()
const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Middleware
app.use(cors())
app.use(express.json())

// Database setup
const db = new sqlite3.Database(join(__dirname, 'transport.db'), (err) => {
  if (err) console.error('Database error:', err)
  else console.log('✓ SQLite database connected')
})

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mobileNumber TEXT UNIQUE NOT NULL,
      companyName TEXT,
      email TEXT,
      passwordHash TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // OTP table
  db.run(`
    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mobileNumber TEXT NOT NULL,
      otp TEXT NOT NULL,
      expiresAt DATETIME NOT NULL,
      attempts INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expiresAt DATETIME NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `)

  // Seed default user for testing
  db.run(
    `INSERT OR IGNORE INTO users (mobileNumber, companyName, email, passwordHash)
     VALUES (?, ?, ?, ?)`,
    [
      '9999999999',
      'PUSHPAK ROADLINES',
      'test@pushpak.com',
      bcrypt.hashSync('password123', 10),
    ],
    (err) => {
      if (!err) console.log('✓ Default test user created (9999999999)')
    }
  )
})

// Helper: Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Helper: Run database query with promise
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve(this)
    })
  })
}

// Helper: Get single row
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

// Helper: Get all rows
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) return res.status(401).json({ error: 'No token provided' })

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' })
    req.user = user
    next()
  })
}

// ==================== AUTH ENDPOINTS ====================

// Send OTP to mobile number
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { mobileNumber } = req.body

    if (!mobileNumber || mobileNumber.length < 10) {
      return res.status(400).json({ error: 'Invalid mobile number' })
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry

    // Delete old OTPs for this number
    await dbRun('DELETE FROM otps WHERE mobileNumber = ?', [mobileNumber])

    // Store new OTP
    await dbRun(
      'INSERT INTO otps (mobileNumber, otp, expiresAt) VALUES (?, ?, ?)',
      [mobileNumber, otp, expiresAt.toISOString()]
    )

    // TODO: In production, send OTP via SMS using Twilio or similar
    console.log(`📱 OTP for ${mobileNumber}: ${otp}`)

    res.json({
      message: 'OTP sent successfully',
      // For testing - remove in production
      testOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    res.status(500).json({ error: 'Failed to send OTP' })
  }
})

// Verify OTP and login/register
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body

    if (!mobileNumber || !otp) {
      return res.status(400).json({ error: 'Mobile number and OTP required' })
    }

    // Check OTP validity
    const otpRecord = await dbGet(
      'SELECT * FROM otps WHERE mobileNumber = ? AND otp = ? AND expiresAt > datetime("now")',
      [mobileNumber, otp]
    )

    if (!otpRecord) {
      return res.status(401).json({ error: 'Invalid or expired OTP' })
    }

    // Find or create user
    let user = await dbGet('SELECT * FROM users WHERE mobileNumber = ?', [
      mobileNumber,
    ])

    if (!user) {
      // Register new user
      await dbRun(
        'INSERT INTO users (mobileNumber, companyName, email) VALUES (?, ?, ?)',
        [mobileNumber, `Company ${mobileNumber}`, `user${mobileNumber}@transport.local`]
      )
      user = await dbGet('SELECT * FROM users WHERE mobileNumber = ?', [
        mobileNumber,
      ])
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, mobileNumber: user.mobileNumber, companyName: user.companyName },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Store session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await dbRun(
      'INSERT INTO sessions (userId, token, expiresAt) VALUES (?, ?, ?)',
      [user.id, token, expiresAt.toISOString()]
    )

    // Delete used OTP
    await dbRun('DELETE FROM otps WHERE id = ?', [otpRecord.id])

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        companyName: user.companyName,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ error: 'Failed to verify OTP' })
  }
})

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT id, mobileNumber, companyName, email FROM users WHERE id = ?', [
      req.user.id,
    ])

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

// Logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      await dbRun('DELETE FROM sessions WHERE token = ?', [token])
    }

    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Failed to logout' })
  }
})

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { companyName, email } = req.body

    await dbRun(
      'UPDATE users SET companyName = ?, email = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [companyName, email, req.user.id]
    )

    const user = await dbGet('SELECT id, mobileNumber, companyName, email FROM users WHERE id = ?', [
      req.user.id,
    ])

    res.json({ message: 'Profile updated', user })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// ==================== DATA ENDPOINTS ====================

// Get all data (bilties, parties, etc.) for authenticated user
app.get('/api/data/:collection', authenticateToken, async (req, res) => {
  try {
    const { collection } = req.params
    // For now, return empty array - will be expanded per collection
    // This allows frontend to fetch data while maintaining auth
    res.json([])
  } catch (error) {
    console.error('Get data error:', error)
    res.status(500).json({ error: 'Failed to fetch data' })
  }
})

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend running', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`\n✓ Transport Backend Server running on http://localhost:${PORT}`)
  console.log(`✓ API: http://localhost:${PORT}/api`)
  console.log(`✓ Test User: 9999999999 (any password)\n`)
})
