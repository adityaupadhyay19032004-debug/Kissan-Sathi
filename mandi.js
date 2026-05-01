// routes/mandi.js — Mandi price routes (MongoDB)
const express    = require("express");
const MandiPrice = require("./model/MandiPrice");

const router = express.Router();

// ── GET /api/mandi/prices ─────────────────────────────────────────────────────
router.get("/prices", async (req, res) => {
  try {
    const { state, market, crop } = req.query;
    const filter = {};

    if (state  && state  !== "all") filter.state  = { $regex: state,  $options: "i" };
    if (market && market !== "all") filter.market = { $regex: market, $options: "i" };
    if (crop)                       filter.crop   = { $regex: crop,   $options: "i" };

    const prices = await MandiPrice.find(filter).sort({ crop: 1 }).lean();
    res.json({ success: true, count: prices.length, prices });
  } catch (err) {
    console.error("Mandi prices error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch prices." });
  }
});

// ── GET /api/mandi/states ─────────────────────────────────────────────────────
router.get("/states", async (req, res) => {
  try {
    const states = await MandiPrice.distinct("state");
    res.json({ success: true, states: states.sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch states." });
  }
});

// ── GET /api/mandi/markets ────────────────────────────────────────────────────
router.get("/markets", async (req, res) => {
  try {
    const { state } = req.query;
    const filter = state ? { state: { $regex: state, $options: "i" } } : {};
    const markets = await MandiPrice.distinct("market", filter);
    res.json({ success: true, markets: markets.sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch markets." });
  }
});

// ── GET /api/mandi/crops ──────────────────────────────────────────────────────
router.get("/crops", async (req, res) => {
  try {
    const crops = await MandiPrice.distinct("crop");
    res.json({ success: true, crops: crops.sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch crops." });
  }
});

module.exports = router;
