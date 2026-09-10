/* =========================================================
   PERF.JS — Adaptive quality + FPS monitor + Battery
   Sets window.Perf with tier info that every module reads.
   ========================================================= */
(function(){
'use strict';

const TIERS = {
  low:    { name: 'LOW',    scale: 0.75, pixelRatio: 1.0,  particles: 0.35, shadows: false, quality: 'basic' },
  medium: { name: 'MEDIUM', scale: 1.0,  pixelRatio: 1.2,  particles: 0.6,  shadows: false, quality: 'medium' },
  high:   { name: 'HIGH',   scale: 1.0,  pixelRatio: 1.5,  particles: 1.0,  shadows: false, quality: 'high' },
  ultra:  { name: 'ULTRA',  scale: 1.1,  pixelRatio: 2.0,  particles: 1.0,  shadows: true,  quality: 'high' }
};

const Perf = {
  tier: 'high',
  cfg: TIERS.high,
  fps: 60,
  frames: 0,
  lastFpsUpdate: performance.now(),
  autoDowngradeCount: 0,
  autoUpgradeCount: 0,
  batteryLevel: null,
  batteryCharging: null,
  reducedMotion: false,
  hidden: false,
  lowEnd: false,

  /* ============================================================
     BOOT
     ============================================================ */
  init(){
    // Detect reduced motion
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Detect device
    this.detectDevice();

    // Battery
    this.initBattery();

    // Tab hidden / visible
    document.addEventListener('visibilitychange', () => {
      this.hidden = document.hidden;
      document.body.classList.toggle('tab-hidden', this.hidden);
    });

    // HUD
    this.initHUD();

    // Start FPS loop
    this.startFPSLoop();

    // Expose
    window.Perf = this;

    console.log(
      '%c🌊 Perf ready — Tier: ' + this.cfg.name,
      'background:#001a30;color:#00d4ff;padding:4px 12px;border-radius:4px;font-weight:bold'
    );
  },

  /* ============================================================
     DEVICE DETECTION
     ============================================================ */
  detectDevice(){
    const ua = navigator.userAgent.toLowerCase();
    const cores = navigator.hardwareConcurrency || 2;
    const mem = navigator.deviceMemory || 4;  // GB (Chrome only)
    const dpr = window.devicePixelRatio || 1;
    const screenArea = window.innerWidth * window.innerHeight;
    const isMobile = /android|iphone|ipad|ipod|mobile|tablet/.test(ua);
    const isLowEnd = (cores <= 4) || (mem <= 2) || (screenArea < 300000);

    // Tier decision tree
    let tier = 'high';

    if (isMobile){
      if (isLowEnd) tier = 'low';
      else if (cores >= 8 && mem >= 6) tier = 'high';
      else tier = 'medium';
    } else {
      // Desktop
      if (cores >= 8) tier = 'ultra';
      else if (cores >= 4) tier = 'high';
      else tier = 'medium';
    }

    // Reduced motion forces low
    if (this.reducedMotion) tier = 'low';

    // Saved preference
    const saved = localStorage.getItem('uwTier');
    if (saved && TIERS[saved]) tier = saved;

    this.lowEnd = isMobile && isLowEnd;
    this.setTier(tier, false);
  },

  /* ============================================================
     TIER SETTER
     ============================================================ */
  setTier(tier, persist = true){
    if (!TIERS[tier]) return;
    this.tier = tier;
    this.cfg = TIERS[tier];

    document.body.dataset.tier = tier;
    if (persist) localStorage.setItem('uwTier', tier);

    // Broadcast event so modules can rebuild
    window.dispatchEvent(new CustomEvent('perf-tier-change', { detail: { tier, cfg: this.cfg } }));

    // Update HUD
    const el = document.getElementById('qhTier');
    if (el) el.textContent = this.cfg.name;
    const pel = document.getElementById('qhParticles');
    if (pel) pel.textContent = Math.round(this.cfg.particles * 100) + '%';
  },

  /* ============================================================
     FPS MONITOR
     ============================================================ */
  startFPSLoop(){
    let last = performance.now();
    let lowStreak = 0;
    let highStreak = 0;

    const tick = (now) => {
      const dt = now - last;
      last = now;
      this.frames++;

      // Update every 1s
      if (now - this.lastFpsUpdate >= 1000){
        this.fps = Math.round(this.frames * 1000 / (now - this.lastFpsUpdate));
        this.frames = 0;
        this.lastFpsUpdate = now;

        // HUD
        const el = document.getElementById('qhFps');
        if (el) el.textContent = this.fps;

        // Auto-tune (skip if tab hidden)
        if (!this.hidden && !this.reducedMotion){
          if (this.fps < 30 && this.autoDowngradeCount < 3){
            lowStreak++;
            highStreak = 0;
            if (lowStreak >= 3){
              this.downgrade();
              lowStreak = 0;
            }
          } else if (this.fps > 55){
            lowStreak = 0;
            highStreak++;
            if (highStreak >= 12 && this.autoUpgradeCount < 2){
              this.upgrade();
              highStreak = 0;
            }
          }
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },

  downgrade(){
    const order = ['ultra', 'high', 'medium', 'low'];
    const idx = order.indexOf(this.tier);
    if (idx >= 0 && idx < order.length - 1){
      const next = order[idx + 1];
      console.log('%c⬇ Perf auto-downgrade → ' + next.toUpperCase(), 'color:#ffaa44');
      this.autoDowngradeCount++;
      this.setTier(next, false);
    }
  },

  upgrade(){
    const order = ['low', 'medium', 'high', 'ultra'];
    const idx = order.indexOf(this.tier);
    if (idx >= 0 && idx < order.length - 1){
      const next = order[idx + 1];
      console.log('%c⬆ Perf auto-upgrade → ' + next.toUpperCase(), 'color:#44ffaa');
      this.autoUpgradeCount++;
      this.setTier(next, false);
    }
  },

  /* ============================================================
     BATTERY API
     ============================================================ */
  initBattery(){
    if (!navigator.getBattery && !navigator.battery) return;
    const get = navigator.getBattery ? navigator.getBattery() : Promise.resolve(navigator.battery);

    get.then(bat => {
      const update = () => {
        this.batteryLevel = bat.level;
        this.batteryCharging = bat.charging;
        const el = document.getElementById('qhBattery');
        if (el){
          el.textContent = Math.round(bat.level * 100) + '%' + (bat.charging ? ' ⚡' : '');
        }
        // Auto-drop tier if battery low
        if (!bat.charging && bat.level < 0.2 && this.tier !== 'low'){
          console.log('%c🔋 Low battery — dropping to LOW tier', 'color:#ff6644');
          this.setTier('low', false);
        }
      };
      bat.addEventListener('levelchange', update);
      bat.addEventListener('chargingchange', update);
      update();
    }).catch(() => {});
  },

  /* ============================================================
     HUD (dev tool)
     ============================================================ */
  initHUD(){
    const hud = document.getElementById('qualityHUD');
    if (!hud) return;
    const toggle = document.getElementById('qhToggle');
    toggle.addEventListener('click', () => {
      const open = hud.dataset.open === 'true';
      hud.dataset.open = !open;
    });
    // Long press toggle to hide entirely (5s hold)
    let pressT = null;
    toggle.addEventListener('mousedown', () => { pressT = setTimeout(() => { hud.style.display = 'none'; }, 1500); });
    toggle.addEventListener('mouseup', () => clearTimeout(pressT));
    toggle.addEventListener('touchstart', () => { pressT = setTimeout(() => { hud.style.display = 'none'; }, 1500); });
    toggle.addEventListener('touchend', () => clearTimeout(pressT));

    // Manual tier buttons
    hud.querySelectorAll('[data-set-tier]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.setTier;
        this.autoDowngradeCount = 99;   // block auto for a bit
        this.autoUpgradeCount = 99;
        this.setTier(t, true);
      });
    });

    // Show HUD only if URL has ?dev=1
    if (!location.search.includes('dev=1')){
      hud.style.display = 'none';
    }
  },

  /* ============================================================
     UTILS — for other modules
     ============================================================ */
  scaled(baseCount){
    return Math.max(4, Math.round(baseCount * this.cfg.particles));
  },

  isReduced(){
    return this.reducedMotion;
  },

  shouldAnimate(){
    return !this.hidden;
  }
};

/* Boot on DOMContentLoaded */
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', () => Perf.init());
} else {
  Perf.init();
}

})();
