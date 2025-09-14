Heiyu Quiz

A real-time multiplayer quiz you can spin up in seconds. Create a room, share a link/code, and play from any device.

Live: https://www.heiyuquiz.com

Features

Create room → share link/code → players join instantly

Host controls: start rounds, reveal answers, next/prev

Real-time scoreboard & answer flow

Mobile-first UI (no app install)

(Optional) AI-generated questions with safety filters & caching

No player sign-in required

Tech (swap in your actual stack)

Frontend: React / Next.js / Vue / Vanilla JS

Realtime: Supabase Realtime / WebSockets / Firebase

Data: Postgres / Supabase / Firestore

AI (optional): OpenAI / Groq / etc.

Hosting: Vercel / Netlify / Cloudflare / …

Tip: update this section with your real choices so reviewers see your decision-making.

Architecture (high level)

Host creates a room → persisted in DB

Players join via link/code → subscribe to realtime channel

Host starts round → questions loaded (AI or question bank)

Players submit answers → realtime broadcast → scoreboard updates

Results stored for post-game review / analytics

Screenshots / Demo

screenshots/lobby.png – Lobby & join flow

screenshots/round.png – Question + timer

screenshots/scoreboard.png – Live scoreboard

Add a short demo GIF/video if you can—huge boost for reviewers.

Getting started (local)
# 1) Clone & install
git clone <your-repo-url>
cd heiyu-quiz
npm install

# 2) Configure env
cp .env.example .env.local
# then open .env.local and set the values below:
# DATABASE_URL=...
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...
# AI_API_KEY=...    # optional if using AI questions

# 3) Run dev server
npm run dev
# visit http://localhost:3000 (or your dev port)


Build & start (production):

npm run build
npm start

Testing
npm test
# includes scoring logic, timers, and basic rendering checks

Accessibility & Performance

Keyboard-navigable controls and focus states

Color contrast checked on primary flows

Performance budget on bundle size & realtime updates

Roadmap

Public rooms & moderation / report abuse

Non-AI question packs (schools/corporate)

Host analytics (session length, retention)

Admin panel for content & game presets


MIT (or your preferred license)

