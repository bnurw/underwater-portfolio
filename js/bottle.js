/* =========================================================
   BOTTLE.JS — Real glass bottle, floating in trench
   Click → write message → submit → bottle floats up + splash
   ========================================================= */
(function(){
'use strict';

window.Bottle = {
  create(scene, camera){
    /* ============================================================
       BOTTLE GEOMETRY — Real glass shape via LatheGeometry
       ============================================================ */
    const profile = [
      // bottom point
      new THREE.Vector2(0.00, 0.00),
      new THREE.Vector2(0.30, 0.05),
      new THREE.Vector2(0.55, 0.20),
      new THREE.Vector2(0.68, 0.55),
      new THREE.Vector2(0.72, 1.00),
      new THREE.Vector2(0.72, 1.70),
      new THREE.Vector2(0.70, 2.00),
      new THREE.Vector2(0.58, 2.20),
      new THREE.Vector2(0.42, 2.34),
      new THREE.Vector2(0.34, 2.55),
      new THREE.Vector2(0.32, 2.90),
      new THREE.Vector2(0.33, 3.10),  // lip curve out
      new THREE.Vector2(0.36, 3.18),  // lip
      new THREE.Vector2(0.33, 3.22)
    ];

    const bottleGeo = new THREE.LatheGeometry(profile, 40);
    bottleGeo.computeVertexNormals();

    // Thickness illusion — inner wall offset slightly
    const innerGeo = new THREE.LatheGeometry(
      profile.map(p => new THREE.Vector2(Math.max(0.001, p.x - 0.035), p.y + 0.02)),
      40
    );

    /* ---------- GLASS MATERIAL ---------- */
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xd8f8f0,
      emissive: 0x0a1a1a,
      emissiveIntensity: 0.15,
      roughness: 0.06,
      metalness: 0.0,
      transmission: 0.92,
      thickness: 0.9,
      ior: 1.45,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide,
      envMapIntensity: 1.0,
      attenuationColor: new THREE.Color(0x6ec9b8),
      attenuationDistance: 2.4
    });

    const glass = new THREE.Mesh(bottleGeo, glassMat);

    const innerGlass = new THREE.Mesh(innerGeo, new THREE.MeshPhysicalMaterial({
      color: 0xa8e8dc,
      roughness: 0.1,
      metalness: 0,
      transmission: 0.85,
      thickness: 0.3,
      transparent: true,
      opacity: 0.5,
      side: THREE.BackSide
    }));

    /* ---------- RIM RING (thick glass at neck) ---------- */
    const rimGeo = new THREE.TorusGeometry(0.35, 0.06, 12, 32);
    rimGeo.rotateX(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, glassMat);
    rim.position.y = 3.18;

    /* ---------- CORK ---------- */
    const corkMat = new THREE.MeshStandardMaterial({
      color: 0x8a6a3a,
      roughness: 0.95,
      metalness: 0.05,
      map: makeCorkTex()
    });
    const corkGeo = new THREE.CylinderGeometry(0.30, 0.27, 0.42, 14);
    const cork = new THREE.Mesh(corkGeo, corkMat);
    cork.position.y = 3.30;

    /* ---------- PAPER SCROLL inside ---------- */
    const paperGroup = new THREE.Group();
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xe8d8b0,
      roughness: 0.9,
      metalness: 0,
      emissive: 0x201810,
      emissiveIntensity: 0.4,
      side: THREE.DoubleSide
    });
    const paperRoll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 1.4, 10),
      paperMat
    );
    paperRoll.position.y = 1.2;
    paperGroup.add(paperRoll);

    // Ribbon tie
    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0x6a2030, roughness: 0.8 });
    const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.025, 8, 20), ribbonMat);
    ribbon.rotation.x = Math.PI / 2;
    ribbon.position.y = 1.2;
    paperGroup.add(ribbon);

    /* ---------- SEAWEED / BARNACLE growth on outside ---------- */
    const growthMat = new THREE.MeshStandardMaterial({
      color: 0x2a4a2a,
      roughness: 1.0,
      metalness: 0,
      transparent: true,
      opacity: 0.85
    });
    for (let i = 0; i < 10; i++){
      const g = new THREE.SphereGeometry(0.06 + Math.random() * 0.08, 5, 4);
      const m = new THREE.Mesh(g, growthMat);
      const ang = Math.random() * Math.PI * 2;
      const y = 0.3 + Math.random() * 1.5;
      m.position.set(Math.cos(ang) * 0.7, y, Math.sin(ang) * 0.7);
      m.scale.y = 0.5;
      m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      glass.add(m);
    }

    /* ---------- ASSEMBLE ---------- */
    const bottleGroup = new THREE.Group();
    bottleGroup.add(glass);
    bottleGroup.add(innerGlass);
    bottleGroup.add(rim);
    bottleGroup.add(cork);
    bottleGroup.add(paperGroup);

    // Slight random tilt (drifting in current)
    bottleGroup.rotation.z = 0.35;
    bottleGroup.scale.setScalar(0.9);

    /* ---------- INNER GLOW (subsurface) ---------- */
    const innerGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTex(),
      color: 0x9effe0,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    innerGlow.scale.set(2.4, 2.4, 1);
    innerGlow.position.y = 1.5;
    bottleGroup.add(innerGlow);

    /* ---------- INVISIBLE HIT TARGET ---------- */
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(2.0, 10, 10),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hit.position.y = 1.5;
    bottleGroup.add(hit);

    /* ---------- POSITION in trench ---------- */
    const HOME = new THREE.Vector3(0, -1960, -42);
    bottleGroup.position.copy(HOME);
    scene.add(bottleGroup);

    /* ---------- LIGHT at bottle ---------- */
    const bottleLight = new THREE.PointLight(0x8effd8, 0.8, 14, 2);
    bottleLight.position.copy(HOME).add(new THREE.Vector3(0, 1.5, 0));
    scene.add(bottleLight);

    /* ============================================================
       INTERACTION
       ============================================================ */
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const modal = document.getElementById('bottleModal');
    const bottleHint = document.getElementById('bottleHint');

    let mouseX = 0, mouseY = 0;
    let mouseDown = null;
    let hovering = false;
    let hoverT = 0;

    window.addEventListener('mousemove', (e) => {
      ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
      ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    window.addEventListener('mousedown', (e) => {
      mouseDown = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('click', (e) => {
      if (mouseDown){
        const dx = e.clientX - mouseDown.x;
        const dy = e.clientY - mouseDown.y;
        if (Math.hypot(dx, dy) > 6) return;
      }
      if (e.target.closest('#bottleModal') || e.target.closest('.bottle-hint')) return;

      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObject(hit, false);
      if (hits.length && state.visible){
        openModal();
      }
    });

    function openModal(){
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }
    function closeModal(){
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
    modal.querySelector('.bm-close').addEventListener('click', closeModal);
    modal.querySelector('.bm-backdrop').addEventListener('click', closeModal);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    /* ============================================================
       FORM HANDLING
       ============================================================ */
    const form = document.getElementById('bottleForm');
    const status = document.getElementById('bottleStatus');
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    ['bName','bEmail','bSubject','bMessage'].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener('input', () => {
        el.parentElement.classList.remove('error');
        el.parentElement.querySelector('.bm-err').textContent = '';
      });
    });

    function setErr(el, msg){
      el.parentElement.classList.add('error');
      el.parentElement.querySelector('.bm-err').textContent = msg;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('bName');
      const email = document.getElementById('bEmail');
      const subject = document.getElementById('bSubject');
      const message = document.getElementById('bMessage');
      let ok = true;

      if (!name.value.trim()){ setErr(name, 'Need your name'); ok = false; }
      if (!email.value.trim()){ setErr(email, 'Need your email'); ok = false; }
      else if (!emailRe.test(email.value.trim())){ setErr(email, 'Invalid email'); ok = false; }
      if (!subject.value.trim()){ setErr(subject, 'Need a subject'); ok = false; }
      if (!message.value.trim() || message.value.trim().length < 5){ setErr(message, 'Say a bit more'); ok = false; }

      if (!ok){ status.textContent = 'Please fix the fields above.'; status.className = 'bm-status error'; return; }

      // Simulate "sealing & sending"
      const btn = form.querySelector('.bm-submit');
      btn.disabled = true;
      status.textContent = 'Sealing the bottle...'; status.className = 'bm-status';

      setTimeout(() => {
        status.textContent = 'Releasing into the current...'; 
        closeModal();
        launchBottle();
      }, 700);

      // After the animation completes, show success card
      setTimeout(() => {
        showSuccess(name.value.trim());
        btn.disabled = false;
        form.reset();
      }, 4200);

      // Mailto fallback (opens email client) — optional, uncomment if you want
      // const mailto = `mailto:third0partyapp@gmail.com?subject=${encodeURIComponent(subject.value)}&body=${encodeURIComponent(message.value + '\n\n— ' + name.value + ' <' + email.value + '>')}`;
      // window.open(mailto, '_blank');
    });

    /* ============================================================
       LAUNCH ANIMATION — bottle floats up to the surface
       ============================================================ */
    let launchProgress = 0;
    let launchTarget = 0;
    let splashDone = false;

    const surfaceFlash = document.getElementById('surfaceFlash');
    const splashOverlay = document.getElementById('splashOverlay');

    function launchBottle(){
      launchTarget = 1;
      splashDone = false;
      if (window.SoundEvents) window.SoundEvents.whoosh();
    }

    function showSuccess(name){
      // Build success card
      const el = document.createElement('div');
      el.className = 'bottle-success';
      el.innerHTML = `
        <div class="bs-card">
          <div class="bs-icon">🍾</div>
          <h3 class="bs-title">Your message is on its way, ${name || 'friend'}!</h3>
          <p class="bs-msg">The bottle broke the surface — Nur will receive it soon at<br><strong>third0partyapp@gmail.com</strong></p>
          <button class="bs-close">Close</button>
        </div>
      `;
      document.body.appendChild(el);
      requestAnimationFrame(() => el.classList.add('show'));

      const close = () => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 500);
        // reset bottle
        launchProgress = 0;
        launchTarget = 0;
        bottleGroup.position.copy(HOME);
        state.visible = true;
      };
      el.querySelector('.bs-close').addEventListener('click', close);
    }

    /* ============================================================
       UPDATE LOOP
       ============================================================ */
    const state = { visible: true };
    const tmp = new THREE.Vector3();

    return {
      group: bottleGroup,
      state,

      update(dt, t, depth){
        // Visibility — only in trench zone (below 1700m)
        const vis = Math.max(0, Math.min(1, (depth - 1700) / 250));
        state.visible = vis > 0.05;

        if (!state.visible){
          bottleGroup.visible = false;
          bottleLight.intensity = 0;
          if (bottleHint) bottleHint.classList.remove('show');
          return;
        }
        bottleGroup.visible = true;

        // Idle floating
        const bob = Math.sin(t * 0.9) * 0.35;
        const sway = Math.sin(t * 0.5 + 1) * 0.5;
        const rotY = Math.sin(t * 0.4) * 0.3;

        // Base position + idle
        tmp.copy(HOME);
        tmp.y += bob;
        tmp.x += sway;

        // Launch progress
        launchProgress += (launchTarget - launchProgress) * Math.min(1, dt * 0.35);

        if (launchProgress > 0.02){
          // Rise dramatically toward surface (y=0)
          const riseT = easeInOutCubic(launchProgress);
          const targetY = 15;                          // above water surface
          tmp.y = tmp.y * (1 - riseT) + targetY * riseT;
          tmp.x = tmp.x * (1 - riseT) + 0 * riseT;
          tmp.z = tmp.z * (1 - riseT) + 20 * riseT;

          // Spin as it rises
          bottleGroup.rotation.y = rotY + riseT * Math.PI * 6;
          bottleGroup.rotation.z = 0.35 * (1 - riseT);

          // Splash moment: when bottle crosses y=0
          if (!splashDone && tmp.y > -20){
            splashDone = true;
            triggerSplash();
          }
        } else {
          bottleGroup.rotation.y = rotY;
          bottleGroup.rotation.z = 0.35;
        }

        bottleGroup.position.copy(tmp);

        // Hover reaction
        raycaster.setFromCamera(ndc, camera);
        const isHover = raycaster.intersectObject(hit, false).length > 0;
        if (isHover !== hovering){
          hovering = isHover;
          if (bottleHint) bottleHint.classList.toggle('show', hovering);
          document.body.style.cursor = hovering ? 'pointer' : '';
        }
        const targetH = hovering ? 1 : 0;
        hoverT += (targetH - hoverT) * Math.min(1, dt * 6);

        // Scale on hover
        const baseScale = 0.9 + hoverT * 0.12;
        bottleGroup.scale.setScalar(baseScale);

        // Glow pulse
        const pulse = 0.45 + Math.sin(t * 2.2) * 0.2;
        innerGlow.material.opacity = pulse * (0.6 + hoverT * 0.4);
        innerGlow.scale.setScalar(2.2 + hoverT * 0.6 + pulse * 0.4);
        bottleLight.intensity = (0.6 + hoverT * 0.6) * (0.9 + pulse * 0.4);

        // Rim shine
        rim.material.emissiveIntensity = 0.15 + hoverT * 0.4;
      }
    };

    /* ---------- SPLASH ---------- */
    function triggerSplash(){
      if (window.SoundEvents) window.SoundEvents.splash();
      if (surfaceFlash){
        surfaceFlash.classList.add('show');
        setTimeout(() => {
          surfaceFlash.classList.remove('show');
          surfaceFlash.classList.add('gone');
          setTimeout(() => {
            surfaceFlash.classList.remove('gone');
          }, 1400);
        }, 700);
      }
      // Small camera shake could go here (handled in main)
    }
  }
};

/* ---------- Easing ---------- */
function easeInOutCubic(t){
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ---------- Cork texture ---------- */
function makeCorkTex(){
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8a6a3a';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 400; i++){
    const x = Math.random() * s;
    const y = Math.random() * s;
    const r = 1 + Math.random() * 3;
    const l = 0.2 + Math.random() * 0.3;
    ctx.fillStyle = `rgba(${60 + Math.random()*40}, ${40 + Math.random()*30}, ${20 + Math.random()*20}, ${l})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ---------- Glow texture ---------- */
function makeGlowTex(){
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(180,255,225,0.5)');
  g.addColorStop(1, 'rgba(120,255,200,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  return t;
}

})();
