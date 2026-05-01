// server.js — KisaanSaathi Express server (MongoDB)
require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const path       = require("path");
const connectDB  = require("./db");

// Route modules
const authRoutes    = require("./auth");
const cropRoutes    = require("./croprotes");
const mandiRoutes   = require("./mandi");
const profileRoutes = require("./profile");
const weatherRoutes = require("./weather");
const statsRoutes   = require("./stats");
const adminRoutes   = require("./admin");
const forgotRoutes  = require("./forgot");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Connect MongoDB first, then start server ──────────────────────────────────
connectDB().then(() => {

  // ── Middleware ──────────────────────────────────────────────────────────────
  app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // Serve frontend HTML files (fixes CORS when opening file://)
  app.use(express.static(path.join(__dirname, "..")));

  // ── Routes ──────────────────────────────────────────────────────────────────
  app.use("/api/auth",    authRoutes);
  app.use("/api/crop",    cropRoutes);
  app.use("/api/ai",      cropRoutes);   // alias for crop-health.html
  app.use("/api/mandi",   mandiRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/weather", weatherRoutes);
  app.use("/api/stats",   statsRoutes);
  app.use("/api/admin",   adminRoutes);
  app.use("/api/forgot",  forgotRoutes);
  app.use("/api/mandi",   mandiRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/weather", weatherRoutes);

  // Health check
  app.get("/", (req, res) => {
    res.json({ status: "ok", message: "KisaanSaathi Backend Running 🌾", db: "MongoDB" });
  });

  // 404
  app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found." });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ success: false, message: err.message || "Internal server error." });
  });

  app.listen(PORT, () => {
    console.log(`🚀 KisaanSaathi server running on http://localhost:${PORT}`);
  });

});
