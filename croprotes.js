// routes/croprotes.js — Crop disease via Groq Vision API + MongoDB
const express  = require("express");
const multer   = require("multer");
const Groq     = require("groq-sdk");
const fs       = require("fs");
const path     = require("path");
const CropScan = require("./model/CropScan");
const { authenticate } = require("./auth");

const router = express.Router();

// ── Multer ────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `crop_${Date.now()}${path.extname(file.originalname) || ".jpg"}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only images allowed."));
    cb(null, true);
  },
});

// ── Prompt ────────────────────────────────────────────────────────────────────
const PROMPT = `You are an expert agricultural scientist for Indian farmers.
Analyze this crop/plant leaf image and respond in EXACTLY this format:

DISEASE: [disease name, or "Healthy" if no disease, or "Not a crop leaf" if unclear]
STATUS: [healthy / diseased / invalid]
CONFIDENCE: [0-100]%
SYMPTOMS: [brief description of what you see]
RECOMMENDED ACTION: [specific treatment with fungicide/pesticide names for Indian farmers]
PREVENTION TIPS:
• [tip 1]
• [tip 2]
• [tip 3]`;

function parseResponse(text) {
  const get = (key) => {
    const match = text.match(new RegExp(`${key}:\\s*(.+)`, "i"));
    return match ? match[1].trim() : "";
  };
  const disease    = get("DISEASE")    || "Unknown";
  const statusRaw  = get("STATUS")     || "";
  const confidence = parseInt(get("CONFIDENCE")) || 0;
  let status = "unknown";
  if (statusRaw.toLowerCase().includes("healthy"))  status = "healthy";
  else if (statusRaw.toLowerCase().includes("diseased")) status = "diseased";
  else if (statusRaw.toLowerCase().includes("invalid"))  status = "invalid";
  return { disease, status, confidence };
}

// ── POST /api/crop/analyze ────────────────────────────────────────────────────
router.post("/analyze", upload.single("image"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, message: "No image uploaded." });

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY || GROQ_KEY === "your_groq_api_key_here") {
    fs.unlink(req.file.path, () => {});
    return res.status(503).json({
      success: false,
      message: "GROQ_API_KEY not set. Get FREE key at https://console.groq.com",
    });
  }

  try {
    const groq        = new Groq({ apiKey: GROQ_KEY });
    const base64Image = fs.readFileSync(req.file.path).toString("base64");
    const mimeType    = req.file.mimetype;

    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{
        role: "user",
        content: [
          { type: "text",      text: PROMPT },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
        ],
      }],
      max_tokens: 600,
      temperature: 0.2,
    });

    const resultText = response.choices[0]?.message?.content || "";
    const parsed     = parseResponse(resultText);

    // Save to MongoDB
    const scan = await CropScan.create({
      user_id:    req.user ? req.user.id : null,
      image_name: req.file.filename,
      status:     parsed.status,
      result:     resultText,
    });

    fs.unlink(req.file.path, () => {});

    return res.json({
      success:    true,
      id:         scan._id,
      disease:    parsed.disease,
      status:     parsed.status,
      confidence: parsed.confidence,
      result:     resultText,
    });

  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    console.error("Groq error:", err.message);
    if (err.status === 401)
      return res.status(401).json({ success: false, message: "Invalid Groq API key." });
    if (err.status === 429)
      return res.status(429).json({ success: false, message: "Rate limit. Please wait and retry." });
    res.status(500).json({ success: false, message: "Analysis failed: " + err.message });
  }
});

// ── GET /api/crop/scans ───────────────────────────────────────────────────────
router.get("/scans", authenticate, async (req, res) => {
  try {
    const scans = await CropScan.find({ user_id: req.user.id })
      .sort({ createdAt: -1 }).limit(10).lean();
    res.json({ success: true, scans });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch scans." });
  }
});

// ── GET /api/crop/history ─────────────────────────────────────────────────────
router.get("/history", authenticate, async (req, res) => {
  try {
    const scans = await CropScan.find({ user_id: req.user.id })
      .sort({ createdAt: -1 }).limit(20).lean();
    res.json({ success: true, scans });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch history." });
  }
});

module.exports = router;
