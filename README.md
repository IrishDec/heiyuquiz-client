HeiyuQuiz

Create and share fun quizzes instantly. Play alone or with friends — no downloads, no sign-ups.

<p align="center"> <img src="./client/img/logo.png" alt="HeiyuQuiz logo" height="64"> </p>
🌟 Features

Instant quizzes — generate from OpenTrivia or AI (beta).

Play anywhere — phone-friendly, no install required.

Shareable links — one link to invite all your friends.

Live results — leaderboard updates as players submit.

“My answers” view — private panel showing ✅/❌ vs correct answers.

Custom topics + country option — guide AI to produce local questions.

Ad-ready layout — banner slots reserved (Google AdSense review pending).

🧩 Architecture

heiyuquiz/
├─ client/                     # Static frontend (plain HTML/CSS/JS)
│  ├─ index.html
│  ├─ app.js                   # Router + create/play/results flows
│  └─ img/logo.png
└─ server/
   ├─ server.js                # Express API (Render-ready)
   └─ package.json


Frontend

Static site: HTML, CSS, JavaScript

Main file: app.js

Handles routing (#/play/:id, #/results/:id), quiz UI, and local/session storage.

Backend

Node.js with Express (hosted on Render)

Main file: server.js

Routes for creating quizzes, submitting answers, fetching results and answers.

Supports two providers:

/api/createQuiz → OpenTrivia (default, stable)

/api/createQuiz/ai → GPT (beta, with fallback to OpenTrivia)

🔌 API Overview
Health
GET /api/health
→ { ok: true }

Create Quiz (OpenTrivia)
POST /api/createQuiz
Body: { category, amount, durationSec }
→ { ok:true, quizId, closesAt }

Create Quiz (AI, beta)
POST /api/createQuiz/ai
Body: { category, topic, country, amount, durationSec }
→ { ok:true, quizId, closesAt, provider:"ai"|"opentdb" }

Get Quiz (public, no answers)
GET /api/quiz/:id
→ { ok:true, id, category, closesAt, open, questions:[{ q, options[] }] }

Submit Answers
POST /api/quiz/:id/submit
Body: { name, picks:number[] }
→ { ok:true, score }

Results
GET /api/quiz/:id/results
→ { ok:true, results:[{ name, score, submittedAt }], totalQuestions }

Answers (for “My answers” panel only)
GET /api/quiz/:id/answers
→ { ok:true, questions:[{ q, options[], correctIndex }] }

⚙️ Configuration

Client

// Choose provider in app.js
const USE_AI = false; // true = GPT, false = OpenTrivia

// Point to backend
window.SERVER_URL = "https://heiyuquiz-server.onrender.com";


Server environment variables

PORT (default 4001)

MAX_PARTICIPANTS (default 300)

OPENAI_API_KEY (required for GPT provider)

🚀 Running Locally

Server

cd server
npm install
export OPENAI_API_KEY=sk-...   # your key
node server.js


→ runs on http://localhost:4001

Client
Serve client/ statically:

npx http-server ./client -p 5173


→ open http://localhost:5173

📋 Roadmap

Add Privacy Policy page.

Launch main landing site with screenshots + CTA.

Publish Updates page for change logs and announcements.

Build Leagues page for seasonal competitions.

Integrate social plugins (OG tags, Twitter cards, share buttons).

Improve AI quiz generation → stronger country/topic grounding.

Enable AdSense banners once approved.
