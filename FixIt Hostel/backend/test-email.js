/**
 * Test Gmail Email Configuration
 * Run: node test-email.js
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

const testEmail = async () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║        Testing Gmail Email Configuration               ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    console.error('❌ Error: Gmail credentials not found in .env file');
    console.error('   GMAIL_USER:', gmailUser ? '✓ Set' : '✗ Missing');
    console.error('   GMAIL_APP_PASSWORD:', gmailPassword ? '✓ Set' : '✗ Missing');
    process.exit(1);
  }

  console.log('📋 Configuration Check:');
  console.log(`   GMAIL_USER: ${gmailUser}`);
  console.log(`   GMAIL_APP_PASSWORD: ${gmailPassword.substring(0, 4)}${'*'.repeat(gmailPassword.length - 4)}`);
  console.log();

  try {
    console.log('🔧 Creating Gmail transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    console.log('✓ Transporter created\n');

    console.log('🧪 Verifying Gmail connection...');
    await transporter.verify();
    console.log('✓ Gmail connection verified\n');

    console.log('📧 Attempting to send test email...');
    const testResult = await transporter.sendMail({
      from: gmailUser,
      to: gmailUser, // Send to self for testing
      subject: 'FixIt Hostel - Gmail Connection Test',
      html: `
        <h2>Gmail Configuration Test Successful! ✓</h2>
        <p>Your Gmail credentials are working correctly.</p>
        <p>Email sent from: ${gmailUser}</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    });

    console.log('✓ Email sent successfully');
    console.log(`   Message ID: ${testResult.messageId}\n`);

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ Gmail Configuration is Working Correctly!           ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nPossible Causes:');
    console.error('1. Invalid Gmail credentials');
    console.error('2. App Password is incorrect (not your Gmail password)');
    console.error('3. 2FA not enabled on Gmail account');
    console.error('4. Gmail account locked');
    console.error('5. Network connectivity issue\n');

    console.log('📝 Troubleshooting Tips:');
    console.log('1. Make sure you\'re using an App Password, not your Gmail password');
    console.log('2. Enable 2-Factor Authentication on your Gmail account');
    console.log('3. Generate a new App Password at: https://myaccount.google.com/apppasswords');
    console.log('4. Ensure your Gmail account allows "Less secure apps" or use App Passwords\n');

    process.exit(1);
  }
};

testEmail();
