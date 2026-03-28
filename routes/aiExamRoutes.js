// routes/aiExamRoutes.js
const express = require("express");
const router = express.Router();
const AIExam = require("../models/AIExam");
const { authenticateToken } = require("../middleware/auth");

// helper
function requireAdmin(req, res) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return false;
  }
  return true;
}

// GET /api/ai-exams  (used by admin dashboard)
router.get("/ai-exams", authenticateToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const exams = await AIExam.findAll();
    res.json(exams);
  } catch (e) {
    console.error("ai-exams list error", e);
    res.status(500).json({ error: "Failed to load AI exams" });
  }
});

// POST /api/ai/generate-exam  (admin creates AI exam via Gemini)
const { generateExamWithGemini } = require("../services/aiService"); // create this service

router.post("/ai/generate-exam", authenticateToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { topic, difficulty = "medium", numQuestions = 5 } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "topic is required" });
    }

    // Call Gemini / AI
    const questions = await generateExamWithGemini({
      topic,
      difficulty,
      numQuestions
    });

    const exam = await AIExam.create({
      topic,
      difficulty,
      numQuestions,
      questions,
      createdBy: req.user.id,
      assignedTo: null
    });

    res.status(201).json(exam);
  } catch (e) {
    console.error("ai generate exam error", e);
    res.status(500).json({ error: "Failed to generate AI exam" });
  }
});

module.exports = router;
