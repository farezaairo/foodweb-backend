const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem"); 

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Konfigurasi Cloudinary
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

// Konfigurasi Multer untuk menangani Form-Data secara aman
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Batas maksimum 5MB
});

// 🛠️ FUNGSI SAKTI: Membersihkan angka 0 anomali dan menduplikasi field (EN <-> ID)
function transformMenu(item) {
  if (!item) return null;
  const raw = item.toObject ? item.toObject() : item;
  
  // Ambil nama asli dan bersihkan jika ada angka 0 aneh di paling depan string
  let namaBersih = raw.nama || raw.name || "Tanpa Nama";
  if (typeof namaBersih === 'string' && namaBersih.startsWith('0') && namaBersih.length > 1) {
    // Jika formatnya seperti "0 Mie Goreng", kita buang "0 " nya
    namaBersih = namaBersih.replace(/^0\s*/, '');
  } else if (namaBersih === 0 || namaBersih === "0") {
    namaBersih = "Tanpa Nama";
  }

  // Cari nilai stok secara aman dari field 'stok' maupun 'stock'
  let nilaiStok = 0;
  if (raw.stok !== undefined && raw.stok !== null) nilaiStok = Number(raw.stok);
  else if (raw.stock !== undefined && raw.stock !== null) nilaiStok = Number(raw.stock);

  // Cari URL gambar secara aman
  const urlGambar = raw.gambar || raw.image || "";

  // Kembalikan objek dengan field GANDA agar frontend tidak kebingungan
  return {
    ...raw,
    _id: raw._id,
    id: raw._id,
    nama: namaBersih,
    name: namaBersih,
    harga: Number(raw.harga || raw.price || 0),
    price: Number(raw.harga || raw.price || 0),
    deskripsi: raw.deskripsi || raw.description || "",
    description: raw.deskripsi || raw.description || "",
    gambar: urlGambar,
    image: urlGambar,
    stok: isNaN(nilaiStok) ? 0 : nilaiStok,
    stock: isNaN(nilaiStok) ? 0 : nilaiStok,
    category: raw.category || "Makanan Utama",
    available: raw.available !== undefined ? raw.available : true,
    isFlashSale: raw.isFlashSale !== undefined ? raw.isFlashSale : false,
    hasSpiceLevel: raw.hasSpiceLevel !== undefined ? raw.hasSpiceLevel : false,
    discount: Number(raw.discount || 0)
  };
}

// 🟢 1. GET ALL MENU
router.get("/", async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 });
    const formattedItems = items.map(item => transformMenu(item));
    res.json(formattedItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🟢 2. GET BY ID
router.get("/:id", async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu tidak ditemukan" });
    res.json(transformMenu(item));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🚀 3. POST TAMBAH MENU (Mendukung upload file gambar ATAU link URL)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    // Deteksi sumber gambar secara berlapis
    let urlGambarFinal = "";
    if (req.file && req.file.path) {
      urlGambarFinal = req.file.path; // Dari upload file fisik
    } else if (req.body.image) {
      urlGambarFinal = req.body.image; // Dari link teks URL (field image)
    } else if (req.body.gambar) {
      urlGambarFinal = req.body.gambar; // Dari link teks URL (field gambar)
    }

    // Ekstrak data text biasa dari form-data / json secara aman
    let namaInput = req.body.name || req.body.nama || "Menu Baru";
    if (typeof namaInput === 'string' && namaInput.startsWith('0') && namaInput.length > 1) {
      namaInput = namaInput.replace(/^0\s*/, '');
    }

    let angkaStok = 10;
    if (req.body.stok !== undefined) angkaStok = Number(req.body.stok);
    else if (req.body.stock !== undefined) angkaStok = Number(req.body.stock);

    // Simpan ke MongoDB menggunakan skema asli database Anda
    const menuBaru = new MenuItem({
      nama: namaInput,
      harga: Number(req.body.price || req.body.harga || 0),
      deskripsi: req.body.description || req.body.deskripsi || "",
      gambar: urlGambarFinal,
      stok: isNaN(angkaStok) ? 10 : angkaStok,
      category: req.body.category || "Makanan Utama",
      discount: req.body.discount !== undefined ? Number(req.body.discount) : 0,
      available: req.body.available === "true" || req.body.available === true || req.body.available === undefined,
      isFlashSale: req.body.isFlashSale === "true" || req.body.isFlashSale === true,
      hasSpiceLevel: req.body.hasSpiceLevel === "true" || req.body.hasSpiceLevel === true,
    });

    const savedMenu = await menuBaru.save();
    res.status(201).json(transformMenu(savedMenu));
  } catch (err) {
    console.error("Gagal POST menu di backend:", err);
    res.status(500).json({ message: err.message });
  }
});

// 🚀 4. PUT UPDATE MENU
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu tidak ditemukan" });

    let urlGambarFinal = item.gambar || item.image || "";
    if (req.file && req.file.path) {
      urlGambarFinal = req.file.path;
    } else if (req.body.gambar || req.body.image) {
      urlGambarFinal = req.body.gambar || req.body.image;
    }

    // Perbarui field text jika dikirim oleh frontend
    if (req.body.name !== undefined || req.body.nama !== undefined) {
      let namaInput = req.body.name || req.body.nama;
      if (typeof namaInput === 'string' && namaInput.startsWith('0') && namaInput.length > 1) {
        namaInput = namaInput.replace(/^0\s*/, '');
      }
      item.nama = namaInput;
    }

    if (req.body.price !== undefined || req.body.harga !== undefined) {
      item.harga = Number(req.body.price !== undefined ? req.body.price : req.body.harga);
    }

    if (req.body.description !== undefined || req.body.deskripsi !== undefined) {
      item.deskripsi = req.body.description !== undefined ? req.body.description : req.body.deskripsi;
    }

    item.gambar = urlGambarFinal;
    item.category = req.body.category || item.category;
    item.discount = req.body.discount !== undefined ? Number(req.body.discount) : item.discount;

    if (req.body.stock !== undefined || req.body.stok !== undefined) {
      const nilaiStok = Number(req.body.stock !== undefined ? req.body.stock : req.body.stok);
      item.stok = isNaN(nilaiStok) ? item.stok : nilaiStok;
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
    res.json(transformMenu(updatedMenu));
  } catch (err) {
    console.error("Gagal PUT menu di backend:", err);
    res.status(500).json({ message: err.message });
  }
});

// 🟢 5. DELETE MENU
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