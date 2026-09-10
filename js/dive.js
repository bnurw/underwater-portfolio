/* =========================================================
   DIVE.JS — Scroll-driven descent + depth meter + bubbles
   ========================================================= */
(function(){
'use strict';

window.Dive = {
  init(camera, sky, ocean){
    this.camera      = camera;
    this.sky         = sky;
    this.ocean       = ocean;
    this.surfaceY    = 12;
    this.deepY       = -2088;      // depth 2000 → camera y
    this.maxDepth    = 2000;
    this.progress    = 0;
    this.depth       = 0;
    this.waterCrossed = false;
    this.zoneEls     = document.querySelectorAll('.zone');
    this.dmFill      = document.querySelector('.dm-fill');
    this.dmValue     = document.getElementById('depthValue');
    this.dmLabels    = document.querySelectorAll('.dm-label');
    this.tint        = document.getElementById('underwaterTint');
    this.hint        = document.getElementById('scrollHint');
    this.mouseOffset = { x: 0, y: 0 };

    this.buildBubbles();
    this.bindScroll();
  },

  /* ---------- BUBBLE PARTICLE SYSTEM ---------- */
  buildBubbles(){
    const COUNT = 120;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const sizes     = new Float32Array(COUNT);
    const alphas    = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++){
      positions[i*3]     = 0;
      positions[i*3 + 1] = -9999;
      positions[i*3 + 2] = 0;
      sizes[i]  = 0;
      alphas[i] = 0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('alpha',    new THREE.BufferAttribute(alphas, 1));

    const tex = this.makeBubbleTex();
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: tex },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        varying float vAlpha;
        uniform float uPixelRatio;
        void main(){
          vAlpha = alpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (300.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        varying float vAlpha;
        void main(){
          vec4 tex = texture2D(uTex, gl_PointCoord);
          gl_FragColor = vec4(tex.rgb, tex.a * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.bubblePoints = new THREE.Points(geo, mat);
    this.bubblePoints.frustumCulled = false;

    this.bubbleData = [];
    for (let i = 0; i < COUNT; i++){
      this.bubbleData.push({
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 1,
        active: false
      });
    }
  },

  makeBubbleTex(){
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0,    'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(220,245,255,0.75)');
    g.addColorStop(0.75, 'rgba(180,230,255,0.25)');
    g.addColorStop(1,    'rgba(180,230,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  },

  spawnBurst(origin, count, power){
    const data = this.bubbleData;
    const pos  = this.bubblePoints.geometry.attributes.position.array;
    const size = this.bubblePoints.geometry.attributes.size.array;
    const alp  = this.bubblePoints.geometry.attributes.alpha.array;
    let spawned = 0;

    for (let i = 0; i < data.length && spawned < count; i++){
      if (data[i].active) continue;

      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 8;

      pos[i*3]     = origin.x + Math.cos(angle) * radius;
      pos[i*3 + 1] = origin.y + (Math.random() - 0.5) * 4;
      pos[i*3 + 2] = origin.z + Math.sin(angle) * radius;

      data[i].vx = (Math.random() - 0.5) * 0.15;
      data[i].vy = 0.4 + Math.random() * 0.6 * power;
      data[i].vz = (Math.random() - 0.5) * 0.15;
      data[i].maxLife = 2.5 + Math.random() * 2.5;
      data[i].life = 0;
      data[i].active = true;

      size[i] = 4 + Math.random() * 10;
      alp[i]  = 0;

      spawned++;
    }

    this.bubblePoints.geometry.attributes.position.needsUpdate = true;
    this.bubblePoints.geometry.attributes.size.needsUpdate     = true;
    this.bubblePoints.geometry.attributes.alpha.needsUpdate    = true;
  },

  updateBubbles(dt){
    const data = this.bubbleData;
    const pos  = this.bubblePoints.geometry.attributes.position.array;
    const alp  = this.bubblePoints.geometry.attributes.alpha.array;
    let dirty  = false;

    for (let i = 0; i < data.length; i++){
      if (!data[i].active) continue;
      const d = data[i];
      d.life += dt;
      if (d.life >= d.maxLife){
        d.active = false;
        alp[i] = 0;
        pos[i*3 + 1] = -9999;
        dirty = true;
        continue;
      }
      // Physics — bubbles rise + wobble
      d.vy += 0.35 * dt;                     // buoyancy
      d.vx += Math.sin(d.life * 4 + i) * 0.02 * dt;
      pos[i*3]     += d.vx;
      pos[i*3 + 1] += d.vy;
      pos[i*3 + 2] += d.vz;

      const t = d.life / d.maxLife;
      alp[i] = Math.sin(t * Math.PI) * 0.9;
      dirty = true;
    }

    if (dirty){
      this.bubblePoints.geometry.attributes.position.needsUpdate = true;
      this.bubblePoints.geometry.attributes.alpha.needsUpdate    = true;
    }
  },

  /* ---------- SCROLL ---------- */
  bindScroll(){
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking){
        ticking = true;
        requestAnimationFrame(() => { this.onScroll(); ticking = false; });
      }
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      this.mouseOffset.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      this.mouseOffset.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  },

  onScroll(){
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const p = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    this.progress = p;
    this.depth = p * this.maxDepth;

    // Depth meter
    if (this.dmFill) this.dmFill.style.height = (p * 100) + '%';
    if (this.dmValue) this.dmValue.textContent = Math.round(this.depth);

    // Active label
    this.dmLabels.forEach(l => {
      const d = +l.dataset.depth;
      const next = +l.nextElementSibling?.dataset?.depth || 99999;
      l.classList.toggle('active', this.depth >= d - 60 && this.depth < next);
    });

    // Hide hint on first scroll
    if (p > 0.02 && this.hint) this.hint.classList.add('hide');

    // Zone active class
    this.zoneEls.forEach(z => {
      const zd = +z.dataset.depth;
      const inView = Math.abs(this.depth - zd) < 260;
      z.classList.toggle('active', inView);
    });

    // Underwater tint
    if (this.tint){
      const t = Math.min(1, Math.max(0, (this.depth - 40) / 400));
      this.tint.style.opacity = t.toFixed(3);
    }
  },

  /* ---------- FRAME UPDATE ---------- */
  update(dt, t){
    const p = this.progress;
    const cam = this.camera;

    // Base camera position (driven by scroll)
    const baseY = this.surfaceY + (this.deepY - this.surfaceY) * p;
    const baseZ = 30 - p * 10;

    // Mouse look-around (subtle)
    const mx = this.mouseOffset.x * 6;
    const my = this.mouseOffset.y * 3;

    cam.position.x = mx;
    cam.position.y = baseY - my + Math.sin(t * 0.6) * 0.6;
    cam.position.z = baseZ;

    cam.lookAt(
      mx * 0.4,
      baseY - 6 - p * 20,
      baseZ - 100
    );

    // Waterline crossing → bubble burst
    if (!this.waterCrossed && cam.position.y < 0){
      this.waterCrossed = true;
      this.spawnBurst(cam.position, 60, 1.4);
    }

    // Ambient bubbles in deep water
    if (this.waterCrossed && Math.random() < 0.15){
      const spread = 40;
      const origin = new THREE.Vector3(
        cam.position.x + (Math.random() - 0.5) * spread,
        cam.position.y - 20 - Math.random() * 30,
        cam.position.z - 20 - Math.random() * 40
      );
      this.spawnBurst(origin, 3, 0.6);
    }

    this.updateBubbles(dt);
  }
};

})();
