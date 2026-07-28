import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import sqlite3 from 'sqlite3'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import twilio from 'twilio'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

dotenv.config()

const app = express()
const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}))
app.use(express.json())

// OTP Service Setup
let twilioClient = null
let emailTransporter = null

// Initialize Twilio if credentials provided and valid (not placeholder)
if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER &&
  process.env.TWILIO_ACCOUNT_SID.startsWith('AC') // Valid Twilio SID format
) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    console.log('✓ Twilio SMS service configured')
  } catch (err) {
    console.warn('⚠️  Twilio configuration error:', err.message)
  }
}

// Initialize Email if credentials provided and valid (not placeholder)
if (
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  !process.env.SMTP_USER.includes('gmail.com') === false // Make sure it's an email
) {
  try {
    emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    console.log('✓ Email OTP service configured')
  } catch (err) {
    console.warn('⚠️  Email configuration error:', err.message)
  }
}

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

  // Settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      logo TEXT,
      companyName TEXT,
      tagline TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `)

  // Parties table
  db.run(`
    CREATE TABLE IF NOT EXISTS parties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      mobile TEXT,
      email TEXT,
      gst TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `)

  // Suppliers table
  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      mobile TEXT,
      email TEXT,
      gst TEXT,
      address TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `)

  // Trucks table
  db.run(`
    CREATE TABLE IF NOT EXISTS trucks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      registrationNumber TEXT NOT NULL UNIQUE,
      truckType TEXT,
      capacity TEXT,
      ownerName TEXT,
      ownerMobile TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `)

  // Drivers table
  db.run(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      mobile TEXT UNIQUE,
      licenseNumber TEXT,
      licenseExpiry TEXT,
      address TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `)

  // Bilties table
  db.run(`
    CREATE TABLE IF NOT EXISTS bilties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      biltyNumber TEXT NOT NULL UNIQUE,
      fromLocation TEXT,
      toLocation TEXT,
      partyId INTEGER,
      truckId INTEGER,
      driverId INTEGER,
      items TEXT,
      totalWeight TEXT,
      totalAmount DECIMAL(10, 2),
      status TEXT DEFAULT 'draft',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (partyId) REFERENCES parties(id),
      FOREIGN KEY (truckId) REFERENCES trucks(id),
      FOREIGN KEY (driverId) REFERENCES drivers(id)
    )
  `)

  // Party Invoices table
  db.run(`
    CREATE TABLE IF NOT EXISTS partyInvoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      invoiceNumber TEXT NOT NULL UNIQUE,
      partyId INTEGER,
      biltyIds TEXT,
      totalAmount DECIMAL(10, 2),
      gstAmount DECIMAL(10, 2),
      netAmount DECIMAL(10, 2),
      status TEXT DEFAULT 'draft',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (partyId) REFERENCES parties(id)
    )
  `)

  // Lorry Hire table
  db.run(`
    CREATE TABLE IF NOT EXISTS lorryHire (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      hireNumber TEXT NOT NULL UNIQUE,
      driverId INTEGER,
      truckId INTEGER,
      fromLocation TEXT,
      toLocation TEXT,
      hireAmount DECIMAL(10, 2),
      status TEXT DEFAULT 'draft',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (driverId) REFERENCES drivers(id),
      FOREIGN KEY (truckId) REFERENCES trucks(id)
    )
  `)

  // Expenses table
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      expenseNumber TEXT NOT NULL UNIQUE,
      category TEXT,
      amount DECIMAL(10, 2),
      description TEXT,
      status TEXT DEFAULT 'draft',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
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

// Helper: Send OTP via SMS or Email
async function sendOTP(mobileNumber, otp, method = 'sms') {
  try {
    if (method === 'sms' && twilioClient) {
      // Send via Twilio SMS
      await twilioClient.messages.create({
        body: `Your Transport Khata OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${mobileNumber}`,
      })
      console.log(`✓ SMS sent to ${mobileNumber}`)
      return { success: true, method: 'sms', message: `OTP sent to +91${mobileNumber}` }
    } else if (method === 'email' && emailTransporter) {
      // Send via Email
      const email = `user${mobileNumber}@transport.local`
      await emailTransporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Your Transport Khata OTP',
        html: `
          <h2>Your OTP Code</h2>
          <p>Your OTP is: <strong style="font-size: 24px; color: #2563eb;">${otp}</strong></p>
          <p>Valid for 5 minutes only.</p>
          <p>Do not share this code with anyone.</p>
          <hr>
          <p><small>If you didn't request this, please ignore this email.</small></p>
        `,
      })
      console.log(`✓ Email OTP sent to ${email}`)
      return { success: true, method: 'email', message: `OTP sent to email` }
    } else {
      // Fallback: Console only (for testing)
      console.log(`📱 OTP for ${mobileNumber}: ${otp}`)
      return {
        success: true,
        method: 'console',
        message: 'Check server console for OTP (configure Twilio or Email for production)',
        testOtp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    }
  } catch (error) {
    console.error(`Failed to send OTP to ${mobileNumber}:`, error)
    throw error
  }
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
    const { mobileNumber, method = 'sms' } = req.body

    if (!mobileNumber || mobileNumber.length < 10) {
      return res.status(400).json({ error: 'Invalid mobile number. Must be 10 digits.' })
    }

    // Validate method
    if (!['sms', 'email'].includes(method)) {
      return res.status(400).json({ error: 'Invalid delivery method. Use "sms" or "email".' })
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

    // Send OTP via configured method
    const result = await sendOTP(mobileNumber, otp, method)

    res.json({
      message: result.message || 'OTP sent successfully',
      method: result.method,
      testOtp: result.testOtp, // Only in development without real SMS/Email
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    res.status(500).json({ error: error.message || 'Failed to send OTP' })
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

// PARTIES - CRUD Operations
app.get('/api/parties', authenticateToken, async (req, res) => {
  try {
    const parties = await dbAll('SELECT * FROM parties WHERE userId = ? ORDER BY createdAt DESC', [req.user.id])
    res.json(parties)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch parties' })
  }
})

app.post('/api/parties', authenticateToken, async (req, res) => {
  try {
    const { name, mobile, email, gst, address, city, state } = req.body
    const result = await dbRun(
      'INSERT INTO parties (userId, name, mobile, email, gst, address, city, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, name, mobile, email, gst, address, city, state]
    )
    res.json({ id: result.lastID, ...req.body, userId: req.user.id })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create party' })
  }
})

app.put('/api/parties/:id', authenticateToken, async (req, res) => {
  try {
    const { name, mobile, email, gst, address, city, state } = req.body
    await dbRun(
      'UPDATE parties SET name=?, mobile=?, email=?, gst=?, address=?, city=?, state=?, updatedAt=CURRENT_TIMESTAMP WHERE id=? AND userId=?',
      [name, mobile, email, gst, address, city, state, req.params.id, req.user.id]
    )
    res.json({ id: req.params.id, ...req.body })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update party' })
  }
})

app.delete('/api/parties/:id', authenticateToken, async (req, res) => {
  try {
    await dbRun('DELETE FROM parties WHERE id=? AND userId=?', [req.params.id, req.user.id])
    res.json({ message: 'Party deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete party' })
  }
})

// SUPPLIERS - CRUD Operations
app.get('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const suppliers = await dbAll('SELECT * FROM suppliers WHERE userId = ? ORDER BY createdAt DESC', [req.user.id])
    res.json(suppliers)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suppliers' })
  }
})

app.post('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const { name, mobile, email, gst, address } = req.body
    const result = await dbRun(
      'INSERT INTO suppliers (userId, name, mobile, email, gst, address) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, name, mobile, email, gst, address]
    )
    res.json({ id: result.lastID, ...req.body, userId: req.user.id })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create supplier' })
  }
})

app.put('/api/suppliers/:id', authenticateToken, async (req, res) => {
  try {
    const { name, mobile, email, gst, address } = req.body
    await dbRun(
      'UPDATE suppliers SET name=?, mobile=?, email=?, gst=?, address=?, updatedAt=CURRENT_TIMESTAMP WHERE id=? AND userId=?',
      [name, mobile, email, gst, address, req.params.id, req.user.id]
    )
    res.json({ id: req.params.id, ...req.body })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update supplier' })
  }
})

app.delete('/api/suppliers/:id', authenticateToken, async (req, res) => {
  try {
    await dbRun('DELETE FROM suppliers WHERE id=? AND userId=?', [req.params.id, req.user.id])
    res.json({ message: 'Supplier deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete supplier' })
  }
})

// TRUCKS - CRUD Operations
app.get('/api/trucks', authenticateToken, async (req, res) => {
  try {
    const trucks = await dbAll('SELECT * FROM trucks WHERE userId = ? ORDER BY createdAt DESC', [req.user.id])
    res.json(trucks)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trucks' })
  }
})

app.post('/api/trucks', authenticateToken, async (req, res) => {
  try {
    const { registrationNumber, truckType, capacity, ownerName, ownerMobile } = req.body
    const result = await dbRun(
      'INSERT INTO trucks (userId, registrationNumber, truckType, capacity, ownerName, ownerMobile) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, registrationNumber, truckType, capacity, ownerName, ownerMobile]
    )
    res.json({ id: result.lastID, ...req.body, userId: req.user.id })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create truck' })
  }
})

app.put('/api/trucks/:id', authenticateToken, async (req, res) => {
  try {
    const { registrationNumber, truckType, capacity, ownerName, ownerMobile } = req.body
    await dbRun(
      'UPDATE trucks SET registrationNumber=?, truckType=?, capacity=?, ownerName=?, ownerMobile=?, updatedAt=CURRENT_TIMESTAMP WHERE id=? AND userId=?',
      [registrationNumber, truckType, capacity, ownerName, ownerMobile, req.params.id, req.user.id]
    )
    res.json({ id: req.params.id, ...req.body })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update truck' })
  }
})

app.delete('/api/trucks/:id', authenticateToken, async (req, res) => {
  try {
    await dbRun('DELETE FROM trucks WHERE id=? AND userId=?', [req.params.id, req.user.id])
    res.json({ message: 'Truck deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete truck' })
  }
})

// DRIVERS - CRUD Operations
app.get('/api/drivers', authenticateToken, async (req, res) => {
  try {
    const drivers = await dbAll('SELECT * FROM drivers WHERE userId = ? ORDER BY createdAt DESC', [req.user.id])
    res.json(drivers)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drivers' })
  }
})

app.post('/api/drivers', authenticateToken, async (req, res) => {
  try {
    const { name, mobile, licenseNumber, licenseExpiry, address } = req.body
    const result = await dbRun(
      'INSERT INTO drivers (userId, name, mobile, licenseNumber, licenseExpiry, address) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, name, mobile, licenseNumber, licenseExpiry, address]
    )
    res.json({ id: result.lastID, ...req.body, userId: req.user.id })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create driver' })
  }
})

app.put('/api/drivers/:id', authenticateToken, async (req, res) => {
  try {
    const { name, mobile, licenseNumber, licenseExpiry, address } = req.body
    await dbRun(
      'UPDATE drivers SET name=?, mobile=?, licenseNumber=?, licenseExpiry=?, address=?, updatedAt=CURRENT_TIMESTAMP WHERE id=? AND userId=?',
      [name, mobile, licenseNumber, licenseExpiry, address, req.params.id, req.user.id]
    )
    res.json({ id: req.params.id, ...req.body })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update driver' })
  }
})

app.delete('/api/drivers/:id', authenticateToken, async (req, res) => {
  try {
    await dbRun('DELETE FROM drivers WHERE id=? AND userId=?', [req.params.id, req.user.id])
    res.json({ message: 'Driver deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete driver' })
  }
})

// BILTIES - CRUD Operations
app.get('/api/bilties', authenticateToken, async (req, res) => {
  try {
    const bilties = await dbAll('SELECT * FROM bilties WHERE userId = ? ORDER BY createdAt DESC', [req.user.id])
    res.json(bilties)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bilties' })
  }
})

app.get('/api/bilties/:id', authenticateToken, async (req, res) => {
  try {
    const bilty = await dbGet('SELECT * FROM bilties WHERE id = ? AND userId = ?', [req.params.id, req.user.id])
    if (!bilty) return res.status(404).json({ error: 'Bilty not found' })
    res.json(bilty)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bilty' })
  }
})

app.post('/api/bilties', authenticateToken, async (req, res) => {
  try {
    const { biltyNumber, fromLocation, toLocation, partyId, truckId, driverId, items, totalWeight, totalAmount, status } = req.body
    const result = await dbRun(
      'INSERT INTO bilties (userId, biltyNumber, fromLocation, toLocation, partyId, truckId, driverId, items, totalWeight, totalAmount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, biltyNumber, fromLocation, toLocation, partyId, truckId, driverId, JSON.stringify(items), totalWeight, totalAmount, status || 'draft']
    )
    res.json({ id: result.lastID, ...req.body, userId: req.user.id })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create bilty' })
  }
})

app.put('/api/bilties/:id', authenticateToken, async (req, res) => {
  try {
    const { biltyNumber, fromLocation, toLocation, partyId, truckId, driverId, items, totalWeight, totalAmount, status } = req.body
    await dbRun(
      'UPDATE bilties SET biltyNumber=?, fromLocation=?, toLocation=?, partyId=?, truckId=?, driverId=?, items=?, totalWeight=?, totalAmount=?, status=?, updatedAt=CURRENT_TIMESTAMP WHERE id=? AND userId=?',
      [biltyNumber, fromLocation, toLocation, partyId, truckId, driverId, JSON.stringify(items), totalWeight, totalAmount, status, req.params.id, req.user.id]
    )
    res.json({ id: req.params.id, ...req.body })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bilty' })
  }
})

app.delete('/api/bilties/:id', authenticateToken, async (req, res) => {
  try {
    await dbRun('DELETE FROM bilties WHERE id=? AND userId=?', [req.params.id, req.user.id])
    res.json({ message: 'Bilty deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete bilty' })
  }
})

// INVOICES - CRUD Operations
app.get('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const invoices = await dbAll('SELECT * FROM partyInvoices WHERE userId = ? ORDER BY createdAt DESC', [req.user.id])
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' })
  }
})

app.post('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const { invoiceNumber, partyId, biltyIds, totalAmount, gstAmount, netAmount, status } = req.body
    const result = await dbRun(
      'INSERT INTO partyInvoices (userId, invoiceNumber, partyId, biltyIds, totalAmount, gstAmount, netAmount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, invoiceNumber, partyId, JSON.stringify(biltyIds), totalAmount, gstAmount, netAmount, status || 'draft']
    )
    res.json({ id: result.lastID, ...req.body, userId: req.user.id })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' })
  }
})

app.put('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const { invoiceNumber, partyId, biltyIds, totalAmount, gstAmount, netAmount, status } = req.body
    await dbRun(
      'UPDATE partyInvoices SET invoiceNumber=?, partyId=?, biltyIds=?, totalAmount=?, gstAmount=?, netAmount=?, status=?, updatedAt=CURRENT_TIMESTAMP WHERE id=? AND userId=?',
      [invoiceNumber, partyId, JSON.stringify(biltyIds), totalAmount, gstAmount, netAmount, status, req.params.id, req.user.id]
    )
    res.json({ id: req.params.id, ...req.body })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' })
  }
})

app.delete('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    await dbRun('DELETE FROM partyInvoices WHERE id=? AND userId=?', [req.params.id, req.user.id])
    res.json({ message: 'Invoice deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete invoice' })
  }
})

// EXPENSES - CRUD Operations
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const expenses = await dbAll('SELECT * FROM expenses WHERE userId = ? ORDER BY createdAt DESC', [req.user.id])
    res.json(expenses)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' })
  }
})

app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const { expenseNumber, category, amount, description, status } = req.body
    const result = await dbRun(
      'INSERT INTO expenses (userId, expenseNumber, category, amount, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, expenseNumber, category, amount, description, status || 'draft']
    )
    res.json({ id: result.lastID, ...req.body, userId: req.user.id })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense' })
  }
})

app.put('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const { expenseNumber, category, amount, description, status } = req.body
    await dbRun(
      'UPDATE expenses SET expenseNumber=?, category=?, amount=?, description=?, status=?, updatedAt=CURRENT_TIMESTAMP WHERE id=? AND userId=?',
      [expenseNumber, category, amount, description, status, req.params.id, req.user.id]
    )
    res.json({ id: req.params.id, ...req.body })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update expense' })
  }
})

app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    await dbRun('DELETE FROM expenses WHERE id=? AND userId=?', [req.params.id, req.user.id])
    res.json({ message: 'Expense deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' })
  }
})

// SETTINGS - Get/Update
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    let settings = await dbGet('SELECT * FROM settings WHERE userId = ?', [req.user.id])
    if (!settings) {
      await dbRun('INSERT INTO settings (userId, companyName) VALUES (?, ?)', [req.user.id, 'PUSHPAK ROADLINES'])
      settings = await dbGet('SELECT * FROM settings WHERE userId = ?', [req.user.id])
    }
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const { logo, companyName, tagline } = req.body
    await dbRun(
      'UPDATE settings SET logo=?, companyName=?, tagline=?, updatedAt=CURRENT_TIMESTAMP WHERE userId=?',
      [logo, companyName, tagline, req.user.id]
    )
    const settings = await dbGet('SELECT * FROM settings WHERE userId = ?', [req.user.id])
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' })
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
