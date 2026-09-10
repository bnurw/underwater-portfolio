/* =========================================================
   FISHSCHOOL.JS — Realistic Sardine-style school
   - Proper sardine anatomy (fusiform, silver)
   - Realistic synchronized swimming (schooling logic)
   - Silver iridescent material
   ========================================================= */
(function(){
'use strict';

window.FishSchool = {
  create(scene){
    const BASE_COUNT = 45;
    const COUNT = (window.Perf && window.Perf.scaled) ? Math.max(6, window.Perf.scaled(BASE_COUNT)) : BASE_COUNT;
    const group = new THREE.Group();

    /* ---------- SHARED GEOMETRY (real sardine proportions) ---------- */
    // Body: Lathe with proper sardine shape
    const profile = [];
    const STEPS = 24;
    for (let i = 0; i <= STEPS; i++){
      const t = i / STEPS;
      let r;
      if (t < 0.25){
        r = Math.sin(t / 0.25 * Math.PI * 0.5) * 0.22;
      } else if (t < 0.6){
        r = 0.22 + Math.sin((t - 0.25) / 0.35 * Math.PI) * 0.04;
      } else {
        r = 0.24 * (1 - (t - 0.6) / 0.4 * 0.92);
      }
      profile.push(new THREE.Vector2(Math.max(0.005, r), (t - 0.5) * 0.95));
    }
    const bodyGeo = new THREE.LatheGeometry(profile, 10);
    bodyGeo.rotateZ(-Math.PI / 2);
    bodyGeo.scale(1, 1.15, 0.65);
    bodyGeo.computeVertexNormals();

    // Tail fin — forked sardine tail
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0);
    tailShape.bezierCurveTo(-0.1, 0.15, -0.22, 0.28, -0.32, 0.32);
    tailShape.bezierCurveTo(-0.24, 0.15, -0.22, 0.05, -0.22, 0);
    tailShape.bezierCurveTo(-0.22, -0.05, -0.24, -0.15, -0.32, -0.32);
    tailShape.bezierCurveTo(-0.22, -0.28, -0.1, -0.15, 0, 0);
    const tailGeo = new THREE.ShapeGeometry(tailShape, 8);

    // Dorsal fin
    const dorsalShape = new THREE.Shape();
    dorsalShape.moveTo(0, 0);
    dorsalShape.lineTo(0.15, 0);
    dorsalShape.lineTo(0.1, 0.14);
    dorsalShape.lineTo(0, 0.12);
    dorsalShape.lineTo(0, 0);
    const dorsalGeo = new THREE.ShapeGeometry(dorsalShape);

    /* ---------- MATERIALS ---------- */
    // Sardines have silver iridescent sides with blue-green backs
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xb8c8d4,
      emissive: 0x1a2a3a,
      emissiveIntensity: 0.3,
      roughness: 0.35,
      metalness: 0.7,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
      sheen: 0.8,
      sheenColor: 0xd8e8f0
    });

    const finMat = new THREE.MeshPhysicalMaterial({
      color: 0x8a9aa8,
      roughness: 0.5,
      metalness: 0.3,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000810 });
    const eyeGeo = new THREE.SphereGeometry(0.04, 8, 6);

    /* ---------- BUILD FISH ---------- */
    const fishes = [];

    for (let i = 0; i < COUNT; i++){
      const f = new THREE.Group();

      const body = new THREE.Mesh(bodyGeo, bodyMat);
      f.add(body);

      const tail = new THREE.Mesh(tailGeo, finMat);
      tail.position.set(-0.5, 0, 0);
      f.add(tail);

      const dorsal = new THREE.Mesh(dorsalGeo, finMat);
      dorsal.position.set(0.05, 0.22, 0);
      dorsal.rotation.y = Math.PI / 2;
      f.add(dorsal);

      // Eyes
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(0.42, 0.06, 0.12);
      f.add(eyeL);
      const eyeR = eyeL.clone();
      eyeR.position.set(0.42, 0.06, -0.12);
      f.add(eyeR);

      // Each fish has a home position and orbit
      const data = {
        mesh: f,
        tail,
        home: new THREE.Vector3(
          (Math.random() - 0.5) * 180,
          -60 - Math.random() * 240,
          -30 - Math.random() * 200
        ),
        orbitR: 2 + Math.random() * 5,
        orbitSpeed: 0.3 + Math.random() * 0.3,
        orbitPhase: Math.random() * Math.PI * 2,
        wobbleAmp: 1 + Math.random() * 2,
        wobbleSpeed: 0.5 + Math.random() * 0.5,
        scale: 0.55 + Math.random() * 0.4,
        velocity: new THREE.Vector3()
      };
      f.scale.setScalar(data.scale);
      group.add(f);
      fishes.push(data);
    }

    scene.add(group);

    const prevPos = new THREE.Vector3();

    return {
      group,
      update(dt, t, camPos){
        fishes.forEach((f, i) => {
          prevPos.copy(f.mesh.position);

          // Orbital motion around home
          const a = t * f.orbitSpeed + f.orbitPhase;
          const x = f.home.x + Math.cos(a) * f.orbitR;
          const y = f.home.y + Math.sin(a * 1.4) * f.wobbleAmp;
          const z = f.home.z + Math.sin(a) * f.orbitR;

          f.mesh.position.set(x, y, z);

          // Face direction of motion
          const dx = x - prevPos.x;
          const dz = z - prevPos.z;
          if (Math.abs(dx) + Math.abs(dz) > 0.0001){
            const targetYaw = Math.atan2(dz, dx) + Math.PI;
            // Smooth turn
            let dy = targetYaw - f.mesh.rotation.y;
            while (dy > Math.PI) dy -= Math.PI * 2;
            while (dy < -Math.PI) dy += Math.PI * 2;
            f.mesh.rotation.y += dy * Math.min(1, dt * 5);
          }

          // Roll on turns
          f.mesh.rotation.z = Math.sin(a * 2) * 0.1;

          // Tail wag — fast when moving
          f.tail.rotation.y = Math.sin(t * 18 + i) * 0.45;

          // Camera avoidance
          const dist = f.mesh.position.distanceTo(camPos);
          if (dist < 10){
            const away = f.mesh.position.clone().sub(camPos).normalize().multiplyScalar((10 - dist) * 0.5);
            f.mesh.position.add(away);
          }
        });
      }
    };
  }
};

})();
