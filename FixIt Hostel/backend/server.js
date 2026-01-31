/**
 * FixIt Hostel Backend Server
 * Handles OTP authentication and email delivery via Gmail API
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { sendOTPHandler, testEmailHandler, registerHandler, loginHandler, getCurrentUserHandler } = require('./routes/authRoutes');
const issueRoutes = require('./routes/issueRoutes');
const lostFoundRoutes = require('./routes/lostFoundRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const managementRoutes = require('./routes/managementRoutes');
const { createNoticeHandler, getNoticesHandler, getNoticeByIdHandler, updateNoticeHandler, deleteNoticeHandler } = require('./routes/noticesRoutes');

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
  const fs = require('fs');
  fs.appendFileSync('error.log', `\n❌ UNCAUGHT EXCEPTION: ${JSON.stringify(err, null, 2)}\n${err.stack}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise, 'reason:', reason);
  const fs = require('fs');
  fs.appendFileSync('error.log', `\n❌ UNHANDLED REJECTION: ${reason}\n${reason.stack}\n`);
});

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow multiple ports for development
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5175',
      'http://localhost:5176',
      'http://127.0.0.1:5176',
      'http://localhost:5177',
      'http://127.0.0.1:5177',
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

console.log('✓ Middlewares initialized');

// Serve uploads directory as static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

console.log('✓ Static files configured');

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'FixIt Hostel Backend is running' });
});

// Authentication Routes
app.post('/api/auth/send-otp', sendOTPHandler);
app.get('/api/auth/test-email', testEmailHandler);
app.post('/api/auth/register', registerHandler);
app.post('/api/auth/login', loginHandler);
app.get('/api/auth/me', getCurrentUserHandler);

// Issue Routes
app.use('/api/issues', issueRoutes);

// Lost & Found Routes
app.use('/api/lost-found', lostFoundRoutes);

// Announcement Routes
app.use('/api/announcements', announcementRoutes);

// Management Routes
app.use('/api/management', managementRoutes);

// Notices Routes
app.post('/api/notices', createNoticeHandler);
app.get('/api/notices', getNoticesHandler);
app.get('/api/notices/:id', getNoticeByIdHandler);
app.put('/api/notices/:id', updateNoticeHandler);
app.delete('/api/notices/:id', deleteNoticeHandler);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║     FixIt Hostel Backend Server Started               ║
╚══════════════════════════════════════════════════════╝

🚀 Server running on: http://localhost:${PORT}
📧 Email Service: ${(process.env.GMAIL_SENDER_EMAIL || process.env.GMAIL_USER) ? 'Configured ✅' : 'Not configured ⚠️'}
🔐 CORS Origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
📁 Static Files: /uploads

Available Endpoints:
- GET  /health                           - Health check
- POST /api/auth/send-otp                - Send OTP to email
- GET  /api/auth/test-email              - Test email configuration
- POST /api/auth/register                - Register new user
- POST /api/auth/login                   - Login with email/password
- GET  /api/auth/me                      - Get current user
- POST /api/issues                       - Create issue with image
- GET  /api/issues                       - Get all issues (filters: status, hostel)
- GET  /api/issues/:id                   - Get single issue
- PUT  /api/issues/:id/assign            - Assign issue to caretaker
- PUT  /api/issues/:id/status            - Update issue status
- DELETE /api/issues/:id                 - Delete issue (own only)
- POST /api/lost-found                   - Post lost/found item with image
- GET  /api/lost-found                   - Get all items (filters: item_type, status, hostel)
- GET  /api/lost-found/:id               - Get item details
- PUT  /api/lost-found/:id/status        - Update item status
- DELETE /api/lost-found/:id             - Delete item (own only)
- POST /api/announcements                - Create announcement (Management only)
- GET  /api/announcements                - Get all announcements (filters: hostel, priority)
- GET  /api/announcements/:id            - Get announcement details
- PUT  /api/announcements/:id            - Update announcement (Management only)
- DELETE /api/announcements/:id          - Delete announcement (Management only)
- POST /api/notices                      - Post notice (Management only)
- GET  /api/notices                      - Get all notices
- GET  /api/notices/:id                  - Get notice details
- PUT  /api/notices/:id                  - Update notice (Management only)
- DELETE /api/notices/:id                - Delete notice (Management only)
  `);
});

module.exports = app;
