# FixIt Hostel Backend

Backend API server for FixIt Hostel application with Gmail OTP authentication support.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**For Gmail App Password (Easy):**
```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

**For Google Cloud Service Account (Recommended):**
```env
PORT=3000
NODE_ENV=production
FRONTEND_URL=http://localhost:5173
GOOGLE_SERVICE_ACCOUNT_JSON=./service-account-key.json
GMAIL_SENDER_EMAIL=your-email@yourdomain.com
```

### 3. Start the Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

You should see:
```
✅ Gmail API Transporter initialized
🚀 Server running on: http://localhost:3000
📧 Email Service: Configured ✅
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Send OTP
```
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```
Sends OTP code to the specified email address.

### Test Email Configuration
```
GET /api/auth/test-email
```
Verifies that email service is properly configured.

## Setup Guide

For detailed setup instructions, see [GMAIL_OTP_SETUP.md](../GMAIL_OTP_SETUP.md)

### Quick Setup Steps:

1. **Method 1: Gmail App Password** (Easy, for testing)
   - Enable 2-Step Verification on Google Account
   - Generate App Password
   - Add credentials to `.env`
   - Run server

2. **Method 2: Google Cloud Service Account** (Recommended, for production)
   - Create Google Cloud Project
   - Enable Gmail API
   - Create Service Account
   - Download credentials JSON
   - Add path and sender email to `.env`
   - Run server

## Project Structure

```
backend/
├── server.js                 # Main server file
├── routes/
│   └── authRoutes.js        # Authentication endpoints
├── package.json             # Dependencies
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

## Environment Variables

| Variable | Description | Method |
|----------|-------------|--------|
| PORT | Server port (default: 3000) | Both |
| NODE_ENV | Environment (development/production) | Both |
| FRONTEND_URL | Frontend URL for CORS | Both |
| GMAIL_USER | Gmail account email | App Password |
| GMAIL_APP_PASSWORD | Gmail app-specific password | App Password |
| GOOGLE_SERVICE_ACCOUNT_JSON | Path to service account JSON | Service Account |
| GMAIL_SENDER_EMAIL | Email authorized to send | Service Account |

## Features

- ✅ Gmail OTP authentication
- ✅ Support for both Service Account and App Password methods
- ✅ Comprehensive error handling
- ✅ CORS support
- ✅ Health check endpoint
- ✅ Email configuration testing
- ✅ Production-ready security

## Security

- Never commit `.env` or service account keys
- Use environment variables for all sensitive data
- Implement rate limiting in production
- Use HTTPS in production
- Rotate credentials regularly

## Troubleshooting

### Email not sending?
1. Check if backend is running: `curl http://localhost:3000/health`
2. Test email config: `curl http://localhost:3000/api/auth/test-email`
3. Check `.env` file is configured correctly
4. Review server logs for errors

### CORS errors?
- Verify `FRONTEND_URL` in `.env` matches your frontend URL
- Restart server after changing `.env`

### "Module not found"?
- Run `npm install` to install dependencies
- Check that you're in the backend directory

## Dependencies

- **express**: Web framework
- **cors**: Cross-Origin Resource Sharing
- **dotenv**: Environment variable management
- **nodemailer**: Email sending library

## Development

```bash
# Install with dev dependencies
npm install --save-dev nodemon

# Start with auto-reload
npm run dev
```

## Production Deployment

1. Use Google Cloud Service Account (not App Password)
2. Set `NODE_ENV=production`
3. Use HTTPS endpoints
4. Configure proper CORS origins
5. Implement rate limiting
6. Set up monitoring and logging
7. Use environment variable management system
8. Regular backup of configuration

## Support

For detailed setup instructions and troubleshooting, see [GMAIL_OTP_SETUP.md](../GMAIL_OTP_SETUP.md)

## License

MIT

---

**FixIt Hostel Backend** - Gmail OTP Authentication Service
