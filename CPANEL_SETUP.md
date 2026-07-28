# cPanel MySQL Setup Guide

This app is now configured to use MySQL/MariaDB (cPanel compatible) instead of SQLite. Follow these steps to set it up:

## Step 1: Create Database in cPanel

1. Log into cPanel
2. Go to **MySQL Databases** (or **MySQL® Databases**)
3. Click **Create New Database**
4. Enter database name: `transport_khata`
5. Click **Create Database**

## Step 2: Create Database User

1. In the same MySQL Databases section, scroll down to **MySQL Users**
2. Click **Create New User**
3. Enter username: `transport_user` (or your preferred name)
4. Create a strong password
5. Click **Create User**

## Step 3: Associate User with Database

1. Go to **MySQL User Privileges** section
2. Select user and database from dropdowns
3. Check **ALL PRIVILEGES**
4. Click **Make Changes**

## Step 4: Update .env File

Update your `.env` file with the database credentials:

```env
DB_HOST=localhost
DB_USER=transport_user
DB_PASSWORD=your_password_here
DB_NAME=transport_khata
```

**For cPanel on shared hosting:**
- DB_HOST is typically `localhost`
- DB_USER will be something like `username_dbuser`
- DB_NAME will be something like `username_transport_khata`

(cPanel prefixes your database and user names with your cPanel username)

## Step 5: Deploy to cPanel

You can deploy this app on cPanel using:

### Option A: Using Node.js App (if available on your cPanel)
1. Go to **Node.js Applications**
2. Create new application
3. Select JavaScript runtime version
4. Set Application Root: `/public_html/transport`
5. Set Start Script: `server.js`
6. Click Create

### Option B: Using Traditional Hosting + Separate Backend
Deploy the frontend to cPanel and run backend on a separate service (Railway, Render, etc.)

### Option C: Use a VPS or Cloud Server
For full Node.js + MySQL support, use:
- DigitalOcean
- Linode  
- AWS EC2
- Google Cloud

## Database Schema

The app automatically creates all required tables on first run:

- **users** - User accounts
- **otps** - OTP verification
- **sessions** - Login sessions
- **settings** - Company branding
- **parties** - Customers/Parties
- **suppliers** - Suppliers
- **trucks** - Vehicle information
- **drivers** - Driver records
- **bilties** - Shipping documents
- **partyInvoices** - Invoices
- **lorryHire** - Hire records
- **expenses** - Expense tracking

## Environment Variables

### Required
```
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=transport_khata
JWT_SECRET=your_secret_key
```

### Optional
```
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Testing Connection

After setup, test the connection:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "Backend running",
  "timestamp": "2026-07-28T12:00:00.000Z"
}
```

## Troubleshooting

### "Access denied for user"
- Check DB_USER and DB_PASSWORD in .env
- Verify user has privileges for the database

### "Database not found"
- Verify database was created in cPanel
- Check DB_NAME is correct (with cPanel prefix if applicable)

### Connection timeout
- Check DB_HOST is `localhost` for shared hosting
- Verify MySQL service is running in cPanel

### Tables not created
- Delete and recreate the database
- Ensure your DB user has CREATE TABLE privileges

## Backup & Restore

### Backup from cPanel:
1. Go to **phpMyAdmin**
2. Select database
3. Click **Export**
4. Choose SQL format
5. Download backup

### Restore:
1. Create new database
2. In phpMyAdmin, click **Import**
3. Select backup file
4. Click **Go**

## Migration from SQLite

If you had data in SQLite before:
1. Export data from SQLite as CSV
2. Import CSV into MySQL tables using phpMyAdmin

This is now a production-ready MySQL setup! 🚀
