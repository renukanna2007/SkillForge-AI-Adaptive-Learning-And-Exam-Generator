// models/Quiz.js (MySQL)

const { getPool } = require("../db");

class Quiz {
  static async create({ name, courseId = null, courseName = null, maxScore = 100 }) {
    const pool = getPool();
    const [res] = await pool.query(
      "INSERT INTO quizzes (name, course_id, course_name, max_score) VALUES (?, ?, ?, ?)",
      [name, courseId, courseName, maxScore]
    );
    const [rows] = await pool.query("SELECT * FROM quizzes WHERE id = ?", [
      res.insertId
    ]);
    return rows[0];
  }

  static async findAll() {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT * FROM quizzes ORDER BY created_at DESC"
    );
    return rows;
  }
}

module.exports = Quiz;
