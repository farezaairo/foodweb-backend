const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem"); // Memastikan model kamu ter-import

// 🌐 1. IMPORT ALAT UNTUK CLOUDINARY & MULTER
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// 🔑 2. KONFIGURASI KONEKSI KE CLOUDINARY (Mengambil dari file .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📁 3. SETTING REKREASI FOLDER DI CLOUDINARY
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "foodweb-menu", // Nama folder ini akan otomatis terbuat di akun Cloudinary kamu
    allowed_formats: ["jpg", "png", "jpeg"], // Format file yang diizinkan
  },
});

const upload = multer({ storage: storage });


// 🟢 RUTE 1: GET ALL MENU (Kode Bawaan Kamu)
router.get("/", async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🟢 RUTE 2: GET MENU BY ID (Kode Bawaan Kamu)
router.get("/:id", async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Menu tidak ditemukan" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 🚀 RUTE 3: POST TAMBAH MENU + UPLOAD GAMBAR BARU
// Perhatikan ada 'upload.single("gambar")' sebagai gerbang penyaring file
router.post("/", upload.single("gambar"), async (req, res) => {
  try {
    // Jika user lupa tidak memilih gambar saat submit
    if (!req.file) {
      return res.status(400).json({ message: "Gambar menu wajib di-upload!" });
    }

    // req.file.path otomatis berisi URL internet permanen dari Cloudinary
    const menuBaru = new MenuItem({
      nama: req.body.nama,
      harga: req.body.harga,
      deskripsi: req.body.deskripsi, // sesuaikan dengan field di modelmu jika ada
      gambar: req.file.path, // <--- Link sakti dari Cloudinary masuk ke MongoDB
    });

    const savedMenu = await menuBaru.save();
    res.status(201).json(savedMenu);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;