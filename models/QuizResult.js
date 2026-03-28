// models/QuizResult.js (MySQL)

const { getPool } = require("../db");

class QuizResult {
  static async create({ quizId, userId, score }) {
    const pool = getPool();
    const [res] = await pool.query(
      "INSERT INTO quiz_results (quiz_id, user_id, score) VALUES (?, ?, ?)",
      [quizId, userId, score]
    );
    const [rows] = await pool.query(
      "SELECT * FROM quiz_results WHERE id = ?",
      [res.insertId]
    );
    return rows[0];
  }

  static async findByUser(userId) {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT * FROM quiz_results WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  }

  static async findLatestByUser(userId) {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT * FROM quiz_results WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows[0] || null;
  }
}

module.exports = QuizResult;
