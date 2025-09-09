// ✅ Play gate logic
function hasPlayedBefore() {
  return localStorage.getItem("hq-played") === "true";
}

function markPlayed() {
  localStorage.setItem("hq-played", "true");
}

function checkPlayGate() {
  if (hasPlayedBefore()) {
    const gate = document.createElement("div");
    gate.style.position = "fixed";
    gate.style.top = 0;
    gate.style.left = 0;
    gate.style.width = "100%";
    gate.style.height = "100%";
    gate.style.background = "rgba(0,0,0,0.85)";
    gate.style.display = "flex";
    gate.style.justifyContent = "center";
    gate.style.alignItems = "center";
    gate.style.zIndex = 2000;
    gate.innerHTML = `
      <div style="background:#fff;padding:20px;max-width:300px;text-align:center;border-radius:8px">
        <h2>Watch an Ad to Continue</h2>
        <p>Your first game was free 🎉. Watch a quick ad to play again!</p>
        <button id="continueBtn">Continue</button>
      </div>
    `;
    document.body.appendChild(gate);

    document.getElementById("continueBtn").addEventListener("click", () => {
      // TODO: real rewarded ad later
      alert("Here you would watch an ad. For now, this just unlocks.");
      gate.remove();
    });
  } else {
    markPlayed();
  }
}

// ✅ Run the gate check immediately
checkPlayGate();

// ---------------------------------------------
// Your quiz code starts here
// ---------------------------------------------

// Point to your live server:
const SERVER_URL = "https://heiyuquiz-server.onrender.com";

const qs = s => document.querySelector(s);
const startCard = qs("#startCard");
const playView = qs("#playView");
const resultsView = qs("#resultsView");

const nameIn = qs("#name");
const categorySel = qs("#category");
const createBtn = qs("#createBtn");
const openPlayBtn = qs("#openPlay");
const shareBtn = qs("#shareBtn");

const quizMeta = qs("#quizMeta");
const quizBody = qs("#quizBody");
const scoreList = qs("#scoreList");

// Point to your live server:
const SERVER_URL = "https://heiyuquiz-server.onrender.com";

const qs = s => document.querySelector(s);
const startCard = qs("#startCard");
const playView = qs("#playView");
const resultsView = qs("#resultsView");

const nameIn = qs("#name");
const categorySel = qs("#category");
const createBtn = qs("#createBtn");
const openPlayBtn = qs("#openPlay");
const shareBtn = qs("#shareBtn");

const quizMeta = qs("#quizMeta");
const quizBody = qs("#quizBody");
const scoreList = qs("#scoreList");

function show(el) {
  [startCard, playView, resultsView].forEach(e => e.classList.add("hidden"));
  el.classList.remove("hidden");
}

// Router: #/play/ID or #/results/ID
window.addEventListener("load", route);
window.addEventListener("hashchange", route);

async function route() {
  const [_, view, id] = (location.hash.slice(1) || "").split("/");
  if (view === "play" && id) renderPlay(id);
  else if (view === "results" && id) renderResults(id);
  else show(startCard);
}

async function createQuiz() {
  const category = categorySel.value;
  const r = await fetch(`${SERVER_URL}/api/createQuiz`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ category, amount: 5, durationSec: 600 })
  }).then(r=>r.json());
  if (!r.ok) return alert("Failed to create quiz.");
  const link = `${location.origin}${location.pathname}#/play/${r.quizId}`;
  try {
    if (navigator.share) await navigator.share({ title:"HeiyuQuiz", text:`Join my ${category} quiz!`, url: link });
    else { await navigator.clipboard.writeText(link); alert("Link copied! Share it in your group."); }
  } catch {}
}

async function renderPlay(id) {
  const data = await fetch(`${SERVER_URL}/api/quiz/${id}`).then(r=>r.json());
  if (!data.ok) return alert("Quiz not found.");
  show(playView);
  quizMeta.textContent = `${data.category} • Closes: ${new Date(data.closesAt).toLocaleTimeString()}`;
  quizBody.innerHTML = "";
  const picks = new Array(data.questions.length).fill(null);

  data.questions.forEach((q, idx) => {
    const wrap = document.createElement("div"); wrap.className = "q";
    const prog = document.createElement("div"); prog.className = "progress"; prog.textContent = `Q ${idx+1}/${data.questions.length}`;
    const h = document.createElement("h3"); h.textContent = q.q;
    const opts = document.createElement("div"); opts.className = "opts";
    q.options.forEach((opt, oidx) => {
      const b = document.createElement("button"); b.textContent = opt;
      b.onclick = () => {
        picks[idx] = oidx;
        [...opts.children].forEach(c => c.classList.remove("selected"));
        b.classList.add("selected");
      };
      opts.appendChild(b);
    });
    wrap.appendChild(prog); wrap.appendChild(h); wrap.appendChild(opts);
    quizBody.appendChild(wrap);
  });

  const submit = document.createElement("button");
  submit.textContent = "Submit Answers";
  submit.style.marginTop = "12px";
  submit.onclick = async () => {
    const name = (nameIn.value || "Player").trim();
    const resp = await fetch(`${SERVER_URL}/api/quiz/${id}/submit`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ name, picks })
    }).then(r=>r.json());
    if (!resp.ok) return alert(resp.error || "Submit failed");
    location.hash = `/results/${id}`;
  };
  quizBody.appendChild(submit);

  shareBtn.onclick = async () => {
    const link = `${location.origin}${location.pathname}#/play/${id}`;
    try {
      if (navigator.share) await navigator.share({ title:"HeiyuQuiz", text:`Join this ${data.category} quiz!`, url: link });
      else { await navigator.clipboard.writeText(link); alert("Link copied!"); }
    } catch {}
  };
}

async function renderResults(id) {
  const data = await fetch(`${SERVER_URL}/api/quiz/${id}/results`).then(r=>r.json());
  if (!data.ok) return alert("No results yet.");
  show(resultsView);
  scoreList.innerHTML = "";
  data.results.forEach((row, i) => {
    const li = document.createElement("li");
    li.textContent = `${i+1}. ${row.name} — ${row.score}/${data.totalQuestions}`;
    scoreList.appendChild(li);
  });
}

createBtn?.addEventListener("click", createQuiz);
openPlayBtn?.addEventListener("click", () => {
  const id = prompt("Paste the quiz ID (the part after #/play/ in the link):");
  if (id) location.hash = `/play/${id.trim()}`;
});
