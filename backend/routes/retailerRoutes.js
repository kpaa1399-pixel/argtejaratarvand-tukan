const express = require('express');
const Retailer = require('../models/Retailer');
const router = express.Router();

// ساخت فروشنده جدید
router.post('/retailers', async (req, res) => {
  const { name, phone, email, brandId, groupId } = req.body;
  const retailer = new Retailer({ name, phone, email, brandId, groupId });
  await retailer.save();
  res.json({ message: 'فروشنده ثبت شد', retailer });
});

// گرفتن لیست فروشنده‌ها
router.get('/retailers', async (req, res) => {
  const retailers = await Retailer.find()
    .populate('brandId')
    .populate('groupId');
  res.json(retailers);
});

module.exports = router;