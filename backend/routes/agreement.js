const express = require('express');
const Agreement = require('../models/BrandAdminAgreement');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
// ثبت تعهدنامه توسط مدیر برند
router.post('/brand-admin/approve', auth, checkRole(['superadmin']), async (req, res) => {
  const { userId, brandId, textVersion } = req.body;
  const signedAt = new Date();

  const agreement = new Agreement({ userId, brandId, textVersion, signedAt });
  await agreement.save();

  res.json({ message: 'تعهدنامه ثبت شد', agreement });
});

// تأیید توسط مدیر کل
router.post('/brand-admin/approve', async (req, res) => {
  const { agreementId, superAdminId } = req.body;
  const agreement = await Agreement.findById(agreementId);

  if (!agreement) return res.status(404).json({ message: 'تعهدنامه پیدا نشد' });

  agreement.approvedBySuperAdmin = superAdminId;
  agreement.approvedAt = new Date();
  await agreement.save();

  res.json({ message: 'تعهدنامه تأیید شد', agreement });
});

module.exports = router;