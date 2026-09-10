/* =========================================================
   SKY.JS — Sky dome + Sun + godrays (depth-aware colors)
   ========================================================= */
(function(){
'use strict';

window.Sky = {
  create(scene){
    const group = new THREE.Group();
    group.name = 'Sky';

    /* ---- Palettes by depth ---- */
    const PAL = {
      surface : { top:0x0a2a5a, mid:0x4a9fd4, bottom:0xd8eefc, fog:0x4a9fd4 },
      shallow : { top:0x06305c, mid:0x1a7ab5, bottom:0x66c0e8, fog:0x1a7ab5 },
      mid     : { top:0x041d40, mid:0x0a4a7a, bottom:0x1a86b8, fog:0x0a3a66 },
      deep    : { top:0x010d1f, mid:0x052a4a, bottom:0x0a4a70, fog:0x051e33 },
      abyss   : { top:0x000308, mid:0x010b18, bottom:0x021828, fog:0x000a14 }
    };

    const domeGeo = new THREE.SphereGeometry(3000, 48, 32);
    const domeMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop:    { value: new THREE.Color(PAL.surface.top) },
        uMid:    { value: new THREE.Color(PAL.surface.mid) },
        uBottom: { value: new THREE.Color(PAL.surface.bottom) },
        uOffset: { value: 200.0 },
        uExp:    { value: 0.65 }
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main(){
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uTop, uMid, uBottom;
        uniform float uOffset, uExp;
        varying vec3 vWorldPos;
        void main(){
          float h = normalize(vWorldPos + vec3(0.0, uOffset, 0.0)).y;
          float t = pow(clamp(h, 0.0, 1.0), uExp);
          vec3 col = mix(uBottom, uMid, smoothstep(0.0, 0.5, t));
          col = mix(col, uTop, smoothstep(0.4, 1.0, t));
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    group.add(dome);

    /* ---- Sun ---- */
    const sunPos = new THREE.Vector3(-900, 750, -1800);
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(70, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xfff2b0 })
    );
    sun.position.copy(sunPos);
    group.add(sun);

    const glowTex = makeGlowTex();
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xfff2b0, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    glow.scale.set(900, 900, 1); glow.position.copy(sunPos);
    group.add(glow);

    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xffe28a, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    halo.scale.set(2400, 2400, 1); halo.position.copy(sunPos);
    group.add(halo);

    const rays = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeRaysTex(), color: 0xfff2b0, transparent: true, opacity: 0.25,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    rays.scale.set(2600, 2600, 1); rays.position.copy(sunPos);
    group.add(rays);

    scene.add(group);

    // Palette mixer helper
    const cA = new THREE.Color(), cB = new THREE.Color(), cOut = new THREE.Color();
    function lerpPal(a, b, t){
      cOut.setHex(a).lerp(cB.setHex(b), t);
      return cOut;
    }

    return {
      group,
      sunPos,

      /* called by Dive.update() each frame */
      updateDepth(depth){
        // pick two palette stops + mix factor
        let a, b, f;
        if (depth < 100){ a = PAL.surface; b = PAL.shallow; f = depth / 100; }
        else if (depth < 400){ a = PAL.shallow; b = PAL.mid;  f = (depth - 100) / 300; }
        else if (depth < 1000){ a = PAL.mid;    b = PAL.deep; f = (depth - 400) / 600; }
        else { a = PAL.deep; b = PAL.abyss; f = Math.min(1, (depth - 1000) / 1000); }

        domeMat.uniforms.uTop.value.setHex(a.top).lerp(cB.setHex(b.top), f);
        domeMat.uniforms.uMid.value.setHex(a.mid).lerp(cB.setHex(b.mid), f);
        domeMat.uniforms.uBottom.value.setHex(a.bottom).lerp(cB.setHex(b.bottom), f);

        // Fade sun glow when deep
        const sunFade = Math.max(0, 1 - depth / 400);
        glow.material.opacity = 0.85 * sunFade;
        halo.material.opacity = 0.35 * sunFade;
        rays.material.opacity = 0.25 * sunFade;
        sun.material.color.setRGB(
          1.0 * sunFade + 0.05,
          0.95 * sunFade + 0.05,
          0.69 * sunFade + 0.1
        );

        return lerpPal(a.fog, b.fog, f).getHex();
      },

      update(t){
        rays.material.rotation = t * 0.03;
        const p = 1 + Math.sin(t * 1.2) * 0.03;
        glow.scale.set(900 * p, 900 * p, 1);
      }
    };
  }
};

/* ---- HELPERS ---- */
function makeGlowTex(){
  const s = 512, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
  g.addColorStop(0,   'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,245,200,0.8)');
  g.addColorStop(0.5, 'rgba(255,220,120,0.25)');
  g.addColorStop(1,   'rgba(255,220,120,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,s,s);
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  return t;
}

function makeRaysTex(){
  const s = 1024, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.translate(s/2, s/2);
  for (let i = 0; i < 14; i++){
    const a = (i/14) * Math.PI * 2;
    const w = 0.08 + Math.random() * 0.05;
    ctx.save(); ctx.rotate(a);
    const grad = ctx.createLinearGradient(0,0,0,s/2);
    grad.addColorStop(0,   'rgba(255,245,200,0)');
    grad.addColorStop(0.3, 'rgba(255,245,200,0.28)');
    grad.addColorStop(1,   'rgba(255,245,200,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(-s*w, s/2);
    ctx.lineTo( s*w, s/2);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  return t;
}

})();
