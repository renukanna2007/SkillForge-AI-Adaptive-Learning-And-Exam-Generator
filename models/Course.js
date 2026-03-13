const mongoose = require('mongoose');
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, default: 0 },
  isPaid: { type: Boolean, default: false },
  semester: String,
  modules: [{
    title: String,
    video: String,
    duration: String,
    quizzes: { type: Number, default: 0 }
  }]
}, { timestamps: true });
module.exports = mongoose.model('Course', courseSchema);
