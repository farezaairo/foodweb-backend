const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const menuRoutes = require("./routes/MenuRoutes");
const orderRoutes = require("./routes/OrderRoutes");
const promoRoutes = require("./routes/PromoRoutes");
const settingsRoutes = require("./routes/SettingsRoutes");

const app = express();

// UBAH BAGIAN INI: Berikan konfigurasi lengkap pada CORS
app.use(cors());
app.use(express.json());

app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/promos", promoRoutes);
app.use("/api/settings", settingsRoutes);

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});