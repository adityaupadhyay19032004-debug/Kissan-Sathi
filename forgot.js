// routes/forgot.js — Forgot password with OTP via email
const express    = require("express");
const bcrypt     = require("bcryptjs");
const nodemailer = require("nodemailer");
const User       = require("./model/user");

const router = express.Router();

// In-memory OTP store: { email: { otp, expiresAt } }
const otpStore = new Map();

// ── Email transporter ─────────────────────────────────────────────────────────
function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },
  });
}

// ── Generate 6-digit OTP ──────────────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── POST /api/forgot/send-otp ─────────────────────────────────────────────────
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: "No account found with this email." });

    const otp       = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email.toLowerCase(), { otp, expiresAt });

    // Send email if configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS &&
        process.env.EMAIL_USER !== "your_gmail@gmail.com") {
      try {
        const transporter = getTransporter();
        await transporter.sendMail({
          from:    `"KisaanSaathi" <${process.env.EMAIL_USER}>`,
          to:      email,
          subject: "KisaanSaathi — Password Reset OTP",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#faf6ee;border-radius:16px;">
              <h2 style="color:#2d4a1e;">🌾 KisaanSaathi</h2>
              <h3 style="color:#1a2e0d;">Password Reset OTP</h3>
              <p style="color:#3d5a2a;">Your one-time password is:</p>
              <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#2d4a1e;text-align:center;padding:20px;background:#fff;border-radius:12px;margin:20px 0;">
                ${otp}
              </div>
              <p style="color:#7a9160;font-size:14px;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
            </div>
          `,
        });
        res.json({ success: true, message: `OTP sent to ${email}` });
      } catch (mailErr) {
        console.error("Email send failed:", mailErr.message);
        // Fall through to dev mode
        console.log(`[DEV] OTP for ${email}: ${otp}`);
        res.json({ success: true, message: "OTP generated (email failed, using dev mode)", devOtp: otp });
      }
    } else {
      // Dev mode — no email configured, return OTP directly
      console.log(`[DEV] OTP for ${email}: ${otp}`);
      res.json({ success: true, message: `OTP generated successfully!`, devOtp: otp });
    }
  } catch (err) {
    console.error("Send OTP error:", err.message);
    res.status(500).json({ success: false, message: "Failed to send OTP. Try again." });
  }
});

// ── POST /api/forgot/verify-otp ───────────────────────────────────────────────
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP required." });

  const record = otpStore.get(email.toLowerCase());
  if (!record)                      return res.status(400).json({ success: false, message: "OTP not found. Request a new one." });
  if (Date.now() > record.expiresAt) return res.status(400).json({ success: false, message: "OTP expired. Request a new one." });
  if (record.otp !== otp.trim())     return res.status(400).json({ success: false, message: "Wrong OTP. Try again." });

  // Mark as verified
  otpStore.set(email.toLowerCase(), { ...record, verified: true });
  res.json({ success: true, message: "OTP verified!" });
});

// ── POST /api/forgot/reset-password ──────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ success: false, message: "All fields required." });

    const record = otpStore.get(email.toLowerCase());
    if (!record || !record.verified)
      return res.status(400).json({ success: false, message: "Please verify OTP first." });
    if (Date.now() > record.expiresAt)
      return res.status(400).json({ success: false, message: "OTP expired. Start over." });
    if (newPassword.length < 8)
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email: email.toLowerCase() }, { password: hashed });

    otpStore.delete(email.toLowerCase());
    res.json({ success: true, message: "Password reset successfully! You can now login." });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(500).json({ success: false, message: "Reset failed. Try again." });
  }
});

module.exports = router;
