const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Brand = mongoose.model('Brand');

// ثبت برند جدید
router.post('/brands', async (req, res) => {
  try {
    const brand = new Brand(req.body);
    await brand.save();
    res.status(201).send(brand);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// دریافت همه برندها
router.get('/brands', async (req, res) => {
  const brands = await Brand.find();
  res.send(brands);
});

module.exports = router;