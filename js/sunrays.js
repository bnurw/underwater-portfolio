/* =========================================================
   SUNRAYS.JS — Underwater godrays (visible when below surface)
   ========================================================= */
(function(){
'use strict';

window.Sunrays = {
  create(scene){
    const group = new THREE.Group();

    // Multiple cone-shaped light shafts
    const RAY_COUNT = 9;
    const rays = [];

    for (let i = 0; i < RAY_COUNT; i++){
      const geo = new THREE.CylinderGeometry(
        2 + Math.random() * 3,     // top radius
        18 + Math.random() * 12,   // bottom radius
        140 + Math.random() * 60,  // height
        16, 1, true
      );
      const mat = new THREE.MeshBasicMaterial({
        color: 0xbfe8ff,
        transparent: true,
        opacity: 0.08 + Math.random() * 0.08,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const cone = new THREE.Mesh(geo, mat);

      cone.position.set(
        (Math.random() - 0.5) * 200,
        -20 - Math.random() * 40,
        (Math.random() - 0.5) * 200 - 60
      );
      cone.rotation.z = (Math.random() - 0.5) * 0.3;
      cone.rotation.x = (Math.random() - 0.5) * 0.15;
      cone.userData = {
        baseX: cone.position.x,
        baseZ: cone.position.z,
        phase: Math.random() * Math.PI * 2,
        baseOpacity: mat.opacity,
        baseRotZ: cone.rotation.z
      };
      group.add(cone);
      rays.push(cone);
    }

    scene.add(group);

    // Also a soft floor light patch (bright zone under surface)
    const patchGeo = new THREE.CircleGeometry(200, 32);
    patchGeo.rotateX(-Math.PI / 2);
    const patchMat = new THREE.MeshBasicMaterial({
      color: 0x9fd8f0,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const patch = new THREE.Mesh(patchGeo, patchMat);
    patch.position.y = -50;
    group.add(patch);

    return {
      group,
      update(t, depth, camY){
        // Show only when below water surface (depth > 40) and not too deep
        const showFactor = Math.max(0, Math.min(1,
          Math.min((depth - 20) / 80, (600 - depth) / 200)
        ));

        // Keep rays around the camera Y
        group.position.y = camY;

        rays.forEach((r, i) => {
          const u = r.userData;
          // Slow sway
          r.position.x = u.baseX + Math.sin(t * 0.3 + u.phase) * 8;
          r.position.z = u.baseZ + Math.cos(t * 0.25 + u.phase) * 8;
          r.rotation.z = u.baseRotZ + Math.sin(t * 0.4 + u.phase) * 0.06;
          // Pulse opacity
          const pulse = 0.7 + Math.sin(t * 0.8 + u.phase) * 0.3;
          r.material.opacity = u.baseOpacity * pulse * showFactor;
        });

        patch.material.opacity = 0.06 * showFactor;
      }
    };
  }
};

})();
