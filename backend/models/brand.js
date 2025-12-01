const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String }, // رنگ برند برای نمایش در داشبورد
  logoUrl: { type: String } // آدرس لوگو (اختیاری)
});

module.exports = mongoose.model('Brand', brandSchema);