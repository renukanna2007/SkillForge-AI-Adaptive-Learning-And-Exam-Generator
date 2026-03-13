const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const router = express.Router();

router.get('/courses', authenticateToken, async (req, res) => {
  const courses = await Course.find({});
  res.json(courses);
});

router.get('/progress', authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.id).populate('progress.courseId');
  res.json(user.progress);
});

module.exports = router;
