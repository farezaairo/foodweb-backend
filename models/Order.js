const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
{
  id: String,

  orderNumber: String,

  customerName: String,
  customerPhone: String,

  items: [
    {
      menuId: String,
      menuName: String,
      price: Number,
      quantity: Number,
      subtotal: Number,
      notes: String,
      spiceLevel: String,
    }
  ],

  miscCosts: Array,

  subtotal: Number,
  miscTotal: Number,
  discount: Number,
  promoCode: String,
  total: Number,

  status: {
    type: String,
    default: "pending",
  },

  estimatedMinutes: Number,

  paymentStatus: {
    type: String,
    default: "paid",
  },

  paymentMethod: {
    type: String,
    default: "qris",
  },

  notes: String,
},
{
  timestamps: true,
}
);

module.exports = mongoose.model("Order", orderSchema);