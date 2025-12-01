import express from `express`;
const router = express.Router();
const Commission = require('../models/CommissionModel');

// گرفتن همه کارمزدها
router.get('/', async (req, res) => {
  const Commissions = await Commission.find();
  res.json(Commissions);
});

// افزودن کارمزد جدید
router.post('/', async (req, res) => {
  const { group, rate } = req.body;
  const newCommission = new Commission({ group, rate });
  await newCommission.save();
  res.json({ success: true, Commission: newCommission });
});

// ویرایش کارمزد
router.put('/:id', async (req, res) => {
  const { group, rate, active } = req.body;
  const updated = await Commission.findByIdAndUpdate(
    req.params.id,
    { group, rate, active },
    { new: true }
  );
  res.json({ success: true, Commission: updated });
});

// حذف کارمزد
router.delete('/:id', async (req, res) => {
  await Commission.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;