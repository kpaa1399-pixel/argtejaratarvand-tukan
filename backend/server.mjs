const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const App = express();

// تنظیمات
const PORT = process.env.PORT || 6000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'art_tejat';

App.use(express.json());
App.use(express.static(path.join(__dirname, `..`, `public`)));
App.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});  
App.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
// اتصال به دیتابیس
require(`./db`);
let client;
let db;
async function initDb() {
  if (!client) {
    client = new MongoClient(MONGO_URI, { ignoreUndefined: true });
    await client.connect();
    db = client.db(DB_NAME);
    console.log('✅ اتصال به MongoDB برقرار شد');
  }
  return db;
}

// ===== مسیر تست سلامت =====
App.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ===== مدیریت سفارش‌ها =====
const ORDERS_COLL = 'rawand_admin';

App.get('/orders', async (req, res) => {
  try {
    const db = await initDb();
    const col = db.collection(ORDERS_COLL);

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.role) filter.role = req.query.role;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.order_id) filter.related_entity = req.query.order_id;

    const docs = await col.find(filter).sort({ created_at: 1 }).toArray();
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: 'خطا در دریافت مراحل سفارش', details: e.message });
  }
});

App.post('/orders', async (req, res) => {
  try {
    const db = await initDb();
    const col = db.collection(ORDERS_COLL);

    const doc = { ...req.body };

    if (!doc.related_entity) {
      return res.status(400).json({ error: 'آیدی مربوطه وارد نشده (related_entity)' });
    }
    if (!doc.role) {
      return res.status(400).json({ error: 'نقش وارد نشده (role)' });
    }

    doc.created_at = doc.created_at ? new Date(doc.created_at) : new Date();
    doc.status = doc.status || 'pending';

    const result = await col.insertOne(doc);
    res.json({ message: '✅ مرحله جدید ثبت شد', id: result.insertedId });
  } catch (e) {
    res.status(500).json({ error: 'خطا در ثبت مرحله جدید', details: e.message });
  }
});

// ===== مدیریت نشست‌ها =====
const SESSIONS_COLL = 'sessions';

App.post('/sessions', async (req, res) => {
  try {
    const dbx = await initDb();
    const col = dbx.collection(SESSIONS_COLL);

    const doc = { ...req.body };

    if (!doc.userId) return res.status(400).json({ error: 'userId اجباری است' });
    if (!doc.role) return res.status(400).json({ error: 'role اجباری است' });

    doc.login_time = doc.login_time ? new Date(doc.login_time) : new Date();
    doc.device = doc.device || 'windows-desktop';
    doc.ip = doc.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local';
    doc.active = true;

    const result = await col.insertOne(doc);
    res.status(201).json({ message: '✅ نشست ایجاد شد', id: result.insertedId });
  } catch (e) {
    res.status(500).json({ error: 'خطا در ایجاد نشست', details: e.message });
  }
});

App.get('/sessions', async (req, res) => {
  try {
    const dbx = await initDb();
    const col = dbx.collection(SESSIONS_COLL);

    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.role) filter.role = req.query.role;
    if (req.query.active) filter.active = req.query.active === 'true';

    const docs = await col.find(filter).sort({ login_time: -1 }).toArray();
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: 'خطا در دریافت نشست‌ها', details: e.message });
  }
});

App.patch('/sessions/:id/deactivate', async (req, res) => {
  try {
    const dbx = await initDb();
    const col = dbx.collection(SESSIONS_COLL);

    const id = req.params.id;
    const result = await col.updateOne(
      { _id: new ObjectId(id) },
      { $set: { active: false, logout_time: new Date() } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'نشست پیدا نشد' });
    }
    res.json({ message: '✅ نشست غیرفعال شد' });
  } catch (e) {
    res.status(500).json({ error: 'خطا در غیرفعال‌سازی نشست', details: e.message });
  }
});

// ===== ورود و تأیید =====
const VERIFY_COLL = 'verifications';

App.post('/login', async (req, res) => {
  try {
    const { phone, email } = req.body;
    if (!phone && !email) {
      return res.status(400).json({ error: 'شماره یا ایمیل اجباری است' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const dbx = await initDb();
    const col = dbx.collection(VERIFY_COLL);
    await col.insertOne({
      phone,
      email,
      code,
      created_at: new Date(),
      verified: false
    });

    res.json({ message: '✅ کد تأیید ارسال شد', code });
  } catch (e) {
    res.status(500).json({ error: 'خطا در ورود', details: e.message });
  }
});

App.post('/verify', async (req, res) => {
  try {
    const { phone, email, code } = req.body;
    if (!code || (!phone && !email)) {
      return res.status(400).json({ error: 'کد و شماره یا ایمیل اجباری است' });
    }

    const dbx = await initDb();
    const col = dbx.collection(VERIFY_COLL);

    const match = await col.findOne({ code, phone, email, verified: false });
    if (!match) {
      return res.status(401).json({ error: 'کد نامعتبر یا قبلاً تأیید شده' });
    }

    await col.updateOne({ _id: match._id }, { $set: { verified: true, verified_at: new Date() } });

    res.json({ message: '✅ تأیید موفق بود', userId: phone || email });
  } catch (e) {
    res.status(500).json({ error: 'خطا در تأیید', details: e.message });
  }
});

// ===== راه‌اندازی سرور =====
App.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
// -------------------- تبلیغات برندها --------------------
const ads = []; // فعلاً آرایه ساده، بعداً به MongoDB وصل می‌کنیم

// گرفتن همه تبلیغات
App.get('/ads', (req,res) => {
  res.json(ads);
});

// گرفتن تبلیغات فعال
App.get('/ads', (req,res) => {
  const status = req.query.status;
  if(status) {
    res.json(ads.filter(a => a.status === status));
  } else {
    res.json(ads);
  }
});

// ثبت تبلیغ جدید توسط مدیر برند
App.post('/ads', (req,res) => {
  const ad = { 
    ...req.body, 
    _id: Date.now().toString(), 
    status:'در انتظار تأیید' 
  };
  ads.push(ad);
  res.send('تبلیغ ثبت شد و در انتظار تأیید مدیر کل است.');
});

// تعیین هزینه تبلیغ توسط مدیر کل
App.post('/ads/cost', (req,res) => {
  const { cost } = req.body;
  // اینجا می‌تونی هزینه رو در تنظیمات ذخیره کنی
res.send('هزینه ارسال داده ها:$ {cost} تومان')
});

// تأیید تبلیغ توسط مدیر کل
App.post('/ads/:id/approve', (req,res) => {
  const ad = ads.find(a => a._id === req.params.id);
  if(ad) { 
    ad.status = 'فعال'; 
    res.send('تبلیغ تأیید شد و فعال گردید.'); 
  } else res.send('تبلیغ یافت نشد.');
});

// رد تبلیغ توسط مدیر کل
App.post('/ads/:id/reject', (req,res) => {
  const ad = ads.find(a => a._id === req.params.id);
  if(ad) { 
    ad.status = 'رد شده'; 
    res.send('تبلیغ رد شد.'); 
  } else res.send('تبلیغ یافت نشد.');
});
// -------------------- داشبورد مدیریتی --------------------
App.get('/dashboard',async (req, res) => {
  try {
    const productCount = await db.collection('products').countDocuments();
    const adCount = await db.collection('ads').countDocuments();
    const orderCount = await db.collection('orders').countDocuments();
    const userCount = await db.collection('users').countDocuments();

    // وضعیت سفارش‌ها
    const pendingOrders = await db.collection('orders').countDocuments({ status: 'در انتظار' });
    const deliveredOrders = await db.collection('orders').countDocuments({ status: 'تحویل شده' });

    // وضعیت تبلیغات
    const activeAds = await db.collection('ads').countDocuments({ status: 'فعال' });
    const rejectedAds = await db.collection('ads').countDocuments({ status: 'رد شده' });

    res.json({
      products: productCount,
      ads: adCount,
      orders: orderCount,
      users: userCount,
      ordersStatus: {
        pending: pendingOrders,
        delivered: deliveredOrders
      },
      adsStatus: {
        active: activeAds,
        rejected: rejectedAds
      }
    });
  } catch (err) {
    res.status(500).send('❌ خطا در دریافت داشبورد: ' + err.message);
  }
});
// ===== خاموش‌سازی تمیز =====
process.on('SIGINT', async () => {
  if (client) await client.close();
  console.log('🛑 Server stopped');
  process.exit(0);
});