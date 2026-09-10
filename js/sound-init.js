/* =========================================================
   SOUND-INIT.JS — Wires the mute button, preloader gesture,
   depth updates, and one-shot event calls.
   ========================================================= */
(function(){
'use strict';

const muteBtn = document.getElementById('muteBtn');
let soundReady = false;
let toastEl = null;

function showToast(msg){
  if (!toastEl){
    toastEl = document.createElement('div');
    toastEl.className = 'sound-toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

/* --- Start sound on first user gesture --- */
function startSound(){
  if (soundReady) return;
  Sound.init();
  Sound.resume();
  Sound.setMuted(false);
  muteBtn.classList.remove('muted');
  muteBtn.dataset.state = 'on';
  soundReady = true;
  showToast('🔊 Ambient sound on');
  localStorage.setItem('uwSound', 'on');
}

/* --- Respect previous setting --- */
const lastState = localStorage.getItem('uwSound');
if (lastState === 'off'){
  muteBtn.classList.add('muted');
  muteBtn.dataset.state = 'off';
}

/* --- Any first interaction starts sound --- */
['click','touchstart','keydown','scroll'].forEach(ev => {
  window.addEventListener(ev, function once(){
    if (lastState !== 'off') startSound();
    window.removeEventListener(ev, once);
  }, { once: true, passive: true });
});

/* --- Mute button --- */
muteBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!soundReady) {
    startSound();
    return;
  }
  const m = Sound.toggle();
  muteBtn.classList.toggle('muted', m);
  muteBtn.dataset.state = m ? 'off' : 'on';
  localStorage.setItem('uwSound', m ? 'off' : 'on');
  showToast(m ? '🔇 Sound muted' : '🔊 Sound on');
});

/* --- Keep AudioContext alive on mobile --- */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && soundReady){
    Sound.resume();
  }
});

/* --- Expose helpers for other modules --- */
window.SoundEvents = {
  bubble(){ Sound.playBubble(); },
  chestOpen(){ Sound.playChestOpen(); },
  chime(freq){ Sound.playChime(freq); },
  sonar(){ Sound.playSonar(); },
  splash(){ Sound.playSplash(); },
  whoosh(){ Sound.playWhoosh(); },
  click(){ Sound.playClick(); }
};

})();
