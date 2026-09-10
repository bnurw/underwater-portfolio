/* =========================================================
   ANGLERFISH.JS — Realistic Deep-Sea Anglerfish (Melanocetus)
   - Bulbous round body (real deep-sea shape)
   - Massive gaping mouth with needle teeth
   - Tiny eye, high on head
   - Long illicium (rod) with bioluminescent esca
   - Dark, leathery skin
   ========================================================= */
(function(){
'use strict';

window.Anglerfish = {
  create(scene){
    const g = new THREE.Group();

    /* ---------- MATERIALS ---------- */
    const skinMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a0d10,
      emissive: 0x020608,
      emissiveIntensity: 0.4,
      roughness: 0.75,
      metalness: 0.15,
      clearcoat: 0.3,
      clearcoatRoughness: 0.6,
      sheen: 0.2
    });

    const mouthMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a0505,
      roughness: 0.7,
      metalness: 0.1,
      emissive: 0x100202,
      emissiveIntensity: 0.5
    });

    const toothMat = new THREE.MeshPhysicalMaterial({
      color: 0xe8e0d0,
      roughness: 0.35,
      metalness: 0.15,
      clearcoat: 0.8,
      emissive: 0x1a1810,
      emissiveIntensity: 0.15
    });

    const finMat = new THREE.MeshPhysicalMaterial({
      color: 0x08080a,
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    /* ---------- BODY (bulbous sphere — real Melanocetus) ---------- */
    const bodyGeo = new THREE.SphereGeometry(1, 32, 24);
    // Deform: make it slightly egg-shaped, taller at front
    const bpos = bodyGeo.attributes.position;
    for (let i = 0; i < bpos.count; i++){
      const x = bpos.getX(i);
      const y = bpos.getY(i);
      const z = bpos.getZ(i);
      // Taper toward tail
      const tailT = Math.max(0, (x + 1) / 2);       // 0 at head, 1 at tail
      const taper = 1 - Math.pow(tailT, 2.2) * 0.55;
      bpos.setY(i, y * taper);
      bpos.setZ(i, z * taper);
      // Slight asymmetry (fish-like belly)
      if (y < 0) bpos.setY(i, y * 1.05);
    }
    bodyGeo.computeVertexNormals();

    const body = new THREE.Mesh(bodyGeo, skinMat);
    body.scale.set(1.4, 1.15, 1.0);
    g.add(body);

    /* ---------- HEAD BULGE (anglerfish have prominent forehead) ---------- */
    const headGeo = new THREE.SphereGeometry(0.75, 24, 18);
    const headPos = headGeo.attributes.position;
    for (let i = 0; i < headPos.count; i++){
      const y = headPos.getY(i);
      // Flatten top for that iconic flat forehead
      if (y > 0) headPos.setY(i, y * 0.7);
    }
    headGeo.computeVertexNormals();
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0.85, 0.15, 0);
    g.add(head);

    /* ---------- JAW (huge lower jaw) ---------- */
    const jawGeo = new THREE.SphereGeometry(0.85, 24, 16, 0, Math.PI, Math.PI * 0.5, Math.PI * 0.5);
    jawGeo.scale(1.2, 0.6, 1.0);
    const jaw = new THREE.Mesh(jawGeo, mouthMat);
    jaw.position.set(0.65, -0.45, 0);
    jaw.rotation.z = -0.15;
    g.add(jaw);

    /* ---------- MOUTH INTERIOR (black cavity) ---------- */
    const cavityMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide
    });
    const cavity = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 14, 0, Math.PI), cavityMat);
    cavity.position.set(0.7, -0.2, 0);
    cavity.rotation.z = -0.1;
    cavity.scale.set(1.3, 0.8, 1);
    g.add(cavity);

    /* ---------- NEEDLE TEETH (real anglerfish have 40+) ---------- */
    // Upper jaw teeth
    const upperTeethCount = 20;
    for (let i = 0; i < upperTeethCount; i++){
      const t = i / (upperTeethCount - 1);
      const ang = (t - 0.5) * Math.PI * 0.85;
      const r = 0.85;
      const len = 0.28 + Math.random() * 0.15;
      const toothGeo = new THREE.ConeGeometry(0.04, len, 5);
      const tooth = new THREE.Mesh(toothGeo, toothMat);
      // Position along upper jaw line
      tooth.position.set(
        0.9 + Math.cos(ang) * r * 0.65,
        0.05 + Math.sin(ang * 0.3) * 0.1,
        Math.sin(ang) * r * 0.55
      );
      tooth.rotation.z = -Math.PI / 2 - 0.3;
      tooth.rotation.x = Math.sin(ang) * 0.3;
      tooth.userData.baseRotZ = tooth.rotation.z;
      g.add(tooth);
    }

    // Lower jaw teeth
    for (let i = 0; i < 18; i++){
      const t = i / 17;
      const ang = (t - 0.5) * Math.PI * 0.85;
      const r = 0.75;
      const len = 0.26 + Math.random() * 0.12;
      const toothGeo = new THREE.ConeGeometry(0.038, len, 5);
      const tooth = new THREE.Mesh(toothGeo, toothMat);
      tooth.position.set(
        0.85 + Math.cos(ang) * r * 0.65,
        -0.55 + Math.sin(ang * 0.3) * 0.08,
        Math.sin(ang) * r * 0.55
      );
      tooth.rotation.z = -Math.PI / 2 + 0.3;
      tooth.rotation.x = Math.sin(ang) * 0.3;
      g.add(tooth);
    }

    /* ---------- TINY EYES (real anglerfish eyes are small) ---------- */
    const eyeMat = new THREE.MeshPhysicalMaterial({
      color: 0xe8e8f0,
      roughness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.05
    });
    const eyeGeo = new THREE.SphereGeometry(0.07, 14, 12);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.9, 0.35, 0.4);
    g.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.set(0.9, 0.35, -0.4);
    g.add(eyeR);

    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const pupilGeo = new THREE.SphereGeometry(0.045, 10, 8);
    const pupL = new THREE.Mesh(pupilGeo, pupilMat);
    pupL.position.set(0.97, 0.35, 0.4);
    g.add(pupL);
    const pupR = pupL.clone();
    pupR.position.set(0.97, 0.35, -0.4);
    g.add(pupR);

    /* ---------- ILLICIUM (rod) + ESCA (glowing lure) ---------- */
    const illiciumGroup = new THREE.Group();

    // The rod — curves forward over the mouth
    const rodCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.6, 0.65, 0),                // base on head
      new THREE.Vector3(0.9, 1.15, 0.05),
      new THREE.Vector3(1.4, 1.35, 0.05),
      new THREE.Vector3(1.9, 1.15, 0.02),
      new THREE.Vector3(2.15, 0.75, 0)                // tip
    ]);
    const rodGeo = new THREE.TubeGeometry(rodCurve, 40, 0.045, 8, false);
    const rodMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a0806,
      roughness: 0.85,
      metalness: 0.05
    });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    illiciumGroup.add(rod);

    // Esca (glowing bulb at the tip)
    const escaPos = rodCurve.getPoint(1);

    const escaGeo = new THREE.SphereGeometry(0.18, 20, 16);
    // Slight elongation
    const epos = escaGeo.attributes.position;
    for (let i = 0; i < epos.count; i++){
      epos.setY(i, epos.getY(i) * 0.85);
    }
    const escaMat = new THREE.MeshPhysicalMaterial({
      color: 0x9effd8,
      emissive: 0x6effc8,
      emissiveIntensity: 3.0,
      roughness: 0.15,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      transmission: 0.5,
      thickness: 0.5
    });
    const esca = new THREE.Mesh(escaGeo, escaMat);
    esca.position.copy(escaPos);
    illiciumGroup.add(esca);

    // Esca glow sprite
    const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTex(),
      color: 0x9effd8,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    glowSprite.scale.set(1.6, 1.6, 1);
    glowSprite.position.copy(escaPos);
    illiciumGroup.add(glowSprite);

    // Point light at esca
    const escaLight = new THREE.PointLight(0x8effd0, 2.0, 14, 2);
    escaLight.position.copy(escaPos);
    illiciumGroup.add(escaLight);

    g.add(illiciumGroup);

    /* ---------- FINS ---------- */
    // Dorsal fin — small, spiny
    const dorsalShape = new THREE.Shape();
    dorsalShape.moveTo(0, 0);
    dorsalShape.lineTo(0.4, 0);
    dorsalShape.lineTo(0.35, 0.35);
    dorsalShape.lineTo(0.05, 0.28);
    dorsalShape.lineTo(0, 0);
    const dorsalGeo = new THREE.ShapeGeometry(dorsalShape);
    const dorsal = new THREE.Mesh(dorsalGeo, finMat);
    dorsal.position.set(-0.2, 0.9, 0);
    dorsal.rotation.y = Math.PI / 2;
    g.add(dorsal);

    // Pectoral fins
    const pecShape = new THREE.Shape();
    pecShape.moveTo(0, 0);
    pecShape.bezierCurveTo(-0.15, 0.25, -0.4, 0.3, -0.55, 0.1);
    pecShape.bezierCurveTo(-0.4, 0, -0.15, -0.05, 0, 0);
    const pecGeo = new THREE.ShapeGeometry(pecShape);
    const pecL = new THREE.Mesh(pecGeo, finMat);
    pecL.position.set(0.4, -0.35, 0.7);
    pecL.rotation.y = -0.5;
    g.add(pecL);
    const pecR = pecL.clone();
    pecR.position.set(0.4, -0.35, -0.7);
    pecR.rotation.y = 0.5;
    pecR.rotation.z = Math.PI;
    g.add(pecR);

    // Caudal (tail) fin — small fan
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0);
    tailShape.bezierCurveTo(-0.3, 0.5, -0.6, 0.7, -0.9, 0.6);
    tailShape.lineTo(-0.95, 0);
    tailShape.lineTo(-0.9, -0.6);
    tailShape.bezierCurveTo(-0.6, -0.7, -0.3, -0.5, 0, 0);
    const tailGeo = new THREE.ShapeGeometry(tailShape);
    const tail = new THREE.Mesh(tailGeo, finMat);
    tail.position.set(-1.7, 0, 0);
    tail.rotation.y = Math.PI / 2;
    g.add(tail);

    /* ---------- LATERAL SMALL SPINES (deep-sea detail) ---------- */
    for (let i = 0; i < 8; i++){
      const t = i / 8;
      const geo = new THREE.ConeGeometry(0.03, 0.14, 4);
      const spine = new THREE.Mesh(geo, toothMat);
      spine.position.set(
        -0.6 - t * 1.2,
        0.5 - t * 0.15,
        (i % 2 === 0 ? 1 : -1) * 0.42
      );
      spine.rotation.z = Math.PI / 2 + 0.3;
      g.add(spine);
    }

    g.scale.setScalar(0.85);
    scene.add(g);

    /* ---------- STATE ---------- */
    const state = {
      pathT: Math.random() * Math.PI * 2,
      cx: -30, cy: -1140, cz: -60,
      rx: 55, ry: 8, rz: 40
    };

    return {
      group: g,
      update(t){
        state.pathT += 0.0030;
        const a = state.pathT;

        g.position.x = state.cx + Math.cos(a) * state.rx;
        g.position.y = state.cy + Math.sin(a * 1.5) * state.ry;
        g.position.z = state.cz + Math.sin(a) * state.rz;

        const dx = -Math.sin(a) * state.rx;
        const dz =  Math.cos(a) * state.rz;
        g.rotation.y = Math.atan2(dz, dx) + Math.PI;

        // Gentle roll
        g.rotation.z = Math.sin(t * 0.6) * 0.06;

        // Tail sway
        tail.rotation.y = Math.sin(t * 3.2) * 0.4;

        // Pectoral flap
        pecL.rotation.z = Math.sin(t * 4) * 0.25;
        pecR.rotation.z = Math.PI + Math.sin(t * 4 + 1) * 0.25;

        // Illicium sway (the lure bobs)
        illiciumGroup.rotation.z = Math.sin(t * 1.3) * 0.06;
        illiciumGroup.rotation.x = Math.cos(t * 0.9) * 0.04;

        // Esca bioluminescent pulse
        const pulse = 0.75 + Math.sin(t * 2.6) * 0.25;
        escaMat.emissiveIntensity = 2.5 * pulse;
        glowSprite.material.opacity = 0.75 * pulse;
        glowSprite.scale.setScalar(1.4 + pulse * 0.4);
        escaLight.intensity = 1.8 * pulse;

        // Occasional jaw "chomp"
        const chomp = Math.max(0, Math.sin(t * 0.4) - 0.9) * 10;
        jaw.rotation.z = -0.15 + chomp * 0.04;
      }
    };
  }
};

function makeGlowTex(){
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(160,255,220,0.75)');
  g.addColorStop(1, 'rgba(100,255,200,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  return t;
}

})();
