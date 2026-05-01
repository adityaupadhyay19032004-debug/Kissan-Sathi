// routes/admin.js — Admin panel routes (protected)
const express    = require("express");
const jwt        = require("jsonwebtoken");
const User       = require("./model/user");
const CropScan   = require("./model/CropScan");
const MandiPrice = require("./model/MandiPrice");

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "kisaansaathi_secret_key";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin@kisaan123";

// ── Admin auth middleware ─────────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!token) return res.status(401).json({ success: false, message: "Admin token required." });
  try {
    const decoded = jwt.verify(token, JWT_SECRET + "_admin");
    if (decoded.role !== "admin") throw new Error("Not admin");
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid admin token." });
  }
}

// ── POST /api/admin/login ─────────────────────────────────────────────────────
router.post("/login", (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASS) {
    return res.status(401).json({ success: false, message: "Wrong admin password." });
  }
  const token = jwt.sign({ role: "admin" }, JWT_SECRET + "_admin", { expiresIn: "8h" });
  res.json({ success: true, token });
});

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalScans, totalPrices, healthyScans, diseasedScans] = await Promise.all([
      User.countDocuments(),
      CropScan.countDocuments(),
      MandiPrice.countDocuments(),
      CropScan.countDocuments({ status: "healthy" }),
      CropScan.countDocuments({ status: "diseased" }),
    ]);
    const weekAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    res.json({ success: true, stats: { totalUsers, newUsers, totalScans, healthyScans, diseasedScans, totalPrices } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get("/users", adminAuth, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const filter = search ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] } : {};
    const [users, total] = await Promise.all([
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/scans ──────────────────────────────────────────────────────
router.get("/scans", adminAuth, async (req, res) => {
  try {
    const scans = await CropScan.find().sort({ createdAt: -1 }).limit(50)
      .populate("user_id", "name email").lean();
    res.json({ success: true, scans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/prices ─────────────────────────────────────────────────────
router.get("/prices", adminAuth, async (req, res) => {
  try {
    const prices = await MandiPrice.find().sort({ state: 1, crop: 1 }).lean();
    res.json({ success: true, prices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/prices ────────────────────────────────────────────────────
router.post("/prices", adminAuth, async (req, res) => {
  try {
    const price = await MandiPrice.create(req.body);
    res.status(201).json({ success: true, price });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/admin/prices/:id ──────────────────────────────────────────────
router.delete("/prices/:id", adminAuth, async (req, res) => {
  try {
    await MandiPrice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Price deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
