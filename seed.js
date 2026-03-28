// seed.js - AI exam generator seeder for SkillForge

require('dotenv').config();
const axios = require('axios');
const mysql = require('mysql2/promise');

const {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DB,
  LOCAL_LLM_BASE_URL,
  LOCAL_LLM_MODEL,
} = process.env;

function createDbPool() {
  return mysql.createPool({
    host: MYSQL_HOST || '127.0.0.1',
    user: MYSQL_USER || 'root',
    password: MYSQL_PASSWORD || '',
    database: MYSQL_DB || 'skillforge_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

const pool = createDbPool();

// ---- Helper: extract JSON object from LLM text ----
function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('No JSON object found in LLM output');
  }

  try {
    return JSON.parse(match[0]);
  } catch (e) {
    throw new Error('Failed to parse JSON object from LLM output');
  }
}

// ---- Call local LLM to generate one exam ----
async function callLocalLlmForExam(topic, difficulty) {
  const prompt = `
You are an AI exam generator.

You MUST return ONLY a single valid JSON object and nothing else.
Do NOT include any explanations, comments, markdown, or code fences.

The JSON format must be exactly:

{
  "topic": "string",
  "difficulty": "easy" | "medium" | "hard",
  "num_questions": number,
  "duration_minutes": number,
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correct_option": 0,
      "marks": number
    }
  ]
}

Requirements:
- "num_questions" must equal the length of the "questions" array.
- Each question must have exactly 4 options.
- "correct_option" must be an integer index between 0 and 3.
- Use simple, clear B.Tech CSE level questions.

Now generate one exam in this format for:
- topic: "${topic}"
- difficulty: "${difficulty}"

Remember: OUTPUT ONLY THE JSON OBJECT, NO TEXT BEFORE OR AFTER.
`;

  const payload = {
    model: LOCAL_LLM_MODEL,
    messages: [
      { role: 'system', content: 'You generate exams strictly as JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 1024,
  };

  // LM Studio OpenAI-compatible base from paste.txt:
  // http://localhost:1234  +  /v1/chat/completions
  const url = `${LOCAL_LLM_BASE_URL}/v1/chat/completions`;

  const res = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 600000,
  });

  const choice = res.data && res.data.choices && res.data.choices[0];
  const text =
    choice && choice.message && choice.message.content
      ? choice.message.content
      : '';

  if (!text || !text.trim()) {
    throw new Error('LLM returned empty response');
  }

  return text;
}


// ---- Generate one AI exam and insert into DB ----
async function generateAiExamOnce(topic, difficulty) {
  const llmText = await callLocalLlmForExam(topic, difficulty);

  let aiExam;
  try {
    aiExam = extractJson(llmText);
  } catch (err) {
    console.error('AI exams JSON parse error:', llmText);
    throw new Error('LLM did not return valid JSON');
  }

  if (
    !aiExam ||
    !aiExam.topic ||
    !Array.isArray(aiExam.questions) ||
    aiExam.questions.length === 0
  ) {
    throw new Error('Invalid AI exam structure from LLM');
  }

  // Basic normalization
  const topicText = aiExam.topic || topic;
  const rawDifficulty =
    (aiExam.difficulty || difficulty || 'medium').toLowerCase();
  const allowed = ['easy', 'medium', 'hard'];
  const difficultyText = allowed.includes(rawDifficulty)
    ? rawDifficulty
    : 'medium';
  const numQuestions = aiExam.num_questions || aiExam.questions.length;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert into ai_exams  (topic, difficulty, num_questions)
    const [examResult] = await conn.execute(
      `INSERT INTO ai_exams (topic, difficulty, num_questions)
       VALUES (?, ?, ?)`,
      [topicText, difficultyText, numQuestions]
    );

    const examId = examResult.insertId;

    // Insert questions into ai_exam_questions
    // Schema: id, exam_id, question, opt1, opt2, opt3, opt4, correct_option, difficulty
    for (const q of aiExam.questions) {
      const questionText = q.question || '';
      const options = q.options || [];
      const correctIndex =
        typeof q.correct_option === 'number' ? q.correct_option : 0;

      const opt1 = options[0] || '';
      const opt2 = options[1] || '';
      const opt3 = options[2] || '';
      const opt4 = options[3] || '';

      await conn.execute(
        `INSERT INTO ai_exam_questions
          (exam_id, question, opt1, opt2, opt3, opt4, correct_option, difficulty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [examId, questionText, opt1, opt2, opt3, opt4, correctIndex, difficultyText]
      );
    }

    await conn.commit();
    console.log(
      `AI exam generated: id=${examId} topic="${topicText}" difficulty=${difficultyText} questions=${numQuestions}`
    );
  } catch (err) {
    await conn.rollback();
    console.error('Generate AI exam DB error:', err.message);
    throw err;
  } finally {
    conn.release();
  }
}

// ---- Retry wrapper to be more robust ----
async function generateAiExamWithRetry(topic, difficulty, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await generateAiExamOnce(topic, difficulty);
    } catch (err) {
      console.warn(
        `Attempt ${i + 1} for topic "${topic}" difficulty "${difficulty}" failed:`,
        err.message
      );
      if (i === retries - 1) {
        throw err;
      }
    }
  }
}

// ---- Main: generate multiple exams ----
async function main() {
  console.log('Starting AI exam generation via seed.js...');

  const topics = [
    'Data Structures and Algorithms',
    'Object Oriented Programming in Java',
    'Computer Networks',
    'Operating Systems',
    'Database Management Systems',
    'Web Technologies (HTML, CSS, JS)',
    'Computer Organization and Architecture',
    'Software Engineering',
    'Discrete Mathematics',
    'Machine Learning Fundamentals',
  ];

  const difficulties = ['easy', 'medium', 'hard'];

  try {
    for (const topic of topics) {
      for (const difficulty of difficulties) {
        await generateAiExamWithRetry(topic, difficulty, 5);
      }
    }

    console.log('AI exam seeding finished.');
  } catch (err) {
    console.error('seed.js failed', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();