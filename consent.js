// Minimal consent gate for GA + AdSense (EU-friendly). Replace IDs below.
const CONSENT_KEY = "heiyuquiz-consent";
window.GA_MEASUREMENT_ID = window.GA_MEASUREMENT_ID || "G-XXXXXXX"; // <-- your GA4 ID later
window.ADSENSE_CLIENT = window.ADSENSE_CLIENT || "ca-pub-XXXXXXXXXXXXXXX"; // <-- your AdSense ID later

const consentEl = document.getElementById("consent");
const btnA = document.getElementById("consentAccept");
const btnD = document.getElementById("consentDecline");

function loadGA(id) {
  if (!id || id === "G-XXXXXXX") return;
  const s1 = document.createElement("script");
  s1.async = true; s1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s1);
  const s2 = document.createElement("script");
  s2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${id}', { anonymize_ip: true });
  `;
  document.head.appendChild(s2);
}

function loadAds(client) {
  if (!client || client.includes("XXXX")) return;
  const s = document.createElement("script");
  s.async = true; s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  document.head.appendChild(s);
  document.querySelectorAll(".ad-slot").forEach(slot => {
    const el = document.createElement("ins");
    el.className = "adsbygoogle";
    el.style = "display:block";
    el.setAttribute("data-ad-client", client);
    el.setAttribute("data-ad-format", "auto");
    el.setAttribute("data-full-width-responsive", "true");
    slot.appendChild(el);
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  });
}

function initConsent() {
  const v = localStorage.getItem(CONSENT_KEY);
  if (v === "accept") { loadGA(window.GA_MEASUREMENT_ID); loadAds(window.ADSENSE_CLIENT); }
  else if (v === "decline") { /* nothing */ }
  else { consentEl.classList.remove("hidden"); }
}

btnA?.addEventListener("click", () => { localStorage.setItem(CONSENT_KEY, "accept"); consentEl.classList.add("hidden"); initConsent(); });
btnD?.addEventListener("click", () => { localStorage.setItem(CONSENT_KEY, "decline"); consentEl.classList.add("hidden"); });

initConsent();
