const express = require("express");
const pool = require("../db").getPool();
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "teacher") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { courseId, title, durationMinutes } = req.body;
    const [result] = await pool.query(
      "INSERT INTO exams (course_id, title, duration_minutes) VALUES (?,?,?)",
      [courseId, title, durationMinutes || 30]
    );
    res.json({ id: result.insertId, courseId, title, durationMinutes: durationMinutes || 30 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Create exam failed" });
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const examId = req.params.id;
    const [[exam]] = await pool.query(
      "SELECT id, course_id AS courseId, title, duration_minutes AS durationMinutes FROM exams WHERE id = ?",
      [examId]
    );
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    const [questions] = await pool.query(
      "SELECT id, question_text AS question, options_json AS options FROM exam_questions WHERE exam_id = ?",
      [examId]
    );
    exam.questions = questions.map(q => ({
      id: q.id,
      question: q.question,
      options: JSON.parse(q.options)
    }));
    res.json(exam);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Load exam failed" });
  }
});

router.post("/:id/submit", authenticateToken, async (req, res) => {
  try {
    const examId = req.params.id;
    const userId = req.user.id;
    const { answers } = req.body; // [{ questionId, chosenOption }]

    const [questions] = await pool.query(
      "SELECT id, correct_option_index FROM exam_questions WHERE exam_id = ?",
      [examId]
    );

    let score = 0;
    const total = questions.length;
    const answerMap = new Map();
    answers.forEach(a => answerMap.set(a.questionId, a.chosenOption));

    questions.forEach(q => {
      const chosen = answerMap.get(q.id);
      if (chosen !== undefined && chosen === q.correct_option_index) score++;
    });

    await pool.query(
      "INSERT INTO exam_results (user_id, exam_id, score, total) VALUES (?,?,?,?)",
      [userId, examId, score, total]
    );

    res.json({ score, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Submit failed" });
  }
});

module.exports = router;
