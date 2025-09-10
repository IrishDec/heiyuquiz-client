// HeiyuQuiz — app.js (mobile spacing fixed)

// If someone opens /?quiz=ABC123, convert it to #/play/ABC123
document.addEventListener('DOMContentLoaded', ()=>{
  const u = new URL(location.href);
  const q = u.searchParams.get('quiz');
  if (q && !location.hash) {
    location.hash = `/play/${q}`;
  }
});

// Decode &ouml;, &quot;, etc. from server text
function decodeHTML(s){ const e=document.createElement('textarea'); e.innerHTML=String(s??""); return e.value; }


/* ---------- First-play gate (overlay kept below ad, mobile-safe) ---------- */
function hasPlayedBefore(){ return localStorage.getItem("hq-played")==="true"; }
function markPlayed(){ localStorage.setItem("hq-played","true"); }

function checkPlayGate(){
  if (!hasPlayedBefore()){ markPlayed(); return; }

  const gate = document.createElement("div");
  Object.assign(gate.style, {
    position:"fixed", top:0, left:0, right:0, bottom:0, // we’ll adjust bottom after mount
    background:"rgba(0,0,0,0.85)",
    display:"flex", justifyContent:"center", alignItems:"center",
    zIndex:2147482000  // below .ad-banner
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

  // expose for any other helpers
  window._hqGate = gate;

  // --- Set overlay bottom to actual banner height (fallback to 56px on small screens) ---
  const banner = document.querySelector('.ad-banner');
  let ro; // ResizeObserver reference

  function setBottomForBanner(){
    let h = 0;
    if (banner) {
      h = Math.max(0, Math.ceil(banner.getBoundingClientRect().height));
    }
    if (h === 0 && matchMedia("(max-width:540px)").matches) {
      // deterministic compact footer height on phones if ad hasn't rendered yet
      h = 56;
    }
    gate.style.bottom = (h ? h + "px" : "0");
  }

  // initial + delayed passes (to catch late ad rendering)
  setBottomForBanner();
  setTimeout(setBottomForBanner, 400);
  setTimeout(setBottomForBanner, 1200);
  setTimeout(setBottomForBanner, 2500);

  // react to future size changes
  if ("ResizeObserver" in window && banner){
    ro = new ResizeObserver(setBottomForBanner);
    ro.observe(banner);
    const ins = banner.querySelector('ins'); if (ins) ro.observe(ins);
  }
  window.addEventListener('resize', setBottomForBanner);

  // button handler
  document.getElementById("continueBtn")?.addEventListener("click", ()=>{
    // TODO: replace with real rewarded ad
    alert("Here you would watch an ad. Unlocking for now.");
    if (ro) try { ro.disconnect(); } catch {}
    window.removeEventListener('resize', setBottomForBanner);
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

const regionSel = qs("#region");
const topicIn   = qs("#topic");
const cancelBtn = qs("#cancelBtn");


// ---- Ad slot: auto-collapse on no fill (kills mobile white gap) ----
(function(){
  const wrap   = document.querySelector('.wrap');
  const banner = document.querySelector('.ad-banner');
  const slot   = banner?.querySelector('.adsbygoogle');

  if (!wrap || !banner || !slot) return;

  function setPaddingByBanner(){
    const h = Math.max(0, Math.ceil(banner.getBoundingClientRect().height));
    wrap.style.paddingBottom = (h ? h + 8 : 16) + 'px';
    if (window._hqGate) window._hqGate.style.bottom = (h ? h : 0) + 'px';
  }

  function collapse(){
    banner.classList.add('hidden');
    wrap.style.paddingBottom = '16px';
    if (window._hqGate) window._hqGate.style.bottom = '0px';
  }

  // Watch for an iframe (ad render) and height changes
  const mo = new MutationObserver(()=> {
    const ifr = slot.querySelector('iframe');
    if (ifr) {
      setPaddingByBanner();
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(setPaddingByBanner);
        ro.observe(banner);
        ro.observe(ifr);
      }
    }
  });
  mo.observe(slot, { childList:true, subtree:true });

  // Fallback: if after 2500ms there's no iframe or height < 30px → collapse
  setTimeout(()=>{
    const ifr = slot.querySelector('iframe');
    const h = Math.ceil(banner.getBoundingClientRect().height);
    if (!ifr || h < 30) collapse();
    else setPaddingByBanner();
  }, 2500);

  // Also recalc on resize
  window.addEventListener('resize', setPaddingByBanner);
})();


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
/* ===== Beauty Pack helpers: toast + confetti ===== */
(function(){
  function ensureToast(){
    let t = document.querySelector('.toast');
    if (!t){
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    return t;
  }
  window.hqToast = function(msg, ms=1600){
    const t = ensureToast();
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'), ms);
  };

  window.hqConfetti = function(n=18){
    const colors = ['#6e56cf','#d6467e','#ffb224','#3dd6b7','#5b9eff'];
    for (let i=0;i<n;i++){
      const s = document.createElement('div');
      s.className = 'confetti';
      s.style.background = colors[i % colors.length];
      const spread = (Math.random()*240 - 120) + 'px';
      s.style.setProperty('--x', spread);
      s.style.left = '50%';
      s.style.animationDuration = (800 + Math.random()*600) + 'ms';
      document.body.appendChild(s);
      setTimeout(()=>s.remove(), 1400);
    }
  };

  // Sprinkle confetti when a quiz is created and show a toast after link share/copy
  const originalCreate = createBtn?.onclick || null;
  // Our file uses addEventListener, so hook after submit instead:
  createBtn?.addEventListener('click', ()=>{
    // confetti fires a bit later to not block your create/share flow
    setTimeout(()=>hqConfetti(20), 300);
    // optional toast hint (will still show even if native share opens)
    setTimeout(()=>hqToast('Share the link 🎉'), 800);
  });

  // When results page loads, add a tiny celebration
  const _oldRenderResults = typeof renderResults === 'function' ? renderResults : null;
  if (_oldRenderResults){
    window.renderResults = async function(id){
      await _oldRenderResults(id);
      hqConfetti(14);
      hqToast('Results ready!');
    };
  }
})();


/* ------------------ Create quiz & share ------------------ */
async function createQuiz(){
  const name     = (nameIn?.value || "Player").trim();   // kept for future use
  const category = categorySel?.value || "General";
  const region   = regionSel?.value || "global";
  const topic    = (topicIn?.value || "").trim();

  let res, data;
  try{
    res = await fetch(`${window.SERVER_URL}/api/createQuiz`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        category,
        region,         // NEW
        topic,          // NEW (server can ignore if unsupported)
        amount: 5,
        durationSec: 600
      })
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
      await navigator.share({
        title: "HeiyuQuiz",
        text: `Join my ${category}${region && region!=='global' ? ' • '+region.toUpperCase() : ''}${topic ? ' — '+topic : ''} quiz!`,
        url: link
      });
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
    res = await fetch(`${window.SERVER_URL}/api/quiz/${id}`, { credentials:"omit" });
    data = await res.json();
  }catch{
    // Network/JSON error → show message instead of blank
    show(playView);
    quizMeta && (quizMeta.textContent = "Couldn’t load that quiz.");
    quizBody && (quizBody.innerHTML = `<p class="muted">Network error. Ask the host to resend the link.</p>`);
    return false;
  }

  if (!res.ok && !data?.ok){
    show(playView);
    quizMeta && (quizMeta.textContent = "Quiz not found or expired.");
    quizBody && (quizBody.innerHTML = `<p class="muted">That link looks invalid or expired.</p>`);
    return false;
  }

  const category = data.category || "Quiz";
  const closesAt = data.closesAt ? new Date(data.closesAt).toLocaleTimeString() : "";
  const region   = data.region || "";
  const topic    = data.topic  || "";

  // --- Questions fallback (prevents blank screen if server returns none) ---
  let questions = data.questions;
  if (!Array.isArray(questions) || questions.length === 0){
    console.warn("No questions from server; using demo set so UI isn’t blank.");
    questions = Array.from({length:5}, (_,i)=>({
      q: `Sample question #${i+1}?`,
      options: ["Option A","Option B","Option C","Option D"]
    }));
  }

  show(playView);
  const metaBits = [category, closesAt && `Closes: ${closesAt}`, region && region.toUpperCase(), topic && `Topic: ${topic}`]
    .filter(Boolean).join(" • ");
  quizMeta && (quizMeta.textContent = metaBits || category);
  quizBody && (quizBody.innerHTML = "");

  const picks = new Array(questions.length).fill(null);

  questions.forEach((q, idx)=>{
    const wrap = document.createElement("div"); wrap.className = "q";
    const prog = document.createElement("div"); prog.className = "progress"; prog.textContent = `Q ${idx+1}/${questions.length}`;
    const h = document.createElement("h3"); h.textContent = q.q || q.question || `Question ${idx+1}`;
    const opts = document.createElement("div"); opts.className = "opts";
    const options = q.options || q.choices || [];
    options.forEach((opt, oidx)=>{
      const b = document.createElement("button"); b.textContent = String(opt);
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
      window.hqToast && hqToast("Network error submitting.");
      return;
    }
    if (!sRes.ok && !sData?.ok){
      window.hqToast && hqToast(sData?.error || "Submit failed");
      return;
    }
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
          window.hqToast && hqToast("Link copied!");
        }
      }catch{}
    };
  }

  return true;
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
cancelBtn?.addEventListener("click", ()=>{
  if (nameIn)      nameIn.value = "";
  if (categorySel) categorySel.selectedIndex = 0;
  if (regionSel)   regionSel.value = "global";
  if (topicIn)     topicIn.value = "";
  if (window.hqToast) hqToast("Cleared");
});

