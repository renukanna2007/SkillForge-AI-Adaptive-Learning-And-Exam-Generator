// routes/announcementRoutes.js
const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");
const { authenticateToken } = require("../middleware/auth");

// GET /api/announcements (for all logged-in users)
router.get("/announcements", authenticateToken, async (req, res) => {
  try {
    const anns = await Announcement.findAll();
    const mapped = anns.map(a => ({
      id: a.id,
      title: a.title,
      text: a.content,
      createdAt: a.created_at
    }));
    res.json(mapped);
  } catch (e) {
    console.error("announcements list error", e);
    res.status(500).json({ error: "Failed to load announcements" });
  }
});

module.exports = router;
