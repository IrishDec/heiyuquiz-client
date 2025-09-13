// HeiyuQuiz — app.js

/* --------- If someone opens /?quiz=ABC123, convert it to #/play/ABC123 --------- */
document.addEventListener('DOMContentLoaded', ()=>{
  const u = new URL(location.href);
  const q = u.searchParams.get('quiz');
  if (q && !location.hash) {
    location.hash = `/play/${q}`;
  }
});

/* --------- Helpers --------- */
// Decode &ouml;, &quot;, etc. from server text
function decodeHTML(s){ const e=document.createElement('textarea'); e.innerHTML=String(s??""); return e.value; }

/* --------- First-play gate (overlay kept below ad, mobile-safe) --------- */
function hasPlayedBefore(){ return localStorage.getItem("hq-played")==="true"; }
function markPlayed(){ localStorage.setItem("hq-played","true"); }

function checkPlayGate(){
  if (!hasPlayedBefore()){ markPlayed(); return; }

  const gate = document.createElement("div");
  Object.assign(gate.style, {
    position:"fixed", top:0, left:0, right:0, bottom:0,
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
  window._hqGate = gate;

  const banner = document.querySelector('.ad-banner');
  let ro;
  function setBottomForBanner(){
    let h = 0;
    if (banner) h = Math.max(0, Math.ceil(banner.getBoundingClientRect().height));
    if (h === 0 && matchMedia("(max-width:540px)").matches) h = 56;
    gate.style.bottom = (h ? h + "px" : "0");
  }
  setBottomForBanner();
  setTimeout(setBottomForBanner, 400);
  setTimeout(setBottomForBanner, 1200);
  setTimeout(setBottomForBanner, 2500);
  if ("ResizeObserver" in window && banner){
    ro = new ResizeObserver(setBottomForBanner);
    ro.observe(banner);
    const ins = banner.querySelector('ins'); if (ins) ro.observe(ins);
  }
  window.addEventListener('resize', setBottomForBanner);

  document.getElementById("continueBtn")?.addEventListener("click", ()=>{
    alert("Here you would watch an ad. Unlocking for now.");
    if (ro) try { ro.disconnect(); } catch {}
    window.removeEventListener('resize', setBottomForBanner);
    gate.remove();
    window._hqGate = null;
  });
}
checkPlayGate();

/* ------------------ Config & Rules ------------------ */
// app.js
window.SERVER_URL = "https://heiyuquiz-server.onrender.com";

const QUIZ_TTL_HOURS = 24;               // set to 3 if you prefer 3-hour links
const DURATION_SEC    = QUIZ_TTL_HOURS * 3600;

/* ------------------ DOM ------------------ */
const qs = (s)=>document.querySelector(s);
const startCard   = qs("#startCard");
const playView    = qs("#playView");
const resultsView = qs("#resultsView");

const nameIn      = qs("#name");
const categorySel = qs("#category");
const createBtn   = qs("#createBtn");
const shareBtn    = qs("#shareBtn");

const quizMeta    = qs("#quizMeta");
const quizBody    = qs("#quizBody");
const scoreList   = qs("#scoreList");

const regionSel = qs("#region");
const topicIn   = qs("#topic");


// --- Name helpers for Play view ---
function getSavedName(){ return localStorage.getItem('hq-name') || ''; }
function saveName(n){ localStorage.setItem('hq-name', (n || '').slice(0, 24)); }


/* ------------------ View switcher + home CTA ------------------ */
function show(el){
  [startCard, playView, resultsView].forEach(e => e?.classList.add("hidden"));
  el?.classList.remove("hidden");
}
function addHomeCta(msg){
  document.querySelector('.home-cta')?.remove();
  const container = document.createElement('div');
  container.className = 'home-cta';
  container.style.marginTop = '12px';
  container.innerHTML = `
    ${msg ? `<p class="muted" style="margin:0 0 8px">${msg}</p>` : ``}
    <button id="goHomeBtn">Start a new quiz</button>
  `;
  const target = !resultsView?.classList.contains('hidden') ? resultsView : playView;
  target.appendChild(container);
  document.getElementById('goHomeBtn').onclick = ()=>{
    location.hash = '';
    show(startCard);
    window.scrollTo(0,0);
  };
}

/* ------------------ Router ------------------ */
window.addEventListener("load", route);
window.addEventListener("hashchange", route);
document.addEventListener("DOMContentLoaded", route);
route();

async function route(){
  const [ , view, id ] = (location.hash.slice(1) || "").split("/");
  if (view === "play" && id)      renderPlay(id);
  else if (view === "results" && id) renderResults(id);  
  else                             show(startCard);
}

/* ===== Beauty Pack: toast + confetti ===== */
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
  createBtn?.addEventListener('click', ()=>{
    setTimeout(()=>hqConfetti(20), 300);
    setTimeout(()=>hqToast('Share the link 🎉'), 800);
  });
  const _oldRenderResults = typeof renderResults === 'function' ? renderResults : null;
  if (_oldRenderResults){
    window.renderResults = async function(id){
      await _oldRenderResults(id);
      hqConfetti(14);
      hqToast('Results ready!');
    };
  }
})();
/* ------------------ Create quiz & share (play-first) ------------------ */
async function createQuiz(){
  const category = categorySel?.value || "General";
  const region   = regionSel?.value || "global";
  const topic    = (topicIn?.value || "").trim();

  const originalLabel = createBtn?.textContent || 'Create & Share Link';
  createBtn?.setAttribute('disabled','');
  if (createBtn) createBtn.textContent = 'Creating…';

  // tiny warm-up to wake the backend (ignore errors)
  try { await fetch(`${window.SERVER_URL}/api/health`, { cache:'no-store' }); } catch {}

  // give slow cold starts time to respond
  const ctrl = new AbortController();
  const TIMEOUT_MS = 25000; // was 10000
  const timer = setTimeout(()=>ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${window.SERVER_URL}/api/createQuiz`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({
        category, region, topic,
        amount: 5,
        durationSec: (typeof DURATION_SEC!=="undefined" ? DURATION_SEC : 86400)
      }),
      signal: ctrl.signal
    });

    const raw = await res.text();
    let data; try { data = JSON.parse(raw); } catch { data = null; }

    if (!res.ok || !data?.ok){
      alert(`Create failed:\n${(data && (data.error || data.message)) || raw || `HTTP ${res.status}`}`);
      return;
    }

    const quizId = data.quizId || data.id;
    if (!quizId){ alert('Create succeeded but no quiz ID returned.'); return; }

    // go straight to play
    location.hash = `/play/${quizId}`;

    // store host flag + link; sharing unlocks after submit
    const link = `${location.origin}${location.pathname}#/play/${quizId}`;
    try {
      localStorage.setItem(`hq-host-${quizId}`, '1');
      localStorage.setItem(`hq-link-${quizId}`, link);
    } catch {}
    window.hqToast && hqToast('Play first — sharing unlocks after you submit ✅');

  } catch (err) {
    if (err.name === 'AbortError') {
      alert('Create timed out (25s). The server may be waking up — please try again.');
    } else {
      alert('Network error creating quiz.');
    }
    console.error('createQuiz exception:', err);
  } finally {
    clearTimeout(timer);
    createBtn?.removeAttribute('disabled');
    if (createBtn) createBtn.textContent = originalLabel;
  }
}

/* ------------------ Play view ------------------ */
async function renderPlay(id){
  let res, data;
  try{
    res = await fetch(`${window.SERVER_URL}/api/quiz/${id}`, { credentials:"omit" });
    data = await res.json();
  }catch{
    show(playView);
    if (quizMeta) quizMeta.textContent = "Couldn’t load that quiz.";
    if (quizBody) quizBody.innerHTML = `<p class="muted">Network error. Ask the host to resend the link.</p>`;
    addHomeCta();
    return false;
  }

  // If quiz missing/closed, try to show results instead
  if (!res.ok || !data?.ok){
    try{
      const r  = await fetch(`${window.SERVER_URL}/api/quiz/${id}/results`);
      const rd = await r.json();
      if (r.ok && rd?.ok && Array.isArray(rd.results) && rd.results.length){
        await renderResults(id);
        addHomeCta('This quiz is closed. Here are the results.');
        return true;
      }
    }catch{}
    show(playView);
    if (quizMeta) quizMeta.textContent = "Quiz not found or expired.";
    if (quizBody) quizBody.innerHTML = `<p class="muted">That link looks invalid or expired.</p>`;
    addHomeCta();
    return false;
  }

  // Theme + meta
  const category = data.category || "Quiz";
  const catSlug  = String(category || 'general').toLowerCase();
  document.documentElement.setAttribute('data-theme', catSlug);

  const closesAt = data.closesAt ? new Date(data.closesAt).toLocaleTimeString() : "";
  const region   = data.region || "";
  const topic    = data.topic  || "";
  let   questions = Array.isArray(data.questions) ? data.questions : [];

  if (questions.length === 0){
    console.warn("No questions from server; using demo set so UI isn’t blank.");
    questions = Array.from({length:5}, (_,i)=>({
      q: `Sample question #${i+1}?`,
      options: ["Option A","Option B","Option C","Option D"]
    }));
  }

  show(playView);

  // Share button (only visible if this user already submitted this quiz)
  const alreadyPlayed = localStorage.getItem(`hq-done-${id}`) === '1';
  if (shareBtn){
    if (alreadyPlayed){
      const link = localStorage.getItem(`hq-link-${id}`) || `${location.origin}${location.pathname}#/play/${id}`;
      shareBtn.style.display = '';
      shareBtn.onclick = async ()=>{
        try{
          if (navigator.share){
            await navigator.share({ title:"HeiyuQuiz", text:`Join this ${category} quiz!`, url: link });
          } else {
            await navigator.clipboard.writeText(link);
            window.hqToast && hqToast("Link copied!");
          }
        }catch{}
      };
    } else {
      shareBtn.style.display = 'none';
    }
  }

  // Compact name bar
  let nameBar = document.getElementById('playNameBar');
  if (!nameBar) {
    nameBar = document.createElement('div');
    nameBar.id = 'playNameBar';
    nameBar.style.cssText = 'display:flex;gap:8px;align-items:center;margin:6px 0 10px';
    nameBar.innerHTML = `
      <input id="playName" placeholder="Your name" maxlength="24"
        style="flex:1;min-width:140px;padding:8px 10px;border:1px solid #ddd;border-radius:10px"/>
    `;
    playView?.insertBefore(nameBar, playView.firstChild);
  }
  const playNameIn = document.getElementById('playName');
  if (playNameIn && !playNameIn.value) playNameIn.value = getSavedName() || (nameIn?.value || '');

  // Meta line + clear body
  const metaBits = [category, closesAt && `Closes: ${closesAt}`, region && region.toUpperCase(), topic && `Topic: ${topic}`]
    .filter(Boolean).join(" • ");
  if (quizMeta) quizMeta.textContent = metaBits || category;
  if (quizBody) quizBody.innerHTML = "";

  // Build questions
  const picks = new Array(questions.length).fill(null);
  questions.forEach((q, idx)=>{
    const wrap = document.createElement("div"); wrap.className = "q";
    const prog = document.createElement("div"); prog.className = "progress"; prog.textContent = `Q ${idx+1}/${questions.length}`;
    const h = document.createElement("h3"); h.textContent = decodeHTML(q.q || q.question || `Question ${idx+1}`);
    const opts = document.createElement("div"); opts.className = "opts";
    const options = q.options || q.choices || [];
    options.forEach((opt, oidx)=>{
      const b = document.createElement("button"); b.textContent = decodeHTML(String(opt));
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

  // Submit (sticky)
  const submit = document.createElement("button");
  submit.className = "sticky-submit";
  submit.textContent = "Submit Answers";
  submit.onclick = async ()=>{
    const name = (document.getElementById('playName')?.value || nameIn?.value || 'Player').trim();
    if (!name) { window.hqToast && hqToast('Enter your name'); return; }
    saveName(name);

    try{
      const sRes  = await fetch(`${window.SERVER_URL}/api/quiz/${id}/submit`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ name, picks })
      });
      const sData = await sRes.json();

      if (!sRes.ok || !sData?.ok){
        window.hqToast && hqToast(sData?.error || "Submit failed");
        return;
      }
      try { localStorage.setItem(`hq-picks-${id}`, JSON.stringify(picks)); } catch {}
      try { localStorage.setItem(`hq-done-${id}`, '1'); } catch {}
      location.hash = `/results/${id}`;
    }catch{
      window.hqToast && hqToast("Network error submitting.");
    }
  };
  quizBody?.appendChild(submit);

  // Keep content visible above sticky button
  let spacer = document.getElementById('submitSpacer');
  if (!spacer) {
    spacer = document.createElement('div');
    spacer.id = 'submitSpacer';
    spacer.style.height = '84px';
    quizBody?.appendChild(spacer);
  }

// --- Only show "View Results" when the quiz is truly CLOSED ---
document.getElementById('viewResultsBtn')?.remove(); // remove any stray one

const isClosed = Number(data.closesAt) && Date.now() > Number(data.closesAt);
if (isClosed) {
  const viewBtn = document.createElement('button');
  viewBtn.id = 'viewResultsBtn';
  viewBtn.textContent = 'Quiz closed — View Results';
  viewBtn.style.margin = '8px 0 0';
  viewBtn.style.background = '#fff';
  viewBtn.style.border = '1px solid #ddd';
  viewBtn.style.borderRadius = '10px';
  viewBtn.style.padding = '8px 12px';
  viewBtn.style.fontWeight = '600';
  viewBtn.onclick = () => { location.hash = `/results/${id}`; };
  quizBody?.appendChild(viewBtn);
}

return true;

}
/* ------------------ Results view (live auto-refresh) ------------------ */
async function renderResults(id){
  // stop any previous poller
  if (window._hqPoll) { try { clearInterval(window._hqPoll.id); } catch {} ; window._hqPoll = null; }

  show(resultsView);
  if (scoreList) scoreList.innerHTML = "<li class='muted'>Loading results…</li>";

  const link    = `${location.origin}${location.pathname}#/play/${id}`;
  const ackKey  = `hq-ack-${id}`; // “acted this session”
  document.querySelector('.home-cta')?.remove(); // we’ll reinsert below the actions row

  // Put the CTA directly under the actions row
  function placeHomeCta(){
    addHomeCta();
    const actions = document.getElementById('resultsActions');
    const cta = document.querySelector('.home-cta');
    if (actions && cta) actions.insertAdjacentElement('afterend', cta);
  }
  function unlockStart(){
    try { sessionStorage.setItem(ackKey, '1'); } catch {}
    if (!document.querySelector('.home-cta')) placeHomeCta();
  }

  // ---- Actions (Copy / Share / My answers) ----
  (function ensureActions(){
    let p = document.getElementById('resultsActions');
    if (!p){
      p = document.createElement('div');
      p.id = 'resultsActions';
      p.style.cssText = 'margin:8px 0 12px;display:flex;flex-direction:column;gap:10px';

      // gradient style inline to match your CTA
      const btn = (id, text)=>(
        `<button id="${id}" style="
            width:100%;padding:14px;border:0;border-radius:14px;
            background:linear-gradient(90deg,#6e56cf,#d6467e,#ffb224);
            color:#fff;font-weight:800;box-shadow:0 12px 28px rgba(214,70,126,.25);
          ">${text}</button>`
      );

      p.innerHTML = [
        btn('resultsCopyBtn','Copy quiz link'),
        btn('resultsShareBtn','Share quiz now'),
        btn('resultsMineBtn','My answers')
      ].join('');
      resultsView?.insertBefore(p, resultsView.firstChild);
    }

    // handlers
    const copyBtn  = document.getElementById('resultsCopyBtn');
    const shareBtn = document.getElementById('resultsShareBtn');
    const mineBtn  = document.getElementById('resultsMineBtn');

    if (copyBtn) copyBtn.onclick = async ()=>{
      try { await navigator.clipboard.writeText(link); } catch {}
      window.hqToast && hqToast('Link copied!');
      unlockStart();
    };

    if (shareBtn) shareBtn.onclick = async ()=>{
      try{
        if (navigator.share){
          await navigator.share({ title:'HeiyuQuiz', text:'Join our quiz', url: link });
        } else {
          await navigator.clipboard.writeText(link);
          window.hqToast && hqToast('Link copied!');
        }
      }catch{}
      unlockStart();
    };

    if (mineBtn) mineBtn.onclick = async ()=>{
      await showMyAnswers();   // defined below
      unlockStart();
    };
  })();

  // If user already acted this session, show CTA immediately
  if (sessionStorage.getItem(ackKey) === '1') placeHomeCta();

  // Make results list comfortably scrollable on phones (results are always visible)
  if (scoreList){
    scoreList.style.maxHeight = '52vh';
    scoreList.style.overflowY = 'auto';
    scoreList.style.webkitOverflowScrolling = 'touch';
  }

  // ---- Fetch + render results ----
  async function fetchResults(){
    const res = await fetch(`${window.SERVER_URL}/api/quiz/${id}/results`);
    const data = await res.json();
    if (!res.ok || !data?.ok) throw new Error(data?.error || "No results yet");
    return data;
  }

  function draw(list, total){
  if (!scoreList) return;
  scoreList.innerHTML = "";

  if (!list || !list.length){
    scoreList.innerHTML = `<li class="muted">No results yet — waiting for players…</li>`;
    return;
  }

  const meName = (getSavedName() || (nameIn?.value || "")).trim().toLowerCase();

  list.forEach((row, i) => {
    const li = document.createElement("li");
    const isMe = meName && row.name && row.name.toLowerCase() === meName;

    // keep dash on one line
    li.textContent = `${i + 1}. ${row.name}\u00A0—\u00A0${row.score}/${total}`;

    if (isMe) {
      li.style.fontWeight = "700";
      li.style.textDecoration = "underline";
    }
    scoreList.appendChild(li);
  });
}



      const isMe = me && row.name && row.name.toLowerCase() === me;
      const label = document.createElement('span');
      label.textContent = `${i+1}. ${row.name} — ${row.score}/${total}`;
      label.style.flex = '1';
      if (isMe) label.style.fontWeight = '700';
      li.appendChild(label);

      // tiny inline “See answers” just for this device’s player
      if (isMe){
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'see-answers';
        btn.textContent = 'See answers';
        btn.style.cssText = 'padding:6px 10px;border:0;border-radius:10px;background:#f0f2ff;font-weight:600;cursor:pointer';
        btn.onclick = showMyAnswers;
        li.appendChild(btn);
      }

      scoreList.appendChild(li);
    });
  }

  // Client-only “My answers” panel (uses /api/quiz/:id/answers)
  async function showMyAnswers(){
    let resp, payload;
    try{
      resp = await fetch(`${window.SERVER_URL}/api/quiz/${id}/answers`);
      payload = await resp.json();
    }catch{ payload = null; }
    if (!resp?.ok || !payload?.ok){
      window.hqToast && hqToast('Could not load answers.');
      return;
    }
    const questions = Array.isArray(payload.questions) ? payload.questions : [];

    let picks; try { picks = JSON.parse(localStorage.getItem(`hq-picks-${id}`) || "null"); } catch {}
    if (!Array.isArray(picks)) picks = [];

    let panel = document.getElementById('answersPanel');
    if (!panel){
      panel = document.createElement('div');
      panel.id = 'answersPanel';
      panel.style.marginTop = '12px';
      panel.style.padding = '12px';
      panel.style.border = '1px solid #eee';
      panel.style.borderRadius = '12px';
      panel.style.background = '#fff';
      resultsView?.appendChild(panel);
    }
    panel.innerHTML = `<h3 style="margin:0 0 8px">Your answers</h3>`;

    const list = document.createElement('div');
    questions.forEach((q, i)=>{
      const opts   = q.options || [];
      const myIdx  = picks[i];
      const corIdx = (typeof q.correctIndex === 'number') ? q.correctIndex : null;

      const myText  = (myIdx != null && opts[myIdx]  != null) ? String(opts[myIdx])  : '(no answer)';
      const corText = (corIdx != null && opts[corIdx] != null) ? String(opts[corIdx]) : '(unknown)';
      const isCorrect = (corIdx != null && myIdx === corIdx);

      const row = document.createElement('div');
      row.style.padding = '10px 0';
      row.style.borderTop = '1px solid #f1f1f1';
      row.innerHTML = `
        <div style="font-weight:700;margin:4px 0">${decodeHTML(q.q || q.question || `Question ${i+1}`)}</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <span>${isCorrect ? '✅' : '❌'} <strong>Your answer:</strong> ${decodeHTML(myText)}</span>
          <span class="muted">·</span>
          <span><strong>Correct:</strong> ${decodeHTML(corText)}</span>
        </div>
      `;
      list.appendChild(row);
    });

    panel.appendChild(list);
    panel.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  // initial load
  try{
    const data = await fetchResults();
    const total = data.totalQuestions ?? (data.results?.[0]?.total ?? 0);
    draw(data.results || [], total);
  }catch{
    if (scoreList) scoreList.innerHTML = `<li class="muted">No results yet — check back soon.</li>`;
  }

  // short-lived poller (every 4s for ~2 minutes)
  const startedAt = Date.now();
  function stop(){
    if (window._hqPoll) { try { clearInterval(window._hqPoll.id); } catch {} ; window._hqPoll = null; }
    window.removeEventListener("hashchange", stop);
    window.removeEventListener("beforeunload", stop);
  }
  window._hqPoll = {
    id: setInterval(async ()=>{
      if (Date.now() - startedAt > 120000) return stop(); // 2 min
      try{
        const data = await fetchResults();
        const total = data.totalQuestions ?? (data.results?.[0]?.total ?? 0);
        draw(data.results || [], total);
      }catch{/* keep last */}
    }, 4000)
  };
  window.addEventListener("hashchange", stop);
  window.addEventListener("beforeunload", stop);

  // NOTE: no addHomeCta() here — CTA appears under the buttons after any action via unlockStart()
}

/* ------------------ Wire buttons ------------------ */
createBtn?.addEventListener("click", createQuiz);


