(function initConsent(){
  const KEY='hq-consent';
  const banner=document.getElementById('consentBanner');
  if(!banner){ console.warn('Consent banner not found; skipping'); return; }

  const saved=localStorage.getItem(KEY);
  if(saved){ banner.classList.add('hidden'); return; }

  banner.classList.remove('hidden');

  banner.querySelector('[data-accept]')?.addEventListener('click',()=>{
    localStorage.setItem(KEY,'yes');
    banner.classList.add('hidden');
  });
  banner.querySelector('[data-decline]')?.addEventListener('click',()=>{
    localStorage.setItem(KEY,'no');
    banner.classList.add('hidden');
  });
})();
