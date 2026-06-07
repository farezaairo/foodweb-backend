const express = require("express");
const router = express.Router();

const Settings = require("../models/pengaturan");

// GET settings
router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        restaurantName: "Warung Sari",
        tagline: "",
        location: "",
        address: "",
        mapsUrl: "",
        phone: "",
        estimatedMinutes: 20,
        miscCosts: [],
        spiceLevels: [],
        customCategories: [],
        adminPassword: "admin123",
        isOperational: true,
  operationalHours: "09:00 - 21:00",
      });
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// UPDATE settings
router.put("/:id", async (req, res) => {
  try {
    // Hilangkan req.params.id dari pencarian, gunakan {} agar langsung mengupdate dokumen pertama yang ada
    const updatedPengaturan = await Settings.findOneAndUpdate(
      {}, 
      req.body,
      { new: true, upsert: true } // upsert: true akan otomatis membuatkan data jika laci kosong
    );

    if (!updatedPengaturan) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    res.json(updatedPengaturan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;