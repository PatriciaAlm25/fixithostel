/**
 * FixIt Hostel - Gmail OTP Backend Service
 * 
 * This file contains the backend API endpoints for sending OTP via Gmail
 * using Google Cloud Console and Gmail API.
 * 
 * Setup Instructions:
 * 1. Create a Google Cloud Project
 * 2. Enable Gmail API
 * 3. Create a Service Account with Gmail API access
 * 4. Download the service account JSON key file
 * 5. Set environment variables
 * 
 * Environment Variables Required:
 * - GOOGLE_SERVICE_ACCOUNT_JSON: Path to service account JSON file
 * - GMAIL_SENDER_EMAIL: Email address authorized to send
 * - NODE_ENV: Set to 'production' for live emails
 * 
 * Usage:
 * POST /api/auth/send-otp
 * {
 *   "email": "user@example.com",
 *   "otp": "123456",
 *   "subject": "OTP Code",
 *   "template": "otp"
 * }
 */

const nodemailer = require('nodemailer');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { registerUser, verifyUserCredentials, userExists, findUserByEmail, isEmailAlreadyRegistered } = require('../database');

// In-memory OTP store: { email -> { otp, expiresAt } }
const otpStore = new Map();

// Cleanup expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (record.expiresAt <= now) otpStore.delete(email);
  }
}, 30 * 1000); // every 30s

// Initialize Gmail transporter
let gmailTransporter = null;

const initializeGmailTransporter = async () => {
  if (gmailTransporter) return gmailTransporter;

  try {
    // Check if using Gmail API (recommended for production)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GMAIL_SENDER_EMAIL) {
      const serviceAccount = require(path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_JSON));
      
      gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.GMAIL_SENDER_EMAIL,
          serviceAccountEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key,
          accessUrl: 'https://www.googleapis.com/oauth2/v4/token',
        },
      });

      console.log('✅ Gmail API Transporter initialized');
      return gmailTransporter;
    }

    // Fallback to App Password authentication
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      console.log('📧 Initializing Gmail App Password transporter...');
      console.log('   Email:', process.env.GMAIL_USER);
      console.log('   Password Length:', process.env.GMAIL_APP_PASSWORD?.length || 0, 'characters');
      
      gmailTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
      });

      console.log('✅ Gmail App Password Transporter initialized');
      
      return gmailTransporter;
    }

    console.warn('⚠️ No Gmail credentials configured. Email sending disabled.');
    return null;
  } catch (error) {
    console.error('❌ Failed to initialize Gmail transporter:', error);
    return null;
  }
};

/**
 * Send OTP Email via Gmail
 * @param {string} recipientEmail - Email address to send OTP to
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<Object>} - Success or failure response
 */
const sendOTPEmail = async (recipientEmail, otp) => {
  try {
    console.log(`📧 Starting to send OTP to ${recipientEmail}...`);
    const transporter = await initializeGmailTransporter();

    if (!transporter) {
      console.warn('⚠️ Email service not configured. OTP will be logged to console.');
      console.log(`
╔════════════════════════════════════════════════════════╗
║          📧 DEMO MODE - OTP Code                        ║
╠════════════════════════════════════════════════════════╣
║ To: ${recipientEmail}
║ OTP: ${otp}
║ Valid for: 1 minute
║                                                        ║
║ In demo mode, this email is logged to console.         ║
╚════════════════════════════════════════════════════════╝
      `);
      return {
        success: true,
        message: 'OTP generated (Demo Mode - Check console)',
        demoMode: true,
      };
    }

    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667eea; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .otp-code { 
              font-size: 32px; 
              font-weight: bold; 
              color: #667eea; 
              text-align: center; 
              padding: 20px; 
              background: #e8eef7; 
              border-radius: 5px; 
              letter-spacing: 5px;
              margin: 20px 0;
            }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            .warning { color: #d9534f; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>FixIt Hostel</h1>
              <p>One-Time Password Verification</p>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You requested a One-Time Password (OTP) to access your FixIt Hostel account. Please use the code below to complete your login or registration:</p>
              
              <div class="otp-code">${otp}</div>
              
              <p><strong>Important:</strong></p>
              <ul>
                <li>This OTP is valid for <strong>1 minute</strong></li>
                <li>Never share this code with anyone</li>
                <li>FixIt Hostel staff will never ask for your OTP</li>
                <li>If you didn't request this OTP, please ignore this email</li>
              </ul>

              <div class="warning">
                <p>⚠️ If you did not attempt to login or register, please change your password and contact our support team immediately.</p>
              </div>

              <div class="footer">
                <p>© 2026 FixIt Hostel. All rights reserved.</p>
                <p>This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.GMAIL_SENDER_EMAIL || process.env.GMAIL_USER || 'noreply@fixithostel.com',
      to: recipientEmail,
      subject: 'FixIt Hostel - Your One-Time Password (OTP)',
      html: emailContent,
      replyTo: 'support@fixithostel.com',
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ OTP sent successfully to ${recipientEmail}`);
    return {
      success: true,
      messageId: result.messageId,
      message: 'OTP sent successfully to your email',
    };
  } catch (error) {
    console.error(`❌ Failed to send OTP to ${recipientEmail}:`, error.message);
    console.warn(`📧 Using demo mode - OTP will be logged to console.`);
    console.log(`
╔════════════════════════════════════════════════════════╗
║          📧 DEMO MODE - OTP Code (EMAIL ERROR)          ║
╠════════════════════════════════════════════════════════╣
║ To: ${recipientEmail}
║ OTP: ${otp}
║ Valid for: 1 minute
║                                                        ║
║ Email Error: ${error.message.substring(0, 40)}...
║ OTP is still valid - enter it in the app             ║
╚════════════════════════════════════════════════════════╝
    `);
    // Return success anyway because OTP is stored locally in frontend
    return {
      success: true,
      message: 'OTP generated (Check browser console for the code)',
      demoMode: true,
      error: error.message,
    };
  }
};

/**
 * Express Route Handler for sending OTP
 * POST /api/auth/send-otp
 * Generates a random 6-digit OTP and sends it via email
 */
const sendOTPHandler = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`✅ Generated OTP for ${email}: ${otp}`);

    // Store OTP with 60s expiry
    try {
      otpStore.set(email, { otp, expiresAt: Date.now() + 60 * 1000 });
      console.log(`🔐 Stored OTP for ${email} (expires in 60s)`);
    } catch (e) {
      console.warn('⚠️ Failed to store OTP in memory:', e.message);
    }

    // Send OTP asynchronously in background
    setImmediate(async () => {
      try {
        await sendOTPEmail(email, otp);
      } catch (error) {
        console.error('Background OTP send error:', error.message);
      }
    });

    // Return immediate success response
    res.json({
      success: true,
      message: 'OTP is being sent to your email',
      email: email,
      demoMode: false,
    });
  } catch (error) {
    console.error('OTP Send Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP',
    });
  }
};

/**
 * Express Route Handler for testing email configuration
 * GET /api/auth/test-email
 */
const testEmailHandler = async (req, res) => {
  try {
    const transporter = await initializeGmailTransporter();

    if (!transporter) {
      return res.status(500).json({
        success: false,
        message: 'Email service not configured',
      });
    }

    // Verify connection using callback
    transporter.verify((error, success) => {
      if (error) {
        console.error('Email Test Error:', error);
        return res.status(500).json({
          success: false,
          message: 'Email service verification failed',
          error: error.message,
        });
      }

      res.json({
        success: true,
        message: 'Email service is properly configured',
        sender: process.env.GMAIL_SENDER_EMAIL || process.env.GMAIL_USER,
      });
    });
  } catch (error) {
    console.error('Email Test Error:', error);
    res.status(500).json({
      success: false,
      message: 'Email service verification failed',
      error: error.message,
    });
  }
};

/**
 * Register a new user with password
 * POST /api/auth/register
 * Requires: email, password, name, role, and other user details
 */
const registerHandler = async (req, res) => {
  console.log('📥 Register request received:', req.body?.email);
  try {
    let { email, password, name, otp, hostel, block, room_no, ...otherData } = req.body;
    
    // Normalize email to lowercase to prevent duplicate registrations
    if (email) email = String(email).toLowerCase().trim();
    console.log('✓ Email normalized:', email);

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // OTP validation (frontend already verifies it, so just check it exists)
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required',
      });
    }

    // Verify OTP against stored value
    const stored = otpStore.get(email);
    if (!stored) {
      console.warn('⚠️ No OTP found or OTP expired for:', email);
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new code.' });
    }

    if (stored.expiresAt < Date.now()) {
      otpStore.delete(email);
      console.warn('⚠️ OTP expired for:', email);
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new code.' });
    }

    if (String(stored.otp) !== String(otp)) {
      console.warn('⚠️ OTP mismatch for:', email);
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check the code and try again.' });
    }

    console.log('✓ OTP verified for:', email);
    // OTP is used - remove it
    otpStore.delete(email);
    console.log('✓ Validation passed, checking if email is already registered:', email);
    
    // Check if email is already registered (comprehensive check: local + Supabase)
    const emailAlreadyExists = await isEmailAlreadyRegistered(email);
    if (emailAlreadyExists) {
      console.log('❌ Email already registered in database:', email);
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please use a different email or login instead.',
      });
    }

    console.log('✓ Email is available, registering new user:', email);
    
    // Register user
    const user = await registerUser({
      email,
      password,
      name: name || '',
      hostel: hostel || '',
      block: block || '',
      room_no: room_no || '',
      email_verified: true,
      ...otherData,
    });

    console.log('✅ User registered successfully:', email);

    // Auto-assign issues if caretaker is registering
    if (user.role === 'caretaker') {
      try {
        console.log(`🔄 Auto-assigning issues to caretaker: ${user.name}`);
        
        const { createClient } = require('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Get unassigned issues (max 5)
        const { data: unassignedIssues } = await supabase
          .from('issues')
          .select('id')
          .eq('status', 'Reported')
          .is('assigned_caretaker_id', null)
          .limit(5);
        
        if (unassignedIssues && unassignedIssues.length > 0) {
          const assignedIds = unassignedIssues.map(i => i.id);
          
          // Auto-assign issues
          await supabase
            .from('issues')
            .update({
              assigned_caretaker_id: user.id,
              status: 'Assigned',
              assigned_at: new Date().toISOString(),
            })
            .in('id', assignedIds);
          
          console.log(`✅ Auto-assigned ${assignedIds.length} issues to ${user.name}`);
        } else {
          console.log('ℹ️ No unassigned issues to distribute');
        }
      } catch (assignError) {
        console.warn('⚠️ Auto-assignment failed (non-fatal):', assignError.message);
        // Don't fail the registration if auto-assignment fails
      }
    }

    // Return success with JWT token
    const token = require('jsonwebtoken').sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hostel: user.hostel,
        block: user.block,
        room_no: user.room_no,
      },
      token: token,
    });
  } catch (error) {
    console.error('❌ Registration Error:', error);
    
    if (error.message && error.message.includes('already registered')) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered. Please use a different email or try logging in.',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

/**
 * Login user with email and password
 * POST /api/auth/login
 * Requires: email, password
 */
const loginHandler = async (req, res) => {
  try {
    console.log('📥 Login request received');
    let { email, password } = req.body;

    console.log('✓ Email:', email);
    console.log('✓ Password length:', password ? password.length : 0);

    // Normalize email
    if (email) email = String(email).toLowerCase().trim();
    console.log('✓ Email normalized:', email);

    // Validate required fields
    if (!email || !password) {
      console.warn('⚠️ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.warn('⚠️ Invalid email format:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    console.log('🔍 Verifying credentials for:', email);
    // Verify credentials
    const user = await verifyUserCredentials(email, password);

    if (!user) {
      console.warn('⚠️ Invalid credentials for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    console.log('✅ User login successful via API:', email);
    console.log('📧 Email verification status:', user.email_verified ? '✓ Verified' : '⏳ Pending');

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '30d' }
    );
    console.log('🔑 JWT token generated');

    res.json({
      success: true,
      message: user.email_verified ? 'Login successful' : 'Login successful. Your email is pending verification.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hostel: user.hostel,
        block: user.block,
        room_no: user.room_no,
      },
      token: token,
      emailVerified: user.email_verified || false,
    });
  } catch (error) {
    console.error('❌ Login Error:', error.message);
    console.error('Stack:', error.stack);

    // Return generic message to prevent email enumeration
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }
};

/**
 * Get current user (requires authentication)
 * GET /api/auth/me
 */
const getCurrentUserHandler = async (req, res) => {
  try {
    console.log('📥 Get current user request');
    
    // Try to get email from Authorization header (JWT claims) or query parameter
    let email = req.query.email;
    
    if (!email && req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
        email = decoded.email;
        console.log('✓ Email from JWT token:', email);
      } catch (error) {
        console.warn('⚠️ Could not decode JWT:', error.message);
      }
    }

    if (!email) {
      console.warn('⚠️ No email provided');
      return res.status(400).json({
        success: false,
        message: 'Email parameter or valid token is required',
      });
    }

    const user = findUserByEmail(email);

    if (!user) {
      console.warn('⚠️ User not found:', email);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('✅ Returning user data for:', email);
    const { password, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('❌ Get User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
    });
  }
};

module.exports = {
  sendOTPEmail,
  sendOTPHandler,
  testEmailHandler,
  registerHandler,
  loginHandler,
  getCurrentUserHandler,
  initializeGmailTransporter,
};
