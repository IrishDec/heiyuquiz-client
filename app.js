// Ensure absolute API host (prevents relative /api/... on www.heiyuquiz.com)
if (!window.SERVER_URL) {
  window.SERVER_URL = "https://heiyuquiz-server.onrender.com";
}
// HeiyuQuiz — app.js

/* --------- If someone opens /?quiz=ABC123, convert it to #/play/ABC123 --------- */
document.addEventListener('DOMContentLoaded', ()=>{
  const u = new URL(location.href);
  const q = u.searchParams.get('quiz');
  if (q && !location.hash) {
    location.hash = `/play/${q}`;
  }
});

const USE_AI = true;
const AI_PRESETS = true; // use GPT even when toggle is OFF (category+country only)


/* --------- Helpers --------- */
// Decode &ouml;, &quot;, etc. from server text
function decodeHTML(s){ const e=document.createElement('textarea'); e.innerHTML=String(s??""); return e.value; }

/* --------- First-play gate (DISABLED for AdSense compliance) --------- */
function hasPlayedBefore(){ return localStorage.getItem("hq-played")==="true"; }
function markPlayed(){ localStorage.setItem("hq-played","true"); }

function checkPlayGate(){
  // Disabled during AdSense review: never show a pre-content pop-up.
  // Leave footer/banner ads as-is; this only removes the replay gate overlay.
  return;
}
checkPlayGate();


 

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
const countrySel  = qs("#country");   

// Load countries (cached) into #country and pin priority countries at the top
(async function loadCountries(){
  // If the element isn't in the DOM yet, wait for it
  if (!countrySel) {
    document.addEventListener('DOMContentLoaded', loadCountries);
    return;
  }

  const PRIORITY = ['IE','GB','US','CA','AU','NZ','PH',]; // put your targets here in order
  const CACHE_KEY = 'hq-countries-v1';
  const CACHE_TTL_MS = 7 * 24 * 3600 * 1000;

  function fill(list){
    const priSet = new Set(PRIORITY);
    const top  = PRIORITY.map(code => list.find(c => c.code === code)).filter(Boolean);
    const rest = list.filter(c => !priSet.has(c.code)); // already A→Z from fetch step

    const opt = c => `<option value="${c.code}">${c.flag ? c.flag + ' ' : ''}${c.name}</option>`;

    countrySel.innerHTML =
      `<option value="">Any country</option>` +
      (top.length ? top.map(opt).join('') + `<option value="" disabled>──────────</option>` : '') +
      rest.map(opt).join('');

    // restore previous choice
    const saved = localStorage.getItem('hq-country') || '';
    if (saved && countrySel.querySelector(`option[value="${saved}"]`)) {
      countrySel.value = saved;
    }
    countrySel.onchange = () => {
      try { localStorage.setItem('hq-country', countrySel.value || ''); } catch {}
    };
  }

  try {
    // use cache if fresh
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    const cachedAt = Number(localStorage.getItem(CACHE_KEY + ':at') || 0);
    if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
      fill(cached);
      return;
    }

    // fetch + normalize + sort A→Z
    const resp = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,region,flag');
    const data = await resp.json();
    const list = (Array.isArray(data) ? data : [])
      .map(c => ({
        name: c?.name?.common || '',
        code: c?.cca2 || '',
        region: c?.region || '',
        flag: c?.flag || ''
      }))
      .filter(x => x.code && x.name)
      .sort((a,b)=> a.name.localeCompare(b.name));

    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
    localStorage.setItem(CACHE_KEY + ':at', String(Date.now()));
    fill(list);
  } catch (e) {
    console.warn('Country load failed', e);
    countrySel.innerHTML = `<option value="">Any country</option>`;
  }
})();

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

// ------------------ Router (complete) ------------------
async function route(){
  const [ , view, id ] = (location.hash.slice(1) || "").split("/");

if (view === "results" && id) return renderResults(id);


  // If opening a play link but this device already submitted, send to results.
  if (view === "play" && id) {
    if (localStorage.getItem(`hq-done-${id}`) === '1') {
      location.hash = `/results/${id}`;
      try { window.hqToast && hqToast("You've already played — showing results"); } catch {}
      return;
    }
    return renderPlay(id);
  }

  return show(startCard);
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
  // ----- Read current form values -----
  const category = (categorySel?.value || "General").trim();
  const country  = (countrySel?.value  || "").trim();

  // AI toggle + topic
  const aiOn    = !!document.getElementById('ai-toggle')?.checked;
  const aiTopic = (document.getElementById('ai-topic')?.value || '').trim();
  const isCustom = aiOn && aiTopic.length >= 3;

  // Segmented controls: amount + difficulty
  const countBtn = document.querySelector('#qcount .seg-btn.active');
  const diffBtn  = document.querySelector('#qdifficulty .seg-btn.active');
  const amount = Math.max(3, Math.min(10, Number(countBtn?.getAttribute('data-count') || 5)));
  const difficulty = (diffBtn?.getAttribute('data-diff') || 'medium'); // 'easy'|'medium'|'hard'

  // Button UX
  const originalLabel = createBtn?.textContent || 'Create & Share Link';
  createBtn?.setAttribute('disabled','');
  if (createBtn) createBtn.textContent = 'Creating…';

  // tiny warm-up (ignore errors)
  try { await fetch(`${window.SERVER_URL}/api/health`, { cache:'no-store' }); } catch {}

  // timeout guard
  const ctrl = new AbortController();
  const TIMEOUT_MS = 25000;
  const timer = setTimeout(()=>ctrl.abort(), TIMEOUT_MS);

  try {
    // Build payload
    const payload = {
      category,
      topic: isCustom ? aiTopic : category,
      amount,                                  // 5 or 10 from the toggle
      durationSec: (typeof DURATION_SEC !== "undefined" ? DURATION_SEC : 86400),
      difficulty                               // easy|medium|hard
    };
    // Only bias by country when not using custom topic
    if (!isCustom) payload.country = country;

    // Create quiz
    const res = await fetch(`${window.SERVER_URL}/api/createQuiz/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    });

    const raw = await res.text();
    let data; try { data = JSON.parse(raw); } catch {}

    if (!res.ok || !data?.ok){
      alert(`Create failed:\n${(data && (data.error || data.message)) || raw || `HTTP ${res.status}`}`);
      return;
    }

    const quizId = data.quizId || data.id;
    if (!quizId){ alert('Create succeeded but no quiz ID returned.'); return; }

    // store host flag + link (for share button)
    const link = `${location.origin}${location.pathname}#/play/${quizId}`;
    try {
      localStorage.setItem(`hq-host-${quizId}`, '1');
      localStorage.setItem(`hq-link-${quizId}`, link);
    } catch {}

    // hard navigation so Play view always loads
    location.href = link;

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
    const sRes = await fetch(`${window.SERVER_URL}/api/quiz/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, picks })
    });
    const sData = await sRes.json();

    if (!sRes.ok || !sData?.ok){
      window.hqToast && hqToast(sData?.error || "Submit failed");
      return;
    }

    // keep for cross-device recovery
    if (sData.sid) { try { localStorage.setItem(`hq-sid-${id}`, String(sData.sid)); } catch {} }
    try { localStorage.setItem(`hq-picks-${id}`, JSON.stringify(picks)); } catch {}
    try { localStorage.setItem(`hq-done-${id}`, '1'); } catch {}

    // carry sid in the URL
    const url = new URL(location.href);
    if (sData.sid) url.searchParams.set('sid', String(sData.sid));
    url.hash = `/results/${id}`;
    location.href = url.toString();

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
  // capture sid from URL for cross-device recovery
// Capture sid from URL, store it, then clean the URL so ?sid isn't shared
try {
  const u = new URL(location.href);
  const sid = u.searchParams.get('sid');
  if (sid) {
    try { localStorage.setItem(`hq-sid-${id}`, String(sid)); } catch {}
    u.searchParams.delete('sid');
    history.replaceState(null, '', u.toString()); // no reload, same page/hash
  }
} catch {}



  // stop any previous poller
  if (window._hqPoll) { try { clearInterval(window._hqPoll.id); } catch {} ; window._hqPoll = null; }

  show(resultsView);
  if (scoreList) scoreList.innerHTML = "<li class='muted'>Loading results…</li>";

  const link   = `${location.origin}${location.pathname}#/play/${id}`;
  const ackKey = `hq-ack-${id}`;

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

  // Actions (Copy / Share / My answers)
  (function ensureActions(){
    let p = document.getElementById('resultsActions');
    if (!p){
      p = document.createElement('div');
      p.id = 'resultsActions';
      p.style.cssText = 'margin:8px 0 12px;display:flex;flex-direction:column;gap:10px';
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
      try { await showMyAnswers(); } catch {}
      unlockStart();
    };
  })();

  if (sessionStorage.getItem(ackKey) === '1') placeHomeCta();

  if (scoreList){
    scoreList.style.maxHeight = '52vh';
    scoreList.style.overflowY = 'auto';
    scoreList.style.webkitOverflowScrolling = 'touch';
  }

  // Fetch + render results
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
      li.textContent = `${i + 1}. ${row.name}\u00A0—\u00A0${row.score}/${total}`;
      if (isMe) { li.style.fontWeight = "700"; li.style.textDecoration = "underline"; }
      scoreList.appendChild(li);
    });
  }

  // Client-only “My answers” panel: try LocalStorage → SID → Name
async function showMyAnswers(){
  // 1) load questions (for correct answers)
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

  // 2) try local picks from THIS device
  let picks; try { picks = JSON.parse(localStorage.getItem(`hq-picks-${id}`) || "null"); } catch {}
  let ok = Array.isArray(picks) && picks.length === questions.length;

  // 3) if missing, try recovery by SID (best)
  if (!ok){
    const sid = (localStorage.getItem(`hq-sid-${id}`) || "").trim();
    if (sid){
      try{
        const r = await fetch(`${window.SERVER_URL}/api/quiz/${id}/submission?sid=${encodeURIComponent(sid)}`);
        const d = await r.json();
        if (r.ok && d?.ok && Array.isArray(d.picks)){
          picks = d.picks;
          try { localStorage.setItem(`hq-picks-${id}`, JSON.stringify(picks)); } catch {}
          ok = true;
        }
      }catch{}
    }
  }

  // 4) if still missing, fall back to recovery by NAME
  if (!ok){
    const suggested = (getSavedName() || (nameIn?.value || '')).trim();
    const who = prompt("Type the name you used when you submitted:", suggested);
    if (!who || !who.trim()){
      window.hqToast && hqToast('Name required to recover.');
      return;
    }
    try{
      const r2 = await fetch(`${window.SERVER_URL}/api/quiz/${id}/submission?name=${encodeURIComponent(who.trim())}`);
      const d2 = await r2.json();
      if (r2.ok && d2?.ok && Array.isArray(d2.picks)){
        picks = d2.picks;
        if (d2.sid) { try { localStorage.setItem(`hq-sid-${id}`, String(d2.sid)); } catch {} }
        try { localStorage.setItem(`hq-picks-${id}`, JSON.stringify(picks)); } catch {}
        ok = true;
      }
    }catch{}
    if (!ok){
      window.hqToast && hqToast('No saved answers found.');
      return;
    }
  }

  // 5) render panel
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

  // short poller (every 4s for ~2 minutes)
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
}

/* ------------------ Wire buttons ------------------ */
createBtn?.addEventListener("click", createQuiz);

// --- Custom (AI) segmented toggle wiring ---
(function(){
  const onReady = () => {
    const cb   = document.getElementById('ai-toggle'); // hidden real checkbox
    const on   = document.getElementById('ai-on');
    const off  = document.getElementById('ai-off');
    const input= document.getElementById('ai-topic');

    if (!cb || !on || !off || !input) return;

    const sync = () => {
  input.disabled = !cb.checked;

  // active gradient on the selected button
  on.classList.toggle('active',  cb.checked);
  off.classList.toggle('active', !cb.checked);

  // black-out the opposite button
  // ON -> make OFF black; OFF -> make ON black
  off.classList.toggle('inverse',  cb.checked);
  on.classList.toggle('inverse', !cb.checked);
};
    on.addEventListener('click',  () => { cb.checked = true;  sync(); input.focus(); });
    off.addEventListener('click', () => { cb.checked = false; sync(); });

    // allow external code to change #ai-toggle if needed
    cb.addEventListener('change', sync);

    sync(); // initial state
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady, { once:true });
  } else {
    onReady();
  }
})();


// --- Segmented controls: question count + difficulty ---
(function(){
  function wireSeg(containerSelector, attr, storageKey){
    const box = document.querySelector(containerSelector);
    if (!box) return;

    const btns = Array.from(box.querySelectorAll('.seg-btn'));
    const setActive = (btn) => {
      btns.forEach(b => b.classList.toggle('active', b === btn));
      if (storageKey) {
        const v = btn.getAttribute(attr);
        try { localStorage.setItem(storageKey, v); } catch {}
      }
    };

    // restore saved choice
    if (storageKey){
      const saved = localStorage.getItem(storageKey);
      const found = saved && btns.find(b => b.getAttribute(attr) === saved);
      if (found) setActive(found);
    }

    btns.forEach(b => b.addEventListener('click', () => setActive(b)));
  }

  // data-count="5|10"
  wireSeg('#qcount', 'data-count', 'hq-qcount');

  // data-diff="easy|medium|hard"
  wireSeg('#qdifficulty', 'data-diff', 'hq-qdiff');
})();
// === Hamburger menu wiring: focus-safe + aria-hidden fix ===
(function(){
  const toggle   = document.getElementById('menuToggle');
  const nav      = document.getElementById('sideMenu');
  const closeBtn = document.getElementById('menuClose');
  // supports either .menu-overlay [data-close] or any element with data-close
  const overlay  = nav ? (nav.querySelector('[data-close]') || nav.querySelector('.menu-overlay')) : null;
  const main     = document.querySelector('main') || document.querySelector('.wrap') || document.body;

  if (!toggle || !nav || !closeBtn || !overlay) {
    console.warn('[menu] elements missing');
    return;
  }

  function openMenu(){
    nav.classList.add('open');
    nav.setAttribute('aria-hidden','false');
    // prevent background scroll & focus
    document.body.style.overflow = 'hidden';
    try { main && main.setAttribute('inert', ''); } catch {}
    toggle.classList.add('is-open');
    // move focus into the panel after paint
    requestAnimationFrame(()=> closeBtn.focus());
  }

  function closeMenu(){
    // 1) move focus back to the toggle FIRST
    toggle.focus();
    toggle.classList.remove('is-open');
    // 2) allow background again
    document.body.style.overflow = '';
    try { main && main.removeAttribute('inert'); } catch {}
    // 3) close the panel
    nav.classList.remove('open');
    // 4) only THEN hide it from the accessibility tree
    setTimeout(()=> nav.setAttribute('aria-hidden','true'), 0);
  }

  toggle.addEventListener('click', ()=>{
    if (nav.classList.contains('open')) closeMenu();
    else openMenu();
  });

  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);

  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape' && nav.classList.contains('open')) closeMenu();
  });
})();







