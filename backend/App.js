// server.js (یا app.js)
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';
import { freePortAndRestart } from './fixport.js'; // مدیریت پورت (اطمینان از وجود این فایل)
const app = express();

// پیکربندی پورت
const PORT = process.env.PORT || 6000;

// تعریف filename و dirname در ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// اتصال به دیتابیس MongoDB
mongoose
  .connect('mongodb://localhost:27017/targetjaratapp', {
    // اگر از Mongoose 7+ استفاده می‌کنی، این گزینه‌ها اختیاری‌اند
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ اتصال به MongoDB برقرار شد'))
  .catch(err => console.error('❌ خطای اتصال به MongoDB:', err.message));

// میدل‌ورها
app.use(cors());                 // اجازه دسترسی از فرانت‌اند
app.use(express.json());         // پارس JSON بدنه درخواست‌ها
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
console.log(`  :مسیرفایلهای آپلود ` + path.join(__dirname, `uploads`));

// روت سلامت
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mongo: mongoose.connection.readyState });
});

// روت تست
app.get('/', (req, res) => {
  res.send('✅ Backend is running');
});

// اجرای سرور
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});

// مدیریت خطاهای غیرمنتظره
process.on('uncaughtException', (err) => {
  console.error('❌ خطای غیرمنتظره:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️ پورت ${PORT} اشغال است. تلاش برای آزادسازی...`);
    // تلاش برای آزادسازی پورت و اجرای مجدد
    try {
      freePortAndRestart(PORT, 'npm run dev');
    } catch (e) {
      console.error('❌ شکست در آزادسازی پورت:', e.message);
      process.exit(1);
    }
  } else {
    // برای سایر خطاها، خروج امن
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ خطای Promise کنترل‌نشده:', reason);
});