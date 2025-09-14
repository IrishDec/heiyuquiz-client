# heiyuquiz-client
HeiyuQuiz.com

Fast, shareable pub-style quizzes you can host in seconds. Create → Play → Share — all from a single link.

<p align="center"> <img alt="HeiyuQuiz" src="./client/img/logo.png" height="64"> </p>
✨ Highlights

Zero-friction play: one link, no sign-in, phone-friendly UI.

Two quiz providers:(( AI to be wired up right now just sending back random questions))

OpenTrivia (stable) via /api/createQuiz

GPT-generated (beta) via /api/createQuiz/ai with proper normalization & fallback

Live leaderboard with gate (copy/share/“my answers” to unlock).

Client-only “My answers” panel — never leaks answers to other players.

Sticky submit UX + safe mobile spacing.

🧱 Architecture
heiyuquiz/
├─ client/                     # Static frontend (plain HTML/CSS/JS)
│  ├─ index.html
│  ├─ app.js                   # Router + create/play/results flows
│  └─ img/logo.png
└─ server/
   ├─ server.js                # Express API (Render-ready)
   └─ package.json


Frontend: Plain HTML/CSS/JS, single page; main file: app.js.

Backend: Node + Express; main file: server.js (deployable on Render).

State (MVP): In-memory Maps for quizzes, submissions, participants. (Swap to DB later.)

🔌 API (server)

Base URL (prod): https://heiyuquiz-server.onrender.com

Health
GET /api/health
→ { ok: true }

Create quiz — OpenTrivia (stable)
POST /api/createQuiz
Body: { category="General", amount=5, durationSec=600 }
→ { ok:true, quizId, closesAt, shareUrlHint }

Create quiz — GPT (beta, localized)
POST /api/createQuiz/ai
Body: { category="General", topic="", country="", amount=5, durationSec=600 }
→ { ok:true, quizId, closesAt, provider:"ai" | "opentdb" }


Returns provider:"ai" when GPT output is used, "opentdb" if it safely falls back.

Fetch quiz (public — no answers)
GET /api/quiz/:id
→ { ok:true, id, category, closesAt, open, questions:[{ q, options[] }] }

Submit answers
POST /api/quiz/:id/submit
Body: { name, picks:number[] }       # picks[i] = chosen option index
→ { ok:true, score }

Results (winner → loser)
GET /api/quiz/:id/results
→ { ok:true, id, category, totalQuestions, results:[{ name, score, submittedAt }] }

Answers (sanitized; for “My answers” on this device)
GET /api/quiz/:id/answers
→ { ok:true, id, questions:[{ q, options[], correctIndex }] }


Server stores questions as { question, options, correctIdx }. The /answers route maps that to correctIndex for the client.

🧭 Frontend flow

Router

#/play/:id → renderPlay(id)

#/results/:id → renderResults(id)

Create quiz (createQuiz())

Warm server /api/health

POST to provider

Navigate to #/play/:id

Store host convenience:

hq-host-${id} = "1"

hq-link-${id} = "#/play/${id}"

Play → Submit

Sticky submit button (.sticky-submit) + #submitSpacer (≈84px).

Local/session storage:

hq-done-${id} = "1" after submit

hq-picks-${id} = JSON array of picks

Results

Actions: Copy link / Share now / My answers — any one sets sessionStorage["hq-ack-${id}"]="1".

Until the gate is set:

Leaderboard hidden

“Start a new quiz” CTA hidden

“My answers” fetches /answers and compares with local hq-picks-${id} (✅/❌ display).

Country picker (optional)

<select id="country"> prefilled via restcountries (prioritizes IE, GB, US, CA, AU, NZ…).

Send country in the create body; backend may ignore or use (AI route supports it).

⚙️ Configuration

Client

// app.js
window.SERVER_URL = "https://heiyuquiz-server.onrender.com";

// Toggle provider (default false for stability)
const USE_AI = false; // set true to hit /api/createQuiz/ai


Server (Render env)

PORT (optional)

MAX_PARTICIPANTS (optional; default 300)

OPENAI_API_KEY (required for /api/createQuiz/ai)

Dependencies (server)

"dependencies": {
  "cors": "^2.8.5",
  "express": "^4.19.2",
  "node-fetch": "^3.3.2",
  "openai": "^4.57.0"
}

🚀 Getting started (local)
1) Server
cd server
npm install
# Add .env with your key (or set env var)
# OPENAI_API_KEY=sk-...

node server.js
# → HeiyuQuiz server on 4001

2) Client

Serve client/ statically (any dev server):

# From project root, for example:
npx http-server ./client -p 5173
# Open http://localhost:5173

3) Point client to server

In client/app.js:

window.SERVER_URL = "http://localhost:4001";

🧪 Quick tests (copy/paste)

Create quiz (OpenTrivia):

curl -s -X POST "$SERVER/api/createQuiz" \
 -H "Content-Type: application/json" \
 -d '{"category":"General","amount":3,"durationSec":120}'


Create quiz (GPT):

curl -s -X POST "$SERVER/api/createQuiz/ai" \
 -H "Content-Type: application/json" \
 -d '{"category":"General","topic":"Irish history","country":"IE","amount":5}'


Fetch quiz:

curl -s "$SERVER/api/quiz/QUIZID"


Submit:

curl -s -X POST "$SERVER/api/quiz/QUIZID/submit" \
 -H "Content-Type: application/json" \
 -d '{"name":"Tester","picks":[0,1,2,3,0]}'


Results:

curl -s "$SERVER/api/quiz/QUIZID/results"


Answers:

curl -s "$SERVER/api/quiz/QUIZID/answers"

🔒 Security & privacy

No accounts; player names are transient.

No answers leaked via /api/quiz/:id (questions only).

In-memory storage (MVP): quizzes and submissions are ephemeral; move to a DB for persistence.

IP-minute rate limit: basic abuse mitigation.

Do not commit keys — keep OPENAI_API_KEY in environment variables.

🧭 Roadmap

 Swap MVP in-memory storage to a managed DB.

 Admin view to end quiz early / ban duplicate spam.

 Rich categories + difficulty sliders.

 Better AI moderation/guardrails + retry on malformed JSON.

 Internationalization (UI copy).

 Image rounds and lightning rounds.

🆘 Troubleshooting

Render deploy fails after adding AI
Add dependency: "openai": "^4.57.0" and redeploy.

AI route returns US-centric questions
Ensure the client uses the AI route (USE_AI = true) and you send country. Check the JSON response provider is "ai" (not "opentdb" fallback).

Cold start delays
Client warms the server with /api/health; there’s also a 25s timeout and retry guidance.

Sticky button covers content
Ensure there’s only one .sticky-submit and the #submitSpacer exists (~84px).


📚 Appendix: Local storage & session keys

hq-done-${id} — "1" after this device submits.

hq-picks-${id} — JSON array of this device’s picks.

hq-host-${id} / hq-link-${id} — host convenience.

hq-ack-${id} (sessionStorage) — set after Copy / Share / My answers (unlocks leaderboard + CTA).
