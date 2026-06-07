const mongoose = require("mongoose");

const promoSchema = new mongoose.Schema(
{
  id: String,
  name: String,
  code: String,
  type: String,
  value: Number,
  minOrder: Number,
  validUntil: String,
  active: Boolean,
  usageCount: {
    type: Number,
    default: 0,
  },
},
{
  timestamps: true,
}
);

module.exports = mongoose.model("Promo", promoSchema);