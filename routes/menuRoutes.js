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

// 🟢 GET ALL MENU
router.get("/", async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🟢 GET BY ID
router.get("/:id", async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu tidak ditemukan" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🚀 POST TAMBAH MENU (Sesuai Skema Database Indonesia)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let urlGambarFinal = "";
    if (req.file) {
      urlGambarFinal = req.file.path; 
    } else if (req.body.gambar) {
      urlGambarFinal = req.body.gambar;
    } else if (req.body.image) {
      urlGambarFinal = req.body.image;
    }

    if (!urlGambarFinal) {
      return res.status(400).json({ message: "Gambar menu wajib diisi!" });
    }

    const menuBaru = new MenuItem({
      nama: req.body.nama || req.body.name || "Menu Baru",
      harga: Number(req.body.harga || req.body.price || 0),
      deskripsi: req.body.deskripsi || req.body.description || "",
      gambar: urlGambarFinal,
      stok: Number(req.body.stok !== undefined ? req.body.stok : (req.body.stock !== undefined ? req.body.stock : 10)),
      category: req.body.category || "Makanan Utama",
      discount: req.body.discount !== undefined ? Number(req.body.discount) : 0,
      available: req.body.available === "true" || req.body.available === true || req.body.available === undefined,
      isFlashSale: req.body.isFlashSale === "true" || req.body.isFlashSale === true,
      hasSpiceLevel: req.body.hasSpiceLevel === "true" || req.body.hasSpiceLevel === true,
    });

    const savedMenu = await menuBaru.save();
    res.status(201).json(savedMenu);
  } catch (err) {
    console.error("Error Post:", err);
    res.status(500).json({ message: err.message });
  }
});

// 🚀 PUT UPDATE MENU
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu tidak ditemukan" });

    let urlGambarFinal = item.gambar || item.image || "";
    if (req.file) {
      urlGambarFinal = req.file.path;
    } else if (req.body.gambar || req.body.image) {
      urlGambarFinal = req.body.gambar || req.body.image;
    }

    if (req.body.nama !== undefined || req.body.name !== undefined) {
      item.nama = req.body.nama || req.body.name;
    }
    if (req.body.harga !== undefined || req.body.price !== undefined) {
      item.harga = Number(req.body.harga !== undefined ? req.body.harga : req.body.price);
    }
    if (req.body.deskripsi !== undefined || req.body.description !== undefined) {
      item.deskripsi = req.body.deskripsi !== undefined ? req.body.deskripsi : req.body.description;
    }
    
    item.gambar = urlGambarFinal;
    item.category = req.body.category || item.category;
    item.discount = req.body.discount !== undefined ? Number(req.body.discount) : item.discount;

    if (req.body.stok !== undefined || req.body.stock !== undefined) {
      item.stok = Number(req.body.stok !== undefined ? req.body.stok : req.body.stock);
    }

    if (req.body.available !== undefined) {
      item.available = req.body.available === "true" || req.body.available === true;
    }
    if (req.body.isFlashSale !== undefined) {
      item.isFlashSale = req.body.isFlashSale === "true" || req.body.isFlashSale === true;
    }
    if (req.body.hasSpiceLevel !== undefined) {
      item.hasSpiceLevel = req.body.hasSpiceLevel === "true" || req.body.hasSpiceLevel === true;
    }

    const updatedMenu = await item.save();
    res.json(updatedMenu);
  } catch (err) {
    console.error("Error Put:", err);
    res.status(500).json({ message: err.message });
  }
});

// 🟢 DELETE MENU
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