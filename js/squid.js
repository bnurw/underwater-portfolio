/* =========================================================
   SQUID.JS — Bioluminescent deep-sea squid (ambient, trench)
   ========================================================= */
(function(){
'use strict';

window.Squid = {
  create(scene){
    const g = new THREE.Group();

    /* ---------- MATERIALS ---------- */
    const skinMat = new THREE.MeshPhysicalMaterial({
      color: 0x3a1a3a,
      emissive: 0x4a1a5a,
      emissiveIntensity: 0.6,
      roughness: 0.55,
      metalness: 0.1,
      clearcoat: 0.5,
      clearcoatRoughness: 0.4,
      sheen: 0.5,
      sheenColor: 0xff6bff
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x9effff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    /* ---------- MANTLE (elongated cone) ---------- */
    const mantleProfile = [];
    const STEPS = 20;
    for (let i = 0; i <= STEPS; i++){
      const t = i / STEPS;
      // Squid mantle: rounded closed end tapering to point
      const r = Math.sin(t * Math.PI * 0.7) * 0.55 + 0.05;
      mantleProfile.push(new THREE.Vector2(r, (t - 0.5) * 2.2));
    }
    const mantleGeo = new THREE.LatheGeometry(mantleProfile, 24);
    mantleGeo.rotateZ(-Math.PI / 2);
    const mantle = new THREE.Mesh(mantleGeo, skinMat);
    g.add(mantle);

    /* ---------- BIOLUMINESCENT STRIPES on mantle ---------- */
    for (let i = 0; i < 5; i++){
      const ang = (i / 5) * Math.PI * 2;
      const stripeGeo = new THREE.TorusGeometry(0.5, 0.015, 6, 20);
      const stripe = new THREE.Mesh(stripeGeo, glowMat);
      stripe.rotation.y = Math.PI / 2;
      stripe.position.set(-0.15 + Math.random() * 0.3, 0, 0);
      stripe.scale.set(1, 1, 1);
      g.add(stripe);
    }

    /* ---------- HEAD ---------- */
    const headGeo = new THREE.SphereGeometry(0.4, 16, 12);
    headGeo.scale(1, 1, 1);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0.85, 0, 0);
    g.add(head);

    /* ---------- EYES (big, deep-sea) ---------- */
    const eyeMat = new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      emissive: 0xff88aa,
      emissiveIntensity: 0.8,
      roughness: 0.05,
      metalness: 0.1,
      clearcoat: 1
    });
    const eyeGeo = new THREE.SphereGeometry(0.15, 16, 12);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(1.05, 0.05, 0.28);
    g.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.set(1.05, 0.05, -0.28);
    g.add(eyeR);

    // eye highlights
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const shineGeo = new THREE.SphereGeometry(0.035, 6, 6);
    const shL = new THREE.Mesh(shineGeo, shineMat);
    shL.position.set(1.14, 0.1, 0.32);
    g.add(shL);
    const shR = shL.clone();
    shR.position.set(1.14, 0.1, -0.32);
    g.add(shR);

    /* ---------- 8 ARMS + 2 LONG TENTACLES ---------- */
    const arms = [];
    // 8 shorter arms
    for (let i = 0; i < 8; i++){
      const ang = (i / 8) * Math.PI * 2;
      const armChain = buildTentacleChain({
        color: 0x3a1a3a,
        emissive: 0x4a1a5a,
        segs: 6,
        segLen: 0.28,
        radius: 0.07,
        tip: 0.015,
        glowTip: true
      });
      armChain.group.position.set(
        1.15,
        Math.cos(ang) * 0.18,
        Math.sin(ang) * 0.18
      );
      armChain.group.rotation.y = -ang;
      g.add(armChain.group);
      arms.push(armChain);
    }
    // 2 long tentacles
    for (let i = 0; i < 2; i++){
      const ang = (i === 0 ? Math.PI * 0.25 : -Math.PI * 0.25);
      const tent = buildTentacleChain({
        color: 0x3a1a3a,
        emissive: 0x6a1a8a,
        segs: 9,
        segLen: 0.32,
        radius: 0.05,
        tip: 0.01,
        glowTip: true
      });
      tent.group.position.set(
        1.15,
        Math.cos(ang) * 0.2,
        Math.sin(ang) * 0.2
      );
      tent.group.rotation.y = -ang;
      g.add(tent.group);
      arms.push(tent);
    }

    /* ---------- FINS (side of mantle) ---------- */
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.bezierCurveTo(-0.3, 0.35, -0.9, 0.55, -1.3, 0.3);
    finShape.bezierCurveTo(-1.0, 0.1, -0.5, 0.05, 0, 0);
    const finGeo = new THREE.ShapeGeometry(finShape, 16);
    const finMat = new THREE.MeshPhysicalMaterial({
      color: 0x3a1a3a,
      emissive: 0x4a1a5a,
      emissiveIntensity: 0.4,
      roughness: 0.6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const finL = new THREE.Mesh(finGeo, finMat);
    finL.position.set(-0.2, 0.55, 0);
    finL.rotation.y = Math.PI / 2;
    g.add(finL);
    const finR = finL.clone();
    finR.position.set(-0.2, -0.55, 0);
    finR.rotation.x = Math.PI;
    g.add(finR);

    /* ---------- AMBIENT GLOW SPRITE ---------- */
    const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTex(),
      color: 0xb888ff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    glowSprite.scale.set(3.5, 3.5, 1);
    g.add(glowSprite);

    g.scale.setScalar(0.9);
    scene.add(g);

    /* ---------- STATE ---------- */
    const state = {
      pathT: Math.random() * Math.PI * 2,
      cx: 20, cy: -1980, cz: -50,
      rx: 45, ry: 8, rz: 35
    };

    return {
      group: g,
      update(t){
        state.pathT += 0.004;
        const a = state.pathT;

        g.position.x = state.cx + Math.cos(a) * state.rx;
        g.position.y = state.cy + Math.sin(a * 1.7) * state.ry;
        g.position.z = state.cz + Math.sin(a) * state.rz;

        const dx = -Math.sin(a) * state.rx;
        const dz =  Math.cos(a) * state.rz;
        g.rotation.y = Math.atan2(dz, dx) + Math.PI;

        // Slow undulate
        g.rotation.z = Math.sin(t * 0.8) * 0.15;
        g.rotation.x = Math.cos(t * 0.6) * 0.1;

        // Arm ripple
        arms.forEach((arm, ai) => {
          arm.update(t, ai);
        });

        // Fin flutter
        finL.rotation.z =  Math.sin(t * 3) * 0.15;
        finR.rotation.z = -Math.sin(t * 3) * 0.15;

        // Bioluminescent pulse
        const pulse = 0.5 + Math.sin(t * 1.8) * 0.5;
        glowSprite.material.opacity = 0.35 + pulse * 0.35;
        glowSprite.scale.setScalar(3.2 + pulse * 1.0);
      }
    };
  }
};

/* =========================================================
   BUILD SEGMENTED TENTACLE CHAIN
   ========================================================= */
function buildTentacleChain({ color, emissive, segs, segLen, radius, tip, glowTip }){
  const group = new THREE.Group();
  const segments = [];
  const mats = [];

  let parent = group;
  for (let i = 0; i < segs; i++){
    const t = i / segs;
    const r0 = radius * (1 - t * 0.7);
    const r1 = radius * (1 - (i + 1) / segs * 0.85) + tip * (i === segs - 1 ? 1.5 : 0);

    const geo = new THREE.CylinderGeometry(r1, r0, segLen, 6);
    geo.translate(0, -segLen / 2, 0);

    const mat = new THREE.MeshPhysicalMaterial({
      color,
      emissive,
      emissiveIntensity: 0.5,
      roughness: 0.55,
      metalness: 0.1,
      clearcoat: 0.4,
      sheen: 0.4,
      sheenColor: 0xff88ff
    });
    mats.push(mat);

    const seg = new THREE.Mesh(geo, mat);
    parent.add(seg);
    segments.push(seg);

    // optional glow tip on last segment
    if (glowTip && i === segs - 1){
      const tipGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeGlowTex(),
        color: 0xaaffff,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }));
      tipGlow.scale.set(0.35, 0.35, 1);
      tipGlow.position.y = -segLen;
      seg.add(tipGlow);
    }

    // next pivot
    const next = new THREE.Group();
    next.position.y = -segLen;
    seg.add(next);
    parent = next;
  }

  return {
    group,
    update(t, seed){
      let p = group;
      segments.forEach((seg, i) => {
        const ang = Math.sin(t * 2 + i * 0.7 + seed) * 0.15;
        seg.rotation.z = ang;
        seg.rotation.x = Math.cos(t * 1.5 + i * 0.6 + seed) * 0.12;
        if (seg.children[0]) p = seg.children[0];
      });
    }
  };
}

function makeGlowTex(){
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(200,255,255,0.5)');
  g.addColorStop(1, 'rgba(140,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  return t;
}

})();
