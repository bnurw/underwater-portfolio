/* =========================================================
   SHIPWRECK.JS — Solid real-looking sunken ship
   Single continuous hull mesh (no floating planks)
   Resting on the seafloor at -1080
   ========================================================= */
(function(){
'use strict';

window.Shipwreck = {
  create(scene){
    const group = new THREE.Group();

    /* ============ TEXTURES & MATERIALS ============ */
    const woodTex = Tex.wood(1024);
    woodTex.repeat.set(2, 2);
    const woodRough = Tex.rough(woodTex, 0.5);

    const hullMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughnessMap: woodRough,
      color: 0x4a3828,
      roughness: 0.92,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const darkWoodMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0x2a1e12,
      roughness: 1.0,
      metalness: 0.02
    });

    const rustTex = Tex.rust(512);
    const rustMat = new THREE.MeshStandardMaterial({
      map: rustTex,
      color: 0x8a6035,
      roughness: 0.7,
      metalness: 0.65
    });

    const mossMat = new THREE.MeshStandardMaterial({
      color: 0x2a3a1f,
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.9
    });

    const barnacleMat = new THREE.MeshStandardMaterial({
      map: Tex.barnacle(128),
      color: 0xb8b2a0,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });

    /* ============================================================
       MAIN HULL — single deformed box (real ship shape)
       ============================================================ */
    const HULL_LEN = 44;
    const HULL_HEI = 6;
    const HULL_WID = 10;

    const hullGeo = new THREE.BoxGeometry(
      HULL_LEN, HULL_HEI, HULL_WID,
      60, 8, 20
    );
    const hp = hullGeo.attributes.position;

    // Per-vertex deformation to boat shape
    for (let i = 0; i < hp.count; i++){
      let x = hp.getX(i);
      let y = hp.getY(i);
      let z = hp.getZ(i);

      const t = (x + HULL_LEN / 2) / HULL_LEN;   // 0 stern, 1 bow
      const yN = (y + HULL_HEI / 2) / HULL_HEI;  // 0 bottom, 1 top

      // Width taper — narrow at bow & stern
      const taper = 0.35 + Math.sin(t * Math.PI * 0.98) * 0.65;

      // Bottom rounding — bottom edge is narrower
      const bottomRound = 0.25 + Math.pow(yN, 0.55) * 0.75;

      // Bow rise & stern rise
      const bowRise = Math.max(0, t - 0.72) * 7.5;
      const sternRise = Math.max(0, 0.28 - t) * 4.5;

      // Curve deck line (sheer)
      const sheer = yN > 0.6 ? Math.sin(t * Math.PI) * 0.6 : 0;

      // Apply
      z = z * taper * bottomRound;
      y = y + bowRise + sternRise + sheer;

      hp.setZ(i, z);
      hp.setY(i, y);
    }
    hullGeo.computeVertexNormals();

    const hull = new THREE.Mesh(hullGeo, hullMat);
    // Tilted on the seabed (natural wreck pose)
    hull.rotation.z = -0.32;
    hull.rotation.x = 0.12;
    hull.rotation.y = 0.05;
    group.add(hull);

    /* ============================================================
       DECK PLANKS — over the top of the hull
       ============================================================ */
    const deckGroup = new THREE.Group();
    const PLANK_COUNT = 22;
    for (let i = 0; i < PLANK_COUNT; i++){
      const t = i / (PLANK_COUNT - 1);
      const x = (t - 0.5) * HULL_LEN * 0.9;
      const w = HULL_WID * (0.35 + Math.sin(t * Math.PI * 0.98) * 0.55) * 0.9;

      // Skip some planks (missing)
      if (Math.random() < 0.18) continue;

      const plankGeo = new THREE.BoxGeometry(HULL_LEN / PLANK_COUNT * 0.85, 0.18, w);
      const plank = new THREE.Mesh(plankGeo, i % 3 === 0 ? darkWoodMat : hullMat);
      plank.position.set(x, 3.2 + Math.sin(t * Math.PI) * 0.5, 0);
      plank.rotation.z = (Math.random() - 0.5) * 0.05;
      // Slight sag from years underwater
      plank.rotation.x = (Math.random() - 0.5) * 0.04;
      deckGroup.add(plank);
    }
    hull.add(deckGroup);

    /* ============================================================
       HULL RIBS (exposed frame through broken side)
       ============================================================ */
    for (let i = 0; i < 8; i++){
      const t = i / 7;
      const ribGeo = new THREE.TorusGeometry(HULL_WID * 0.42, 0.16, 6, 14, Math.PI * 1.05);
      const rib = new THREE.Mesh(ribGeo, darkWoodMat);
      rib.rotation.x = Math.PI / 2;
      rib.rotation.z = Math.PI / 2 + 0.15;
      rib.position.set((t - 0.5) * HULL_LEN * 0.82, 0.5, 0);
      rib.scale.y = 0.9;
      hull.add(rib);
    }

    /* ============================================================
       KEEL BEAM (bottom)
       ============================================================ */
    const keelGeo = new THREE.BoxGeometry(HULL_LEN * 0.95, 0.45, 0.7);
    const keel = new THREE.Mesh(keelGeo, darkWoodMat);
    keel.position.set(0, -HULL_HEI / 2 + 0.1, 0);
    hull.add(keel);

    /* ============================================================
       MAST + RIGGING + SAIL
       ============================================================ */
    const mastGroup = new THREE.Group();
    const mastHeight = 24;

    // Main mast (leaning heavily)
    const mastGeo = new THREE.CylinderGeometry(0.32, 0.55, mastHeight, 12);
    const mast = new THREE.Mesh(mastGeo, darkWoodMat);
    mast.position.y = mastHeight / 2;
    mastGroup.add(mast);

    // Broken top half
    const breakGeo = new THREE.CylinderGeometry(0.22, 0.3, 7, 10);
    const breakHalf = new THREE.Mesh(breakGeo, darkWoodMat);
    breakHalf.position.set(5.5, mastHeight - 3, 1);
    breakHalf.rotation.z = -1.25;
    mastGroup.add(breakHalf);

    // Yard crossbeam
    const yardGeo = new THREE.CylinderGeometry(0.16, 0.16, 12, 8);
    const yard = new THREE.Mesh(yardGeo, darkWoodMat);
    yard.rotation.z = Math.PI / 2;
    yard.position.set(0, 15, 0);
    mastGroup.add(yard);

    // Broken yard half hanging
    const yardHalf = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5, 8), darkWoodMat);
    yardHalf.rotation.z = Math.PI / 2 + 0.5;
    yardHalf.position.set(6, 12.5, 0.2);
    mastGroup.add(yardHalf);

    mastGroup.position.set(-3, -0.5, 0);
    mastGroup.rotation.z = 0.42;
    mastGroup.rotation.x = -0.15;
    hull.add(mastGroup);

    // Torn sail
    const sailTex = Tex.sail(512);
    const sailMat = new THREE.MeshStandardMaterial({
      map: sailTex,
      color: 0x9a8870,
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      alphaTest: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const sailGeo = new THREE.PlaneGeometry(12, 16, 16, 16);
    const spos = sailGeo.attributes.position;
    for (let i = 0; i < spos.count; i++){
      const x = spos.getX(i), y = spos.getY(i);
      spos.setZ(i, Math.sin(x * 0.5) * 0.5 + Math.cos(y * 0.4) * 0.4);
    }
    sailGeo.computeVertexNormals();
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.set(0, 6, 0);
    sail.rotation.y = Math.PI / 2;
    sail.rotation.z = 0.12;
    mastGroup.add(sail);

    // Small tatters
    for (let i = 0; i < 6; i++){
      const tg = new THREE.PlaneGeometry(1.5 + Math.random() * 3, 3 + Math.random() * 5);
      const tt = new THREE.Mesh(tg, sailMat);
      tt.position.set(-8 + Math.random() * 16, 1 + Math.random() * 6, -1.5 + Math.random() * 3);
      tt.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
      mastGroup.add(tt);
    }

    // Rigging ropes (catenary)
    function makeRope(a, b, sag){
      const pts = [];
      const segs = 20;
      for (let i = 0; i <= segs; i++){
        const t = i / segs;
        pts.push(new THREE.Vector3(
          a.x + (b.x - a.x) * t,
          a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * sag,
          a.z + (b.z - a.z) * t
        ));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const geo = new THREE.TubeGeometry(curve, 30, 0.05, 5, false);
      return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.95 }));
    }
    mastGroup.add(makeRope(new THREE.Vector3(-3, -0.5, 0), new THREE.Vector3(20, -1.5, 0), 3));
    mastGroup.add(makeRope(new THREE.Vector3(-3, -0.5, 0), new THREE.Vector3(-20, -1, 0), 3));
    mastGroup.add(makeRope(new THREE.Vector3(-3, 13, 0), new THREE.Vector3(15, -1, 0), 2));
    mastGroup.add(makeRope(new THREE.Vector3(-3, 13, 0), new THREE.Vector3(-15, -1, 0), 2));

    /* ============================================================
       ANCHOR
       ============================================================ */
    const anchorGroup = new THREE.Group();
    const stemGeo = new THREE.CylinderGeometry(0.14, 0.14, 3.2, 8);
    const stem = new THREE.Mesh(stemGeo, rustMat);
    stem.rotation.z = Math.PI / 2;
    anchorGroup.add(stem);
    const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.6, 6), rustMat);
    arm1.position.set(0.7, 0.4, 0);
    arm1.rotation.z = -0.6;
    anchorGroup.add(arm1);
    const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.6, 6), rustMat);
    arm2.position.set(-0.7, 0.4, 0);
    arm2.rotation.z = 0.6;
    anchorGroup.add(arm2);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 6, 14), rustMat);
    ring.position.set(1.6, 0.35, 0);
    ring.rotation.y = Math.PI / 2;
    anchorGroup.add(ring);
    anchorGroup.position.set(22, -2, 0);
    anchorGroup.rotation.z = 0.4;
    hull.add(anchorGroup);

    /* ============================================================
       BARNACLES (instanced on hull)
       ============================================================ */
    const barGeo = new THREE.DodecahedronGeometry(0.14, 0);
    const BASE_BAR = 400;
    const BAR_COUNT = (window.Perf && window.Perf.scaled) ? Math.max(60, window.Perf.scaled(BASE_BAR)) : BASE_BAR;
    const barnacles = new THREE.InstancedMesh(barGeo, barnacleMat, BAR_COUNT);
    const bdummy = new THREE.Object3D();
    for (let i = 0; i < BAR_COUNT; i++){
      const t = Math.random();
      const crossAngle = (Math.random() - 0.5) * Math.PI * 0.65;
      const baseY = Math.cos(crossAngle) * HULL_HEI * 0.5 * 0.7;
      const baseZ = Math.sin(crossAngle) * HULL_WID * 0.5 * 0.9;
      const longCurve = Math.sin(t * Math.PI) * 0.5;

      bdummy.position.set(
        (t - 0.5) * HULL_LEN * 0.9 + (Math.random() - 0.5) * 1.5,
        baseY + longCurve + (Math.random() - 0.5) * 0.6,
        baseZ + (Math.random() - 0.5) * 0.6
      );
      const s = 0.6 + Math.random() * 1.2;
      bdummy.scale.set(s, s * 0.7, s);
      bdummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      bdummy.updateMatrix();
      barnacles.setMatrixAt(i, bdummy.matrix);
    }
    barnacles.instanceMatrix.needsUpdate = true;
    hull.add(barnacles);

    /* ============================================================
       MOSS PATCHES
       ============================================================ */
    for (let i = 0; i < 40; i++){
      const r = 0.5 + Math.random() * 1.1;
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 5), mossMat);
      m.position.set(
        (Math.random() - 0.5) * HULL_LEN * 0.85,
        -HULL_HEI * 0.3 + Math.random() * 1.5,
        (Math.random() < 0.5 ? 1 : -1) * (HULL_WID * 0.35 + Math.random() * 0.5)
      );
      m.scale.set(1, 0.15 + Math.random() * 0.2, 1);
      m.rotation.y = Math.random() * Math.PI;
      hull.add(m);
    }

    /* ============================================================
       POSITION SHIPWRECK — resting on floor at -1085
       ============================================================ */
    // Hull is ~6 tall, so bottom must touch -1090
    // Tilted 0.32 rad, so effective height is taller
    group.position.set(-14, -1082, -58);
    group.rotation.y = 0.4;

    scene.add(group);

    /* ============================================================
       WARM RIM LIGHT (bioluminescent glow nearby)
       ============================================================ */
    const lamp = new THREE.PointLight(0x4a8a9a, 0.8, 80, 2);
    lamp.position.set(-14, -1070, -58);
    scene.add(lamp);

    return {
      group,
      update(t){
        group.rotation.y = 0.4 + Math.sin(t * 0.05) * 0.008;
      }
    };
  }
};

})();
