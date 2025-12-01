const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// 📦 تنظیم آپلود فایل (تصویر محصول)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // مسیر ذخیره تصاویر
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 🔑 Middleware کنترل دسترسی
function authMiddleware(requiredRole) {
  return (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'توکن وجود ندارد' });

    try {
      const decoded = jwt.verify(token, 'secretKey');
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ error: 'دسترسی غیرمجاز' });
      }
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'توکن نامعتبر است' });
    }
  };
}

// 📌 لیست همه محصولات
router.get('/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// 📌 فیلتر محصولات
router.get('/products/filter', async (req, res) => {
  const { name, category, brand, group } = req.query;
  const query = {};
  if (name) query.name = new RegExp(name, 'i');
  if (category) query.category = category;
  if (brand) query.brand = brand;
  if (group) query.group = group;

  const products = await Product.find(query);
  res.json(products);
});

// 📌 افزودن محصول (فقط مدیر)
router.post('/products', authMiddleware('admin'), upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock, category, brand, group } = req.body;
    const product = new Product({
      name,
      description,
      price,
      stock,
      category,
      brand,
      group,
      image: req.file ? /uploads/${req.file.filename} : null
    });
    await product.save();
    res.json({ message: 'محصول با موفقیت اضافه شد', product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 📌 ویرایش محصول (مدیر یا کارمند)
router.put('/products/:id', authMiddleware('staff'), upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock, category, brand, group } = req.body;
    const updateData = { name, description, price, stock, category, brand, group };
    if (req.file) updateData.image = /uploads/${req.file.filename};

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ message: 'محصول ویرایش شد', product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 📌 حذف محصول (فقط مدیر)
router.delete('/products/:id', authMiddleware('admin'), async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'محصول حذف شد' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 📊 آمار: تعداد محصولات
router.get('/products/count', async (req, res) => {
  const totalProducts = await Product.countDocuments();
  res.json({ totalProducts });
});

// 📊 آمار: مجموع موجودی
router.get('/products/stock/total', async (req, res) => {
  const result = await Product.aggregate([{ $group: { _id: null, totalStock: { $sum: "$stock" } } }]);
  res.json({ totalStock: result[0] ? result[0].totalStock : 0 });
});

// 📊 آمار: میانگین قیمت
router.get('/products/price/average', async (req, res) => {
  const result = await Product.aggregate([{ $group: { _id: null, averagePrice: { $avg: "$price" } } }]);
  res.json({ averagePrice: result[0] ? result[0].averagePrice : 0 });
});

module.exports = router;