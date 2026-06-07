const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
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

module.exports = mongoose.model("Settings", settingsSchema);