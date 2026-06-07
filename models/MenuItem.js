const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    category: String,
    description: String,
    price: Number,
    image: String,
    stock: Number,

    isFlashSale: {
      type: Boolean,
      default: false,
    },

    salePrice: Number,
    saleEndTime: String,

    available: {
      type: Boolean,
      default: true,
    },

    hasSpiceLevel: {
      type: Boolean,
      default: false,
    },

    orderCount: {
      type: Number,
      default: 0,
    },

    discount: Number,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MenuItem", menuItemSchema);