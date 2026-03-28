# SkillForge-AI-Adaptive-Learning-And-Exam-Generator
SkillForge is an AI-powered EdTech platform designed to help students and administrators manage learning activities through a centralized web application.  It provides tools for course management, announcements, attendance tracking, and AI-assisted learning support.
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
  - Uses LM Studio running a local model.
  - Prompts are structured so the model returns strict JSON, which the backend validates and stores.
  - Supports configurable difficulty, topic, number of questions, and marks.

- **AI Tutor**
  - `/api/ai-tutor/chat` endpoint connects to the local LLM via the OpenAI-compatible `/v1/chat/completions` API.
  - Chat-style interface where students can ask course-related questions.
  - Short, focused explanations targeted at B.Tech level students.

- **Architecture & tech stack**
  - **Backend:** Node.js, Express.
  - **Database:** (Your DB here – e.g., MySQL / PostgreSQL) with tables for users, courses, exams, questions, and results.
  - **AI backend:** LM Studio local LLM server with OpenAI-compatible endpoints.
  - **Auth:** Token-based auth middleware for protected routes.
  - **Frontend:** HTML/CSS/JS dashboard-style UI (student and admin views).

---

## Project structure (high level)

- `server.js` – Express app entry point, route registration, middleware.
- `routes/` – API routes for auth, students, admins, exams, AI tutor, and AI exam generator.
- `public/` – Static assets (HTML, CSS, JS) for dashboards and exam/tutor UI.
- `config/` – Environment and database configuration.
- `sql/` or `migrations/` – Database schema and seed data (users, courses, exams, etc.).
- `logs/` – Optional: application and LLM logs (for debugging exam JSON, tutor responses).  

(Names may differ; update according to your actual structure.)

---

## Getting started

### Prerequisites

- Node.js (LTS)
- npm or yarn
- Local database (e.g., MySQL) with a configured user and database.
- [LM Studio](https://lmstudio.ai/) installed and a compatible chat model downloaded (e.g., `tinyllama-1.1b-chat-v1.0`).
