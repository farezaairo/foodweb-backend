const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem"); 

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "foodweb-menu",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage: storage });

// 🟢 RUTE 1: GET ALL MENU
router.get("/", async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🟢 RUTE 2: GET MENU BY ID
router.get("/:id", async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu tidak ditemukan" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🚀 RUTE 3: POST TAMBAH MENU
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let urlGambarFinal = "";
    if (req.file) {
      urlGambarFinal = req.file.path; 
    } else if (req.body.image || req.body.gambar) {
      urlGambarFinal = req.body.image || req.body.gambar; 
    }

    if (!urlGambarFinal) {
      return res.status(400).json({ message: "Gambar menu wajib diisi!" });
    }

    // Ambil data langsung, toleransi bahasa Inggris maupun Indonesia
    const menuBaru = new MenuItem({
      nama: req.body.name || req.body.nama,
      harga: Number(req.body.price || req.body.harga || 0),
      deskripsi: req.body.description || req.body.deskripsi || "",
      gambar: urlGambarFinal,
      category: req.body.category || "Makanan Utama",
      stock: req.body.stock !== undefined ? Number(req.body.stock) : 10,
      discount: req.body.discount !== undefined ? Number(req.body.discount) : 0,
      available: req.body.available === "true" || req.body.available === true,
      isFlashSale: req.body.isFlashSale === "true" || req.body.isFlashSale === true,
      hasSpiceLevel: req.body.hasSpiceLevel === "true" || req.body.hasSpiceLevel === true,
    });

    const savedMenu = await menuBaru.save();
    res.status(201).json(savedMenu);
  } catch (err) {
    console.error("Error Post Backend:", err);
    res.status(500).json({ message: err.message });
  }
});

// 🚀 RUTE 4: PUT UPDATE MENU
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu tidak ditemukan" });

    let urlGambarFinal = item.gambar;
    if (req.file) {
      urlGambarFinal = req.file.path;
    } else if (req.body.image || req.body.gambar) {
      urlGambarFinal = req.body.image || req.body.gambar;
    }

    item.nama = req.body.name || req.body.nama || item.nama;
    item.harga = req.body.price !== undefined ? Number(req.body.price) : item.harga;
    item.deskripsi = req.body.description !== undefined ? req.body.description : item.deskripsi;
    item.gambar = urlGambarFinal;
    item.category = req.body.category || item.category;
    item.stock = req.body.stock !== undefined ? Number(req.body.stock) : item.stock;
    item.discount = req.body.discount !== undefined ? Number(req.body.discount) : item.discount;

    const updatedMenu = await item.save();
    res.json(updatedMenu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🚀 RUTE 5: DELETE MENU
router.delete("/:id", async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu tidak ditemukan" });
    res.json({ message: "Menu berhasil dihapus", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;