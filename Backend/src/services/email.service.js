const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

// Verify connection on startup — errors appear in terminal
transporter.verify((error) => {
    if (error) {
        console.error('❌ Email server error:', error.message);
    } else {
        console.log('✅ Email server is ready');
    }
});

// Core email sender — THROWS on failure (no silent catch)
const sendEmail = async (to, subject, text, html) => {
    const info = await transporter.sendMail({
        from: `"Backend Ledger" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
    });
    console.log('📧 Email sent:', info.messageId);
    return info;
};

// Welcome email after registration
async function sendVerificationEmail(userEmail, name) {
    const subject = 'Welcome to Backend Ledger';
    const text = `Hello ${name},\n\nThank you for registering with Backend Ledger.\n\nBest regards,\nBackend Ledger Team`;
    const html = `
        <h2>Hello ${name},</h2>
        <p>Thank you for registering with <strong>Backend Ledger</strong>.</p>
        <p>Best regards,<br/>Backend Ledger Team</p>
    `;
    await sendEmail(userEmail, subject, text, html);
}

async function sendOtpEmail(userEmail, name, otpCode) {
    const subject = "Your OTP for Backend Ledger";
    const text = `Hello ${name},\n\nYour OTP is ${otpCode}. It expires in 10 minutes.\n\nIf you did not request this, ignore this email.\n\nBackend Ledger Team`;
    const html = `
        <h2>Hello ${name},</h2>
        <p>Your OTP is:</p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 6px;">${otpCode}</p>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
    `;
    await sendEmail(userEmail, subject, text, html);
}

// Transaction notification email
async function sendTransactionEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Successful - Backend Ledger';
    const text = `Hello ${name},\n\nYour transfer of ${amount} to account ${toAccount} was completed successfully.\n\nBest regards,\nBackend Ledger Team`;
    const html = `
        <h2>Hello ${name},</h2>
        <p>Your transfer of <strong>${amount}</strong> to account <strong>${toAccount}</strong> was completed successfully.</p>
        <p>Best regards,<br/>Backend Ledger Team</p>
    `;
    await sendEmail(userEmail, subject, text, html);
}

module.exports = { sendVerificationEmail, sendOtpEmail, sendTransactionEmail };