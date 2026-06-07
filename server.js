const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const promoRoutes = require("./routes/promoRoutes");
const pengaturanRoutes = require("./routes/pengaturanRoutes");

const app = express();

// 🌐 KONFIGURASI CORS LENGKAP & AMAN UNTUK NETLIFY & LOCALHOST
const allowedOrigins = [
  "http://localhost:5173", // URL standar Vite saat running lokal
  "http://localhost:3000", // URL alternatif jika Anda pakai CRA lokal
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Izinkan request tanpa origin (seperti aplikasi mobile, server-to-server, atau Postman)
      if (!origin) return callback(null, true);
      
      // Izinkan semua domain dari netlify.app secara dinamis, atau domain lokal yang terdaftar
      if (origin.endsWith(".netlify.app") || allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      
      const msg = "Akses CORS diblokir server. Domain ini tidak diizinkan mengakses API.";
      return callback(new Error(msg), false);
    },
    credentials: true, // Mengizinkan pengiriman cookies atau header otorisasi jika diperlukan ke depan
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/promos", promoRoutes);
app.use("/api/pengaturan", pengaturanRoutes);

console.log(
  "MONGO_URI:",
  process.env.MONGO_URI?.replace(/\/\/(.*?):(.*?)@/, "//$1:******@")
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/", (req, res) => {
  res.send("FoodWeb API Running");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});