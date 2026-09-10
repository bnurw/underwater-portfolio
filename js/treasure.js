/* =========================================================
   TREASURE.JS — 4 realistic chests, each holds a project
   Click → chest opens → project modal appears
   ========================================================= */
(function(){
'use strict';

window.Treasure = {
  create(scene, camera){
    /* ---------- PROJECT DATA ---------- */
    const PROJECTS = [
      {
        title: 'Real Upoto',
        desc: 'A real-world web application project exploring practical UI & functionality with clean architecture. Live web app used to test and showcase full stack skills.',
        tags: ['HTML', 'CSS', 'JavaScript', 'Web App'],
        demo: 'https://realupoto.app.web',
        github: '#',
        year: '2024',
        type: 'Web App',
        pos: [-32, -1085, -30]
      },
      {
        title: 'Deep Portfolio',
        desc: 'An immersive underwater 3D portfolio built with Three.js. Every scroll reveals a new depth zone — shipwrecks, jellyfish, bioluminescence, and treasure.',
        tags: ['Three.js', 'WebGL', 'GSAP', 'Animation'],
        demo: '#',
        github: '#',
        year: '2025',
        type: '3D Interactive',
        pos: [-6, -1085, -50]
      },
      {
        title: 'Landing Kit',
        desc: 'A reusable component library of landing page sections — hero, pricing, testimonials, CTA — all responsive with dark/light theme support.',
        tags: ['HTML', 'CSS', 'UI Kit'],
        demo: '#',
        github: '#',
        year: '2024',
        type: 'UI Library',
        pos: [18, -1085, -62]
      },
      {
        title: 'Mini Dashboard',
        desc: 'A clean admin dashboard with modular widgets, chart placeholders, and a responsive grid layout. Backend-ready frontend template.',
        tags: ['Frontend', 'Grid', 'Dashboard'],
        demo: '#',
        github: '#',
        year: '2024',
        type: 'Dashboard',
        pos: [34, -1085, -80]
      }
    ];

    /* ---------- TEXTURES ---------- */
    const woodTex = Tex.wood(512);
    woodTex.repeat.set(1.2, 1.2);
    const woodRough = Tex.rough(woodTex, 0.5);
    const chestWoodMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughnessMap: woodRough,
      color: 0x6a4a28,
      roughness: 0.9,
      metalness: 0.05
    });

    const rustTex = Tex.rust(256);
    const metalBandMat = new THREE.MeshStandardMaterial({
      map: rustTex,
      color: 0x8a6840,
      roughness: 0.55,
      metalness: 0.8
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4a72a,
      roughness: 0.28,
      metalness: 1.0,
      emissive: 0x3a2405,
      emissiveIntensity: 0.5
    });

    const jewelColors = [0xd83a5a, 0x2a8ed8, 0x2ad88e, 0xb83ad8];

    const barnacleMat = new THREE.MeshStandardMaterial({
      map: Tex.barnacle(64),
      color: 0xb8b2a0,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });

    /* ---------- BUILD 4 CHESTS ---------- */
    const group = new THREE.Group();
    const chests = [];

    PROJECTS.forEach((proj, idx) => {
      const chest = buildChest({
        woodMat: chestWoodMat,
        bandMat: metalBandMat,
        goldMat,
        jewelColors,
        barnacleMat,
        project: proj
      });
      chest.group.position.set(proj.pos[0], proj.pos[1], proj.pos[2]);
      chest.group.rotation.y = (Math.random() - 0.5) * 0.8 + (idx - 1.5) * 0.15;
      chest.group.rotation.z = (Math.random() - 0.5) * 0.08;
      chest.group.userData = {
        project: proj,
        openT: 0,
        opening: false,
        closed: true,
        floatPhase: Math.random() * Math.PI * 2
      };
      group.add(chest.group);
      chests.push({ ...chest, data: chest.group.userData, project: proj });

      // warm glow light inside chest when open
      const glowLight = new THREE.PointLight(0xffc060, 0, 8, 2);
      glowLight.position.set(proj.pos[0], proj.pos[1] + 0.6, proj.pos[2]);
      scene.add(glowLight);
      chests[chests.length - 1].glowLight = glowLight;
    });

    scene.add(group);

    /* ---------- RAYCAST + MODAL ---------- */
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let mouseDownPos = null;

    window.addEventListener('mousemove', (e) => {
      ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
      ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    window.addEventListener('mousedown', (e) => {
      mouseDownPos = { x: e.clientX, y: e.clientY };
    });

    const modal = document.getElementById('projectModal');
    const modalClose = modal.querySelector('.pm-close');
    const modalBackdrop = modal.querySelector('.pm-backdrop');

    function openModal(proj){
      modal.querySelector('.pm-title').textContent = proj.title;
      modal.querySelector('.pm-desc').textContent = proj.desc;
      modal.querySelector('.pm-year').textContent = proj.year;
      modal.querySelector('.pm-type').textContent = proj.type;
      const tagBox = modal.querySelector('.pm-tags');
      tagBox.innerHTML = '';
      proj.tags.forEach(t => {
        const s = document.createElement('span');
        s.textContent = t;
        tagBox.appendChild(s);
      });
      modal.querySelector('.pm-demo').href = proj.demo;
      modal.querySelector('.pm-github').href = proj.github;

      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal(){
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }

    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    window.addEventListener('click', (e) => {
      // Only if not a drag
      if (mouseDownPos){
        const dx = e.clientX - mouseDownPos.x;
        const dy = e.clientY - mouseDownPos.y;
        if (Math.hypot(dx, dy) > 6) return;
      }
      // Only if click not on modal/hint
      if (e.target.closest('#projectModal') || e.target.closest('.chest-hint')) return;

      raycaster.setFromCamera(ndc, camera);
      const targets = chests.map(c => c.hit);
      const hits = raycaster.intersectObjects(targets, false);

      if (hits.length){
        const obj = hits[0].object;
        const c = chests.find(x => x.hit === obj);
        if (!c) return;

        // Open the chest
        c.data.opening = true;
        if (window.SoundEvents) window.SoundEvents.chestOpen();
        c.data.closed = false;
        // Play "opening" state — animation in update()

        // Wait a moment, then show modal
        setTimeout(() => openModal(c.project), 700);
      }
    });

    /* ---------- CHEST HINT visibility ---------- */
    const chestHint = document.getElementById('chestHint');
    let hoverChest = null;

    /* ---------- API ---------- */
    return {
      group,
      chests,

      update(dt, t, depth){
        // Visible around 950m - 1400m
        const vis = Math.max(0, Math.min(1,
          Math.min((depth - 900) / 150, (1450 - depth) / 200)
        ));
        group.visible = vis > 0.01;

        // Chest hint — check hover
        if (group.visible){
          raycaster.setFromCamera(ndc, camera);
          const targets = chests.map(c => c.hit);
          const hits = raycaster.intersectObjects(targets, false);
          const newHover = hits.length ? chests.find(x => x.hit === hits[0].object) : null;
          if (newHover && newHover !== hoverChest && window.SoundEvents) window.SoundEvents.chime(1200);
          hoverChest = newHover;
          if (chestHint){
            chestHint.classList.toggle('show', !!hoverChest);
          }
        } else if (chestHint){
          chestHint.classList.remove('show');
        }

        chests.forEach((c, i) => {
          const d = c.data;

          // Gentle floating bob
          const bob = Math.sin(t * 0.5 + d.floatPhase) * 0.15;
          c.group.position.y = c.project.pos[1] + bob;

          // Slight rotation drift
          c.group.rotation.z = (i % 2 === 0 ? 1 : -1) * Math.sin(t * 0.3 + d.floatPhase) * 0.02;

          // Lid opening animation
          const targetOpen = d.opening ? 1 : 0;
          d.openT += (targetOpen - d.openT) * Math.min(1, dt * 3.5);
          c.lid.rotation.x = -d.openT * 1.15;

          // Gold + jewel visibility (only visible when open)
          const goldVis = d.openT;
          c.goldGroup.children.forEach(g => {
            g.material.opacity = goldVis;
            g.material.transparent = goldVis < 1;
            g.material.needsUpdate = true;
          });
          c.goldGroup.visible = goldVis > 0.05;

          // Glow light
          if (c.glowLight){
            c.glowLight.intensity = d.openT * 1.4 * (0.8 + Math.sin(t * 3 + i) * 0.2);
          }

          // Hover lift
          const isHover = hoverChest === c;
          const targetLift = isHover ? 0.3 : 0;
          c.group.position.y += targetLift * 0.5;

          // Emissive rim on band when hover
          c.bandMats.forEach(m => {
            m.emissive = m.emissive || new THREE.Color();
            m.emissive.setHex(isHover ? 0x8a5030 : 0x000000);
            m.emissiveIntensity = isHover ? 0.5 : 0;
          });
        });
      }
    };
  }
};

/* =========================================================
   BUILD A SINGLE REALISTIC CHEST
   ========================================================= */
function buildChest({ woodMat, bandMat, goldMat, jewelColors, barnacleMat, project }){
  const g = new THREE.Group();

  const W = 1.6, H = 0.9, D = 1.1;

  /* ---- BASE BOX ---- */
  const baseGeo = new THREE.BoxGeometry(W, H, D);
  // Slight dent
  const bp = baseGeo.attributes.position;
  for (let i = 0; i < bp.count; i++){
    bp.setX(i, bp.getX(i) + (Math.random() - 0.5) * 0.02);
    bp.setY(i, bp.getY(i) + (Math.random() - 0.5) * 0.02);
    bp.setZ(i, bp.getZ(i) + (Math.random() - 0.5) * 0.02);
  }
  baseGeo.computeVertexNormals();
  const base = new THREE.Mesh(baseGeo, woodMat);
  base.position.y = H / 2;
  g.add(base);

  /* ---- LID (curved top) ---- */
  const lidGeo = new THREE.CylinderGeometry(D / 2, D / 2, W, 16, 1, false, 0, Math.PI);
  lidGeo.rotateZ(Math.PI / 2);
  // Reduce depth to make it half-round
  lidGeo.scale(1, 1, 1);
  const lid = new THREE.Mesh(lidGeo, woodMat);
  lid.position.y = H;
  lid.rotation.x = 0;
  // Pivot: we need it to rotate on its back edge
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, H, -D / 2);
  lid.position.set(0, 0, D / 2);
  lidPivot.add(lid);
  g.add(lidPivot);

  // back lid edge is at z = -D/2 (relative to group)
  // The actual lid mesh needs its own inner position so pivot lines up

  /* ---- METAL BANDS (3 vertical straps + lid strap) ---- */
  const bandMats = [];
  const bandZ = [-D/2 + 0.08, 0, D/2 - 0.08];
  bandZ.forEach(z => {
    // body band
    const bandGeo = new THREE.BoxGeometry(W + 0.02, H + 0.02, 0.09);
    const bm = bandMat.clone();
    bandMats.push(bm);
    const band = new THREE.Mesh(bandGeo, bm);
    band.position.set(0, H / 2, z);
    g.add(band);
    // lid band
    const lidBandGeo = new THREE.CylinderGeometry(D / 2 + 0.02, D / 2 + 0.02, 0.09, 16, 1, false, 0, Math.PI);
    lidBandGeo.rotateZ(Math.PI / 2);
    const lbm = bandMat.clone();
    bandMats.push(lbm);
    const lidBand = new THREE.Mesh(lidBandGeo, lbm);
    lidBand.position.set(0, 0, D / 2);
    lidPivot.add(lidBand);
    // reposition lidBand to match lid
    lidBand.position.set(0, 0, D / 2);
    lidBand.userData = { offset: z };
  });

  /* ---- RUSTED LOCK (front center) ---- */
  const lockBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.38, 0.12),
    bandMat
  );
  lockBase.position.set(0, H - 0.08, D / 2 + 0.02);
  g.add(lockBase);

  const lockRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.035, 6, 14, Math.PI),
    bandMat
  );
  lockRing.position.set(0, H + 0.06, D / 2 + 0.02);
  lockRing.rotation.z = Math.PI;
  g.add(lockRing);

  const keyhole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.14, 8),
    new THREE.MeshStandardMaterial({ color: 0x0a0805, roughness: 1 })
  );
  keyhole.rotation.x = Math.PI / 2;
  keyhole.position.set(0, H - 0.08, D / 2 + 0.09);
  g.add(keyhole);

  /* ---- GOLD COINS + JEWELS (hidden until opened) ---- */
  const goldGroup = new THREE.Group();
  goldGroup.visible = false;

  // Coins — many small discs
  const COIN_COUNT = 55;
  const coinGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.02, 12);
  for (let i = 0; i < COIN_COUNT; i++){
    const c = new THREE.Mesh(coinGeo, goldMat);
    const rx = (Math.random() - 0.5) * (W - 0.3);
    const rz = (Math.random() - 0.5) * (D - 0.3);
    const ry = 0.15 + Math.random() * 0.5;
    c.position.set(rx, H * 0.5 + ry, rz);
    c.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    c.userData.spin = (Math.random() - 0.5) * 1.5;
    goldGroup.add(c);
  }

  // Jewels
  for (let i = 0; i < 6; i++){
    const col = jewelColors[Math.floor(Math.random() * jewelColors.length)];
    const jewelMat = new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.08,
      metalness: 0.1,
      emissive: col,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 1
    });
    const jgeo = new THREE.OctahedronGeometry(0.11 + Math.random() * 0.06, 0);
    const jewel = new THREE.Mesh(jgeo, jewelMat);
    jewel.position.set(
      (Math.random() - 0.5) * (W - 0.4),
      H * 0.55 + Math.random() * 0.35,
      (Math.random() - 0.5) * (D - 0.4)
    );
    jewel.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    goldGroup.add(jewel);
  }

  // Glow sprite inside
  const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTex(),
    color: 0xffc060,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));
  glowSprite.scale.set(2.4, 2.4, 1);
  glowSprite.position.y = H * 0.6;
  goldGroup.add(glowSprite);

  g.add(goldGroup);

  /* ---- BARNACLES on chest (a few) ---- */
  const barGeo = new THREE.DodecahedronGeometry(0.06, 0);
  for (let i = 0; i < 12; i++){
    const b = new THREE.Mesh(barGeo, barnacleMat);
    b.position.set(
      (Math.random() - 0.5) * W,
      H * (0.2 + Math.random() * 0.6),
      (Math.random() < 0.5 ? -1 : 1) * (D / 2 + Math.random() * 0.02)
    );
    const s = 0.6 + Math.random() * 1.2;
    b.scale.setScalar(s);
    b.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    g.add(b);
  }

  /* ---- INVISIBLE HIT TARGET ---- */
  const hitGeo = new THREE.BoxGeometry(W + 0.6, H + 1.0, D + 0.6);
  const hitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  const hit = new THREE.Mesh(hitGeo, hitMat);
  hit.position.y = H * 0.7;
  g.add(hit);

  // Slight random tilt to feel dropped/buried
  g.rotation.x += (Math.random() - 0.5) * 0.06;

  return {
    group: g,
    lid: lidPivot,
    goldGroup,
    bandMats,
    hit
  };
}

function makeGlowTex(){
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  g.addColorStop(0, 'rgba(255,220,140,1)');
  g.addColorStop(0.4, 'rgba(255,180,80,0.5)');
  g.addColorStop(1, 'rgba(255,180,80,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  return t;
}

})();
