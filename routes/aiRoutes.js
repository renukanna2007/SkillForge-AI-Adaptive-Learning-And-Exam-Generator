const express = require('express');
const router = express.Router();

router.post('/generate-quiz', (req, res) => {
  // Mock AI quiz generation
  const { topic, level } = req.body;
  res.json({
    questions: [
      { question: `What is ${topic}?`, options: ['A', 'B', 'C'], answer: 'A' },
      { question: `Explain ${topic} concepts`, options: ['X', 'Y', 'Z'], answer: 'X' }
    ]
  });
});

module.exports = router;
