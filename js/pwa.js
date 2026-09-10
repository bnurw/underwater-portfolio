/* =========================================================
   PWA.JS — Service Worker registration + install prompt
   ========================================================= */
(function(){
'use strict';

/* ---------- Service Worker ---------- */
if ('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('✅ SW registered:', reg.scope))
      .catch(err => console.warn('⚠️ SW failed:', err));
  });
}

/* ---------- Install Prompt ---------- */
let deferredPrompt = null;
const promptEl = document.getElementById('installPrompt');
const installBtn = document.getElementById('ipInstall');
const closeBtn = document.getElementById('ipClose');

// Already dismissed?
const dismissed = localStorage.getItem('uwInstallDismissed');
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                  || window.navigator.standalone === true;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Show prompt if not already dismissed and not standalone
  if (!dismissed && !isStandalone && promptEl){
    setTimeout(() => {
      promptEl.classList.add('show');
      promptEl.dataset.open = 'true';
    }, 8000); // wait 8s before nudging
  }
});

if (installBtn){
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('Install outcome:', outcome);
    deferredPrompt = null;
    promptEl.classList.remove('show');
  });
}

if (closeBtn){
  closeBtn.addEventListener('click', () => {
    promptEl.classList.remove('show');
    promptEl.dataset.open = 'false';
    localStorage.setItem('uwInstallDismissed', '1');
  });
}

/* ---------- Standalone detection ---------- */
window.addEventListener('appinstalled', () => {
  console.log('🎉 App installed!');
  if (promptEl) promptEl.classList.remove('show');
});

/* ---------- iOS Safari — "Add to Home Screen" hint ---------- */
if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone && !dismissed){
  // Show a custom hint after 12s
  setTimeout(() => {
    if (promptEl){
      const txt = promptEl.querySelector('.ip-text span');
      if (txt) txt.textContent = 'Tap Share → Add to Home Screen';
      const ib = promptEl.querySelector('.ip-install');
      if (ib) ib.style.display = 'none';
      promptEl.classList.add('show');
    }
  }, 12000);
}

})();
