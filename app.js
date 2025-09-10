// HeiyuQuiz — app.js (clean)

/* ---------- First-play gate (overlay kept below ad) ---------- */
function hasPlayedBefore(){ return localStorage.getItem("hq-played")==="true"; }
function markPlayed(){ localStorage.setItem("hq-played","true"); }

function checkPlayGate(){
  if (!hasPlayedBefore()){ markPlayed(); return; }

  const gate = document.createElement("div");
  Object.assign(gate.style, {
    position:"fixed", top:0, left:0, right:0, bottom:0,
    background:"rgba(0,0,0,0.85)",
    display:"flex", justifyContent:"center", alignItems:"center",
    zIndex:2147482000 // below .ad-banner
  });
  gate.className = "overlay-safe";
  gate.innerHTML = `
    <div style="background:#fff;padding:20px;max-width:320px;text-align:center;border-radius:12px">
      <h2 style="margin:0 0 8px;">Watch an Ad to Continue</h2>
      <p style="margin:0 0 12px;">Your first game was free 🎉. Watch a quick ad to play again!</p>
      <button id="continueBtn" style="padding:10px 14px;border:1px solid #ddd;border-radius:10px;background:#f9f9f9;font-weight:600;cursor:pointer">Continue</button>
    </div>
  `;
  document.body.appendChild(gate);

  // Expose so the footer script (in index.html) can adjust bottom spacing when an ad renders
  window._hqGate = gate;

  document.getElementById("continueBtn")?.addEventListener("click", ()=>{
    // TODO: replace with real rewarded ad
    alert("Here you would watch an ad. Unlocking for now.");
    gate.remove();
    window._hqGate = null;
  });
}
checkPlayGate();

/* ------------------ Config ------------------ */
window.SERVER_URL = window.SERVER_URL || "https://heiyuquiz-server.onrender.com";

/* ------------------ DOM ------------------ */
const qs = (s)=>document.querySelector(s);
const startCard   = qs("#startCard");
const playView    = qs("#playView");
const resultsView = qs("#resultsView");

const nameIn      = qs("#name");
const categorySel = qs("#category");
const createBtn   = qs("#createBtn");
const openPlayBtn = qs("#openPlay");
const shareBtn    = qs("#shareBtn");

const quizMeta    = qs("#quizMeta");
const quizBody    = qs("#quizBody");
const scoreList   = qs("#scoreList");

/* ------------------ View switcher ------------------ */
function show(el){
  [startCard, playView, resultsView].forEach(e => e?.classList.add("hidden"));
  el?.classList.remove("hidden");
}

/* ------------------ Router ------------------ */
window.addEventListener("load", route);
window.addEventListener("hashchange", route);

async function route(){
  const [ , view, id ] = (location.hash.slice(1) || "").split("/");
  if (view === "play" && id)      renderPlay(id);
  else if (view === "results" && id) renderResults(id);
  else                             show(startCard);
}

/* ------------------ Create quiz & share ------------------ */
async function createQuiz(){
  const category = categorySel?.value || "General";

  let res, data;
  try{
    res = await fetch(`${window.SERVER_URL}/api/createQuiz`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ category, amount:5, durationSec:600 })
    });
    data = await res.json();
  }catch{
    alert("Network error creating quiz."); return;
  }

  if (!res.ok && !data?.ok){ alert(data?.error || "Failed to create quiz."); return; }

  const quizId = data.quizId || data.id;
  if (!quizId){ alert("Create succeeded but no quiz ID returned."); return; }

  const link = `${location.origin}${location.pathname}#/play/${quizId}`;
  try{
    if (navigator.share){
      await navigator.share({ title:"HeiyuQuiz", text:`Join my ${category} quiz!`, url: link });
    }else{
      await navigator.clipboard.writeText(link);
      alert("Link copied! Share it in your group.");
    }
  }catch{/* user canceled share */}
}

/* ------------------ Play view ------------------ */
async function renderPlay(id){
  let res, data;
  try{
    res = await fetch(`${window.SERVER_URL}/api/quiz/${id}`);
    data = await res.json();
  }catch{
    alert("Network error loading quiz."); return;
  }
  if (!res.ok && !data?.ok){ alert(data?.error || "Quiz not found."); return; }

  const category = data.category || "Quiz";
  const closesAt = data.closesAt ? new Date(data.closesAt).toLocaleTimeString() : "";

  show(playView);
  if (quizMeta) quizMeta.textContent = closesAt ? `${category} • Closes: ${closesAt}` : category;
  if (quizBody) quizBody.innerHTML = "";

  const questions = data.questions || [];
  const picks = new Array(questions.length).fill(null);

  questions.forEach((q, idx)=>{
    const wrap = document.createElement("div"); wrap.className = "q";
    const prog = document.createElement("div"); prog.className = "progress"; prog.textContent = `Q ${idx+1}/${questions.length}`;
    const h = document.createElement("h3"); h.textContent = q.q;
    const opts = document.createElement("div"); opts.className = "opts";
    (q.options || q.choices || []).forEach((opt, oidx)=>{
      const b = document.createElement("button"); b.textContent = opt;
      b.onclick = ()=>{
        picks[idx] = oidx;
        [...opts.children].forEach(c => c.classList.remove("selected"));
        b.classList.add("selected");
      };
      opts.appendChild(b);
    });
    wrap.appendChild(prog); wrap.appendChild(h); wrap.appendChild(opts);
    quizBody?.appendChild(wrap);
  });

  const submit = document.createElement("button");
  submit.textContent = "Submit Answers";
  submit.style.marginTop = "12px";
  submit.onclick = async ()=>{
    const name = (nameIn?.value || "Player").trim();
    let sRes, sData;
    try{
      sRes = await fetch(`${window.SERVER_URL}/api/quiz/${id}/submit`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ name, picks })
      });
      sData = await sRes.json();
    }catch{
      alert("Network error submitting answers."); return;
    }
    if (!sRes.ok && !sData?.ok){ alert(sData?.error || "Submit failed"); return; }
    location.hash = `/results/${id}`;
  };
  quizBody?.appendChild(submit);

  if (shareBtn){
    shareBtn.onclick = async ()=>{
      const link = `${location.origin}${location.pathname}#/play/${id}`;
      try{
        if (navigator.share){
          await navigator.share({ title:"HeiyuQuiz", text:`Join this ${category} quiz!`, url: link });
        }else{
          await navigator.clipboard.writeText(link);
          alert("Link copied!");
        }
      }catch{}
    };
  }
}

/* ------------------ Results view ------------------ */
async function renderResults(id){
  let res, data;
  try{
    res = await fetch(`${window.SERVER_URL}/api/quiz/${id}/results`);
    data = await res.json();
  }catch{
    alert("Network error loading results."); return;
  }
  if (!res.ok && !data?.ok){ alert(data?.error || "No results yet."); return; }

  const total = data.totalQuestions ?? (data.results?.[0]?.total ?? 0);

  show(resultsView);
  if (scoreList) scoreList.innerHTML = "";
  (data.results || []).forEach((row, i)=>{
    const li = document.createElement("li");
    li.textContent = `${i+1}. ${row.name} — ${row.score}/${total}`;
    scoreList?.appendChild(li);
  });
}

/* ------------------ Wire buttons ------------------ */
createBtn?.addEventListener("click", createQuiz);
openPlayBtn?.addEventListener("click", ()=>{
  const id = prompt("Paste the quiz ID (the part after #/play/ in the link):");
  if (id) location.hash = `/play/${id.trim()}`;
});
