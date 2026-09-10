/* =========================================================
   FISH.JS — Realistic Betta Fish (player avatar)
   - LatheGeometry body with proper fusiform shape
   - Gill covers (operculum), lateral line
   - Long flowing fins (real betta anatomy)
   - Forked tail
   - Real eye with iris
   ========================================================= */
(function(){
'use strict';

window.PlayerFish = {
  create(scene, camera){
    const g = new THREE.Group();

    /* ---------- BODY (Lathe with real fish profile) ---------- */
    const bodyProfile = [];
    const STEPS = 40;
    // Profile: nose (x=0) to tail base (x=1)
    // Radius function approximates a fish body
    for (let i = 0; i <= STEPS; i++){
      const t = i / STEPS;              // 0 = nose, 1 = tail
      // Peak at ~30% from nose, taper to tail
      let r;
      if (t < 0.18){
        // head — pointed nose rising to gill area
        r = 0.05 + Math.sin(t / 0.18 * Math.PI * 0.55) * 0.42;
      } else if (t < 0.55){
        // body — widest part
        const tt = (t - 0.18) / 0.37;
        r = 0.47 + Math.sin(tt * Math.PI) * 0.06;
      } else {
        // tail base — tapering
        const tt = (t - 0.55) / 0.45;
        r = 0.47 * (1 - tt * 0.92);
      }
      // y position along body axis
      const y = (t - 0.5) * 2.4;
      bodyProfile.push(new THREE.Vector2(Math.max(0.02, r), y));
    }

    const bodyGeo = new THREE.LatheGeometry(bodyProfile, 32);
    bodyGeo.rotateZ(-Math.PI / 2);      // so nose faces +X
    // Squash sideways (fish are narrower than tall)
    bodyGeo.scale(1.0, 1.05, 0.7);
    bodyGeo.computeVertexNormals();

    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xc84a6a,                   // betta red
      emissive: 0x4a0a1a,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.15,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      sheen: 0.6,
      sheenColor: 0xff6b9d,
      side: THREE.DoubleSide
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    g.add(body);

    /* ---------- DORSAL FIN (long, flowing) ---------- */
    const finMat = new THREE.MeshPhysicalMaterial({
      color: 0xb43a5a,
      emissive: 0x300818,
      emissiveIntensity: 0.4,
      roughness: 0.35,
      metalness: 0.05,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      clearcoat: 0.4
    });

    // Dorsal — long ribbon from mid-body to tail base
    const dorsalShape = new THREE.Shape();
    dorsalShape.moveTo(0.3, 0);
    dorsalShape.bezierCurveTo(0.1, 0.5, -0.4, 0.6, -0.9, 0.25);
    dorsalShape.lineTo(-0.95, 0.05);
    dorsalShape.bezierCurveTo(-0.5, 0.15, 0.0, 0.2, 0.3, 0);
    const dorsalGeo = new THREE.ShapeGeometry(dorsalShape, 24);
    const dorsal = new THREE.Mesh(dorsalGeo, finMat);
    dorsal.position.set(-0.1, 0.42, 0);
    dorsal.rotation.y = Math.PI / 2;
    dorsal.userData = { baseY: 0.42 };
    g.add(dorsal);

    /* ---------- ANAL FIN (bottom, long) ---------- */
    const analShape = new THREE.Shape();
    analShape.moveTo(0.25, 0);
    analShape.bezierCurveTo(0.05, -0.4, -0.35, -0.5, -0.75, -0.2);
    analShape.lineTo(-0.8, 0);
    analShape.bezierCurveTo(-0.4, -0.05, 0.0, -0.1, 0.25, 0);
    const analGeo = new THREE.ShapeGeometry(analShape, 24);
    const anal = new THREE.Mesh(analGeo, finMat);
    anal.position.set(-0.15, -0.42, 0);
    anal.rotation.y = Math.PI / 2;
    g.add(anal);

    /* ---------- TAIL FIN (forked — real betta shape) ---------- */
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0);
    tailShape.bezierCurveTo(-0.3, 0.5, -0.7, 0.9, -1.1, 1.05);
    tailShape.bezierCurveTo(-0.9, 0.6, -0.85, 0.3, -0.85, 0.05);
    tailShape.bezierCurveTo(-0.85, -0.3, -0.9, -0.6, -1.1, -1.05);
    tailShape.bezierCurveTo(-0.7, -0.9, -0.3, -0.5, 0, 0);
    const tailGeo = new THREE.ShapeGeometry(tailShape, 32);
    // Add flowing wave
    const tpos = tailGeo.attributes.position;
    for (let i = 0; i < tpos.count; i++){
      const x = tpos.getX(i);
      const y = tpos.getY(i);
      const t = -x;                       // further from body = more wave
      tpos.setZ(i, Math.sin(y * 3 + t * 4) * t * 0.15);
    }
    tailGeo.computeVertexNormals();

    const tailMat = new THREE.MeshPhysicalMaterial({
      color: 0xd85a80,
      emissive: 0x4a0a1a,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.05,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
      transmission: 0.35,
      thickness: 0.3,
      clearcoat: 0.5
    });
    const tailFin = new THREE.Mesh(tailGeo, tailMat);
    tailFin.position.set(-1.15, 0, 0);
    g.add(tailFin);

    /* ---------- PECTORAL FINS (side, small) ---------- */
    const pecShape = new THREE.Shape();
    pecShape.moveTo(0, 0);
    pecShape.bezierCurveTo(-0.25, 0.15, -0.5, 0.15, -0.55, 0);
    pecShape.bezierCurveTo(-0.5, -0.15, -0.25, -0.15, 0, 0);
    const pecGeo = new THREE.ShapeGeometry(pecShape, 16);
    const pecMat = new THREE.MeshPhysicalMaterial({
      color: 0xc84a6a,
      emissive: 0x300810,
      emissiveIntensity: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      clearcoat: 0.4
    });

    const pecL = new THREE.Mesh(pecGeo, pecMat);
    pecL.position.set(0.65, -0.05, 0.32);
    pecL.rotation.y = -0.8;
    g.add(pecL);

    const pecR = new THREE.Mesh(pecGeo, pecMat);
    pecR.position.set(0.65, -0.05, -0.32);
    pecR.rotation.y = 0.8;
    pecR.rotation.z = Math.PI;
    g.add(pecR);

    /* ---------- GILL COVER (operculum) ---------- */
    const gillShape = new THREE.Shape();
    gillShape.moveTo(0, 0.35);
    gillShape.bezierCurveTo(0.12, 0.2, 0.12, -0.2, 0, -0.35);
    const gillGeo = new THREE.ShapeGeometry(gillShape, 12);
    const gillMat = new THREE.MeshPhysicalMaterial({
      color: 0xa83858,
      roughness: 0.3,
      metalness: 0.15,
      clearcoat: 0.7,
      side: THREE.DoubleSide
    });
    const gillL = new THREE.Mesh(gillGeo, gillMat);
    gillL.position.set(0.55, 0, 0.34);
    gillL.rotation.y = Math.PI / 2;
    g.add(gillL);
    const gillR = gillL.clone();
    gillR.position.set(0.55, 0, -0.34);
    gillR.rotation.y = -Math.PI / 2;
    g.add(gillR);

    /* ---------- EYE (real anatomy) ---------- */
    // Sclera
    const eyeMat = new THREE.MeshPhysicalMaterial({
      color: 0xfaf0e8,
      roughness: 0.15,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.05
    });
    const eyeGeo = new THREE.SphereGeometry(0.13, 20, 16);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.82, 0.12, 0.28);
    g.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.set(0.82, 0.12, -0.28);
    g.add(eyeR);

    // Iris (golden)
    const irisMat = new THREE.MeshPhysicalMaterial({
      color: 0xd8a030,
      emissive: 0x602000,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.3
    });
    const irisGeo = new THREE.SphereGeometry(0.085, 16, 12);
    const irisL = new THREE.Mesh(irisGeo, irisMat);
    irisL.position.set(0.92, 0.12, 0.28);
    g.add(irisL);
    const irisR = irisL.clone();
    irisR.position.set(0.92, 0.12, -0.28);
    g.add(irisR);

    // Pupil (black)
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const pupilGeo = new THREE.SphereGeometry(0.045, 12, 10);
    const pupL = new THREE.Mesh(pupilGeo, pupilMat);
    pupL.position.set(0.98, 0.12, 0.28);
    g.add(pupL);
    const pupR = pupL.clone();
    pupR.position.set(0.98, 0.12, -0.28);
    g.add(pupR);

    // Eye shine
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const shineGeo = new THREE.SphereGeometry(0.02, 8, 6);
    const shL = new THREE.Mesh(shineGeo, shineMat);
    shL.position.set(1.0, 0.16, 0.30);
    g.add(shL);
    const shR = shL.clone();
    shR.position.set(1.0, 0.16, -0.30);
    g.add(shR);

    /* ---------- MOUTH ---------- */
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x2a0810 });
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.15), mouthMat);
    mouth.position.set(1.15, -0.05, 0);
    g.add(mouth);

    /* ---------- LATERAL LINE (subtle detail dots) ---------- */
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x601828, transparent: true, opacity: 0.5
    });
    for (let i = 0; i < 14; i++){
      const t = 0.25 + i * 0.045;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 4, 4), dotMat);
      dot.position.set(0.9 - t * 2.2, 0.05, 0.28);
      g.add(dot);
    }

    g.scale.setScalar(1.05);
    scene.add(g);

    /* ---------- STATE ---------- */
    const state = {
      cur: new THREE.Vector3(0, -100, -40),
      target: new THREE.Vector3(0, -100, -40),
      vel: new THREE.Vector3(0, 0, 0),
      facing: 1,
      lastX: 0,
      t: 0
    };

    const camDir = new THREE.Vector3();
    const tmp = new THREE.Vector3();

    return {
      group: g, state,
      update(dt, t, mouseX, mouseY){
        // On touch devices, we already converted touch to mouse in main.js
        state.t = t;

        // Target position: ahead of camera, offset by mouse
        camera.getWorldDirection(camDir);
        tmp.copy(camera.position).add(camDir.multiplyScalar(24));
        state.target.x = tmp.x + mouseX * 8;
        state.target.y = tmp.y + mouseY * 5;
        state.target.z = tmp.z;

        const k = 1 - Math.pow(0.0015, dt);
        state.cur.x += (state.target.x - state.cur.x) * k;
        state.cur.y += (state.target.y - state.cur.y) * k;
        state.cur.z += (state.target.z - state.cur.z) * k;

        const dx = state.cur.x - state.lastX;
        state.lastX = state.cur.x;
        state.vel.x = dx / Math.max(dt, 0.001);

        g.position.copy(state.cur);

        // Yaw toward movement
        const yaw = state.vel.x * 0.05;
        g.rotation.y = yaw;
        // Slight roll when banking
        g.rotation.z = -state.vel.x * 0.015;
        // Pitch when going up/down (velocity of Y)
        g.rotation.x = Math.sin(t * 1.4) * 0.04;

        // Whole-body undulation (real fish swim from head to tail)
        // We can warp the tail fin + body separately
        const undulate = Math.sin(t * 9);
        tailFin.rotation.y = undulate * 0.55;
        // Slight lateral shift of body — simulates S-curve
        // (Can't easily warp Lathe; fake with slight rotation)
        g.rotation.y += undulate * 0.03;

        // Pectoral fins flap
        pecL.rotation.z =  Math.sin(t * 5) * 0.3;
        pecR.rotation.z = Math.PI + Math.sin(t * 5 + 1) * 0.3;

        // Gill covers breathe
        gillL.rotation.x = Math.sin(t * 4) * 0.15;
        gillR.rotation.x = -Math.sin(t * 4) * 0.15;

        // Fins wave gently
        dorsal.rotation.z = Math.sin(t * 2) * 0.06;
        anal.rotation.z   = Math.sin(t * 2 + 0.5) * 0.06;

        // Subtle idle bob
        g.position.y += Math.sin(t * 2.0) * 0.08;
      }
    };
  }
};

})();
