const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]); // DNS fix for Atlas on Windows

require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();

// ====== DB SETUP ======
mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// ====== SCHEMAS & MODELS ======

// User model
const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, enum: ["student", "admin"], default: "student" },
  googleId: String,
  githubId: String,
  phone: String,
  department: String,
  year: String,
  rollNumber: String,
  bio: String
});
const User = mongoose.model("User", userSchema);

// Course
const courseSchema = new mongoose.Schema({
  title: String,
  code: String,
  level: String,
  description: String
});
const Course = mongoose.model("Course", courseSchema);

// Announcement with timestamps
const announcementSchema = new mongoose.Schema(
  {
    title: String,
    text: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);
const Announcement = mongoose.model("Announcement", announcementSchema);

// Exam
const examSchema = new mongoose.Schema({
  name: String,
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  courseName: String,
  date: String
});
const Exam = mongoose.model("Exam", examSchema);

// Quiz
const quizSchema = new mongoose.Schema({
  name: String,
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  courseName: String,
  maxScore: Number
});
const Quiz = mongoose.model("Quiz", quizSchema);

// QuizResult
const quizResultSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  score: Number
});
const QuizResult = mongoose.model("QuizResult", quizResultSchema);

// Attendance
const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: String,
  status: { type: String, enum: ["Present", "Absent"], default: "Present" }
});
const Attendance = mongoose.model("Attendance", attendanceSchema);

// Message (for chat)
const messageSchema = new mongoose.Schema({
  from: String,
  to: String,
  fromName: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", messageSchema);

// ====== MIDDLEWARE ======
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "skillforge_secret",
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use(express.static(path.join(__dirname, "public")));

// ====== JWT AUTH MIDDLEWARE ======
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Invalid auth header" });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "skillforge_jwt"
    );
    req.user = decoded; // { id, role, email, name }
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

// ====== PASSPORT CONFIG ======
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const u = await User.findById(id);
    done(null, u);
  } catch (e) {
    done(e);
  }
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0]?.value;
        let user = await User.findOne({ googleId: profile.id });
        if (!user && email) {
          user = await User.findOne({ email });
        }
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            fullName: profile.displayName,
            email,
            role: "student"
          });
        }
        return done(null, user);
      } catch (e) {
        return done(e);
      }
    }
  )
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
      scope: ["user:email"]
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let email = null;
        if (profile.emails && profile.emails.length > 0) {
          email = profile.emails[0].value;
        }
        let user = await User.findOne({ githubId: profile.id });
        if (!user && email) {
          user = await User.findOne({ email });
        }
        if (!user) {
          user = await User.create({
            githubId: profile.id,
            fullName: profile.username || "GitHub User",
            email,
            role: "student"
          });
        }
        return done(null, user);
      } catch (e) {
        return done(e);
      }
    }
  )
);

// Helper to create JWT
function createToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.fullName },
    process.env.JWT_SECRET || "skillforge_jwt",
    { expiresIn: "7d" }
  );
}

// ====== PAGE ROUTES ======
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/auth", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "auth.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});
app.get("/student-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "student-dashboard.html"));
});
app.get("/admin-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-dashboard.html"));
});

// ====== AUTH APIS ======

app.post("/api/register", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email,
      passwordHash: hash,
      role: role === "admin" ? "admin" : "student"
    });
    const token = createToken(user);
    res.json({ token, role: user.role, name: user.fullName, email: user.email });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Register failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
    if (role && user.role !== role) {
      return res.status(400).json({ error: "Role mismatch" });
    }
    const ok = await bcrypt.compare(password, user.passwordHash || "");
    if (!ok) return res.status(400).json({ error: "Invalid password" });
    const token = createToken(user);
    res.json({ token, role: user.role, name: user.fullName, email: user.email });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

// Google auth routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const token = createToken(req.user);
    res.redirect(
      `/login?provider=google&token=${encodeURIComponent(token)}&role=${req.user.role}`
    );
  }
);

// GitHub auth routes
app.get("/auth/github", passport.authenticate("github"));

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    const token = createToken(req.user);
    res.redirect(
      `/login?provider=github&token=${encodeURIComponent(token)}&role=${req.user.role}`
    );
  }
);

// ====== SEED DATA ======
async function ensureSeedData() {
  const courseCount = await Course.countDocuments();
  if (courseCount === 0) {
    const c1 = await Course.create({
      title: "Data Structures & Algorithms",
      code: "CS201",
      level: "Intermediate",
      description: "Core concepts of DSA."
    });
    const c2 = await Course.create({
      title: "Database Management Systems",
      code: "CS301",
      level: "Beginner",
      description: "Relational databases and SQL."
    });
    const c3 = await Course.create({
      title: "Operating Systems",
      code: "CS302",
      level: "Intermediate",
      description: "Processes, memory, file systems."
    });

    await Announcement.insertMany([
      { title: "New Quiz in DSA", text: "Quiz 3 will be available from Friday 5 PM." },
      { title: "Live Session", text: "Join OS live session on Saturday at 7 PM." }
    ]);

    await Exam.insertMany([
      { name: "Midterm 1", course: c1._id, courseName: c1.title, date: "2026-04-10" },
      { name: "End Semester", course: c2._id, courseName: c2.title, date: "2026-05-20" }
    ]);

    await Quiz.insertMany([
      { name: "DSA Quiz 1", course: c1._id, courseName: c1.title, maxScore: 100 },
      { name: "OS Quiz 2", course: c3._id, courseName: c3.title, maxScore: 100 }
    ]);

    console.log("Seed data created");
  }
}
ensureSeedData().catch(console.error);

// ====== PROTECTED DATA APIS ======

// Courses
app.get("/api/courses", authMiddleware, async (req, res) => {
  try {
    const courses = await Course.find().lean();
    res.json(
      courses.map((c) => ({
        id: c._id,
        title: c.title,
        level: c.level,
        progress: 0
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load courses" });
  }
});

// Progress
app.get("/api/progress", authMiddleware, async (req, res) => {
  try {
    const quizCount = await QuizResult.countDocuments({ user: req.user.id });
    res.json({
      completedCourses: 2,
      activeCourses: 3,
      quizzesTaken: quizCount,
      overallPercent: 68
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load progress" });
  }
});

// Attendance
app.get("/api/attendance", authMiddleware, async (req, res) => {
  try {
    const records = await Attendance.find({ user: req.user.id }).lean();
    res.json(records.map((r) => ({ date: r.date, status: r.status })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load attendance" });
  }
});

// Announcements (GET)
app.get("/api/announcements", authMiddleware, async (req, res) => {
  try {
    const anns = await Announcement.find().sort({ createdAt: -1 }).lean();
    res.json(
      anns.map((a) => ({
        title: a.title,
        text: a.text,
        createdAt: a.createdAt
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load announcements" });
  }
});

// Announcements (POST, admin only)
app.post("/api/announcements", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { title, text } = req.body;
    if (!title || !text) {
      return res.status(400).json({ error: "Title and text are required" });
    }

    await Announcement.create({
      title,
      text,
      createdBy: req.user.id
    });

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create announcement" });
  }
});

// Exams
app.get("/api/exams", authMiddleware, async (req, res) => {
  try {
    const exams = await Exam.find().lean();
    res.json(
      exams.map((ex) => ({
        name: ex.name,
        course: ex.courseName,
        date: ex.date
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load exams" });
  }
});

// Quizzes
app.get("/api/quizzes", authMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz.find().lean();
    const results = await QuizResult.find({ user: req.user.id }).lean();
    res.json(
      quizzes.map((q, idx) => ({
        name: q.name,
        score: results[idx]?.score || 0
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load quizzes" });
  }
});

// AI Tutor
app.post("/api/ai-chat", authMiddleware, (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  const q = message.toLowerCase();
  let reply;

  const isJava = q.includes("java");
  const isC = q === "c" || q.includes("in c language") || q.includes("c program");
  const isPython = q.includes("python");
  const isDBMS = q.includes("dbms") || q.includes("database");
  const isOS = q.includes("operating system") || q.includes(" os ");
  const isDSA = q.includes("data structure") || q.includes("dsa");
  const isCN = q.includes("computer network") || q.includes("networking");
  const isExam = q.includes("exam") || q.includes("test") || q.includes("prepare");

  if (isJava && (q.includes("define") || q.includes("what is"))) {
    reply =
      "Java is a high-level, object-oriented programming language developed by Sun Microsystems (now Oracle). It is platform independent using the JVM, strongly typed, and widely used for web apps, Android apps, and enterprise software.";
  } else if (isJava && (q.includes("features") || q.includes("characteristics"))) {
    reply =
      "Important features of Java: (1) Object-oriented (classes, objects, inheritance, polymorphism, encapsulation, abstraction), (2) Platform independent via bytecode and JVM, (3) Automatic memory management using garbage collection, (4) Rich standard library, (5) Robust and secure with strong type checking and exception handling.";
  } else if (isJava && (q.includes("jvm") || q.includes("jre") || q.includes("jdk"))) {
    reply =
      "JDK (Java Development Kit) is used to develop programs and includes compiler + tools + JRE. JRE (Java Runtime Environment) is needed to run Java programs. JVM (Java Virtual Machine) is the engine that executes Java bytecode; it is part of the JRE.";
  } else if (isC && (q.includes("define") || q.includes("what is"))) {
    reply =
      "C is a general-purpose, procedural programming language developed by Dennis Ritchie. It is close to hardware, gives manual memory control, and is widely used to build operating systems, compilers, and embedded systems.";
  } else if (isC && (q.includes("features") || q.includes("advantages"))) {
    reply =
      "Key features of C: (1) Simple and structured, (2) Low-level access to memory using pointers, (3) Portable across platforms, (4) Efficient code and performance, (5) Rich set of operators and library functions.";
  } else if (isPython && (q.includes("define") || q.includes("what is"))) {
    reply =
      "Python is a high-level, interpreted programming language known for simple syntax and readability. It supports multiple paradigms (procedural, object-oriented, functional) and is popular for web development, data science, AI, scripting, and automation.";
  } else if (q.includes("array") && q.includes("linked list")) {
    reply =
      "Arrays store elements in contiguous memory, so access by index is O(1) but insertion/deletion in the middle is costly. Linked lists store nodes anywhere with pointers, so insertion/deletion is easy, but access is O(n) because you must traverse from the head.";
  } else if (q.includes("stack")) {
    reply =
      "A stack is a LIFO structure (Last In, First Out). You push elements on top and pop from the top. Uses include function call stack, undo operations, and expression evaluation.";
  } else if (q.includes("queue")) {
    reply =
      "A queue is a FIFO structure (First In, First Out). You enqueue at the rear and dequeue from the front. It models real-life queues like people waiting in line or tasks waiting for the CPU.";
  } else if (q.includes("time complexity") || q.includes("big o")) {
    reply =
      "Time complexity describes how running time grows with input size n. Common orders: O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n) like merge sort, O(n^2) like simple bubble sort. We mostly analyze worst-case Big-O.";
  } else if (q.includes("binary search")) {
    reply =
      "Binary search works on sorted arrays. You repeatedly compare the middle element with the target and discard half of the array each time, giving O(log n) time, which is faster than linear search O(n) for large n.";
  } else if (isDBMS && q.includes("normalization")) {
    reply =
      "Normalization is the process of organizing tables to reduce redundancy and avoid update anomalies. Normal forms like 1NF, 2NF, and 3NF ensure each table has a clear purpose and data is not unnecessarily duplicated.";
  } else if (isDBMS && q.includes("primary key")) {
    reply =
      "A primary key uniquely identifies each row in a table. It must be unique and not null. Example: student_roll_number can be a primary key in a Students table.";
  } else if (isDBMS && q.includes("foreign key")) {
    reply =
      "A foreign key is a column that links one table to the primary key of another table. It enforces referential integrity and connects related records across tables.";
  } else if (isOS && q.includes("deadlock")) {
    reply =
      "Deadlock occurs when processes are waiting on each other in a cycle, so none can proceed. The four conditions are mutual exclusion, hold and wait, no preemption, and circular wait. Breaking any one of these can prevent deadlocks.";
  } else if (isOS && q.includes("process") && q.includes("thread")) {
    reply =
      "A process is an independent program with its own memory space. A thread is a lighter unit inside a process that shares the same memory. Threads are cheaper to create and switch than processes.";
  } else if (isCN && q.includes("osi model")) {
    reply =
      "The OSI model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application. It is a reference model to understand how data moves across networks layer by layer.";
  } else if (isCN && q.includes("tcp") && q.includes("udp")) {
    reply =
      "TCP is connection-oriented, reliable, and guarantees ordered delivery, used for web, email, etc. UDP is connectionless, faster, but unreliable and unordered, used for streaming, gaming, and real-time applications.";
  } else if (isExam || q.includes("how to study") || q.includes("prepare for exam")) {
    reply =
      "Break the syllabus into small topics, make a daily schedule, and focus on understanding plus practice questions. After each topic, write short notes in your own words and solve previous year questions to test yourself.";
  } else {
    reply =
      `I am a free rule-based tutor for SkillForge and can answer common syllabus questions (Java, C, Python, DBMS, OS, DSA, CN, exam tips).\n` +
      `You asked: "${message}".\n` +
      `Please be more specific, for example: "features of Java", "difference between array and linked list", "normalization in DBMS", "deadlock in OS", or "OSI model in networks".`;
  }

  res.json({ reply });
});

// Messages
app.get("/api/messages", authMiddleware, async (req, res) => {
  try {
    const msgs = await Message.find().sort({ createdAt: 1 }).lean();
    res.json(
      msgs.map((m) => ({
        from: m.from,
        to: m.to,
        fromName: m.fromName,
        text: m.text,
        time: m.createdAt
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

app.post("/api/messages", authMiddleware, async (req, res) => {
  try {
    const { from, to, text, fromName } = req.body;
    await Message.create({ from, to, text, fromName });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ====== START SERVER ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SkillForge running at http://localhost:${PORT}`);
});
