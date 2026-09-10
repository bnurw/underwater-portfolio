/* =========================================================
   FLOOR.JS — Two visible seafloors (abyssal + trench)
   ========================================================= */
(function(){
'use strict';

window.Floor = {
  create(scene){
    const group = new THREE.Group();

    /* ============ SHARED TEXTURES ============ */
    const sandTex = Tex.sand(512);
    sandTex.repeat.set(50, 50);
    const sandRough = Tex.rough(sandTex, 0.3);

    const rockTex = Tex.rust(256);
    rockTex.repeat.set(2, 2);

    /* ============ FLOOR BUILDER ============ */
    function buildFloor(yLevel, size, colorHex, rockColorHex, rockCount, sedimentCount){
      if (window.Perf && window.Perf.scaled){
        rockCount = Math.max(15, window.Perf.scaled(rockCount));
        sedimentCount = Math.max(40, window.Perf.scaled(sedimentCount));
      }
      const g = new THREE.Group();

      /* --- Sand plane with dunes --- */
      const geo = new THREE.PlaneGeometry(size, size, 96, 96);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++){
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const h =
          Math.sin(x * 0.012) * 2.5 +
          Math.cos(z * 0.015) * 2.0 +
          Math.sin((x + z) * 0.008) * 3.5 +
          (Math.random() - 0.5) * 0.4;
        pos.setY(i, h);
      }
      geo.computeVertexNormals();

      const sandMat = new THREE.MeshStandardMaterial({
        map: sandTex,
        roughnessMap: sandRough,
        color: colorHex,
        roughness: 1.0,
        metalness: 0.0
      });
      const floor = new THREE.Mesh(geo, sandMat);
      floor.position.y = yLevel;
      g.add(floor);

      /* --- Rocks scattered --- */
      const rockGeo = new THREE.DodecahedronGeometry(1, 0);
      const rp = rockGeo.attributes.position;
      for (let i = 0; i < rp.count; i++){
        rp.setX(i, rp.getX(i) * (0.7 + Math.random() * 0.5));
        rp.setY(i, rp.getY(i) * (0.5 + Math.random() * 0.5));
        rp.setZ(i, rp.getZ(i) * (0.7 + Math.random() * 0.5));
      }
      rockGeo.computeVertexNormals();

      const rockMat = new THREE.MeshStandardMaterial({
        color: rockColorHex,
        roughness: 0.95,
        metalness: 0.05,
        flatShading: true,
        map: rockTex
      });

      const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < rockCount; i++){
        const r = 1 + Math.random() * 8;
        dummy.position.set(
          (Math.random() - 0.5) * size * 0.9,
          yLevel + r * 0.35,
          (Math.random() - 0.5) * size * 0.9
        );
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        dummy.scale.set(r * 0.9, r * 0.5, r * 0.9);
        dummy.updateMatrix();
        rocks.setMatrixAt(i, dummy.matrix);
      }
      rocks.instanceMatrix.needsUpdate = true;
      g.add(rocks);

      /* --- Sediment particles --- */
      const SED_COUNT = sedimentCount;
      const sedGeo = new THREE.BufferGeometry();
      const sedPos = new Float32Array(SED_COUNT * 3);
      const sedPhase = new Float32Array(SED_COUNT);
      for (let i = 0; i < SED_COUNT; i++){
        sedPos[i*3]     = (Math.random() - 0.5) * size * 0.4;
        sedPos[i*3 + 1] = yLevel + Math.random() * 30;
        sedPos[i*3 + 2] = (Math.random() - 0.5) * size * 0.4;
        sedPhase[i] = Math.random() * Math.PI * 2;
      }
      sedGeo.setAttribute('position', new THREE.BufferAttribute(sedPos, 3));
      sedGeo.setAttribute('aPhase', new THREE.BufferAttribute(sedPhase, 1));

      const sedMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTex: { value: makeDotTex() },
          uTime: { value: 0 },
          uOpacity: { value: 0.85 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
        },
        vertexShader: `
          attribute float aPhase;
          uniform float uTime;
          uniform float uPixelRatio;
          varying float vAlpha;
          void main(){
            vec3 p = position;
            p.y += sin(uTime * 0.4 + aPhase) * 4.0;
            p.x += cos(uTime * 0.3 + aPhase) * 2.5;
            vAlpha = 0.4 + 0.6 * sin(uTime * 0.8 + aPhase);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = (1.0 + 1.5 * vAlpha) * uPixelRatio * (280.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform sampler2D uTex;
          uniform float uOpacity;
          varying float vAlpha;
          void main(){
            vec4 tex = texture2D(uTex, gl_PointCoord);
            gl_FragColor = vec4(0.55, 0.5, 0.42, tex.a * vAlpha * uOpacity * 0.6);
          }
        `
      });
      const sediment = new THREE.Points(sedGeo, sedMat);
      sediment.frustumCulled = false;
      g.add(sediment);

      return { group: g, sedimentMat: sedMat, floorMesh: floor };
    }

    /* ============ SHALLOW FLOOR (abyssal — shipwreck level) ============ */
    const shallow = buildFloor(-1090, 1400, 0x6a5a3a, 0x2a2620, 80, 200);

    /* ============ DEEP FLOOR (trench) ============ */
    const deep = buildFloor(-2090, 1400, 0x2a2420, 0x141210, 60, 250);

    group.add(shallow.group);
    group.add(deep.group);

    scene.add(group);

    return {
      group,
      update(t, depth){
        // Shallow floor visible 850m-1500m
        const shallowVis = Math.max(0, Math.min(1,
          Math.min((depth - 850) / 150, (1500 - depth) / 200)
        ));
        // Deep floor visible from 1700m down
        const deepVis = Math.max(0, Math.min(1, (depth - 1700) / 200));

        shallow.group.visible = shallowVis > 0.01;
        deep.group.visible    = deepVis > 0.01;

        shallow.sedimentMat.uniforms.uTime.value = t;
        shallow.sedimentMat.uniforms.uOpacity.value = shallowVis * 0.9;

        deep.sedimentMat.uniforms.uTime.value = t;
        deep.sedimentMat.uniforms.uOpacity.value = deepVis * 0.9;
      }
    };
  }
};

function makeDotTex(){
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.3)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  return t;
}

})();
