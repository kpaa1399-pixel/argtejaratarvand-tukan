const mongoose = require('mongoose');

const CommissionSchema = new mongoose.Schema({
  group: { type: String, required: true },   // گروه فروشنده یا برند
  rate: { type: Number, required: true },    // درصد کارمزد (مثلاً 5 یعنی 5%)
  active: { type: Boolean, default: true }   // فعال یا غیرفعال بودن
});

module.exports = mongoose.model('Commission', CommissionSchema);