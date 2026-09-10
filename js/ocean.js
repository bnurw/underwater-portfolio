/* =========================================================
   OCEAN.JS — Gerstner wave surface (DoubleSide + depth fog)
   ========================================================= */
(function(){
'use strict';

window.Ocean = {
  create(scene){
    const SIZE = 3500;
    const SEG  = 200;

    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        uTime:     { value: 0 },
        uDeep:     { value: new THREE.Color(0x003a66) },
        uShallow:  { value: new THREE.Color(0x00b8e6) },
        uSunColor: { value: new THREE.Color(0xfff0b0) },
        uSunDir:   { value: new THREE.Vector3(-0.45, 0.7, -0.55).normalize() },
        uCamPos:   { value: new THREE.Vector3(0, 0, 0) },
        uFogNear:  { value: 500.0 },
        uFogFar:   { value: 3000.0 },
        uFogColor: { value: new THREE.Color(0x0a2a4a) },
        uBelow:    { value: 0.0 }   // 0 = above water, 1 = below
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vWorld;
        varying vec3 vNormal;
        varying float vWave;
        varying float vY;

        vec3 gerstner(vec3 p, vec2 dir, float steep, float wl, float t){
          float k = 6.28318 / wl;
          float c = sqrt(9.8 / k);
          vec2 d = normalize(dir);
          float f = k * (dot(d, p.xz) - c * t);
          float a = steep / k;
          return vec3(
            d.x * a * cos(f),
            a * sin(f),
            d.y * a * cos(f)
          );
        }

        void main(){
          vec3 pos = position;

          vec3 w1 = gerstner(pos, vec2( 1.0,  0.3), 0.28, 260.0, uTime * 0.9);
          vec3 w2 = gerstner(pos, vec2(-0.6,  1.0), 0.22, 180.0, uTime * 1.1);
          vec3 w3 = gerstner(pos, vec2( 0.4, -1.0), 0.18, 110.0, uTime * 1.4);
          vec3 w4 = gerstner(pos, vec2(-0.9, -0.4), 0.12,  60.0, uTime * 1.8);

          pos += w1 + w2 + w3 + w4;
          vWave = pos.y;
          vY = pos.y;

          // normal via finite differences
          float e = 5.0;
          vec3 pX = position + vec3(e, 0, 0);
          vec3 pZ = position + vec3(0, 0, e);
          pX += gerstner(pX, vec2( 1.0, 0.3), 0.28, 260.0, uTime*0.9);
          pX += gerstner(pX, vec2(-0.6, 1.0), 0.22, 180.0, uTime*1.1);
          pX += gerstner(pX, vec2( 0.4,-1.0), 0.18, 110.0, uTime*1.4);
          pX += gerstner(pX, vec2(-0.9,-0.4), 0.12,  60.0, uTime*1.8);

          pZ += gerstner(pZ, vec2( 1.0, 0.3), 0.28, 260.0, uTime*0.9);
          pZ += gerstner(pZ, vec2(-0.6, 1.0), 0.22, 180.0, uTime*1.1);
          pZ += gerstner(pZ, vec2( 0.4,-1.0), 0.18, 110.0, uTime*1.4);
          pZ += gerstner(pZ, vec2(-0.9,-0.4), 0.12,  60.0, uTime*1.8);

          vNormal = normalize(cross(pZ - pos, pX - pos));

          vec4 wp = modelMatrix * vec4(pos, 1.0);
          vWorld = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uDeep, uShallow, uSunColor, uSunDir, uCamPos, uFogColor;
        uniform float uFogNear, uFogFar, uBelow;
        varying vec3 vWorld;
        varying vec3 vNormal;
        varying float vWave;

        void main(){
          vec3 N = normalize(vNormal);
          if (!gl_FrontFacing) N = -N;   // flip when viewed from below
          vec3 V = normalize(uCamPos - vWorld);
          vec3 L = normalize(uSunDir);

          float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
          float h = clamp(vWave * 0.06 + 0.5, 0.0, 1.0);
          vec3 base = mix(uDeep, uShallow, h);
          float diff = max(dot(N, L), 0.0);
          vec3 H = normalize(L + V);
          float spec = pow(max(dot(N, H), 0.0), 90.0);

          vec3 col = base * (0.35 + diff * 0.65);
          col += uSunColor * spec * 1.6 * (1.0 - uBelow * 0.6);
          col = mix(col, uSunColor * 0.6, fres * 0.35 * (1.0 - uBelow * 0.5));

          // Extra depth-darkening when underwater
          col *= (1.0 - uBelow * 0.45);

          float d = distance(uCamPos, vWorld);
          float fog = smoothstep(uFogNear, uFogFar, d);
          col = mix(col, uFogColor, fog);

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    scene.add(mesh);

    return {
      mesh,
      update(t, camPos, depth){
        mat.uniforms.uTime.value = t;
        mat.uniforms.uCamPos.value.copy(camPos);

        // Below-water factor
        mat.uniforms.uBelow.value = Math.max(0, Math.min(1, -depth / 200));

        // Fog scaling with depth
        const dNorm = Math.min(1, depth / 2000);
        mat.uniforms.uFogNear.value = 400 + dNorm * 200;
        mat.uniforms.uFogFar.value  = 3000 - dNorm * 2200;

        // Darken water base as we go deeper
        const shallow = new THREE.Color(0x00b8e6).lerp(new THREE.Color(0x000a18), dNorm);
        const deep    = new THREE.Color(0x003a66).lerp(new THREE.Color(0x000105), dNorm);
        mat.uniforms.uShallow.value.copy(shallow);
        mat.uniforms.uDeep.value.copy(deep);
      },
      setFogColor(hex){
        mat.uniforms.uFogColor.value.setHex(hex);
      }
    };
  }
};

})();
