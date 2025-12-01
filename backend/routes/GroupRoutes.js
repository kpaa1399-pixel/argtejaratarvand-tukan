const express = require('express');
const Group = require('../models/Group');
const router = express.Router();

// ساخت گروه جدید
router.post('/groups', async (req, res) => {
  const { name, brandId, description } = req.body;
  const group = new Group({ name, brandId, description });
  await group.save();
  res.json({ message: 'گروه ساخته شد', group });
});

// گرفتن لیست گروه‌ها
router.get('/groups', async (req, res) => {
  const groups = await Group.find().populate('brandId');
  res.json(groups);
});

module.exports = router;