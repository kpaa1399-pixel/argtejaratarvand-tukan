const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String }, // توضیح گروه کالایی
  icon: { type: String } // آیکون یا نماد گروه (اختیاری)
});

module.exports = mongoose.model('Group', groupSchema);