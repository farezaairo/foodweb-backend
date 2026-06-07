const mongoose = require("mongoose");

const pengaturanSchema = new mongoose.Schema(
{
  restaurantName: String,
  tagline: String,
  location: String,
  address: String,
  mapsUrl: String,
  phone: String,

  estimatedMinutes: Number,

  miscCosts: Array,
  spiceLevels: Array,
  customCategories: Array,

  adminPassword: String,
},
{
  timestamps: true,
}
);

// Parameter ketiga 'settings' memaksa Mongoose mengisi laci database yang sudah ada di MongoDB Atlas Anda
module.exports = mongoose.model("Pengaturan", pengaturanSchema, "settings");