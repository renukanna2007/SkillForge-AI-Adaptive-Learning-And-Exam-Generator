const mongoose = require('mongoose');
const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  progress: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'free'], default: 'pending' }
});
module.exports = mongoose.model('Enrollment', enrollmentSchema);
