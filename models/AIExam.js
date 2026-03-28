// models/AIExam.js (MySQL)

const { getPool } = require("../db");

class AIExam {
  static async create({
    topic,
    difficulty = "medium",
    numQuestions = 5,
    questions = [],
    createdBy = null,
    assignedTo = null
  }) {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [resExam] = await conn.query(
        "INSERT INTO ai_exams (topic, difficulty, num_questions, created_by, assigned_to) VALUES (?, ?, ?, ?, ?)",
        [topic, difficulty, numQuestions, createdBy, assignedTo]
      );
      const examId = resExam.insertId;

      if (Array.isArray(questions) && questions.length > 0) {
        const values = questions.map((q) => [
          examId,
          q.question,
          q.options[0] || "",
          q.options[1] || "",
          q.options[2] || null,
          q.options[3] || null,
          q.correctOption,
          q.difficulty || difficulty
        ]);

        await conn.query(
          `INSERT INTO ai_exam_questions
           (exam_id, question, opt1, opt2, opt3, opt4, correct_option, difficulty)
           VALUES ?`,
          [values]
        );
      }

      await conn.commit();
      conn.release();
      return this.findById(examId);
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }

  static async findById(id) {
    const pool = getPool();

    const [exams] = await pool.query(
      "SELECT * FROM ai_exams WHERE id = ?",
      [id]
    );
    if (exams.length === 0) return null;
    const e = exams[0];

    const [qs] = await pool.query(
      "SELECT * FROM ai_exam_questions WHERE exam_id = ? ORDER BY id",
      [id]
    );

    return {
      id: e.id,
      topic: e.topic,
      difficulty: e.difficulty,
      numQuestions: e.num_questions,
      createdBy: e.created_by,
      assignedTo: e.assigned_to,
      createdAt: e.created_at,
      updatedAt: e.updated_at,
      questions: qs.map((q) => ({
        id: q.id,
        question: q.question,
        options: [q.opt1, q.opt2, q.opt3, q.opt4].filter((x) => x != null),
        correctOption: q.correct_option,
        difficulty: q.difficulty
      }))
    };
  }

  static async findAll() {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT * FROM ai_exams ORDER BY created_at DESC"
    );
    return rows;
  }
}

module.exports = AIExam;
