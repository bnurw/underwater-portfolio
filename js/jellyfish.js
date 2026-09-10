/* =========================================================
   JELLYFISH.JS — Realistic Moon Jellyfish (Aurelia aurita)
   - LatheGeometry bell with real profile
   - Corrugated bell edge (subumbrellar folds)
   - 4 horseshoe gonads (visible through bell)
   - 4 ruffled oral arms
   - 48 fringe tentacles
   - 4 long trailing tentacles
   ========================================================= */
(function(){
'use strict';

window.Jellyfish = {
  create(scene, camera){
    const SKILLS = [
      { name: 'HTML5',      pct: 95, color: 0x7fe8ff, pos: [-22,  -30, -40] },
      { name: 'CSS3',       pct: 90, color: 0xb38dff, pos: [ 22,  -20, -55] },
      { name: 'JavaScript', pct: 85, color: 0xffe07a, pos: [ -6,  -55, -30] },
      { name: 'Backend',    pct: 75, color: 0x7fffc8, pos: [ 30,  -60, -70] },
      { name: 'UI / Anim',  pct: 88, color: 0xff8fb8, pos: [-32,  -75, -55] },
      { name: 'Responsive', pct: 92, color: 0xc9a6ff, pos: [  8, -100, -40] }
    ];

    const group = new THREE.Group();
    const jellies = [];

    SKILLS.forEach((s) => {
      const jelly = buildRealJellyfish(s.color);
      const startY = s.pos[1] - 250;
      jelly.group.position.set(s.pos[0], startY, s.pos[2]);
      jelly.group.userData = {
        baseY: startY,
        targetY: s.pos[1],
        x: s.pos[0],
        z: s.pos[2],
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.9 + Math.random() * 0.3,
        bobRange: 3 + Math.random() * 3,
        driftAmp: 4 + Math.random() * 4,
        driftSpeed: 0.15 + Math.random() * 0.1,
        skill: s,
        hovering: false,
        hoverT: 0
      };
      group.add(jelly.group);
      jellies.push({ ...jelly, data: jelly.group.userData, skill: s });
    });

    scene.add(group);

    /* ---------- RAYCAST (hover) ---------- */
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const tooltip = document.getElementById('skillTooltip');
    const stName = tooltip.querySelector('.st-name');
    const stFill = tooltip.querySelector('.st-fill');
    const stPct  = tooltip.querySelector('.st-pct');

    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', (e) => {
      ndc.x = (e.clientX / window.innerWidth)  * 2 - 1;
      ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseX = e.clientX; mouseY = e.clientY;
    });

    let activeHover = null;

    function checkHover(){
      raycaster.setFromCamera(ndc, camera);
      const targets = jellies.map(j => j.hit);
      const hits = raycaster.intersectObjects(targets, false);

      if (hits.length){
        const j = jellies.find(x => x.hit === hits[0].object);
        if (!j) return;
        if (activeHover !== j){
          if (activeHover) activeHover.data.hovering = false;
          activeHover = j;
          j.data.hovering = true;
          if (window.SoundEvents) window.SoundEvents.chime(760 + Math.random() * 480);

          stName.textContent = j.skill.name;
          stFill.style.width = j.skill.pct + '%';
          stPct.textContent = j.skill.pct + '%';
          tooltip.style.setProperty('--accent', '#' + j.skill.color.toString(16).padStart(6,'0'));
        }
        tooltip.classList.add('show');
        tooltip.style.left = mouseX + 'px';
        tooltip.style.top  = mouseY + 'px';
      } else {
        if (activeHover){ activeHover.data.hovering = false; activeHover = null; }
        tooltip.classList.remove('show');
      }
    }

    /* ---------- API ---------- */
    return {
      group, jellies,
      update(dt, t, depth){
        const vis = Math.max(0, Math.min(1,
          Math.min((depth - 250) / 200, (1000 - depth) / 250)
        ));
        group.visible = vis > 0.01;

        jellies.forEach((j) => {
          const d = j.data;
          const riseT = Math.max(0, Math.min(1, (depth - 200) / 400));
          const y = d.baseY + (d.targetY - d.baseY) * riseT;

          // Life-like pulse cycle
          const pulsePhase = t * d.pulseSpeed + d.phase;
          const pulse = 0.5 + 0.5 * Math.sin(pulsePhase);            // 0..1
          // Bell contracts fast, expands slow (real jellyfish)
          const bellScaleX = 1.0 + Math.cos(pulsePhase) * 0.10;
          const bellScaleY = 1.0 - Math.cos(pulsePhase) * 0.08;

          // Swim pulse pushes jellyfish forward
          const swimPush = Math.max(0, Math.sin(pulsePhase)) * 0.6;

          const driftX = Math.sin(t * d.driftSpeed + d.phase) * d.driftAmp;
          const driftZ = Math.cos(t * d.driftSpeed * 0.7 + d.phase) * d.driftAmp;
          const bob = Math.sin(t * 0.6 + d.phase) * d.bobRange;

          j.group.position.x = d.x + driftX;
          j.group.position.y = y + bob + swimPush;
          j.group.position.z = d.z + driftZ;

          // Slight rotation
          j.group.rotation.z = Math.sin(t * 0.35 + d.phase) * 0.10;
          j.group.rotation.x = Math.cos(t * 0.25 + d.phase) * 0.06;

          // Bell pulse
          j.bell.scale.set(bellScaleX, bellScaleY, bellScaleX);
          // Rim pulse slightly delayed
          j.rim.scale.set(bellScaleX * 1.02, 1, bellScaleX * 1.02);

          // Oral arms sway & ripple
          j.oralArms.forEach((arm, ai) => {
            arm.rotation.x = Math.sin(t * 2 + ai * 1.6 + d.phase) * 0.15;
            arm.rotation.z = Math.cos(t * 1.8 + ai * 1.5 + d.phase) * 0.20 + (ai - 1.5) * 0.1;
          });

          // Fringe tentacles sway
          j.fringeTentacles.forEach((tn, ti) => {
            tn.rotation.z = Math.sin(t * 3 + ti * 0.5 + d.phase) * 0.28;
            tn.rotation.x = Math.cos(t * 2.6 + ti * 0.4 + d.phase) * 0.18;
          });

          // Long trailing tentacles — ripple down the length
          j.longTentacles.forEach((seg, si) => {
            seg.rotation.z = Math.sin(t * 1.5 + si * 0.6 + d.phase) * 0.15;
            seg.rotation.x = Math.cos(t * 1.2 + si * 0.5 + d.phase) * 0.10;
          });

          // Hover reaction
          const targetH = d.hovering ? 1 : 0;
          d.hoverT += (targetH - d.hoverT) * Math.min(1, dt * 6);

          const glow = (0.7 + Math.sin(t * d.pulseSpeed * 1.5 + d.phase) * 0.3) * vis;
          j.bellMat.emissiveIntensity = (0.35 + d.hoverT * 1.6) * glow;

          // Rim glow ring pulses
          j.rimGlowMat.opacity = (0.35 + Math.sin(t * d.pulseSpeed * 1.4 + d.phase) * 0.15) * vis * (1 + d.hoverT);

          // Whole jellyfish scale up on hover
          j.group.scale.setScalar(1 + d.hoverT * 0.22);
        });

        if (group.visible) checkHover();
      }
    };
  }
};

/* =========================================================
   BUILD REAL MOON JELLYFISH
   ========================================================= */
function buildRealJellyfish(colorHex){
  const g = new THREE.Group();

  /* ---------- BELL (LatheGeometry from real profile) ---------- */
  // Profile: start at rim, go up and over the top
  const profile = [];
  const PROFILE_STEPS = 32;
  for (let i = 0; i <= PROFILE_STEPS; i++){
    const t = i / PROFILE_STEPS;      // 0 = rim, 1 = top
    // Smooth curve: bell widens then narrows to a small dome top
    const r = Math.sin(t * Math.PI * 0.95) * 1.0;
    const y = t * 1.15;
    profile.push(new THREE.Vector2(Math.max(0.001, r), y));
  }
  // Add underside of the bell (subumbrella) — a concave shape
  // We use a Lathe with only the outer surface; underside is a separate mesh

  const bellGeo = new THREE.LatheGeometry(profile, 64);
  // Corrugate the rim — real jellyfish have wavy edge
  const bpos = bellGeo.attributes.position;
  for (let i = 0; i < bpos.count; i++){
    const x = bpos.getX(i);
    const y = bpos.getY(i);
    const z = bpos.getZ(i);
    const angle = Math.atan2(z, x);
    const r = Math.hypot(x, z);
    const rimFalloff = Math.max(0, 1 - y * 1.2);         // strongest near rim
    const corr = 1 + Math.cos(angle * 12) * 0.05 * rimFalloff;
    bpos.setX(i, x * corr);
    bpos.setZ(i, z * corr);
    // Slight undulation vertically
    bpos.setY(i, y + Math.sin(angle * 12) * 0.03 * rimFalloff);
  }
  bellGeo.computeVertexNormals();

  const bellMat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.55,
    roughness: 0.25,
    metalness: 0.0,
    transmission: 0.6,
    thickness: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false,
    ior: 1.33,
    clearcoat: 0.6,
    clearcoatRoughness: 0.3
  });

  const bell = new THREE.Mesh(bellGeo, bellMat);
  bell.scale.set(1.6, 1.3, 1.6);
  g.add(bell);

  /* ---------- RIM GLOW RING ---------- */
  const rimGeo = new THREE.TorusGeometry(1.58, 0.04, 8, 64);
  rimGeo.rotateX(Math.PI / 2);
  const rimGlowMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const rim = new THREE.Mesh(rimGeo, rimGlowMat);
  rim.position.y = 0.02;
  g.add(rim);

  /* ---------- 4 GONADS (visible through bell) ---------- */
  // Real Aurelia have 4 horseshoe-shaped gonads
  const gonadMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  for (let i = 0; i < 4; i++){
    const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, 0.32, Math.PI * 0.15, Math.PI * 0.85, false);
    shape.absarc(0, 0, 0.16, Math.PI * 0.85, Math.PI * 0.15, true);
    const geo = new THREE.ShapeGeometry(shape, 20);
    const gonad = new THREE.Mesh(geo, gonadMat);
    gonad.position.set(
      Math.cos(ang) * 0.6,
      0.35,
      Math.sin(ang) * 0.6
    );
    gonad.rotation.x = -Math.PI / 2 + 0.3;
    gonad.rotation.z = -ang;
    gonad.scale.set(1, 1, 1);
    g.add(gonad);
  }

  /* ---------- 4 ORAL ARMS (ruffled ribbon) ---------- */
  const oralArms = [];
  const armMat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.45,
    roughness: 0.3,
    metalness: 0.0,
    side: THREE.DoubleSide,
    transmission: 0.5,
    thickness: 0.4,
    depthWrite: false
  });

  for (let i = 0; i < 4; i++){
    const ang = (i / 4) * Math.PI * 2;
    // Build a ribbon that gets ruffled (wavy edges)
    const armGeo = new THREE.PlaneGeometry(0.55, 2.4, 6, 18);
    const apos = armGeo.attributes.position;
    for (let v = 0; v < apos.count; v++){
      const x = apos.getX(v);
      const y = apos.getY(v);
      const tY = (y / 2.4) + 0.5;                  // 0 bottom, 1 top
      // ruffles: sharper near bottom
      const ruffle = Math.sin(y * 3.5 + i * 1.3) * (1 - tY) * 0.15;
      apos.setX(v, x + ruffle);
      apos.setZ(v, Math.sin(x * 2 + y * 1.5) * 0.08);
    }
    armGeo.computeVertexNormals();

    const arm = new THREE.Mesh(armGeo, armMat);
    // Attach near bell center, hanging down
    arm.position.set(
      Math.cos(ang) * 0.55,
      -0.9,
      Math.sin(ang) * 0.55
    );
    arm.rotation.y = -ang + Math.PI / 2;
    arm.rotation.x = Math.PI * 0.02;
    g.add(arm);
    oralArms.push(arm);
  }

  /* ---------- 48 FRINGE TENTACLES (short) ---------- */
  const fringeMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.65,
    depthWrite: false
  });
  const fringeTentacles = [];
  const FRINGE_COUNT = (window.Perf && window.Perf.tier === 'low') ? 24 : (window.Perf && window.Perf.tier === 'medium') ? 36 : 48;
  for (let i = 0; i < FRINGE_COUNT; i++){
    const ang = (i / FRINGE_COUNT) * Math.PI * 2;
    const len = 0.35 + Math.random() * 0.25;
    const geo = new THREE.CylinderGeometry(0.012, 0.006, len, 4);
    geo.translate(0, -len / 2, 0);
    const tn = new THREE.Mesh(geo, fringeMat);
    tn.position.set(
      Math.cos(ang) * 1.55,
      0.02,
      Math.sin(ang) * 1.55
    );
    tn.userData = { baseRotZ: 0, baseRotX: 0 };
    g.add(tn);
    fringeTentacles.push(tn);
  }

  /* ---------- 4 LONG TRAILING TENTACLES ---------- */
  const longMat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.25,
    transparent: true,
    opacity: 0.55,
    roughness: 0.4,
    metalness: 0,
    transmission: 0.4,
    thickness: 0.2,
    depthWrite: false
  });
  const longTentacles = [];
  for (let i = 0; i < 4; i++){
    const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
    // Build multi-segment chain
    let parent = g;
    let prevPos = new THREE.Vector3(
      Math.cos(ang) * 1.45,
      0,
      Math.sin(ang) * 1.45
    );
    const SEGS = 10;
    for (let s = 0; s < SEGS; s++){
      const len = 0.55 + Math.random() * 0.2;
      const geo = new THREE.CylinderGeometry(0.03, 0.02, len, 5);
      geo.translate(0, -len / 2, 0);
      const seg = new THREE.Mesh(geo, longMat);
      seg.position.copy(prevPos);
      parent.add(seg);
      longTentacles.push(seg);

      // Next segment hangs below this one
      const next = new THREE.Group();
      next.position.y = -len;
      seg.add(next);
      parent = next;
      prevPos = new THREE.Vector3(0, 0, 0);
    }
  }

  /* ---------- INNER GLOW (bloom fake) ---------- */
  const coreMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), coreMat);
  core.position.y = 0.4;
  g.add(core);

  /* ---------- HIT TARGET ---------- */
  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(2.0, 8, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hit.position.y = 0.3;
  g.add(hit);

  g.scale.setScalar(0.95);
  return { group: g, bell, bellMat, rim, rimGlowMat, oralArms, fringeTentacles, longTentacles, hit };
}

})();
