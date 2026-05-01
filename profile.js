// routes/profile.js — User profile routes (MongoDB)
const express = require("express");
const User    = require("./model/user");
const { authenticate } = require("./auth");

const router = express.Router();

// ── GET /api/profile ──────────────────────────────────────────────────────────
router.get("/", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch profile." });
  }
});

// ── PUT /api/profile ──────────────────────────────────────────────────────────
router.put("/", authenticate, async (req, res) => {
  try {
    const { name, phone, location, crops, avatar_url } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name, phone, location, crops, avatar_url } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, message: "Profile updated!", user: updated });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ success: false, message: "Update failed." });
  }
});

module.exports = router;
