# 🔐 Mobile OTP Authentication Setup Guide

## Overview

Your Transport ERP now has a complete backend authentication system with:
- ✅ Mobile number login with OTP
- ✅ User registration on first login
- ✅ JWT token-based authentication
- ✅ SQLite database for users and sessions
- ✅ Protected routes
- ✅ User profile management

## Quick Start

### Step 1: Install Dependencies
All dependencies are already installed. If needed, run:
```bash
npm install
```

### Step 2: Start Both Server and Frontend

**Option A: Run Together (Recommended)**
```bash
npm run dev:all
```
This starts:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

**Option B: Run Separately**
Terminal 1:
```bash
npm run dev:server
```

Terminal 2:
```bash
npm run dev
```

### Step 3: Access the App
1. Open http://localhost:5173
2. You'll be redirected to login page
3. Enter mobile number: `9999999999`
4. Click "Send OTP"
5. OTP will appear in console/on screen (in development)
6. Enter the OTP and login

## Test Credentials

**Default Test User:**
- Mobile: `9999999999`
- Password: `password123` (if using password login)
- Company: PUSHPAK ROADLINES

## API Endpoints

### Authentication Endpoints

#### Send OTP
```
POST /api/auth/send-otp
Content-Type: application/json

{
  "mobileNumber": "9876543210"
}

Response:
{
  "message": "OTP sent successfully",
  "testOtp": "123456"  // Only in development
}
```

#### Verify OTP
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "mobileNumber": "9876543210",
  "otp": "123456"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "mobileNumber": "9876543210",
    "companyName": "My Company",
    "email": "user@example.com"
  }
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer {token}

Response:
{
  "id": 1,
  "mobileNumber": "9876543210",
  "companyName": "My Company",
  "email": "user@example.com"
}
```

#### Update Profile
```
PUT /api/auth/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "companyName": "Updated Company Name",
  "email": "newemail@example.com"
}

Response:
{
  "message": "Profile updated",
  "user": {...}
}
```

#### Logout
```
POST /api/auth/logout
Authorization: Bearer {token}

Response:
{
  "message": "Logged out successfully"
}
```

## How It Works

### 1. User Login Flow
```
User enters mobile → Send OTP → OTP sent to console (dev) → 
User enters OTP → Backend verifies → JWT token issued → 
User logged in → Frontend stores token in localStorage
```

### 2. Protected Routes
All dashboard routes require authentication via ProtectedRoute component:
```jsx
<Route path="/bilty" element={<ProtectedRoute><BiltyList /></ProtectedRoute>} />
```

### 3. Token Management
- Token stored in `localStorage` as `authToken`
- Token included in all API requests via Authorization header
- Token valid for 7 days
- Session tracked in database

### 4. Database Schema

#### users table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  mobileNumber TEXT UNIQUE NOT NULL,
  companyName TEXT,
  email TEXT,
  passwordHash TEXT,
  createdAt DATETIME,
  updatedAt DATETIME
)
```

#### otps table
```sql
CREATE TABLE otps (
  id INTEGER PRIMARY KEY,
  mobileNumber TEXT NOT NULL,
  otp TEXT NOT NULL,
  expiresAt DATETIME NOT NULL,
  attempts INTEGER DEFAULT 0,
  createdAt DATETIME
)
```

#### sessions table
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  userId INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME,
  FOREIGN KEY (userId) REFERENCES users(id)
)
```

## Production Setup

### 1. Environment Variables
Update `.env` file with production values:
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-very-long-random-secret-key-here

# For production SMS (using Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# For email OTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 2. Install SMS Service (Optional)
For production SMS sending, use Twilio:
```bash
npm install twilio
```

Then update `server.js` to send actual SMS:
```javascript
// Replace console.log with Twilio SMS
const twilio = require('twilio')
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

// In send-otp endpoint:
await client.messages.create({
  body: `Your OTP is: ${otp}`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: `+91${mobileNumber}`
})
```

### 3. Database Backup
The SQLite database is stored as `transport.db` in the project root. 
For production, backup regularly:
```bash
cp transport.db transport.db.backup
```

### 4. Deploy Backend
Options:
- **Heroku**: Free tier available
- **Railway**: Node.js ready
- **Render**: Easy deployment
- **AWS Lambda**: Serverless option

### 5. Frontend Environment Variable
Update frontend API URL in `.env`:
```env
VITE_API_URL=https://your-backend-url.com/api
```

## Troubleshooting

### Issue: OTP not showing
**Solution**: Check browser console for development OTP, or check server terminal logs

### Issue: Login fails with 401
**Solution**: 
- OTP has expired (valid for 5 minutes)
- OTP is incorrect
- Server not running (check http://localhost:5000/api/health)

### Issue: Protected routes redirect to login
**Solution**:
- Token may have expired
- Clear localStorage: `localStorage.removeItem('authToken')`
- Refresh page and login again

### Issue: CORS errors
**Solution**: Backend CORS is enabled for localhost. Update for production:
```javascript
// In server.js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))
```

## File Structure

```
project/
├── server.js                    # Express backend server
├── .env                         # Environment variables
├── transport.db                 # SQLite database (auto-created)
├── src/
│   ├── context/
│   │   └── AuthContext.jsx     # Auth state management
│   ├── components/
│   │   ├── ProtectedRoute.jsx  # Route protection component
│   │   └── Sidebar.jsx          # Updated with logout
│   ├── pages/
│   │   ├── Login.jsx           # Login page with OTP
│   │   └── [other pages]       # Protected pages
│   └── styles/
│       ├── login.css           # Login page styles
│       └── [other styles]      # Protected page styles
└── package.json                # Updated with backend scripts
```

## Security Best Practices

✅ **Implemented:**
- Passwords hashed with bcrypt
- JWT tokens with expiration
- OTP expires after 5 minutes
- SQL injection protection via parameterized queries
- CORS enabled with credentials support

🔒 **To Add in Production:**
- HTTPS/TLS encryption
- Rate limiting on OTP endpoint
- IP whitelisting
- Database encryption
- Audit logging
- 2FA support
- Refresh token rotation

## Next Steps

1. **Customize OTP Delivery**: Integrate Twilio for SMS
2. **Add Email Verification**: Optional email confirmation
3. **User Profiles**: Extended user fields
4. **API Keys**: Allow third-party integrations
5. **Multi-tenancy**: Support multiple organizations
6. **Backup & Restore**: Database backup functionality

## Support

For issues or questions:
1. Check server logs: `npm run dev:server`
2. Check frontend console: Browser DevTools (F12)
3. Verify .env configuration
4. Check database connection: `sqlite3 transport.db ".tables"`
5. Test API: `curl http://localhost:5000/api/health`

---

**Happy Transporting! 🚚**
