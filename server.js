import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import twilio from 'twilio'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', process.env.FRONTEND_URL || ''].filter(Boolean),
  credentials: true
}))
app.use(express.json())

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'transport_khata',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

// OTP Service Setup
let twilioClient = null
let emailTransporter = null

if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER &&
  process.env.TWILIO_ACCOUNT_SID.startsWith('AC')
) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    console.log('✓ Twilio SMS service configured')
  } catch (err) {
    console.warn('⚠️  Twilio configuration error:', err.message)
  }
}

if (
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
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

// Initialize Database Tables
async function initializeDatabase() {
  const connection = await pool.getConnection()
  try {
    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mobileNumber VARCHAR(20) UNIQUE NOT NULL,
        companyName VARCHAR(255),
        email VARCHAR(255),
        passwordHash VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // OTP table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mobileNumber VARCHAR(20) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        expiresAt DATETIME NOT NULL,
        attempts INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Sessions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        token VARCHAR(500) UNIQUE NOT NULL,
        expiresAt DATETIME NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `)

    // Settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        logo LONGTEXT,
        companyName VARCHAR(255),
        tagline VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `)

    // Parties table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS parties (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(20),
        email VARCHAR(255),
        gst VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `)

    // Suppliers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(20),
        email VARCHAR(255),
        gst VARCHAR(50),
        address TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `)

    // Trucks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS trucks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        registrationNumber VARCHAR(50) NOT NULL UNIQUE,
        truckType VARCHAR(100),
        capacity VARCHAR(50),
        ownerName VARCHAR(255),
        ownerMobile VARCHAR(20),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `)

    // Drivers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(20) UNIQUE,
        licenseNumber VARCHAR(50),
        licenseExpiry VARCHAR(20),
        address TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `)

    // Bilties table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bilties (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        biltyNumber VARCHAR(50) NOT NULL UNIQUE,
        fromLocation VARCHAR(255),
        toLocation VARCHAR(255),
        partyId INT,
        truckId INT,
        driverId INT,
        items JSON,
        totalWeight VARCHAR(50),
        totalAmount DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'draft',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (partyId) REFERENCES parties(id),
        FOREIGN KEY (truckId) REFERENCES trucks(id),
        FOREIGN KEY (driverId) REFERENCES drivers(id)
      )
    `)

    // Party Invoices table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS partyInvoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        invoiceNumber VARCHAR(50) NOT NULL UNIQUE,
        partyId INT,
        biltyIds JSON,
        totalAmount DECIMAL(10, 2),
        gstAmount DECIMAL(10, 2),
        netAmount DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'draft',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (partyId) REFERENCES parties(id)
      )
    `)

    // Lorry Hire table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS lorryHire (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        hireNumber VARCHAR(50) NOT NULL UNIQUE,
        driverId INT,
        truckId INT,
        fromLocation VARCHAR(255),
        toLocation VARCHAR(255),
        hireAmount DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'draft',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (driverId) REFERENCES drivers(id),
        FOREIGN KEY (truckId) REFERENCES trucks(id)
      )
    `)

    // Expenses table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        expenseNumber VARCHAR(50) NOT NULL UNIQUE,
        category VARCHAR(100),
        amount DECIMAL(10, 2),
        description TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `)

    // Insert default test user
    await connection.query(
      `INSERT IGNORE INTO users (mobileNumber, companyName, email, passwordHash) VALUES (?, ?, ?, ?)`,
      ['9999999999', 'PUSHPAK ROADLINES', 'test@pushpak.com', bcrypt.hashSync('password123', 10)]
    )

    console.log('✓ MySQL database initialized')
  } catch (error) {
    console.error('Database initialization error:', error)
  } finally {
    await connection.release()
  }
}

// Helper: Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Helper: Send OTP
async function sendOTP(mobileNumber, otp, method = 'sms') {
  try {
    if (method === 'sms' && twilioClient) {
      await twilioClient.messages.create({
        body: `Your Transport Khata OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${mobileNumber}`,
      })
      console.log(`✓ SMS sent to ${mobileNumber}`)
      return { success: true, method: 'sms', message: `OTP sent to +91${mobileNumber}` }
    } else if (method === 'email' && emailTransporter) {
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
        `,
      })
      console.log(`✓ Email OTP sent to ${email}`)
      return { success: true, method: 'email', message: `OTP sent to email` }
    } else {
      console.log(`📱 OTP for ${mobileNumber}: ${otp}`)
      return {
        success: true,
        method: 'console',
        message: 'Check server console for OTP (configure Twilio or Email for production)',
        testOtp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    }
  } catch (error) {
    console.error(`Failed to send OTP:`, error)
    throw error
  }
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

app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { mobileNumber, method = 'sms' } = req.body

    if (!mobileNumber || mobileNumber.length < 10) {
      return res.status(400).json({ error: 'Invalid mobile number. Must be 10 digits.' })
    }

    if (!['sms', 'email'].includes(method)) {
      return res.status(400).json({ error: 'Invalid delivery method. Use "sms" or "email".' })
    }

    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    const connection = await pool.getConnection()
    try {
      await connection.query('DELETE FROM otps WHERE mobileNumber = ?', [mobileNumber])
      await connection.query(
        'INSERT INTO otps (mobileNumber, otp, expiresAt) VALUES (?, ?, ?)',
        [mobileNumber, otp, expiresAt]
      )

      const result = await sendOTP(mobileNumber, otp, method)
      res.json({
        message: result.message || 'OTP sent successfully',
        method: result.method,
        testOtp: result.testOtp,
      })
    } finally {
      await connection.release()
    }
  } catch (error) {
    console.error('Send OTP error:', error)
    res.status(500).json({ error: error.message || 'Failed to send OTP' })
  }
})

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body

    if (!mobileNumber || !otp) {
      return res.status(400).json({ error: 'Mobile number and OTP required' })
    }

    const connection = await pool.getConnection()
    try {
      const [otpRecords] = await connection.query(
        'SELECT * FROM otps WHERE mobileNumber = ? AND otp = ? AND expiresAt > NOW()',
        [mobileNumber, otp]
      )

      if (otpRecords.length === 0) {
        return res.status(401).json({ error: 'Invalid or expired OTP' })
      }

      const [users] = await connection.query('SELECT * FROM users WHERE mobileNumber = ?', [mobileNumber])
      let user = users[0]

      if (!user) {
        await connection.query(
          'INSERT INTO users (mobileNumber, companyName, email) VALUES (?, ?, ?)',
          [mobileNumber, `Company ${mobileNumber}`, `user${mobileNumber}@transport.local`]
        )
        const [newUsers] = await connection.query('SELECT * FROM users WHERE mobileNumber = ?', [mobileNumber])
        user = newUsers[0]
      }

      const token = jwt.sign(
        { id: user.id, mobileNumber: user.mobileNumber, companyName: user.companyName },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await connection.query(
        'INSERT INTO sessions (userId, token, expiresAt) VALUES (?, ?, ?)',
        [user.id, token, expiresAt]
      )

      await connection.query('DELETE FROM otps WHERE id = ?', [otpRecords[0].id])

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
    } finally {
      await connection.release()
    }
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ error: 'Failed to verify OTP' })
  }
})

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      const [users] = await connection.query(
        'SELECT id, mobileNumber, companyName, email FROM users WHERE id = ?',
        [req.user.id]
      )

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.json(users[0])
    } finally {
      await connection.release()
    }
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const connection = await pool.getConnection()
      try {
        await connection.query('DELETE FROM sessions WHERE token = ?', [token])
      } finally {
        await connection.release()
      }
    }

    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Failed to logout' })
  }
})

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { companyName, email } = req.body

    const connection = await pool.getConnection()
    try {
      await connection.query(
        'UPDATE users SET companyName = ?, email = ?, updatedAt = NOW() WHERE id = ?',
        [companyName, email, req.user.id]
      )

      const [users] = await connection.query(
        'SELECT id, mobileNumber, companyName, email FROM users WHERE id = ?',
        [req.user.id]
      )

      res.json({ message: 'Profile updated', user: users[0] })
    } finally {
      await connection.release()
    }
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// ==================== CRUD ENDPOINTS ====================

// PARTIES
app.get('/api/parties', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      const [parties] = await connection.query(
        'SELECT * FROM parties WHERE userId = ? ORDER BY createdAt DESC',
        [req.user.id]
      )
      res.json(parties)
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch parties' })
  }
})

app.post('/api/parties', authenticateToken, async (req, res) => {
  try {
    const { name, mobile, email, gst, address, city, state } = req.body
    const connection = await pool.getConnection()
    try {
      const [result] = await connection.query(
        'INSERT INTO parties (userId, name, mobile, email, gst, address, city, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, name, mobile, email, gst, address, city, state]
      )
      res.json({ id: result.insertId, ...req.body, userId: req.user.id })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create party' })
  }
})

app.put('/api/parties/:id', authenticateToken, async (req, res) => {
  try {
    const { name, mobile, email, gst, address, city, state } = req.body
    const connection = await pool.getConnection()
    try {
      await connection.query(
        'UPDATE parties SET name=?, mobile=?, email=?, gst=?, address=?, city=?, state=?, updatedAt=NOW() WHERE id=? AND userId=?',
        [name, mobile, email, gst, address, city, state, req.params.id, req.user.id]
      )
      res.json({ id: req.params.id, ...req.body })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update party' })
  }
})

app.delete('/api/parties/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      await connection.query('DELETE FROM parties WHERE id=? AND userId=?', [req.params.id, req.user.id])
      res.json({ message: 'Party deleted' })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete party' })
  }
})

// SUPPLIERS
app.get('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      const [suppliers] = await connection.query(
        'SELECT * FROM suppliers WHERE userId = ? ORDER BY createdAt DESC',
        [req.user.id]
      )
      res.json(suppliers)
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suppliers' })
  }
})

app.post('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const { name, mobile, email, gst, address } = req.body
    const connection = await pool.getConnection()
    try {
      const [result] = await connection.query(
        'INSERT INTO suppliers (userId, name, mobile, email, gst, address) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, name, mobile, email, gst, address]
      )
      res.json({ id: result.insertId, ...req.body, userId: req.user.id })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create supplier' })
  }
})

app.put('/api/suppliers/:id', authenticateToken, async (req, res) => {
  try {
    const { name, mobile, email, gst, address } = req.body
    const connection = await pool.getConnection()
    try {
      await connection.query(
        'UPDATE suppliers SET name=?, mobile=?, email=?, gst=?, address=?, updatedAt=NOW() WHERE id=? AND userId=?',
        [name, mobile, email, gst, address, req.params.id, req.user.id]
      )
      res.json({ id: req.params.id, ...req.body })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update supplier' })
  }
})

app.delete('/api/suppliers/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      await connection.query('DELETE FROM suppliers WHERE id=? AND userId=?', [req.params.id, req.user.id])
      res.json({ message: 'Supplier deleted' })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete supplier' })
  }
})

// TRUCKS
app.get('/api/trucks', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      const [trucks] = await connection.query(
        'SELECT * FROM trucks WHERE userId = ? ORDER BY createdAt DESC',
        [req.user.id]
      )
      res.json(trucks)
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trucks' })
  }
})

app.post('/api/trucks', authenticateToken, async (req, res) => {
  try {
    const { registrationNumber, truckType, capacity, ownerName, ownerMobile } = req.body
    const connection = await pool.getConnection()
    try {
      const [result] = await connection.query(
        'INSERT INTO trucks (userId, registrationNumber, truckType, capacity, ownerName, ownerMobile) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, registrationNumber, truckType, capacity, ownerName, ownerMobile]
      )
      res.json({ id: result.insertId, ...req.body, userId: req.user.id })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create truck' })
  }
})

app.put('/api/trucks/:id', authenticateToken, async (req, res) => {
  try {
    const { registrationNumber, truckType, capacity, ownerName, ownerMobile } = req.body
    const connection = await pool.getConnection()
    try {
      await connection.query(
        'UPDATE trucks SET registrationNumber=?, truckType=?, capacity=?, ownerName=?, ownerMobile=?, updatedAt=NOW() WHERE id=? AND userId=?',
        [registrationNumber, truckType, capacity, ownerName, ownerMobile, req.params.id, req.user.id]
      )
      res.json({ id: req.params.id, ...req.body })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update truck' })
  }
})

app.delete('/api/trucks/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      await connection.query('DELETE FROM trucks WHERE id=? AND userId=?', [req.params.id, req.user.id])
      res.json({ message: 'Truck deleted' })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete truck' })
  }
})

// DRIVERS
app.get('/api/drivers', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      const [drivers] = await connection.query(
        'SELECT * FROM drivers WHERE userId = ? ORDER BY createdAt DESC',
        [req.user.id]
      )
      res.json(drivers)
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drivers' })
  }
})

app.post('/api/drivers', authenticateToken, async (req, res) => {
  try {
    const { name, mobile, licenseNumber, licenseExpiry, address } = req.body
    const connection = await pool.getConnection()
    try {
      const [result] = await connection.query(
        'INSERT INTO drivers (userId, name, mobile, licenseNumber, licenseExpiry, address) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, name, mobile, licenseNumber, licenseExpiry, address]
      )
      res.json({ id: result.insertId, ...req.body, userId: req.user.id })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create driver' })
  }
})

app.put('/api/drivers/:id', authenticateToken, async (req, res) => {
  try {
    const { name, mobile, licenseNumber, licenseExpiry, address } = req.body
    const connection = await pool.getConnection()
    try {
      await connection.query(
        'UPDATE drivers SET name=?, mobile=?, licenseNumber=?, licenseExpiry=?, address=?, updatedAt=NOW() WHERE id=? AND userId=?',
        [name, mobile, licenseNumber, licenseExpiry, address, req.params.id, req.user.id]
      )
      res.json({ id: req.params.id, ...req.body })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update driver' })
  }
})

app.delete('/api/drivers/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      await connection.query('DELETE FROM drivers WHERE id=? AND userId=?', [req.params.id, req.user.id])
      res.json({ message: 'Driver deleted' })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete driver' })
  }
})

// BILTIES
app.get('/api/bilties', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      const [bilties] = await connection.query(
        'SELECT * FROM bilties WHERE userId = ? ORDER BY createdAt DESC',
        [req.user.id]
      )
      res.json(bilties.map(b => ({ ...b, items: typeof b.items === 'string' ? JSON.parse(b.items) : b.items })))
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bilties' })
  }
})

app.get('/api/bilties/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      const [bilties] = await connection.query(
        'SELECT * FROM bilties WHERE id = ? AND userId = ?',
        [req.params.id, req.user.id]
      )
      if (bilties.length === 0) return res.status(404).json({ error: 'Bilty not found' })
      const bilty = bilties[0]
      bilty.items = typeof bilty.items === 'string' ? JSON.parse(bilty.items) : bilty.items
      res.json(bilty)
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bilty' })
  }
})

app.post('/api/bilties', authenticateToken, async (req, res) => {
  try {
    const { biltyNumber, fromLocation, toLocation, partyId, truckId, driverId, items, totalWeight, totalAmount, status } = req.body
    const connection = await pool.getConnection()
    try {
      const [result] = await connection.query(
        'INSERT INTO bilties (userId, biltyNumber, fromLocation, toLocation, partyId, truckId, driverId, items, totalWeight, totalAmount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, biltyNumber, fromLocation, toLocation, partyId, truckId, driverId, JSON.stringify(items), totalWeight, totalAmount, status || 'draft']
      )
      res.json({ id: result.insertId, ...req.body, userId: req.user.id })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create bilty' })
  }
})

app.put('/api/bilties/:id', authenticateToken, async (req, res) => {
  try {
    const { biltyNumber, fromLocation, toLocation, partyId, truckId, driverId, items, totalWeight, totalAmount, status } = req.body
    const connection = await pool.getConnection()
    try {
      await connection.query(
        'UPDATE bilties SET biltyNumber=?, fromLocation=?, toLocation=?, partyId=?, truckId=?, driverId=?, items=?, totalWeight=?, totalAmount=?, status=?, updatedAt=NOW() WHERE id=? AND userId=?',
        [biltyNumber, fromLocation, toLocation, partyId, truckId, driverId, JSON.stringify(items), totalWeight, totalAmount, status, req.params.id, req.user.id]
      )
      res.json({ id: req.params.id, ...req.body })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bilty' })
  }
})

app.delete('/api/bilties/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      await connection.query('DELETE FROM bilties WHERE id=? AND userId=?', [req.params.id, req.user.id])
      res.json({ message: 'Bilty deleted' })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete bilty' })
  }
})

// INVOICES
app.get('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      const [invoices] = await connection.query(
        'SELECT * FROM partyInvoices WHERE userId = ? ORDER BY createdAt DESC',
        [req.user.id]
      )
      res.json(invoices.map(i => ({ ...i, biltyIds: typeof i.biltyIds === 'string' ? JSON.parse(i.biltyIds) : i.biltyIds })))
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' })
  }
})

app.post('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const { invoiceNumber, partyId, biltyIds, totalAmount, gstAmount, netAmount, status } = req.body
    const connection = await pool.getConnection()
    try {
      const [result] = await connection.query(
        'INSERT INTO partyInvoices (userId, invoiceNumber, partyId, biltyIds, totalAmount, gstAmount, netAmount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, invoiceNumber, partyId, JSON.stringify(biltyIds), totalAmount, gstAmount, netAmount, status || 'draft']
      )
      res.json({ id: result.insertId, ...req.body, userId: req.user.id })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' })
  }
})

app.put('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const { invoiceNumber, partyId, biltyIds, totalAmount, gstAmount, netAmount, status } = req.body
    const connection = await pool.getConnection()
    try {
      await connection.query(
        'UPDATE partyInvoices SET invoiceNumber=?, partyId=?, biltyIds=?, totalAmount=?, gstAmount=?, netAmount=?, status=?, updatedAt=NOW() WHERE id=? AND userId=?',
        [invoiceNumber, partyId, JSON.stringify(biltyIds), totalAmount, gstAmount, netAmount, status, req.params.id, req.user.id]
      )
      res.json({ id: req.params.id, ...req.body })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' })
  }
})

app.delete('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      await connection.query('DELETE FROM partyInvoices WHERE id=? AND userId=?', [req.params.id, req.user.id])
      res.json({ message: 'Invoice deleted' })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete invoice' })
  }
})

// EXPENSES
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      const [expenses] = await connection.query(
        'SELECT * FROM expenses WHERE userId = ? ORDER BY createdAt DESC',
        [req.user.id]
      )
      res.json(expenses)
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' })
  }
})

app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const { expenseNumber, category, amount, description, status } = req.body
    const connection = await pool.getConnection()
    try {
      const [result] = await connection.query(
        'INSERT INTO expenses (userId, expenseNumber, category, amount, description, status) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, expenseNumber, category, amount, description, status || 'draft']
      )
      res.json({ id: result.insertId, ...req.body, userId: req.user.id })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense' })
  }
})

app.put('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const { expenseNumber, category, amount, description, status } = req.body
    const connection = await pool.getConnection()
    try {
      await connection.query(
        'UPDATE expenses SET expenseNumber=?, category=?, amount=?, description=?, status=?, updatedAt=NOW() WHERE id=? AND userId=?',
        [expenseNumber, category, amount, description, status, req.params.id, req.user.id]
      )
      res.json({ id: req.params.id, ...req.body })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update expense' })
  }
})

app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      await connection.query('DELETE FROM expenses WHERE id=? AND userId=?', [req.params.id, req.user.id])
      res.json({ message: 'Expense deleted' })
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' })
  }
})

// SETTINGS
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      let [settings] = await connection.query('SELECT * FROM settings WHERE userId = ?', [req.user.id])
      if (settings.length === 0) {
        await connection.query('INSERT INTO settings (userId, companyName) VALUES (?, ?)', [req.user.id, 'PUSHPAK ROADLINES'])
        [settings] = await connection.query('SELECT * FROM settings WHERE userId = ?', [req.user.id])
      }
      res.json(settings[0])
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const { logo, companyName, tagline } = req.body
    const connection = await pool.getConnection()
    try {
      await connection.query(
        'UPDATE settings SET logo=?, companyName=?, tagline=?, updatedAt=NOW() WHERE userId=?',
        [logo, companyName, tagline, req.user.id]
      )
      const [settings] = await connection.query('SELECT * FROM settings WHERE userId = ?', [req.user.id])
      res.json(settings[0])
    } finally {
      await connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend running', timestamp: new Date().toISOString() })
})

// Start Server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✓ Transport Backend Server running on http://localhost:${PORT}`)
    console.log(`✓ API: http://localhost:${PORT}/api`)
    console.log(`✓ Test User: 9999999999 (any password)\n`)
  })
}).catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
