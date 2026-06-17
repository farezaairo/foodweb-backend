const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem"); // Memastikan model kamu ter-import

// 🌐 1. IMPORT ALAT UNTUK CLOUDINARY & MULTER
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// 🔑 2. KONFIGURASI KONEKSI KE CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📁 3. SETTING REKREASI FOLDER DI CLOUDINARY
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "foodweb-menu",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage: storage });

// Fungsi Pembantu: Mengubah data Bahasa Indonesia dari MongoDB menjadi Bahasa Inggris untuk Frontend
function formatToFrontend(item) {
  if (!item) return null;
  return {
    _id: item._id,
    id: item._id,
    name: item.nama || item.name || '',
    price: item.harga || item.price || 0,
    description: item.deskripsi || item.description || '',
    image: item.gambar || item.image || '', // Menjamin field 'image' terbaca di frontend grid gambar
    category: item.category || '',
    stock: item.stock ?? 10,
    discount: item.discount ?? 0,
    available: item.available ?? true,
    isFlashSale: item.isFlashSale ?? false,
    hasSpiceLevel: item.hasSpiceLevel ?? false,
    salePrice: item.salePrice,
    saleEndTime: item.saleEndTime
  };
}


// 🟢 RUTE 1: GET ALL MENU (Disesuaikan agar Frontend bisa baca gambar)
router.get("/", async (req, res) => {
  try {
    const items = await MenuItem.find();
    // Petakan semua item agar menggunakan format bahasa Inggris standar frontend
    const formattedItems = items.map(item => formatToFrontend(item));
    res.json(formattedItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🟢 RUTE 2: GET MENU BY ID
router.get("/:id", async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Menu tidak ditemukan" });
    }
    res.json(formatToFrontend(item));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 🚀 RUTE 3: POST TAMBAH MENU
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let urlGambarFinal = "";
    if (req.file) {
      urlGambarFinal = req.file.path; // Dari Cloudinary
    } else if (req.body.image) {
      urlGambarFinal = req.body.image; // Dari Teks Link URL
    }

    if (!urlGambarFinal) {
      return res.status(400).json({ message: "Gambar menu wajib diisi (Foto atau URL Link)!" });
    }

    const menuBaru = new MenuItem({
      nama: req.body.name || req.body.nama,
      harga: Number(req.body.price || req.body.harga),
      deskripsi: req.body.description || req.body.deskripsi || '',
      gambar: urlGambarFinal, // Disimpan ke field database asli kamu
      category: req.body.category,
      stock: Number(req.body.stock || 10),
      discount: Number(req.body.discount || 0),
      available: req.body.available === 'true' || req.body.available === true,
      isFlashSale: req.body.isFlashSale === 'true' || req.body.isFlashSale === true,
      hasSpiceLevel: req.body.hasSpiceLevel === 'true' || req.body.hasSpiceLevel === true,
      salePrice: req.body.salePrice ? Number(req.body.salePrice) : undefined,
      saleEndTime: req.body.saleEndTime || undefined
    });

    const savedMenu = await menuBaru.save();
    res.status(201).json(formatToFrontend(savedMenu));
  } catch (err) {
    console.error("Error Post Backend:", err);
    res.status(400).json({ message: err.message });
  }
});


// 🚀 RUTE 4: PUT UPDATE MENU (Supaya fitur Edit Menu juga bisa Upload Gambar)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu tidak ditemukan" });

    let urlGambarFinal = item.gambar; // Default pakai gambar lama jika tidak diganti
    if (req.file) {
      urlGambarFinal = req.file.path;
    } else if (req.body.image) {
      urlGambarFinal = req.body.image;
    }

    // Update field bahasa Indonesia di MongoDB berdasarkan kiriman frontend
    item.nama = req.body.name || req.body.nama || item.nama;
    item.harga = req.body.price !== undefined ? Number(req.body.price) : item.harga;
    item.deskripsi = req.body.description !== undefined ? req.body.description : item.deskripsi;
    item.gambar = urlGambarFinal;
    item.category = req.body.category || item.category;
    item.stock = req.body.stock !== undefined ? Number(req.body.stock) : item.stock;
    item.discount = req.body.discount !== undefined ? Number(req.body.discount) : item.discount;
    
    if (req.body.available !== undefined) item.available = req.body.available === 'true' || req.body.available === true;
    if (req.body.isFlashSale !== undefined) item.isFlashSale = req.body.isFlashSale === 'true' || req.body.isFlashSale === true;
    if (req.body.hasSpiceLevel !== undefined) item.hasSpiceLevel = req.body.hasSpiceLevel === 'true' || req.body.hasSpiceLevel === true;
    
    if (req.body.salePrice) item.salePrice = Number(req.body.salePrice);
    if (req.body.saleEndTime) item.saleEndTime = req.body.saleEndTime;

    const updatedMenu = await item.save();
    res.json(formatToFrontend(updatedMenu));
  } catch (err) {
    console.error("Error Put Backend:", err);
    res.status(400).json({ message: err.message });
  }
});


// 🚀 RUTE 5: DELETE MENU (Mengatasi Error 404 Not Found saat menghapus)
router.delete("/:id", async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Menu sudah tidak ada atau telah dihapus sebelumnya" });
    }
    res.json({ message: "Menu berhasil dihapus", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;