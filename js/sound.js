/* =========================================================
   SOUND.JS — Procedural underwater sound engine
   Web Audio API only. No external files.
   ========================================================= */
(function(){
'use strict';

window.Sound = {

  ctx: null,
  master: null,
  muted: false,
  started: false,
  depth: 0,
  nodes: {},

  /* ============================================================
     INIT — must be called after first user gesture
     ============================================================ */
  init(){
    if (this.started) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(this.ctx.destination);

    // Underwater lowpass — everything routes through this
    this.underwaterFilter = this.ctx.createBiquadFilter();
    this.underwaterFilter.type = 'lowpass';
    this.underwaterFilter.frequency.value = 20000;  // opens up on surface
    this.underwaterFilter.Q.value = 0.5;
    this.underwaterFilter.connect(this.master);

    // Depth-based muffler
    this.depthFilter = this.ctx.createBiquadFilter();
    this.depthFilter.type = 'lowpass';
    this.depthFilter.frequency.value = 22000;
    this.depthFilter.Q.value = 0.3;
    this.depthFilter.connect(this.underwaterFilter);

    this.buildAmbient();
    this.buildBubbles();
    this.buildWhales();

    this.started = true;
  },

  /* ============================================================
     AMBIENT — noise bed + low hum
     ============================================================ */
  buildAmbient(){
    const ctx = this.ctx;

    /* --- Brown noise --- */
    const bufSize = 4 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufSize; i++){
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    // Filter the noise to sound deep and distant
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 320;
    noiseFilter.Q.value = 0.6;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.22;

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.depthFilter);
    noise.start();

    /* --- Low sub hum (heartbeat of the deep) --- */
    const hum = ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 42;

    const humGain = ctx.createGain();
    humGain.gain.value = 0.06;

    hum.connect(humGain);
    humGain.connect(this.depthFilter);
    hum.start();

    // Slow LFO on hum
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 6;
    lfo.connect(lfoGain);
    lfoGain.connect(hum.frequency);
    lfo.start();

    /* --- High shimmer layer (surface light) --- */
    const shimmer = ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.value = 1200;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.008;
    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.underwaterFilter);
    shimmer.start();

    // Slow fade in the noise bed
    noiseGain.gain.setValueAtTime(0, ctx.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 3);

    this.nodes.ambientNoise = noiseGain;
    this.nodes.hum = humGain;
    this.nodes.shimmer = shimmerGain;
  },

  /* ============================================================
     BUBBLES — random pops/clicks rising from depth
     ============================================================ */
  buildBubbles(){
    const self = this;
    function scheduleBubble(){
      if (!self.started) return;
      const base = self.depth < 100 ? 1.4 : self.depth < 800 ? 2.6 : 4.2;
      const delay = base * 1000 + Math.random() * base * 1000;
      setTimeout(() => {
        self.playBubble();
        scheduleBubble();
      }, delay);
    }
    // start after a warm-up
    setTimeout(scheduleBubble, 2500);
  },

  playBubble(){
    if (!this.started || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const baseFreq = 400 + Math.random() * 900;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.4, now + 0.12);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.11, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(g);
    g.connect(this.depthFilter);
    osc.start(now);
    osc.stop(now + 0.16);
  },

  /* ============================================================
     WHALES — procedural whale song (long formant sweeps)
     ============================================================ */
  buildWhales(){
    const self = this;
    function scheduleWhale(){
      if (!self.started) return;
      const delay = 18000 + Math.random() * 22000;
      setTimeout(() => {
        self.playWhale();
        scheduleWhale();
      }, delay);
    }
    setTimeout(scheduleWhale, 8000);
  },

  playWhale(){
    if (!this.started || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const startFreq = 80 + Math.random() * 120;
    const peakFreq  = startFreq * (1.6 + Math.random() * 0.8);
    const endFreq   = peakFreq * (0.5 + Math.random() * 0.3);
    const duration  = 2.8 + Math.random() * 2.2;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(peakFreq, now + duration * 0.35);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    // Add harmonic
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(startFreq * 2, now);
    osc2.frequency.exponentialRampToValueAtTime(peakFreq * 2, now + duration * 0.35);
    osc2.frequency.exponentialRampToValueAtTime(endFreq * 2, now + duration);

    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 800;
    filt.Q.value = 4;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.05, now + 0.4);
    g.gain.linearRampToValueAtTime(0.04, now + duration * 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const g2 = ctx.createGain();
    g2.gain.value = 0.25;

    osc.connect(filt);
    osc2.connect(g2);
    g2.connect(filt);
    filt.connect(g);
    g.connect(this.depthFilter);

    osc.start(now);  osc.stop(now + duration + 0.5);
    osc2.start(now); osc2.stop(now + duration + 0.5);

    // Optional: also trigger surface shimmer pulse
    const pulse = ctx.createGain();
    pulse.gain.setValueAtTime(0, now);
    pulse.gain.linearRampToValueAtTime(0.3, now + 0.2);
    pulse.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  },

  /* ============================================================
     ONE-SHOT SFX
     ============================================================ */

  /* Splash — filtered white noise burst */
  playSplash(){
    if (!this.started || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.9);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++){
      const t = i / len;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.5);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(1200, now);
    filt.frequency.exponentialRampToValueAtTime(180, now + 0.8);
    filt.Q.value = 1.2;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    src.connect(filt); filt.connect(g); g.connect(this.master);
    src.start(now);
  },

  /* Chest creak + unlock */
  playChestOpen(){
    if (!this.started || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Metallic clink
    const clink = ctx.createOscillator();
    clink.type = 'triangle';
    clink.frequency.setValueAtTime(2400, now);
    clink.frequency.exponentialRampToValueAtTime(900, now + 0.1);
    const clinkG = ctx.createGain();
    clinkG.gain.setValueAtTime(0.14, now);
    clinkG.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    clink.connect(clinkG); clinkG.connect(this.master);
    clink.start(now); clink.stop(now + 0.16);

    // Wood creak — filtered noise with slow env
    const len = Math.floor(ctx.sampleRate * 0.7);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++){
      const t = i / len;
      d[i] = (Math.random() * 2 - 1) * (1 - t) * 0.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(320, now + 0.05);
    filt.frequency.linearRampToValueAtTime(180, now + 0.6);
    filt.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    src.connect(filt); filt.connect(g); g.connect(this.master);
    src.start(now + 0.05);
  },

  /* Bell/glow chime — for hover on jellyfish */
  playChime(freq = 880){
    if (!this.started || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;

    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = freq * 2.01;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.07, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    const g2 = ctx.createGain();
    g2.gain.value = 0.3;

    o.connect(g);
    o2.connect(g2); g2.connect(g);
    g.connect(this.master);

    o.start(now); o.stop(now + 0.95);
    o2.start(now); o2.stop(now + 0.95);
  },

  /* Deep sonar ping — when entering new depth zone */
  playSonar(){
    if (!this.started || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(1100, now);
    o.frequency.exponentialRampToValueAtTime(420, now + 0.9);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.08, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    o.connect(g);
    g.connect(this.depthFilter);
    o.start(now); o.stop(now + 1.2);
  },

  /* Whoosh — when bottle launches to surface */
  playWhoosh(){
    if (!this.started || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(80, now);
    o.frequency.exponentialRampToValueAtTime(320, now + 0.6);
    o.frequency.exponentialRampToValueAtTime(60, now + 1.8);

    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(200, now);
    filt.frequency.linearRampToValueAtTime(1200, now + 0.8);
    filt.frequency.exponentialRampToValueAtTime(180, now + 1.9);
    filt.Q.value = 2;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.14, now + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    o.connect(filt); filt.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + 2.1);
  },

  /* Small UI click — for buttons */
  playClick(){
    if (!this.started || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(1400, now);
    o.frequency.exponentialRampToValueAtTime(700, now + 0.06);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.07, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + 0.08);
  },

  /* ============================================================
     DEPTH UPDATE — filter + gain change
     ============================================================ */
  setDepth(depth){
    this.depth = depth;
    if (!this.started) return;

    // Lowpass cutoff drops as we go deeper (muffled)
    const t = Math.min(1, depth / 2000);
    const cutoff = 22000 - t * 18000;      // 22k → 4k
    this.depthFilter.frequency.value = cutoff;

    // Noise gain slightly louder deeper (pressure)
    if (this.nodes.ambientNoise){
      const target = 0.22 + t * 0.08;
      this.nodes.ambientNoise.gain.value = target;
    }
    if (this.nodes.hum){
      const hTarget = 0.06 + t * 0.07;
      this.nodes.hum.gain.value = hTarget;
    }
    if (this.nodes.shimmer){
      // Shimmer fades in deep water
      this.nodes.shimmer.gain.value = 0.008 + t * 0.006;
    }
  },

  /* ============================================================
     MUTE / UNMUTE
     ============================================================ */
  setMuted(m){
    this.muted = m;
    if (!this.started) return;
    const target = m ? 0 : 0.7;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(target, now + 0.3);
  },

  toggle(){
    this.setMuted(!this.muted);
    return this.muted;
  },

  /* Resume on user gesture (mobile Safari) */
  resume(){
    if (this.ctx && this.ctx.state === 'suspended'){
      this.ctx.resume();
    }
  }
};

})();
