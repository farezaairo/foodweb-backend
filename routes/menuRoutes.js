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
    
    // SAKTI: Kita manipulasi hasil keluaran ke frontend di sini saja!
    // Tanpa mengubah database asli, kita duplikat fieldnya agar frontend kamu yang sensitif bisa membaca dua-duanya (stok & stock, nama & name, dll)
    const formatUntukFrontend = items.map(item => {
      const raw = item.toObject();
      return {
        ...raw,
        id: raw._id,
        name: raw.nama || raw.name || "Tanpa Nama",
        price: raw.harga !== undefined ? raw.harga : (raw.price || 0),
        description: raw.deskripsi || raw.description || "",
        image: raw.gambar || raw.image || "",
        stock: raw.stok !== undefined ? raw.stok : (raw.stock !== undefined ? raw.stock : 10),
        stok: raw.stok !== undefined ? raw.stok : (raw.stock !== undefined ? raw.stock : 10)
      };
    });

    res.json(formatUntukFrontend);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🟢 RUTE 2: GET MENU BY ID
router.get("/:id", async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu tidak ditemukan" });
    
    const raw = item.toObject();
    res.json({
      ...raw,
      id: raw._id,
      name: raw.nama || raw.name || "Tanpa Nama",
      price: raw.harga !== undefined ? raw.harga : (raw.price || 0),
      description: raw.deskripsi || raw.description || "",
      image: raw.gambar || raw.image || "",
      stock: raw.stok !== undefined ? raw.stok : (raw.stock !== undefined ? raw.stock : 10),
      stok: raw.stok !== undefined ? raw.stok : (raw.stock !== undefined ? raw.stock : 10)
    });
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
    } else if (req.body.image) {
      urlGambarFinal = req.body.image; 
    } else if (req.body.gambar) {
      urlGambarFinal = req.body.gambar;
    }

    if (!urlGambarFinal) {
      return res.status(400).json({ message: "Gambar menu wajib diisi!" });
    }

    // Ambil nilai stok dari kiriman frontend secara aman
    let angkaStok = 10;
    if (req.body.stok !== undefined) angkaStok = Number(req.body.stok);
    else if (req.body.stock !== undefined) angkaStok = Number(req.body.stock);

    // MENGUNCI STRUKTUR DATA SESUAI MODEL SCHEMA DATABASE ASLI INDONESIA KAMU
    const menuBaru = new MenuItem({
      nama: req.body.name || req.body.nama || "Menu Baru",
      harga: Number(req.body.price || req.body.harga || 0),
      deskripsi: req.body.description || req.body.deskripsi || "",
      gambar: urlGambarFinal,
      stok: isNaN(angkaStok) ? 10 : angkaStok, // Validasi anti-crash jika disubmit kosong
      category: req.body.category || "Makanan Utama",
      discount: req.body.discount !== undefined ? Number(req.body.discount) : 0,
      available: req.body.available === "true" || req.body.available === true || req.body.available === undefined,
      isFlashSale: req.body.isFlashSale === "true" || req.body.isFlashSale === true,
      hasSpiceLevel: req.body.hasSpiceLevel === "true" || req.body.hasSpiceLevel === true,
    });

    const savedMenu = await menuBaru.save();
    
    // Kembalikan response yang sudah diduplikat fieldnya agar frontend langsung mengenali tanpa error
    const rawSaved = savedMenu.toObject();
    res.status(201).json({
      ...rawSaved,
      id: rawSaved._id,
      name: rawSaved.nama,
      price: rawSaved.harga,
      description: rawSaved.deskripsi,
      image: rawSaved.gambar,
      stock: rawSaved.stok,
      stok: rawSaved.stok
    });
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
    item.discount = req.body.discount !== undefined ? Number(req.body.discount) : item.discount;

    if (req.body.stock !== undefined) item.stok = Number(req.body.stock);
    else if (req.body.stok !== undefined) item.stok = Number(req.body.stok);

    if (req.body.available !== undefined) item.available = req.body.available === "true" || req.body.available === true;
    if (req.body.isFlashSale !== undefined) item.isFlashSale = req.body.isFlashSale === "true" || req.body.isFlashSale === true;
    if (req.body.hasSpiceLevel !== undefined) item.hasSpiceLevel = req.body.hasSpiceLevel === "true" || req.body.hasSpiceLevel === true;

    const updatedMenu = await item.save();
    
    const rawUpdated = updatedMenu.toObject();
    res.json({
      ...rawUpdated,
      id: rawUpdated._id,
      name: rawUpdated.nama,
      price: rawUpdated.harga,
      description: rawUpdated.deskripsi,
      image: rawUpdated.gambar,
      stock: rawUpdated.stok,
      stok: rawUpdated.stok
    });
  } catch (err) {
    console.error("Error Put Backend:", err);
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