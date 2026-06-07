const express = require("express");
const router = express.Router();

const Settings = require("../models/Settings");

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
router.put("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings(req.body);
      await settings.save();

      return res.json(settings);
    }

    Object.assign(settings, req.body);

    await settings.save();

    res.json(settings);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

module.exports = router;