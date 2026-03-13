const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  date: { type: Date, default: Date.now },
  present: { type: Boolean, default: true },
  session: String
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
