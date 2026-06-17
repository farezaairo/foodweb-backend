const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem"); 

// 🌐 1. IMPORT CLOUDINARY & MULTER
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// 🔑 2. KONEKSI CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📁 3. CONFIG STORAGE CLOUDINARY
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "foodweb-menu",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage: storage });

// 🛠️ FUNGSI SAKTI: Menjamin data dari MongoDB (Bahasa Indonesia) dikonversi total ke Bahasa Inggris demi Frontend React kamu
function formatToFrontend(item) {
  if (!item) return null;
  
  // Ambil data mentah object Mongoose
  const raw = item.toObject ? item.toObject() : item;

  return {
    _id: raw._id,
    id: raw._id,
    name: raw.nama || raw.name || "",
    price: raw.harga !== undefined ? raw.harga : (raw.price || 0),
    description: raw.deskripsi || raw.description || "",
    image: raw.gambar || raw.image || "", // Ini yang bikin gambar LINK maupun FOTO langsung muncul di grid!
    category: raw.category || "Makanan Utama",
    stock: raw.stock !== undefined ? raw.stock : 10,
    discount: raw.discount !== undefined ? raw.discount : 0,
    available: raw.available !== undefined ? raw.available : true,
    isFlashSale: raw.isFlashSale !== undefined ? raw.isFlashSale : false,
    hasSpiceLevel: raw.hasSpiceLevel !== undefined ? raw.hasSpiceLevel : false,
    salePrice: raw.salePrice,
    saleEndTime: raw.saleEndTime
  };
}


// 🟢 RUTE 1: GET ALL MENU
router.get("/", async (req, res) => {
  try {
    const items = await MenuItem.find();
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


// 🚀 RUTE 3: POST TAMBAH MENU (Mendukung upload gambar lewat file 'image' atau string teks URL)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let urlGambarFinal = "";
    if (req.file) {
      urlGambarFinal = req.file.path; // Jika ada file biner, ambil url aman Cloudinary
    } else if (req.body.image) {
      urlGambarFinal = req.body.image; // Jika tidak ada, ambil dari teks input URL Gambar
    }

    if (!urlGambarFinal) {
      return res.status(400).json({ message: "Gambar menu wajib disediakan via upload atau link URL!" });
    }

    // Ambil data text dari req.body
    const { name, nama, price, harga, description, deskripsi, category } = req.body;

    const menuBaru = new MenuItem({
      nama: name || nama,
      harga: Number(price || harga || 0),
      deskripsi: description || deskripsi || "",
      gambar: urlGambarFinal,
      category: category || "Makanan Utama",
      stock: req.body.stock !== undefined ? Number(req.body.stock) : 10,
      discount: req.body.discount !== undefined ? Number(req.body.discount) : 0,
      available: req.body.available === "true" || req.body.available === true,
      isFlashSale: req.body.isFlashSale === "true" || req.body.isFlashSale === true,
      hasSpiceLevel: req.body.hasSpiceLevel === "true" || req.body.hasSpiceLevel === true,
      salePrice: req.body.salePrice ? Number(req.body.salePrice) : undefined,
      saleEndTime: req.body.saleEndTime || undefined
    });

    const savedMenu = await menuBaru.save();
    res.status(201).json(formatToFrontend(savedMenu));
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
    } else if (req.body.image) {
      urlGambarFinal = req.body.image;
    }

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
    res.status(500).json({ message: err.message });
  }
});


// 🚀 RUTE 5: DELETE MENU
router.delete("/:id", async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Menu tidak ditemukan atau sudah terhapus" });
    }
    res.json({ message: "Menu berhasil dihapus", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;