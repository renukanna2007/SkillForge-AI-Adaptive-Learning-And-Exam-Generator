const express = require('express');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Course = require('../models/Course');
const router = express.Router();

router.get('/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const users = await User.find({}).select('-password');
  res.json(users);
});

router.post('/announcements', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const announcement = new Announcement({ ...req.body, author: req.user.id });
  await announcement.save();
  res.json(announcement);
});

module.exports = router;
