const express = require("express");
const pool = require("../db").getPool();
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.get("/student", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [[courseCounts]] = await pool.query(
      "SELECT COUNT(*) AS enrolledCount FROM enrollments WHERE user_id = ?",
      [userId]
    );

    const [[examStats]] = await pool.query(
      "SELECT COUNT(*) AS attempts, COALESCE(AVG(score/total),0) AS avgScore FROM exam_results WHERE user_id = ?",
      [userId]
    );

    const [announcements] = await pool.query(
      "SELECT id, title, content, created_at AS createdAt FROM announcements ORDER BY created_at DESC LIMIT 5"
    );

    res.json({
      enrolledCourses: courseCounts.enrolledCount,
      examAttempts: examStats.attempts,
      avgScore: Number(examStats.avgScore),
      latestAnnouncements: announcements
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load student dashboard" });
  }
});

router.get("/admin", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });

    const [[userCounts]] = await pool.query(
      "SELECT COUNT(*) AS users FROM users"
    );
    const [[courseCounts]] = await pool.query(
      "SELECT COUNT(*) AS courses FROM courses"
    );
    const [[examCounts]] = await pool.query(
      "SELECT COUNT(*) AS exams FROM exams"
    );
    res.json({
      users: userCounts.users,
      courses: courseCounts.courses,
      exams: examCounts.exams
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load admin dashboard" });
  }
});

module.exports = router;
