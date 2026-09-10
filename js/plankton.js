/* =========================================================
   PLANKTON.JS — Tiny glowing dots drifting in the deep
   ========================================================= */
(function(){
'use strict';

window.Plankton = {
  create(scene){
    const BASE_COUNT = 400;
    const COUNT = (window.Perf && window.Perf.scaled) ? window.Perf.scaled(BASE_COUNT) : BASE_COUNT;
    const RANGE_X = 260;
    const RANGE_Y = 400;
    const RANGE_Z = 260;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const sizes     = new Float32Array(COUNT);
    const phases    = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++){
      positions[i*3]     = (Math.random() - 0.5) * RANGE_X;
      positions[i*3 + 1] = -100 - Math.random() * RANGE_Y;
      positions[i*3 + 2] = -30 - Math.random() * RANGE_Z;
      sizes[i]  = 0.6 + Math.random() * 1.6;
      phases[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase',   new THREE.BufferAttribute(phases, 1));

    const tex = makeDotTex();
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTex:        { value: tex },
        uTime:       { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uOpacity:    { value: 0.0 }   // faded in by depth
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vAlpha;
        void main(){
          vAlpha = 0.5 + 0.5 * sin(uTime * 1.6 + aPhase);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio * (260.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        uniform float uOpacity;
        varying float vAlpha;
        void main(){
          vec4 tex = texture2D(uTex, gl_PointCoord);
          gl_FragColor = vec4(tex.rgb, tex.a * vAlpha * uOpacity);
        }
      `
    });

    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);

    const baseY = positions.slice();

    return {
      points,
      update(t, depth){
        // Only visible between 250m and 1200m
        const vis = Math.max(0, Math.min(1,
          Math.min((depth - 200) / 200, (1200 - depth) / 300)
        ));
        mat.uniforms.uOpacity.value = vis * 0.85;
        mat.uniforms.uTime.value = t;

        // Gentle drift
        const arr = geo.attributes.position.array;
        for (let i = 0; i < COUNT; i++){
          arr[i*3 + 1] = baseY[i*3 + 1] + Math.sin(t * 0.4 + phases[i]) * 3;
        }
        geo.attributes.position.needsUpdate = true;
      }
    };
  }
};

/* ---- Helper ---- */
function makeDotTex(){
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
  g.addColorStop(0,   'rgba(190,230,255,1)');
  g.addColorStop(0.35,'rgba(150,180,255,0.6)');
  g.addColorStop(1,   'rgba(150,180,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,s,s);
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  return t;
}

})();
