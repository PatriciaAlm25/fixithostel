#!/usr/bin/env node

/**
 * Email Sending Diagnostic Test
 * This script tests if emails are being sent successfully
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🧪 Email Sending Diagnostic Test');
console.log('================================\n');

// Check environment variables
console.log('1️⃣ Checking environment variables...');
console.log(`   GMAIL_USER: ${process.env.GMAIL_USER ? '✓' : '✗'} ${process.env.GMAIL_USER || 'NOT SET'}`);
console.log(`   GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD ? '✓ (LENGTH: ' + process.env.GMAIL_APP_PASSWORD.length + ')' : '✗'}`);

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.error('\n❌ Email credentials are not properly configured in .env file');
  process.exit(1);
}

// Create transporter
console.log('\n2️⃣ Creating Gmail transporter...');
const transporter = nodemailer.createTransport({
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

// Verify connection
console.log('\n3️⃣ Verifying Gmail connection...');
transporter.verify(async (error, success) => {
  if (error) {
    console.error('❌ Connection failed:', error.message);
    
    // Provide troubleshooting tips
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('   1. Verify Gmail credentials in .env file');
    console.log('   2. Check that 2-Factor Authentication is enabled on your Gmail account');
    console.log('   3. Generate a new App Password from: https://myaccount.google.com/apppasswords');
    console.log('   4. Ensure the email account is not blocked by Gmail security');
    console.log('   5. Check that IMAP/POP3 access is enabled in Gmail settings');
    
    process.exit(1);
  }

  console.log('✅ Gmail SMTP connection successful!');

  // Try sending a test email
  console.log('\n4️⃣ Sending test email...');
  
  const testEmail = {
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER, // Send to self for testing
    subject: '🧪 FixIt Hostel - Email Test',
    html: `
      <h1>Email System Test</h1>
      <p>This is a test email to verify that the email system is working correctly.</p>
      <p>If you received this email, your Gmail SMTP configuration is working! ✅</p>
      <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
    `,
  };

  transporter.sendMail(testEmail, (error, info) => {
    if (error) {
      console.error('❌ Email sending failed:', error.message);
      console.log('\n🔧 Troubleshooting Tips:');
      console.log('   1. Check if Gmail security settings are blocking the connection');
      console.log('   2. Visit: https://myaccount.google.com/lesssecureapps');
      console.log('   3. Or create an App Password: https://myaccount.google.com/apppasswords');
      console.log('   4. Make sure you\'re using the App Password, not your Gmail password');
      process.exit(1);
    } else {
      console.log('✅ Test email sent successfully!');
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Sent to: ${process.env.GMAIL_USER}`);
      console.log('\n✅ Your email system is fully functional!');
      console.log('   Users should now receive OTP emails when they register.\n');
      process.exit(0);
    }
  });
});
