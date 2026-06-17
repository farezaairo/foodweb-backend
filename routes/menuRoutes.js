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

// DISESUAIKAN: Menggunakan multer storage yang sudah dikonfigurasi
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


// 🚀 RUTE 3: POST TAMBAH MENU + UPLOAD GAMBAR BARU / LINK TEKS
// PERBAIKAN: Diubah menjadi 'image' agar sinkron dengan kiriman dari Frontend
router.post("/", upload.single("image"), async (req, res) => {
  try {
    // Tentukan URL gambar. Jika ada file fisik, ambil dari Cloudinary (req.file.path).
    // Jika tidak ada file fisik, ambil dari string URL teks biasa (req.body.image).
    let urlGambarFinal = "";
    if (req.file) {
      urlGambarFinal = req.file.path;
    } else if (req.body.image) {
      urlGambarFinal = req.body.image;
    }

    // Validasi alternatif jika dua-duanya kosong
    if (!urlGambarFinal) {
      return res.status(400).json({ message: "Gambar menu wajib diisi (Foto atau URL Link)!" });
    }

    // PERBAIKAN: Memetakan properti bahasa Inggris dari Frontend (req.body.name / price) 
    // ke dalam skema bahasa Indonesia milik Model MongoDB kamu (nama / harga)
    const menuBaru = new MenuItem({
      nama: req.body.name || req.body.nama,
      harga: Number(req.body.price || req.body.harga),
      deskripsi: req.body.description || req.body.deskripsi || '',
      gambar: urlGambarFinal, // Menyimpan URL final baik dari file upload maupun teks link
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
    
    // PERBAIKAN AGAR FRONTEND TIDAK BINGUNG:
    // Mongoose mengembalikan dokumen dengan key bahasa Indonesia ('nama', 'harga', 'gambar').
    // Kita petakan balik ke bentuk objek ber-key bahasa Inggris sebelum dikirim ke Frontend React
    const responseData = {
      _id: savedMenu._id,
      id: savedMenu._id,
      name: savedMenu.nama,
      price: savedMenu.harga,
      description: savedMenu.deskripsi,
      image: savedMenu.gambar,
      category: savedMenu.category,
      stock: savedMenu.stock,
      discount: savedMenu.discount,
      available: savedMenu.available,
      isFlashSale: savedMenu.isFlashSale,
      hasSpiceLevel: savedMenu.hasSpiceLevel,
      salePrice: savedMenu.salePrice,
      saleEndTime: savedMenu.saleEndTime
    };

    res.status(201).json(responseData);
  } catch (err) {
    console.error("Error di Backend:", err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;