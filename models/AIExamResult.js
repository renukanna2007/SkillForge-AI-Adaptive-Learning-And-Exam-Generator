// models/AIExamResult.js (MySQL)

const { getPool } = require("../db");

class AIExamResult {
  static async create({ examId, userId, score, total, answers }) {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [resRes] = await conn.query(
        "INSERT INTO ai_exam_results (exam_id, user_id, score, total) VALUES (?, ?, ?, ?)",
        [examId, userId, score, total]
      );
      const resultId = resRes.insertId;

      if (Array.isArray(answers) && answers.length > 0) {
        const values = answers.map((a) => [
          resultId,
          a.questionId,
          a.chosenOption,
          a.correctOption
        ]);
        await conn.query(
          `INSERT INTO ai_exam_result_answers
           (result_id, question_id, chosen_option, correct_option)
           VALUES ?`,
          [values]
        );
      }

      await conn.commit();
      conn.release();
      return { id: resultId, examId, userId, score, total };
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }
}

module.exports = AIExamResult;
