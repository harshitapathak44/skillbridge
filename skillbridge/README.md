# ⬡ SkillBridge AI Agent

> AI-powered personalized career roadmap generator — built with Node.js, Express & Claude API.

---

## 📁 Folder Structure

```
skillbridge/
├── public/
│   ├── index.html       ← Single-page frontend
│   ├── styles.css       ← Full dark industrial UI
│   └── script.js        ← Form logic, API calls, rendering
├── server.js            ← Express backend + Claude integration
├── package.json         ← Dependencies
├── .env                 ← Your API key (create from .env.example)
├── .env.example         ← Template for env variables
└── README.md            ← This file
```

---

## ⚙️ Setup & Run Instructions

### Step 1 — Prerequisites
Make sure you have:
- **Node.js** v18+ installed → https://nodejs.org
- An **Anthropic API Key** → https://console.anthropic.com

---

### Step 2 — Install Dependencies

Open your terminal in the `skillbridge/` folder:

```bash
npm install
```

---

### Step 3 — Create your `.env` file

```bash
cp .env.example .env
```

Then open `.env` and paste your key:

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
PORT=3000
```

---

### Step 4 — Start the Server

```bash
npm start
```

Or with auto-reload during development:

```bash
npm run dev
```

---

### Step 5 — Open in Browser

Visit: **http://localhost:3000**

---

## 🧠 How It Works

1. User fills in: Confidence level, Current skills, Desired job, Weekly hours
2. Frontend sends a `POST /analyze` request to the Express backend
3. Backend calls Claude API with the SkillBridge system prompt
4. Claude returns a structured JSON roadmap
5. Frontend renders the results in beautiful cards

---

## 🔌 API Endpoint

```
POST /analyze
Content-Type: application/json

Body:
{
  "confidence": "7",
  "skills": "HTML, CSS, Python basics",
  "desiredJob": "Full Stack Developer",
  "weeklyHours": "15"
}

Response:
{
  "success": true,
  "data": { ...roadmap JSON... }
}
```

---

## 📦 Tech Stack

| Layer     | Technology             |
|-----------|------------------------|
| Frontend  | HTML5, CSS3, Vanilla JS |
| Backend   | Node.js + Express       |
| AI Model  | Claude (Anthropic SDK)  |
| Fonts     | Syne, DM Mono, Lora     |

---

## 🆓 Features

- ✅ Free resource recommendations only (no paid courses)
- ✅ India-focused job market context
- ✅ 4-phase structured roadmap
- ✅ Honest AI feedback
- ✅ YouTube + Docs + Practice platform links
- ✅ Responsive mobile-friendly UI
- ✅ Raw JSON toggle for developers

---

Built for hackathons. Copy-paste ready. Zero paid dependencies.
