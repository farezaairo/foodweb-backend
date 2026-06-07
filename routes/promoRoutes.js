const express = require("express");
const router = express.Router();

const Promo = require("../models/Promo");

// GET semua promo
router.get("/", async (req, res) => {
  try {
    const promos = await Promo.find().sort({ createdAt: -1 });

    res.json(promos);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// GET promo by id
router.get("/:id", async (req, res) => {
  try {
    const promo = await Promo.findById(req.params.id);

    if (!promo) {
      return res.status(404).json({
        message: "Promo tidak ditemukan",
      });
    }

    res.json(promo);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// GET promo by code
router.get("/code/:code", async (req, res) => {
  try {
    const promo = await Promo.findOne({
      code: req.params.code.toUpperCase(),
      active: true,
    });

    if (!promo) {
      return res.status(404).json({
        message: "Kode promo tidak ditemukan",
      });
    }

    res.json(promo);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// POST tambah promo
router.post("/", async (req, res) => {
  try {
    const promo = new Promo(req.body);

    await promo.save();

    res.status(201).json(promo);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// UPDATE promo
router.put("/:id", async (req, res) => {
  try {
    const promo = await Promo.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    if (!promo) {
      return res.status(404).json({
        message: "Promo tidak ditemukan",
      });
    }

    res.json(promo);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// DELETE promo
router.delete("/:id", async (req, res) => {
  try {
    const promo = await Promo.findByIdAndDelete(req.params.id);

    if (!promo) {
      return res.status(404).json({
        message: "Promo tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Promo berhasil dihapus",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

module.exports = router;