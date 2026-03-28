// routes/messageRoutes.js
const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const { authenticateToken } = require("../middleware/auth");

function requireAdmin(req, res) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return false;
  }
  return true;
}

// GET /api/messages  (admin inbox in dashboard)
router.get("/messages", authenticateToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rows = await Message.findAll();
    const enriched = rows.map(m => ({
      id: m.id,
      from: m.from_email,
      to: m.to_email,
      fromName: m.from_name,
      fromEmail: m.from_email,
      text: m.text,
      createdAt: m.created_at
    }));
    res.json(enriched);
  } catch (e) {
    console.error("messages list error", e);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// POST /api/messages  (student or admin send)
router.post("/messages", authenticateToken, async (req, res) => {
  try {
    const { to, text, fromName } = req.body;
    if (!to || !text) {
      return res.status(400).json({ error: "to and text are required" });
    }

    const fromEmail = req.user.email;
    const name = fromName || req.user.full_name || null;

    const msg = await Message.create({
      from: fromEmail,
      to,
      fromName: name,
      text
    });

    res.status(201).json(msg);
  } catch (e) {
    console.error("message create error", e);
    res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;
