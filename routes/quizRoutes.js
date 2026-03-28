const express = require("express");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.post("/generate-quiz", authenticateToken, (req, res) => {
  const { topic, level } = req.body;
  res.json({
    topic,
    level,
    questions: [
      { question: `What is ${topic}?`, options: ["A", "B", "C"], answer: "A" },
      { question: `Explain ${topic} concepts`, options: ["X", "Y", "Z"], answer: "X" }
    ]
  });
});

module.exports = router;
