const express = require("express");
const pool = require("../db").getPool();
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, title, description, instructor_id AS instructorId, is_published AS isPublished FROM courses WHERE is_published = 1"
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load courses" });
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, title, description, instructor_id AS instructorId, is_published AS isPublished FROM courses WHERE id = ?",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Course not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load course" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "teacher") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { title, description } = req.body;
    const [result] = await pool.query(
      "INSERT INTO courses (title, description, instructor_id, is_published) VALUES (?,?,?,?)",
      [title, description || "", req.user.id, 1]
    );
    res.json({ id: result.insertId, title, description, instructorId: req.user.id, isPublished: 1 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create course" });
  }
});

router.post("/:id/enroll", authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;
    await pool.query(
      "INSERT IGNORE INTO enrollments (user_id, course_id) VALUES (?,?)",
      [userId, courseId]
    );
    res.json({ message: "Enrolled" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Enrollment failed" });
  }
});

router.get("/:id/students", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "teacher") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name AS fullName, u.email
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       WHERE e.course_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load enrolled students" });
  }
});

module.exports = router;
