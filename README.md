# SkillForge-AI-Adaptive-Learning-And-Exam-Generator

Full‑stack SkillForge – AI-powered adaptive learning and exam generator platform for B.Tech students, with separate Student and Admin dashboards, AI exam generation, and an integrated AI Tutor.<file:2707>

SkillForge is an AI-powered EdTech platform designed to help students and administrators manage learning activities through a centralized web application. It provides tools for course management, announcements, attendance tracking, and AI-assisted learning support.<file:2707>

## Features

- **Student portal**
  - Dashboard with enrolled courses and upcoming exams.
  - Take AI-generated exams and manually created exams.
  - View scores and detailed results.

- **Admin / faculty portal**
  - Create and manage courses, subjects, and student enrollments.
  - Build **manual exams** with custom questions, marks, and timing.
  - Generate **AI-powered exams** (MCQ / theory) using a local LLM.
  - Manage question banks and exam configurations.

- **AI exam generation**
  - Uses LM Studio running a local model.<file:2707>
  - Prompts are structured so the model returns strict JSON, which the backend validates and stores.<file:2707>
  - Supports configurable difficulty, topic, number of questions, and marks.

- **AI Tutor**
  - `/api/ai-tutor/chat` endpoint connects to the local LLM via the OpenAI-compatible `/v1/chat/completions` API.<file:2707>[web:2732]
  - Chat-style interface where students can ask course-related questions.
  - Short, focused explanations targeted at B.Tech level students.

- **Architecture & tech stack**
  - **Backend:** Node.js, Express.
  - **Database:** Relational DB (e.g., MySQL) with tables for users, courses, exams, questions, and results.<file:2707>
  - **AI backend:** LM Studio local LLM server with OpenAI-compatible endpoints.<file:2707>[web:2732]
  - **Auth:** Token-based auth middleware plus Google and GitHub OAuth login.
  - **Frontend:** HTML/CSS/JS dashboard-style UI (student and admin views).

---

## Project structure (high level)

- `server.js` – Express app entry point, route registration, middleware.
- `routes/` – API routes for auth, students, admins, exams, AI tutor, and AI exam generator.<file:2707>
- `public/` – Static assets (HTML, CSS, JS) for dashboards and exam/tutor UI.
- `config/` – Environment and database configuration.
- `sql/` or `migrations/` – Database schema and seed data (users, courses, exams, etc.).
- `logs/` – Optional: application and LLM logs (for debugging exam JSON, tutor responses).<file:2707>

---

## Getting started

### Prerequisites

- Node.js (LTS) and npm or yarn.
- Local database (e.g., MySQL) with a configured user and database.
- [LM Studio](https://lmstudio.ai/) installed and a compatible chat model downloaded (for example, `tinyllama-1.1b-chat-v1.0`).<file:2707>[web:2731]