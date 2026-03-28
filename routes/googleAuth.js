// googleAuth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { JWT_SECRET } = require('./authRoutes');

const router = express.Router();

// GET /auth/google - you already redirect to Google via passport or similar
// This file handles ONLY the callback.

router.get('/google/callback', async (req, res) => {
  try {
    // Depending on your OAuth set‑up; adjust if your library uses a different property.
    const googleProfile = req.user || req.googleProfile;
    if (!googleProfile) {
      return res.status(400).send('Google profile missing');
    }

    const email = googleProfile.email;
    const fullName = googleProfile.displayName || googleProfile.name || email.split('@')[0];
    const googleId = googleProfile.id;

    if (!email) {
      return res.status(400).send('Google did not provide an email');
    }

    let [rows] = await db.query(
      'SELECT id, full_name, email, role, google_id FROM users WHERE email = ?',
      [email]
    );

    let user;
    if (!rows.length) {
      // First time Google login -> default to student
      const role = 'student';
      const [result] = await db.query(
        `INSERT INTO users (full_name, email, google_id, role)
         VALUES (?, ?, ?, ?)`,
        [fullName, email, googleId, role]
      );
      user = { id: result.insertId, full_name: fullName, email, role };
    } else {
      user = rows[0];
      if (!user.google_id) {
        await db.query(
          'UPDATE users SET google_id = ? WHERE id = ?',
          [googleId, user.id]
        );
      }
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    const redirectTo = user.role === 'admin'
      ? '/admin-dashboard'
      : '/student-dashboard';

    res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Redirecting to SkillForge…</title>
</head>
<body>
  <script>
    try {
      localStorage.setItem('sf_token', ${JSON.stringify(token)});
      localStorage.setItem('sf_role', ${JSON.stringify(user.role)});
      localStorage.setItem('sf_name', ${JSON.stringify(user.full_name || '')});
      localStorage.setItem('sf_email', ${JSON.stringify(user.email || '')});
    } catch (e) {}
    window.location.href = ${JSON.stringify(redirectTo)};
  </script>
  Redirecting…
</body>
</html>
    `);
  } catch (err) {
    console.error('Google callback error', err);
    return res.status(500).send('Google login failed');
  }
});

module.exports = router;
