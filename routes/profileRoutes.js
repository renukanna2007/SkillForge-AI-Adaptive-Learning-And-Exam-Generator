// profileRoutes.js
const express = require('express');
const db = require('./db');
const { authMiddleware } = require('./authRoutes');

const router = express.Router();

// GET /api/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT full_name, email, photo, phone,
              department, year, roll_number, address, bio
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const u = rows[0];
    return res.json({
      fullName: u.full_name,
      email: u.email,
      photo: u.photo,
      phone: u.phone,
      department: u.department,
      year: u.year,
      rollNumber: u.roll_number,
      address: u.address,
      bio: u.bio,
    });
  } catch (err) {
    console.error('Profile GET error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/profile
router.post('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      fullName,
      photo,
      phone,
      department,
      year,
      rollNumber,
      address,
      bio,
    } = req.body || {};

    await db.query(
      `UPDATE users
       SET full_name = ?, photo = ?, phone = ?, department = ?,
           year = ?, roll_number = ?, address = ?, bio = ?
       WHERE id = ?`,
      [fullName, photo, phone, department, year, rollNumber, address, bio, userId]
    );

    return res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error('Profile POST error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
