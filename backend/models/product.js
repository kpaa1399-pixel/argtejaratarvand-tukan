const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  price:       { type: Number, required: true },
  stock:       { type: Number, default: 0 },
  category:    { type: String, enum: ['electronics', 'clothing', 'food'], default: '' },
  brand:       { type: String, default: '' },
  group:       { type: String, default: '' },
  image:       { type: String } // مسیر فایل تصویر
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);