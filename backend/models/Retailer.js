const mongoose = require('mongoose');

const RetailerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  email: String,
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Retailer', RetailerSchema);