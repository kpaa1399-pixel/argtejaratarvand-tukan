// db.js

const mongoose = require("mongoose");

// اتصال به دیتابیس محلی به نام argetdb
mongoose.connect("mongodb://localhost:27017/argetdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// بررسی اتصال
const db = mongoose.connection;

db.on("error", console.error.bind(console, "❌ Connection error:"));
db.once("open", () => {
  console.log("✅ MongoDB connected successfully");
});

module.exports = db;