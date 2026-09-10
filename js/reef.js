/* =========================================================
   REEF.JS — Coral reef clusters + seaweed for sunlight zone
   ========================================================= */
(function(){
'use strict';

window.Reef = {
  create(scene){
    const group = new THREE.Group();

    const CORAL_COLORS = [
      0xff6b9d, 0xff8a4c, 0xffd93d, 0x7ef2c8, 0xb388ff, 0xff5c8a
    ];

    // ---- CORAL CLUSTERS ----
    const BASE_CLUSTERS = 14;
    const CLUSTER_COUNT = (window.Perf && window.Perf.scaled) ? Math.max(4, window.Perf.scaled(BASE_CLUSTERS)) : BASE_CLUSTERS;
    const clusters = [];

    for (let c = 0; c < CLUSTER_COUNT; c++){
      const cx = (Math.random() - 0.5) * 260;
      const cz = -20 - Math.random() * 200;
      const cy = -80 - Math.random() * 200;

      const cluster = new THREE.Group();
      cluster.position.set(cx, cy, cz);

      // Each cluster has 4-8 branches
      const branches = 4 + Math.floor(Math.random() * 5);
      const baseColor = CORAL_COLORS[Math.floor(Math.random() * CORAL_COLORS.length)];
      const clusterColor = new THREE.Color(baseColor);

      for (let b = 0; b < branches; b++){
        const height = 3 + Math.random() * 8;
        const radiusTop = 0.4 + Math.random() * 0.8;
        const radiusBot = 0.6 + Math.random() * 1.2;

        const geo = new THREE.CylinderGeometry(radiusTop, radiusBot, height, 6, 1);
        const mat = new THREE.MeshStandardMaterial({
          color: clusterColor.clone().offsetHSL(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.15
          ),
          emissive: clusterColor.clone().multiplyScalar(0.25),
          emissiveIntensity: 0.5,
          roughness: 0.7,
          metalness: 0.1,
          flatShading: true
        });
        const branch = new THREE.Mesh(geo, mat);

        // Random offset & lean
        const ang = (b / branches) * Math.PI * 2 + Math.random() * 0.6;
        const dist = Math.random() * 2.5;
        branch.position.set(
          Math.cos(ang) * dist,
          height / 2,
          Math.sin(ang) * dist
        );
        branch.rotation.z = (Math.random() - 0.5) * 0.4;
        branch.rotation.x = (Math.random() - 0.5) * 0.4;
        branch.userData = {
          baseRotZ: branch.rotation.z,
          baseRotX: branch.rotation.x,
          phase: Math.random() * Math.PI * 2
        };

        cluster.add(branch);
      }

      // Soft glow bulb on top of each cluster
      const glowMat = new THREE.SpriteMaterial({
        map: makeGlowTex(),
        color: clusterColor,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const glow = new THREE.Sprite(glowMat);
      glow.scale.set(24, 24, 1);
      glow.position.y = 6;
      cluster.add(glow);

      group.add(cluster);
      clusters.push({
        group: cluster,
        baseY: cy,
        phase: Math.random() * Math.PI * 2,
        glow
      });
    }

    // ---- SEAWEED ----
    const BASE_WEEDS = 30;
    const WEED_COUNT = (window.Perf && window.Perf.scaled) ? Math.max(8, window.Perf.scaled(BASE_WEEDS)) : BASE_WEEDS;
    const weeds = [];
    for (let w = 0; w < WEED_COUNT; w++){
      const h = 4 + Math.random() * 10;
      const geo = new THREE.PlaneGeometry(0.6, h, 1, 6);
      geo.translate(0, h / 2, 0);

      const mat = new THREE.MeshStandardMaterial({
        color: 0x2ecc71,
        emissive: 0x003311,
        emissiveIntensity: 0.4,
        roughness: 0.8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const weed = new THREE.Mesh(geo, mat);
      weed.position.set(
        (Math.random() - 0.5) * 300,
        -90 - Math.random() * 150,
        -10 - Math.random() * 200
      );
      weed.rotation.y = Math.random() * Math.PI;
      weed.userData = {
        baseRotY: weed.rotation.y,
        phase: Math.random() * Math.PI * 2,
        swayAmt: 0.15 + Math.random() * 0.15,
        h
      };
      group.add(weed);
      weeds.push(weed);
    }

    scene.add(group);

    return {
      group,
      update(t){
        // Corals breathe
        clusters.forEach(c => {
          c.glow.material.opacity = 0.28 + Math.sin(t * 1.5 + c.phase) * 0.12;
          c.group.children.forEach(ch => {
            if (ch.userData && ch.userData.phase !== undefined){
              ch.rotation.z = ch.userData.baseRotZ + Math.sin(t * 0.9 + ch.userData.phase) * 0.05;
              ch.rotation.x = ch.userData.baseRotX + Math.cos(t * 0.8 + ch.userData.phase) * 0.04;
            }
          });
        });

        // Seaweed sway
        weeds.forEach(w => {
          const u = w.userData;
          w.rotation.z = Math.sin(t * 1.4 + u.phase) * u.swayAmt;
          w.rotation.x = Math.cos(t * 1.1 + u.phase) * u.swayAmt * 0.5;
        });
      }
    };
  }
};

/* ---- Helper ---- */
function makeGlowTex(){
  const s = 256, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
  g.addColorStop(0,   'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  g.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,s,s);
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  return t;
}

})();
