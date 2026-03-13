const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Local Login
router.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
  const token = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET);
  res.json({ token, role: req.user.role, user: req.user });
});

// Register
router.post('/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.status(201).json({ token, role: user.role });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
