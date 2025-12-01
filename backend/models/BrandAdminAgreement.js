const mongoose = require('mongoose');

const AgreementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  brandId: String,
  textVersion: String,
  signedAt: Date,
  approvedBySuperAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date
});

module.exports = mongoose.model('BrandAdminAgreement', AgreementSchema);