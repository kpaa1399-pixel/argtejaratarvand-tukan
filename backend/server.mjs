
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient, ObjectId } from "mongodb";
// اگر فایل fixport.js داری و با ESM نوشته شده، این خط را نگه دار
// در غیراین‌صورت فعلاً کامنت می‌کنیم تا ارور نده
// import { freePortAndRestart } from "./fixport.js";

const App = express();

// dirname برای ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// تنظیمات
const PORT = process.env.PORT || 6000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "art_tejat";

// میدل‌ورها
App.use(cors());
App.use(express.json());
App.use(express.static(path.join(__dirname, "..", "public")));

// صفحه داشبورد ایستا
App.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// اتصال به دیتابیس
let client;
let db;
async function initDb() {
  if (!client) {
    client = new MongoClient(MONGO_URI, { ignoreUndefined: true });
    await client.connect();
    db = client.db(DB_NAME);
    console.log("✅ اتصال به MongoDB برقرار شد");
  }
  return db;
}

// ===== مسیر تست سلامت =====
App.get("/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ===== مدیریت سفارش‌ها =====
const ORDERS_COLL = "rawand_admin";

App.get("/orders", async (req, res) => {
  try {
    const dbx = await initDb();
    const col = dbx.collection(ORDERS_COLL);

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.role) filter.role = req.query.role;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.order_id) filter.related_entity = req.query.order_id;

    const docs = await col.find(filter).sort({ created_at: 1 }).toArray();
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: "خطا در دریافت مراحل سفارش", details: e.message });
  }
});

App.post("/orders", async (req, res) => {
  try {
    const dbx = await initDb();
    const col = dbx.collection(ORDERS_COLL);

    const doc = { ...req.body };
    if (!doc.related_entity) return res.status(400).json({ error: "آیدی مربوطه وارد نشده (related_entity)" });
    if (!doc.role) return res.status(400).json({ error: "نقش وارد نشده (role)" });

    doc.created_at = doc.created_at ? new Date(doc.created_at) : new Date();
    doc.status = doc.status || "pending";

    const result = await col.insertOne(doc);
    res.json({ message: "✅ مرحله جدید ثبت شد", id: result.insertedId });
  } catch (e) {
    res.status(500).json({ error: "خطا در ثبت مرحله جدید", details: e.message });
  }
});

// ===== مدیریت نشست‌ها =====
const SESSIONS_COLL = "sessions";

App.post("/sessions", async (req, res) => {
  try {
    const dbx = await initDb();
    const col = dbx.collection(SESSIONS_COLL);

    const doc = { ...req.body };
    if (!doc.userId) return res.status(400).json({ error: "userId اجباری است" });
    if (!doc.role) return res.status(400).json({ error: "role اجباری است" });

    doc.login_time = doc.login_time ? new Date(doc.login_time) : new Date();
    doc.device = doc.device || "windows-desktop";
    doc.ip = doc.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local";
    doc.active = true;

    const result = await col.insertOne(doc);
    res.status(201).json({ message: "✅ نشست ایجاد شد", id: result.insertedId });
  } catch (e) {
    res.status(500).json({ error: "خطا در ایجاد نشست", details: e.message });
  }
});

App.get("/sessions", async (req, res) => {
  try {
    const dbx = await initDb();
    const col = dbx.collection(SESSIONS_COLL);

    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.role) filter.role = req.query.role;
    if (req.query.active) filter.active = req.query.active === "true";

const docs = await col.find(filter).sort({ login_time: -1 }).toArray();
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: "خطا در دریافت نشست‌ها", details: e.message });
  }
});

App.patch("/sessions/:id/deactivate", async (req, res) => {
  try {
    const dbx = await initDb();
    const col = dbx.collection(SESSIONS_COLL);

    const id = req.params.id;
    const result = await col.updateOne(
      { _id: new ObjectId(id) },
      { $set: { active: false, logout_time: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: "نشست پیدا نشد" });
    res.json({ message: "✅ نشست غیرفعال شد" });
  } catch (e) {
    res.status(500).json({ error: "خطا در غیرفعال‌سازی نشست", details: e.message });
  }
});

// ===== ورود و تأیید =====
const VERIFY_COLL = "verifications";

App.post("/login", async (req, res) => {
  try {
    const { phone, email } = req.body;
    if (!phone && !email) return res.status(400).json({ error: "شماره یا ایمیل اجباری است" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const dbx = await initDb();
    const col = dbx.collection(VERIFY_COLL);
    await col.insertOne({ phone, email, code, created_at: new Date(), verified: false });

    res.json({ message: "✅ کد تأیید ارسال شد", code });
  } catch (e) {
    res.status(500).json({ error: "خطا در ورود", details: e.message });
  }
});

App.post("/verify", async (req, res) => {
  try {
    const { phone, email, code } = req.body;
    if (!code || (!phone && !email)) return res.status(400).json({ error: "کد و شماره یا ایمیل اجباری است" });

    const dbx = await initDb();
    const col = dbx.collection(VERIFY_COLL);

    const match = await col.findOne({ code, phone, email, verified: false });
    if (!match) return res.status(401).json({ error: "کد نامعتبر یا قبلاً تأیید شده" });

    await col.updateOne({ _id: match._id }, { $set: { verified: true, verified_at: new Date() } });
    res.json({ message: "✅ تأیید موفق بود", userId: phone || email });
  } catch (e) {
    res.status(500).json({ error: "خطا در تأیید", details: e.message });
  }
});

// ===== تبلیغات برندها =====
const ads = [];

// دریافت همه یا فیلتر براساس status (یک route واحد—بدون تعارض)
App.get("/ads", (req, res) => {
  const status = req.query.status;
  if (status) return res.json(ads.filter(a => a.status === status));
  res.json(ads);
});

// ثبت تبلیغ جدید
App.post("/ads", (req, res) => {
  const ad = { ...req.body, _id: Date.now().toString(), status: "در انتظار تأیید" };
  ads.push(ad);
  res.send("تبلیغ ثبت شد و در انتظار تأیید مدیر کل است.");
});

// تعیین هزینه تبلیغ
App.post("/ads/cost", (req, res) => {
  const { cost } = req.body;
  res.send(` هزینه ارسال داده‌ها: ${cost} تومان`);
});

// تأیید تبلیغ
App.post("/ads/:id/approve", (req, res) => {
  const ad = ads.find(a => a._id === req.params.id);
  if (!ad) return res.send("تبلیغ یافت نشد.");
  ad.status = "فعال";
  res.send("تبلیغ تأیید شد و فعال گردید.");
});

// رد تبلیغ
App.post("/ads/:id/reject", (req, res) => {
  const ad = ads.find(a => a._id === req.params.id);
  if (!ad) return res.send("تبلیغ یافت نشد.");
  ad.status = "رد شده";
  res.send("تبلیغ رد شد.");
});

// ===== داشبورد مدیریتی =====
App.get("/dashboard/stats", async (req, res) => {
  try {
    const dbx = await initDb();
    const products = await dbx.collection("products").countDocuments();
    const adsCount = await dbx.collection("ads").countDocuments();
    const orders = await dbx.collection("orders").countDocuments();
    const users = await dbx.collection("users").countDocuments();

    const pendingOrders = await dbx.collection("orders").countDocuments({ status: "در انتظار" });
    const deliveredOrders = await dbx.collection("orders").countDocuments({ status: "تحویل شده" });

    const activeAds = await dbx.collection("ads").countDocuments({ status: "فعال" });
    const rejectedAds = await dbx.collection("ads").countDocuments({ status: "رد شده" });

res.json({
      products,
      ads: adsCount,
      orders,
      users,
      ordersStatus: { pending: pendingOrders, delivered: deliveredOrders },
      adsStatus: { active: activeAds, rejected: rejectedAds }
    });
  } catch (err) {
    res.status(500).send("❌ خطا در دریافت داشبورد: " + err.message);
  }
});

// ===== راه‌اندازی سرور =====
initDb()
  .then(() => {
    App.listen(PORT, () => {
      console.log(` 🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.log(` ⛔️ اتصال به دیتابیس ناموفق بود: ${err.message}`);
    // اگر ابزار آزادسازی پورت داری، این بخش را فعال کن و مطمئن شو فایلش ESM است:
    // try {
    //   freePortAndRestart(PORT, `node ${path.join(__dirname, "server.mjs")}`);
    // } catch (e) {
   console.log("Restart failed:", err.message);
    //   process.exit(1);
    // }
  });

// ===== خاموش‌سازی تمیز =====
process.on("SIGINT", async () => {
  try {
    if (client) await client.close();
  } finally {
    console.log("🛑 Server stopped");
    process.exit(0);
  }
});