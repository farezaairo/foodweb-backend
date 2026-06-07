require("dotenv").config();
const mongoose = require("mongoose");
const MenuItem = require("./models/MenuItem");

const data = [
  {
    id: "m1",
    name: "Nasi Goreng Spesial",
    category: "Makanan Utama",
    description:
      "Nasi goreng dengan telur, ayam, udang, dan sayuran segar pilihan",
    price: 28000,
    stock: 25,
    available: true,
    isFlashSale: true,
    salePrice: 20000,
    orderCount: 45,
  },
  {
    id: "m2",
    name: "Mie Goreng Jawa",
    category: "Makanan Utama",
    description:
      "Mie goreng khas Jawa dengan bumbu rempah tradisional dan telur ceplok",
    price: 25000,
    stock: 20,
    available: true,
    orderCount: 38,
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await MenuItem.deleteMany();

    await MenuItem.insertMany(data);

    console.log("Menu berhasil diimport");

    process.exit();
  } catch (err) {
    console.error(err);
  }
}

seed();