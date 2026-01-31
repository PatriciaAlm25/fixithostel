# Email Troubleshooting Guide - FixIt Hostel

## Issue: Users Not Receiving Emails After Registration

### Quick Diagnosis Checklist

1. **Server Status**
   - [ ] Backend server is running on port 3000
   - [ ] Run `npm start` from `/backend` directory
   - [ ] Check console for "Email Service: Configured ✅"

2. **Gmail Configuration**
   - [ ] Gmail credentials are set in `/backend/.env`
   - [ ] Run `node test-email.js` to verify credentials work
   - [ ] Check that app password is being used (not regular Gmail password)

3. **User's Email Provider**
   - [ ] Email is being sent (check browser console for OTP code)
   - [ ] Email might be in spam/junk folder
   - [ ] Check inbox filters and forwarding rules

### Detailed Solutions

#### Solution 1: Verify Backend Email Service

Run the email test script to ensure Gmail credentials work:

```bash
cd backend
node test-email.js
```

**Expected output:**
```
✅ Gmail Configuration is Working Correctly!
```

**If it fails:**
- Check that `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set in `.env`
- Verify the app password is correct (not your Gmail password)
- Ensure 2FA is enabled on the Gmail account

#### Solution 2: Check Frontend Sending

1. Open browser DevTools (F12)
2. Go to Console tab
3. Register a new user
4. Look for this message:
```
╔════════════════════════════════════════════════════════╗
║     📧 FixIt Hostel - OTP Email Sent Successfully       ║
```

**If you see this message:**
- Email WAS successfully sent
- User should check their inbox

**If you see this instead:**
```
║     ⚠️ FixIt Hostel - Email Sending Failed
```
- Backend service didn't receive the email request
- Check if backend is running and accessible

#### Solution 3: User Email Issues

**Emails going to spam?**
1. Have users check their spam/junk folder
2. Mark the email as "not spam"
3. Add FixIt Hostel email to contacts

**Email not arriving at all?**
1. Check if email address is correct
2. Check email provider's spam filters
3. Some email providers block apps - may need to whitelist

#### Solution 4: Gmail Setup Verification

Verify that the Gmail account has the correct setup:

1. **App Password Configuration:**
   - Go to https://myaccount.google.com/apppasswords
   - Ensure 2-Factor Authentication is enabled
   - Generate a new app password if needed
   - Copy the 16-character password to `.env`

2. **Security Settings:**
   - Check https://myaccount.google.com/security
   - Allow "Less secure app access" OR use App Passwords (preferred)
   - Ensure no unusual login activity blocks

3. **API Configuration:**
   - Gmail API should be enabled in Google Cloud Project
   - Service account should have Gmail API permissions

### Email Sending Flow Diagram

```
User Registration Form
        ↓
Frontend: authService.sendOTP()
        ↓
Backend API: POST /api/auth/send-otp
        ↓
Gmail Transporter
        ↓
Gmail Servers
        ↓
User's Email Inbox (or Spam)
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Backend not running | Start backend with `npm start` |
| `Invalid login credentials` | Wrong app password | Generate new app password at myaccount.google.com |
| `Email service not configured` | Missing .env variables | Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` |
| `Verify connection failed` | Gmail blocking login | Check security settings in Gmail account |

### Testing Email Delivery

**Test Step 1: Verify Backend**
```bash
cd backend
node test-email.js
```

**Test Step 2: Test API Endpoint**
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test@email.com","otp":"123456"}'
```

**Test Step 3: Check Frontend Console**
Register a new user and check DevTools Console for:
- OTP code displayed
- Success/failure message
- Any error details

### Production Checklist

Before deploying to production:

- [ ] Use a dedicated Gmail account for sending (not personal)
- [ ] Set `NODE_ENV=production` in backend `.env`
- [ ] Update `FRONTEND_URL` to your production domain
- [ ] Consider using a dedicated email service (SendGrid, AWS SES, etc.)
- [ ] Set up proper error logging
- [ ] Configure email templates for branding
- [ ] Test email delivery with real email providers
- [ ] Set up SPF, DKIM, DMARC records if using custom domain

### Switching to Professional Email Service

For better reliability, consider switching to:

1. **SendGrid** - Free tier with API
2. **AWS SES** - Cheap and reliable
3. **Mailgun** - Good email service
4. **Nodemailer-SES** - Use AWS SES with Nodemailer

### Debug Logging

To see detailed email sending logs, modify the backend handler:

```javascript
// In authRoutes.js - sendOTPEmail function
console.log('📧 Sending email to:', recipientEmail);
console.log('From:', mailOptions.from);
console.log('Subject:', mailOptions.subject);
// ... more logs
```

### Still Having Issues?

1. Check browser console (F12) during registration
2. Check backend console for error messages
3. Verify `.env` file has correct credentials
4. Run `node test-email.js` to test Gmail connection
5. Check Gmail account security settings
6. Review Firebase Firestore for any stored user data
