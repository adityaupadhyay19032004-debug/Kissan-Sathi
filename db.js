// db.js — MongoDB connection via Mongoose
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/kisaansaathi";

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected — kisaansaathi");
    await seedMandiPrices();
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

// ── Seed mandi prices if empty ────────────────────────────────────────────────
async function seedMandiPrices() {
  const MandiPrice = require("./model/MandiPrice");
  const count = await MandiPrice.countDocuments();
  if (count > 0) return;

  const seedData = [
    // Punjab
    { state: "Punjab",           market: "Ludhiana",    crop: "Wheat",     min_price: 2050, max_price: 2250 },
    { state: "Punjab",           market: "Ludhiana",    crop: "Rice",      min_price: 1800, max_price: 2000 },
    { state: "Punjab",           market: "Ludhiana",    crop: "Maize",     min_price: 1550, max_price: 1700 },
    { state: "Punjab",           market: "Amritsar",    crop: "Wheat",     min_price: 2000, max_price: 2200 },
    { state: "Punjab",           market: "Amritsar",    crop: "Mustard",   min_price: 5000, max_price: 5400 },
    { state: "Punjab",           market: "Jalandhar",   crop: "Cotton",    min_price: 6200, max_price: 6800 },
    // Haryana
    { state: "Haryana",          market: "Karnal",      crop: "Wheat",     min_price: 2100, max_price: 2300 },
    { state: "Haryana",          market: "Karnal",      crop: "Rice",      min_price: 1900, max_price: 2100 },
    { state: "Haryana",          market: "Karnal",      crop: "Mustard",   min_price: 5100, max_price: 5500 },
    { state: "Haryana",          market: "Hisar",       crop: "Cotton",    min_price: 6300, max_price: 6700 },
    { state: "Haryana",          market: "Hisar",       crop: "Bajra",     min_price: 1700, max_price: 1900 },
    // Uttar Pradesh
    { state: "Uttar Pradesh",    market: "Agra",        crop: "Potato",    min_price: 800,  max_price: 1100 },
    { state: "Uttar Pradesh",    market: "Agra",        crop: "Wheat",     min_price: 2000, max_price: 2200 },
    { state: "Uttar Pradesh",    market: "Lucknow",     crop: "Sugarcane", min_price: 310,  max_price: 360  },
    { state: "Uttar Pradesh",    market: "Lucknow",     crop: "Rice",      min_price: 1850, max_price: 2050 },
    { state: "Uttar Pradesh",    market: "Kanpur",      crop: "Wheat",     min_price: 1980, max_price: 2180 },
    // Madhya Pradesh
    { state: "Madhya Pradesh",   market: "Indore",      crop: "Soybean",   min_price: 4000, max_price: 4400 },
    { state: "Madhya Pradesh",   market: "Indore",      crop: "Wheat",     min_price: 2000, max_price: 2200 },
    { state: "Madhya Pradesh",   market: "Bhopal",      crop: "Wheat",     min_price: 1980, max_price: 2150 },
    { state: "Madhya Pradesh",   market: "Gwalior",     crop: "Mustard",   min_price: 5000, max_price: 5300 },
    // Rajasthan
    { state: "Rajasthan",        market: "Jaipur",      crop: "Mustard",   min_price: 5000, max_price: 5400 },
    { state: "Rajasthan",        market: "Jaipur",      crop: "Wheat",     min_price: 2000, max_price: 2200 },
    { state: "Rajasthan",        market: "Jodhpur",     crop: "Bajra",     min_price: 1700, max_price: 1900 },
    { state: "Rajasthan",        market: "Jodhpur",     crop: "Cumin",     min_price: 14000,max_price: 16000},
    // Maharashtra
    { state: "Maharashtra",      market: "Pune",        crop: "Onion",     min_price: 900,  max_price: 1400 },
    { state: "Maharashtra",      market: "Pune",        crop: "Tomato",    min_price: 700,  max_price: 950  },
    { state: "Maharashtra",      market: "Nashik",      crop: "Onion",     min_price: 850,  max_price: 1300 },
    { state: "Maharashtra",      market: "Nagpur",      crop: "Orange",    min_price: 2500, max_price: 3500 },
    // Gujarat
    { state: "Gujarat",          market: "Ahmedabad",   crop: "Cotton",    min_price: 6500, max_price: 7000 },
    { state: "Gujarat",          market: "Rajkot",      crop: "Groundnut", min_price: 4800, max_price: 5300 },
    // West Bengal
    { state: "West Bengal",      market: "Kolkata",     crop: "Rice",      min_price: 1900, max_price: 2100 },
    { state: "West Bengal",      market: "Kolkata",     crop: "Potato",    min_price: 900,  max_price: 1200 },
    // Karnataka
    { state: "Karnataka",        market: "Bangalore",   crop: "Tomato",    min_price: 600,  max_price: 900  },
    { state: "Karnataka",        market: "Bangalore",   crop: "Ragi",      min_price: 1800, max_price: 2000 },
    // Andhra Pradesh
    { state: "Andhra Pradesh",   market: "Guntur",      crop: "Chilli",    min_price: 8000, max_price: 12000},
    { state: "Andhra Pradesh",   market: "Vijayawada",  crop: "Rice",      min_price: 1900, max_price: 2100 },
    // Tamil Nadu
    { state: "Tamil Nadu",       market: "Chennai",     crop: "Rice",      min_price: 2000, max_price: 2200 },
    { state: "Tamil Nadu",       market: "Coimbatore",  crop: "Banana",    min_price: 1500, max_price: 2000 },
    // Bihar
    { state: "Bihar",            market: "Patna",       crop: "Wheat",     min_price: 1900, max_price: 2100 },
    { state: "Bihar",            market: "Patna",       crop: "Maize",     min_price: 1600, max_price: 1800 },
  ];

  await MandiPrice.insertMany(seedData);
  console.log(`✅ Seeded ${seedData.length} mandi price records`);
}

module.exports = connectDB;
