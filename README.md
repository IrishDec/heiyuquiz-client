# HeiyuQuiz — Client

Mobile-first web app for creating and playing quick pub-style quizzes.  
Pairs with the [HeiyuQuiz Server](https://github.com/heiyuquiz/heiyuquiz-server).

---

## 🌟 What it does

- **Create & share** a quiz in seconds (one link for everyone).
- **Play on phones** with large touch targets and a sticky submit button.
- **Live results** with a gated leaderboard (Copy/Share/My answers unlocks it).
- **“My answers” panel** shows ✅/❌ against the correct answers for **this device only**.
- **Country/topic inputs** to guide AI generation (server may use/fallback).

---
## 📂 Project Structure

client/
├─ index.html # App shell
├─ app.js # Router + create/play/results flows
└─ img/
└─ logo.png


> The backend API lives separately: [HeiyuQuiz Server](https://github.com/heiyuquiz/heiyuquiz-server)

---

## ⚙️ Configure

Open `app.js` and check these at the top:

```js
// Point the client to your server
window.SERVER_URL = "https://heiyuquiz-server.onrender.com"; // or http://localhost:4001

// Feature flag: which create endpoint to use
const USE_AI = false; // false = OpenTrivia (stable), true = GPT (beta)
Country (<select id="country">) — prefilled via restcountries and cached.
Topic (<input id="topic">) — short text to steer AI quizzes.

▶️ Run Locally (static)
# Option A: http-server
npx http-server ./client -p 5173

# Option B: vite preview (if you have Vite installed)
npx vite preview --port 5173 --strictPort
🧭 App Flow (client)

Routes

#/play/:id → renders questions from GET /api/quiz/:id

#/results/:id → shows leaderboard and “My answers”

Create quiz (createQuiz())

Warmup: GET /api/health

POST to /api/createQuiz or /api/createQuiz/ai (controlled by USE_AI)

Navigate to #/play/:id

Save host helpers: hq-host-${id}, hq-link-${id}

Play & Submit

Sticky submit button (.sticky-submit) and #submitSpacer (~84px)

After submit: save hq-picks-${id} and hq-done-${id} = "1"

Results (gated)

Actions row: Copy link, Share now, My answers

Any action sets sessionStorage["hq-ack-${id}"]="1" → unlocks leaderboard + “Start a new quiz” CTA

My answers

Fetches /api/quiz/:id/answers

Compares with local hq-picks-${id}; shows ✅/❌ and “Your vs Correct”

🔌 Talks to the Server

The client expects the server to expose:

POST /api/createQuiz (OpenTrivia, stable)

POST /api/createQuiz/ai (GPT, beta; may fallback; returns provider)

GET /api/quiz/:id

POST /api/quiz/:id/submit

GET /api/quiz/:id/results

GET /api/quiz/:id/answers

🎨 UI Notes (quick)

Sticky header with logo (<header id="appHeader"><img ...></header>).

One and only one .sticky-submit button + a #submitSpacer.

“View Results” button appears only when closed:

const isClosed = Number(data.closesAt) && Date.now() > Number(data.closesAt);

Country picker prioritizes IE/GB/US/CA/AU/NZ and caches responses.

🧪 Quick Checks

Create → Play → Submit → Results all work with USE_AI = false.

Flip USE_AI = true, create a quiz, confirm network call hits /api/createQuiz/ai.

On Results page, try Copy, Share, My answers — gate lifts and CTA appears.

🧭 Roadmap (client)

Add Privacy Policy page and link in footer.

Main landing page (screenshots + “Play now”).

Updates page for change logs.

Leagues page (seasonal leaderboards).

Social metadata (OG tags, Twitter cards).

Hook AdSense banners once approved.


