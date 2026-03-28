// models/Message.js (MySQL)

const { getPool } = require("../db");

class Message {
  static async create({ from, to, fromName = null, text }) {
    const pool = getPool();
    const [res] = await pool.query(
      "INSERT INTO messages (from_email, to_email, from_name, text) VALUES (?, ?, ?, ?)",
      [from, to, fromName, text]
    );
    const [rows] = await pool.query("SELECT * FROM messages WHERE id = ?", [
      res.insertId
    ]);
    return rows[0];
  }

  static async findAll() {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT * FROM messages ORDER BY created_at ASC"
    );
    return rows;
  }
}

module.exports = Message;
