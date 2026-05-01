// routes/stats.js — App statistics for dashboard
const express    = require("express");
const User       = require("./model/user");
const CropScan   = require("./model/CropScan");
const MandiPrice = require("./model/MandiPrice");

const router = express.Router();

// GET /api/stats — public stats
router.get("/", async (req, res) => {
  try {
    const [totalUsers, totalScans, totalPrices] = await Promise.all([
      User.countDocuments(),
      CropScan.countDocuments(),
      MandiPrice.countDocuments(),
    ]);

    // Recent registrations (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    // Healthy vs diseased scans
    const healthyScans  = await CropScan.countDocuments({ status: "healthy" });
    const diseasedScans = await CropScan.countDocuments({ status: "diseased" });

    res.json({
      success: true,
      stats: {
        totalUsers,
        newUsersThisWeek: newUsers,
        totalScans,
        healthyScans,
        diseasedScans,
        totalPrices,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
