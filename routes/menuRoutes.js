const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem");

// GET semua menu
router.get("/", async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET menu by id
router.get("/:id", async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        message: "Menu tidak ditemukan",
      });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// POST tambah menu
router.post("/", async (req, res) => {
  try {
    const item = new MenuItem(req.body);

    await item.save();

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// PUT update menu
router.put("/:id", async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(item);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// DELETE menu
router.delete("/:id", async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

module.exports = router;