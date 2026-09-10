/* =========================================================
   MAIN.JS — Part 6
   ========================================================= */
(function(){
'use strict';

let scene, camera, renderer, clock;
let sky, ocean, dive, sunrays, plankton;
let playerFish, fishSchool, reef, jellyfish;
let floor, shipwreck, treasure, anglerfish, squid, bottle;
let mouse = { x: 0, y: 0 };

function init(){
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x4a9fd4, 500, 3000);

  camera = new THREE.PerspectiveCamera(
    62, window.innerWidth / window.innerHeight, 0.1, 8000
  );
  camera.position.set(0, 12, 30);
  camera.lookAt(0, 6, -100);

  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('scene'),
    antialias: true,
    powerPreference: 'high-performance'
  });
  const pr = (window.Perf && window.Perf.cfg.pixelRatio) || Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.physicallyCorrectLights = true;

  // Environment (for glass reflections)
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(makeEnvScene(), 0.04).texture;

  // Lights
  const hemi = new THREE.HemisphereLight(0xbfe3f5, 0x003a66, 1.1);
  scene.add(hemi);
  const sunLight = new THREE.DirectionalLight(0xfff2b0, 1.6);
  sunLight.position.set(-900, 750, -1800);
  scene.add(sunLight);
  const ambient = new THREE.AmbientLight(0x88bbdd, 0.35);
  scene.add(ambient);
  scene.userData.sunLight = sunLight;
  scene.userData.hemi = hemi;

  // World
  sky        = Sky.create(scene);
  ocean      = Ocean.create(scene);
  sunrays    = Sunrays.create(scene);
  plankton   = Plankton.create(scene);
  fishSchool = FishSchool.create(scene);
  reef       = Reef.create(scene);
  jellyfish  = Jellyfish.create(scene, camera);
  floor      = Floor.create(scene);
  shipwreck  = Shipwreck.create(scene);
  treasure   = Treasure.create(scene, camera);
  anglerfish = Anglerfish.create(scene);
  squid      = Squid.create(scene);
  bottle     = Bottle.create(scene, camera);
  playerFish = PlayerFish.create(scene, camera);

  dive = Dive.init(camera, sky, ocean) || window.Dive;
  dive = window.Dive;

  clock = new THREE.Clock();

  window.addEventListener('resize', onResize);
  window.addEventListener('perf-tier-change', () => {
    if (!renderer || !window.Perf) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.Perf.cfg.pixelRatio));
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  const updatePointer = (x, y) => {
    mouse.x = (x / window.innerWidth)  * 2 - 1;
    mouse.y = (y / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('mousemove', e => updatePointer(e.clientX, e.clientY));
  window.addEventListener('touchmove', e => {
    if (e.touches.length) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchstart', e => {
    if (e.touches.length) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  window.addEventListener('load', () => {
    const pre  = document.getElementById('preloader');
    const fill = document.querySelector('.pre-bar-fill');
    let p = 0;
    const t = setInterval(() => {
      p += 8 + Math.random() * 12;
      if (p >= 100){ p = 100; clearInterval(t); }
      fill.style.width = p + '%';
      if (p >= 100){
        setTimeout(() => {
          pre.classList.add('hide');
          document.getElementById('depthMeter').classList.add('show');
          document.getElementById('muteBtn').classList.add('show');
        }, 300);
      }
    }, 120);
  });

  window.addEventListener('load', () => dive.onScroll());

  animate();
}

/* ---------- Simple environment scene for glass reflections ---------- */
function makeEnvScene(){
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x0a2a4a);
  const hemi = new THREE.HemisphereLight(0x9fd8ff, 0x001020, 1);
  s.add(hemi);
  const p1 = new THREE.PointLight(0xffffff, 2, 100);
  p1.position.set(20, 30, 20);
  s.add(p1);
  const p2 = new THREE.PointLight(0x88ccff, 1.5, 100);
  p2.position.set(-30, 20, 10);
  s.add(p2);
  return s;
}

function onResize(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  const pr = (window.Perf && window.Perf.cfg.pixelRatio) || Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pr));
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(){
  requestAnimationFrame(animate);

  // Skip rendering when tab hidden (battery save)
  if (window.Perf && window.Perf.hidden){
    clock.getDelta(); // keep clock in sync
    return;
  }

  const t  = clock.getElapsedTime();
  const dt = Math.min(clock.getDelta(), 0.05);

  dive.update(dt, t);

  const fogHex = sky.updateDepth(dive.depth);
  sky.update(t);

  scene.fog.color.setHex(fogHex);
  const dNorm = Math.min(1, dive.depth / 2000);
  scene.fog.near = 400 + dNorm * 100;
  scene.fog.far  = 3000 - dNorm * 2600;

  ocean.update(t, camera.position, dive.depth);
  ocean.setFogColor(fogHex);

  sunrays.update(t, dive.depth, camera.position.y);
  plankton.update(t, dive.depth);
  fishSchool.update(dt, t, camera.position);
  reef.update(t);
  jellyfish.update(dt, t, dive.depth);

  floor.update(t, dive.depth);
  shipwreck.update(t);
  treasure.update(dt, t, dive.depth);
  anglerfish.update(t);
  squid.update(t);
  bottle.update(dt, t, dive.depth);

  playerFish.update(dt, t, mouse.x, mouse.y);

  // Reduced motion: half-speed everything
  const motionScale = (window.Perf && window.Perf.reducedMotion) ? 0.35 : 1.0;
  if (motionScale !== 1){
    // Nudge time-scale via animation influence
    playerFish.update(dt * motionScale, t * 0.5, mouse.x, mouse.y);
  }

  const lightFactor = Math.max(0.06, 1 - dNorm * 1.1);
  scene.userData.sunLight.intensity = 1.6 * lightFactor;
  scene.userData.hemi.intensity     = 1.1 * lightFactor;

  renderer.render(scene, camera);
}

init();

})();
