require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ─── Sleep helper ─────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Free models to try in order ─────────────
const FREE_MODELS = [
  "google/gemma-3-4b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-3-12b-it:free",
  "google/gemma-2-9b-it:free",
];

// ─── Build prompt ─────────────────────────────
function buildPrompt(confidence, skills, desiredJob, weeklyHours) {
  return `You are SkillBridge AI Agent — a senior career guidance assistant for users in India.

The user has provided this profile:
- Confidence Level: ${confidence}/10
- Current Skills: ${skills}
- Desired Job Role: ${desiredJob}
- Weekly Hours Available for Learning: ${weeklyHours} hours/week
- Location: India

Your task: Analyze this profile and return a career roadmap as a JSON object.

IMPORTANT RULES:
- Return ONLY a valid JSON object
- No markdown, no backticks, no explanation
- No text before or after the JSON
- Just the raw JSON object starting with { and ending with }

Return this exact JSON structure (fill in real values, do not use placeholder text):
{
  "profile_summary": "Write 2-3 honest sentences about where this user currently stands",
  "current_level": "Beginner",
  "recommended_role": "Write the best job role for them",
  "alternative_roles": ["Role 1", "Role 2", "Role 3"],
  "skill_gaps": ["Gap 1", "Gap 2", "Gap 3", "Gap 4", "Gap 5"],
  "roadmap": {
    "phase_1": {
      "title": "Foundations",
      "duration": "Weeks 1-4",
      "topics": ["Topic 1", "Topic 2", "Topic 3"],
      "weekly_plan": "Describe what to study each week",
      "practical_task": "Describe a hands-on task"
    },
    "phase_2": {
      "title": "Core Skills",
      "duration": "Weeks 5-10",
      "topics": ["Topic 1", "Topic 2", "Topic 3"],
      "weekly_plan": "Describe what to study each week",
      "practical_task": "Describe a hands-on task"
    },
    "phase_3": {
      "title": "Projects",
      "duration": "Weeks 11-16",
      "topics": ["Topic 1", "Topic 2", "Topic 3"],
      "weekly_plan": "Describe what to study each week",
      "practical_task": "Build 2 real projects"
    },
    "phase_4": {
      "title": "Job Preparation",
      "duration": "Weeks 17-20",
      "topics": ["Resume building", "LinkedIn optimization", "DSA prep", "Mock interviews"],
      "weekly_plan": "Describe what to do each week",
      "practical_task": "Apply to 10 jobs, do 5 mock interviews"
    }
  },
  "weekly_schedule": "Write a practical daily/weekly schedule based on ${weeklyHours} hours per week",
  "free_resources": {
    "youtube": [
      { "name": "Traversy Media", "topic": "Web development tutorials", "url": "https://youtube.com/@TraversyMedia" },
      { "name": "CodeWithHarry", "topic": "Programming in Hindi", "url": "https://youtube.com/@CodeWithHarry" },
      { "name": "Apna College", "topic": "DSA and placements", "url": "https://youtube.com/@ApnaCollegeOfficial" },
      { "name": "Fireship", "topic": "Quick tech concepts", "url": "https://youtube.com/@Fireship" }
    ],
    "docs": [
      { "name": "MDN Web Docs", "description": "Best reference for HTML CSS JS", "url": "https://developer.mozilla.org" },
      { "name": "freeCodeCamp", "description": "Free full courses and certifications", "url": "https://freecodecamp.org" },
      { "name": "W3Schools", "description": "Easy beginner tutorials", "url": "https://w3schools.com" }
    ],
    "practice_platforms": [
      { "name": "HackerRank", "description": "Practice coding challenges", "url": "https://hackerrank.com" },
      { "name": "LeetCode", "description": "DSA interview preparation", "url": "https://leetcode.com" },
      { "name": "GitHub", "description": "Host your projects and build portfolio", "url": "https://github.com" }
    ]
  },
  "feedback": "Write 3-4 honest sentences about whether this goal is realistic and what the biggest risks are",
  "motivation_tip": "Write one powerful motivational sentence for this specific user"
}`;
}

// ─── Call OpenRouter with model fallback ──────
async function callOpenRouter(prompt) {
  for (let m = 0; m < FREE_MODELS.length; m++) {
    const model = FREE_MODELS[m];
    console.log(`\n🤖 Trying: ${model}`);

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: model,
            messages: [
              { role: "user", content: prompt }
            ],
            max_tokens: 3000,
            temperature: 0.5,
          },
          {
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "http://localhost:3000",
              "X-Title": "SkillBridge AI",
            },
            timeout: 60000,
          }
        );

        const text = response.data.choices[0].message.content;
        console.log(`✅ Got response from ${model}`);
        return text;

      } catch (err) {
        const status = err.response?.status;
        const errBody = JSON.stringify(err.response?.data || err.message);
        console.log(`❌ ${model} attempt ${attempt} failed: ${status} — ${errBody}`);

        // Model not available — try next model immediately
        if (status === 404 || status === 400 ||
            errBody.includes("No endpoints") ||
            errBody.includes("not found") ||
            errBody.includes("unavailable")) {
          console.log(`⚠️  Skipping ${model}, trying next...`);
          break;
        }

        // Rate limit — wait then retry
        if (status === 429) {
          if (attempt < 2) {
            console.log(`⏳ Rate limit. Waiting 25s...`);
            await sleep(25000);
          } else {
            console.log(`⚠️  Rate limit persists. Trying next model...`);
            break;
          }
        }
      }
    }
  }

  throw new Error("All free models are currently unavailable. Please try again in 2 minutes.");
}

// ─── POST /analyze ────────────────────────────
app.post("/analyze", async (req, res) => {
  const { confidence, skills, desiredJob, weeklyHours } = req.body;

  if (!confidence || !skills || !desiredJob || !weeklyHours) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const prompt = buildPrompt(confidence, skills, desiredJob, weeklyHours);
    const rawText = await callOpenRouter(prompt);

    // Clean any accidental markdown
    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("❌ JSON Parse Error:", parseErr.message);
      console.error("Raw response:", cleaned.substring(0, 500));
      return res.status(500).json({
        error: "AI returned invalid format. Please click Analyze again.",
      });
    }

    return res.json({ success: true, data: parsed });

  } catch (err) {
    console.error("❌ Final error:", err.message);

    if (err.message.includes("401") || err.message.includes("Unauthorized")) {
      return res.status(500).json({
        error: "❌ Invalid API Key — check OPENROUTER_API_KEY in your .env file."
      });
    }
    if (err.message.includes("402")) {
      return res.status(500).json({
        error: "💳 No credits — go to openrouter.ai and top up your account."
      });
    }

    return res.status(500).json({ error: "⚠️ " + err.message });
  }
});

// ─── Serve frontend ───────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n✅ SkillBridge AI running at http://localhost:${PORT}`);
  console.log(`🔑 API Key: ${process.env.OPENROUTER_API_KEY ? "Loaded ✅" : "MISSING ❌ — create .env file"}\n`);
});