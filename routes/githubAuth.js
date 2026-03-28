// githubAuth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { JWT_SECRET } = require('./authRoutes');

const router = express.Router();

router.get('/github/callback', async (req, res) => {
  try {
    const ghProfile = req.user || req.githubProfile;
    if (!ghProfile) {
      return res.status(400).send('GitHub profile missing');
    }

    const email =
      ghProfile.email ||
      (Array.isArray(ghProfile.emails) && ghProfile.emails[0]?.value) ||
      '';
    const fullName = ghProfile.name || ghProfile.username || 'GitHub User';
    const githubId = ghProfile.id;

    if (!email) {
      return res.status(400).send('GitHub did not provide an email');
    }

    let [rows] = await db.query(
      'SELECT id, full_name, email, role, github_id FROM users WHERE email = ?',
      [email]
    );

    let user;
    if (!rows.length) {
      const role = 'student';
      const [result] = await db.query(
        `INSERT INTO users (full_name, email, github_id, role)
         VALUES (?, ?, ?, ?)`,
        [fullName, email, githubId, role]
      );
      user = { id: result.insertId, full_name: fullName, email, role };
    } else {
      user = rows[0];
      if (!user.github_id) {
        await db.query(
          'UPDATE users SET github_id = ? WHERE id = ?',
          [githubId, user.id]
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
    console.error('GitHub callback error', err);
    return res.status(500).send('GitHub login failed');
  }
});

module.exports = router;
