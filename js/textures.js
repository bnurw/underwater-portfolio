/* =========================================================
   TEXTURES.JS — Procedural PBR textures (canvas-based)
   Wood · Rust · Barnacle · Sand · Sail
   ========================================================= */
(function(){
'use strict';

window.Tex = {

  /* ---------------- AGED WOOD ---------------- */
  wood(size = 512){
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');

    // base
    const baseGrad = ctx.createLinearGradient(0, 0, size, size);
    baseGrad.addColorStop(0, '#241a10');
    baseGrad.addColorStop(0.5, '#3a2818');
    baseGrad.addColorStop(1, '#1e1408');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, size, size);

    // Wood grain — long sinuous lines
    for (let g = 0; g < 140; g++){
      const baseY = Math.random() * size;
      const amp   = 1 + Math.random() * 6;
      const freq  = 0.01 + Math.random() * 0.03;
      const alpha = 0.15 + Math.random() * 0.35;
      const light = Math.random() < 0.3 ? 60 : 15;
      const dark  = Math.random() < 0.3 ? 30 : 8;
      ctx.strokeStyle = `rgba(${light + Math.random()*20}, ${dark + Math.random()*15}, ${dark/1.5}, ${alpha})`;
      ctx.lineWidth = 0.4 + Math.random() * 1.6;
      ctx.beginPath();
      for (let x = 0; x <= size; x += 12){
        const y = baseY + Math.sin(x * freq + g * 0.5) * amp + Math.cos(x * freq * 2.3) * (amp*0.4);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Knots
    for (let k = 0; k < 2; k++){
      const kx = 60 + Math.random() * (size - 120);
      const ky = 60 + Math.random() * (size - 120);
      const kr = 14 + Math.random() * 22;
      const g = ctx.createRadialGradient(kx, ky, 2, kx, ky, kr);
      g.addColorStop(0, 'rgba(10,6,2,0.9)');
      g.addColorStop(0.5, 'rgba(35,20,10,0.6)');
      g.addColorStop(1, 'rgba(35,20,10,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(kx, ky, kr, 0, Math.PI * 2); ctx.fill();

      // concentric rings around knot
      for (let r = 3; r < kr; r += 2.5){
        ctx.strokeStyle = `rgba(20,12,5,${0.35 - r / kr * 0.3})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.arc(kx, ky, r, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // Water stains / rot patches
    for (let s = 0; s < 26; s++){
      const sx = Math.random() * size;
      const sy = Math.random() * size;
      const sr = 20 + Math.random() * 70;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      g.addColorStop(0, 'rgba(8,4,0,0.3)');
      g.addColorStop(1, 'rgba(8,4,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }

    // Dark cracks
    for (let cr = 0; cr < 18; cr++){
      ctx.strokeStyle = `rgba(0,0,0,${0.25 + Math.random()*0.35})`;
      ctx.lineWidth = 0.5 + Math.random() * 1.2;
      let x = Math.random() * size;
      let y = Math.random() * size;
      ctx.beginPath(); ctx.moveTo(x, y);
      const steps = 6 + Math.floor(Math.random() * 8);
      for (let s = 0; s < steps; s++){
        x += (Math.random() - 0.5) * 60;
        y += (Math.random() - 0.5) * 60;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  },

  /* ---------------- RUST ---------------- */
  rust(size = 512){
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');

    // base dark brown
    ctx.fillStyle = '#1e1408';
    ctx.fillRect(0, 0, size, size);

    // Patchy rust blobs
    for (let i = 0; i < 200; i++){
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 4 + Math.random() * 40;
      const hue = 15 + Math.random() * 30;
      const sat = 40 + Math.random() * 40;
      const light = 12 + Math.random() * 30;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0,   `hsla(${hue}, ${sat}%, ${light}%, ${0.3 + Math.random()*0.4})`);
      g.addColorStop(0.5, `hsla(${hue}, ${sat}%, ${light*0.7}%, ${0.15 + Math.random()*0.2})`);
      g.addColorStop(1,   `hsla(${hue}, ${sat}%, ${light*0.5}%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    // Speckle noise
    const img = ctx.getImageData(0, 0, size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4){
      const n = (Math.random() - 0.5) * 50;
      d[i]   = Math.max(0, Math.min(255, d[i] + n));
      d[i+1] = Math.max(0, Math.min(255, d[i+1] + n));
      d[i+2] = Math.max(0, Math.min(255, d[i+2] + n));
    }
    ctx.putImageData(img, 0, 0);

    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  },

  /* ---------------- SAND ---------------- */
  sand(size = 512){
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#3a3225';
    ctx.fillRect(0, 0, size, size);

    // grain speckle
    const img = ctx.getImageData(0, 0, size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4){
      const n = (Math.random() - 0.5) * 60;
      d[i]   = Math.max(0, Math.min(255, 58 + n + Math.random()*20));
      d[i+1] = Math.max(0, Math.min(255, 50 + n + Math.random()*18));
      d[i+2] = Math.max(0, Math.min(255, 37 + n + Math.random()*15));
    }
    ctx.putImageData(img, 0, 0);

    // Larger stone/pebble blotches
    for (let i = 0; i < 40; i++){
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 3 + Math.random() * 12;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(20,16,10,0.6)');
      g.addColorStop(1, 'rgba(20,16,10,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  },

  /* ---------------- BARNACLE (color variation texture) ---------------- */
  barnacle(size = 128){
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#a8a49a';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 60; i++){
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 2 + Math.random() * 8;
      ctx.fillStyle = `rgba(${140 + Math.random()*40},${138 + Math.random()*30},${120 + Math.random()*30},${0.4 + Math.random()*0.4})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  },

  /* ---------------- TORN SAIL (with alpha) ---------------- */
  sail(size = 512){
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#8a7a5e';
    ctx.fillRect(0, 0, size, size);

    // Woven fabric lines
    for (let i = 0; i < 200; i++){
      ctx.strokeStyle = `rgba(${40 + Math.random()*30},${35 + Math.random()*25},${20 + Math.random()*15},${0.1 + Math.random()*0.2})`;
      ctx.lineWidth = 0.5 + Math.random() * 0.7;
      if (Math.random() < 0.5){
        const y = Math.random() * size;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
      } else {
        const x = Math.random() * size;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
      }
    }

    // Aging blotches
    for (let i = 0; i < 30; i++){
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 20 + Math.random() * 60;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(30,25,10,0.4)');
      g.addColorStop(1, 'rgba(30,25,10,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    // Torn edges — punch transparent holes near edges
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 40; i++){
      const x = Math.random() * size;
      const y = Math.random() < 0.5 ? 0 : size;
      const r = 8 + Math.random() * 22;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    // Big tears in middle
    for (let i = 0; i < 6; i++){
      ctx.beginPath();
      let x = Math.random() * size;
      let y = Math.random() * size;
      ctx.moveTo(x, y);
      for (let s = 0; s < 6; s++){
        x += (Math.random() - 0.5) * 90;
        y += (Math.random() - 0.5) * 90;
        ctx.lineTo(x, y);
      }
      ctx.lineWidth = 4 + Math.random() * 14;
      ctx.strokeStyle = '#000';
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';

    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  },

  /* ---------------- ROUGHNESS MAP (grayscale) ---------------- */
  rough(colorTex, contrast = 1){
    const src = colorTex.image;
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4){
      const g = (d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114);
      const v = Math.max(0, Math.min(255, 128 + (g - 128) * contrast));
      d[i] = d[i+1] = d[i+2] = v;
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
};

})();
