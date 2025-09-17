// Supernatural Phoning Activity (Base Scaffold)
// -------------------------------------------------
// This is a lightweight, uploadable static activity shell.
// Later you can integrate Discord's Embedded App SDK if you apply for it.
// For now this runs standalone as a web UI inside an iFrame-like surface.

window.__APP_BOOTED = false; // flag for watchdog
const state = {
  sdkReady: false,
  currentScreen: 'menu',
  settings: { musicVolume: 0.7 },
  music: {
    list: [],          // {src,title,artist,cover}
    idx: 0,
    playing: false,
    audio: null,
    initialized: false,
  }
};

// Simple pub/sub (can grow later)
const events = new EventTarget();
function emit(name, detail) { events.dispatchEvent(new CustomEvent(name, { detail })); }
function on(name, cb) { events.addEventListener(name, cb); }

// DOM helpers
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const screens = {};

function mount(id, node) {
  const container = document.getElementById('screen-container');
  container.innerHTML = '';
  container.appendChild(node);
  state.currentScreen = id;
  emit('screen:change', id);
}

function template(id) {
  const tpl = document.getElementById(id);
  return tpl ? tpl.content.cloneNode(true) : document.createDocumentFragment();
}

function buildMenu() {
  const frag = template('tpl-menu');
  const root = document.createElement('div');
  root.appendChild(frag);
  // Intentionally no image replacement (emoji / gradient style only).
  // Interactive accent ripple on tiles
  root.addEventListener('pointermove', (e) => {
    const tile = e.target.closest('.menu__tile');
    if (!tile) return;
    const r = tile.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    tile.style.setProperty('--mx', x + '%');
    tile.style.setProperty('--my', y + '%');
    tile.animate({ background: [tile.style.background, `radial-gradient(circle at ${x}% ${y}%, #8f7dff35, transparent 65%), ` + tile.dataset.bgBase] }, { duration: 700, direction: 'alternate' });
  });
  // Assign base gradient snapshot (for animation reference)
  setTimeout(() => {
    root.querySelectorAll('.menu__tile').forEach(t => {
      t.dataset.bgBase = getComputedStyle(t).background;
    });
  }, 0);
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    switch (action) {
      case 'start-game':
        navigate('graph');
        break;
      case 'how-to':
        showPanel('tpl-howto');
        break;
      case 'settings':
        showPanel('tpl-settings', panelSettingsInit);
        break;
      case 'credits':
        showPanel('tpl-credits');
        break;
    }
  });
  return root;
}

function showPanel(tplId, after) {
  const frag = template(tplId);
  const wrapper = document.createElement('div');
  wrapper.appendChild(frag);
  wrapper.addEventListener('click', (e) => {
    if (e.target.matches('[data-action=back]')) {
      navigate('menu');
    }
  });
  mount(tplId, wrapper);
  after && after(wrapper);
}

function showHowToTemporary() {
  // Simulate a future game load
  const div = document.createElement('div');
  div.className = 'panel';
  div.innerHTML = `
    <h2>Game Placeholder</h2>
    <p>The actual game screen will appear here later. Use <strong>navigate('menu')</strong> to go back.</p>
    <button class="btn" data-action="back">⬅ Back</button>
  `;
  div.addEventListener('click', (e) => {
    if (e.target.matches('[data-action=back]')) navigate('menu');
  });
  mount('game', div);
}

function panelSettingsInit(wrapper) {
  const range = $('#music-volume', wrapper);
  range.value = state.settings.musicVolume;
  range.addEventListener('input', () => {
    state.settings.musicVolume = parseFloat(range.value);
    emit('settings:update', { ...state.settings });
  });
}

function navigate(screenId) {
  switch (screenId) {
    case 'menu':
      mount('menu', buildMenu());
      break;
    case 'graph':
      mount('graph', buildGraphScreen());
      break;
    default:
      console.warn('Unknown screen', screenId);
  }
}

function buildGraphScreen(){
  const wrap = document.createElement('div');
  wrap.className = 'graph-screen';
  wrap.style.cssText = 'position:relative; width:100%; height:100%; display:flex; flex-direction:column; gap:8px;';

  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'position:absolute; top:10px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:8px; padding:8px 12px;'
    + 'background:linear-gradient(90deg, rgba(20,22,30,.7), rgba(20,22,30,.35));'
    + 'border:1px solid rgba(255,255,255,0.08); border-radius:12px; margin:0; z-index:2;';
  const backBtn = document.createElement('button');
  backBtn.className = 'btn';
  backBtn.textContent = '⬅ Back';
  backBtn.addEventListener('click', ()=> navigate('menu'));
  const title = document.createElement('div');
  title.textContent = 'Archive Graph';
  title.style.cssText = 'color:#fff; opacity:.85; font-weight:600; letter-spacing:.5px; margin-left:6px;';
  toolbar.appendChild(backBtn);
  toolbar.appendChild(title);

  const frame = document.createElement('iframe');
  frame.src = 'horizontal-graph.html';
  frame.title = 'Archive Graph';
  frame.loading = 'eager';
  frame.style.cssText = 'flex:1 1 auto; width:100%; height:100%; border:0; border-radius:14px;'
    + 'background:#0f1115; box-shadow:0 10px 28px #0008 inset, 0 2px 16px #0006;';

  wrap.appendChild(toolbar);
  wrap.appendChild(frame);
  return wrap;
}

// (Optional) Future: Discord Embedded App SDK placeholder
async function initDiscordSDK() {
  // Insert actual SDK loading here when approved by Discord.
  // For now we just simulate a connection.
  await new Promise((res) => setTimeout(res, 600));
  state.sdkReady = true;
  updateStatus('Ready');
  emit('sdk:ready');
}

function updateStatus(text) {
  const s = document.getElementById('status');
  if (s) s.textContent = text;
}

function init() {
  document.body.classList.add('loading');
  navigate('menu');
  initDiscordSDK().finally(() => {
    document.body.classList.remove('loading');
  });

  document.getElementById('reload-btn').addEventListener('click', () => {
    navigate('menu');
  });
  console.log('[Supernatural Phoning] Base scaffold initialized');
  window.__APP_BOOTED = true;
  clearTimeout(window.__APP_WATCHDOG);
  initMusicPlayer();
  initBackgroundFlyers();
}

document.addEventListener('DOMContentLoaded', init);

// Global error handler to surface failures & show reload button
window.addEventListener('error', (e) => {
  console.error('[Global Error]', e.error || e.message);
  updateStatus('Error – see console');
  const reloadBtn = document.getElementById('reload-btn');
  if (reloadBtn) reloadBtn.hidden = false;
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled Rejection]', e.reason);
  updateStatus('Runtime error – see console');
  const reloadBtn = document.getElementById('reload-btn');
  if (reloadBtn) reloadBtn.hidden = false;
});

// ─────────────────────────  CLICK FALLING FLOWER EFFECT  ───────────────
const CLICK_GIF_SRC = 'assets/img/spin-flower.gif';
const MAX_PARTICLES = 40;
let activeParticles = 0;
document.addEventListener('pointerdown', (e) => {
  spawnFallingFlower(e.clientX, e.clientY);
});
function spawnFallingFlower(x, y) {
  if (activeParticles >= MAX_PARTICLES) return; activeParticles++;
  const size = 40 + Math.random()*28;
  const el = document.createElement('img');
  el.src = CLICK_GIF_SRC;
  el.alt = '';
  el.style.cssText = `position:fixed; left:${x - size/2}px; top:${y - size/2}px; width:${size}px; height:${size}px; pointer-events:none; z-index:9999; will-change:transform,opacity; filter:drop-shadow(0 4px 10px #0008);`;
  document.body.appendChild(el);
  const vx = (Math.random()*60 - 30); // horizontal drift
  const v0y = 20 + Math.random()*50;  // initial downward speed
  const gravity = 240 + Math.random()*160; // px/s^2
  const spin = (Math.random()>0.5?1:-1)*(180 + Math.random()*240); // deg/s
  let rot = Math.random()*360;
  let last = performance.now();
  let t = 0;
  function frame(now){
    const dt = (now - last)/1000; last = now; t += dt;
    // kinematics
    const dy = v0y*t + 0.5*gravity*t*t;
    const dx = vx*t;
    rot += spin*dt;
    el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
    if (t > 2.8 || y + dy > window.innerHeight + 120) {
      el.style.transition = 'opacity .9s, filter .9s';
      el.style.opacity = '0';
      el.style.filter = 'blur(2px) drop-shadow(0 0 14px #ff91ecaa)';
      setTimeout(()=>{ el.remove(); activeParticles--; }, 950);
      return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ─────────────────────────  MUSIC PLAYER  ─────────────────────────
async function initMusicPlayer() {
  const playerEl = document.getElementById('music-player');
  if (!playerEl) return;
  let manifest = [];
  try { manifest = await fetch('assets/music/tracks.json').then(r => r.ok ? r.json() : []); } catch {}
  if (!manifest.length) {
    const inline = document.getElementById('music-manifest');
    if (inline) { try { manifest = JSON.parse(inline.textContent.trim()); } catch {} }
  }
  if (Array.isArray(manifest) && manifest.length) {
    state.music.list = manifest.map((t,i) => ({
      src: t.src,
      title: t.title || `Track ${i+1}`,
      artist: t.artist || 'Unknown',
      cover: t.cover || 'assets/img/cover-placeholder.png'
    }));
    setupAudio();
    playerEl.classList.remove('music-player--hidden');
    playerEl.classList.add('music-player--visible');
  } else {
    console.warn('[Music] No tracks loaded');
  }
}

function setupAudio() {
  if (state.music.initialized) return;
  const audio = new Audio();
  audio.volume = state.settings.musicVolume;
  state.music.audio = audio;
  state.music.initialized = true;
  hookPlayerUI();
  loadTrack(0);
}

function hookPlayerUI() {
  const q = id => document.getElementById(id);
  const progress = q('mp-progress');
  const btns = document.querySelectorAll('[data-mp]');
  btns.forEach(b => b.addEventListener('click', () => handleMusicAction(b.dataset.mp)));
  progress.addEventListener('input', () => {
    const a = state.music.audio; if (!a || !a.duration) return;
    a.currentTime = (progress.value / 100) * a.duration;
  });
  state.music.audio.addEventListener('timeupdate', () => {
    updateProgress();
  });
  state.music.audio.addEventListener('ended', () => {
    nextTrack();
  });
  on('settings:update', ({ detail }) => {
    if (state.music.audio) state.music.audio.volume = detail.musicVolume;
  });
}

function handleMusicAction(act) {
  switch (act) {
    case 'play': togglePlay(); break;
    case 'next': nextTrack(); break;
    case 'prev': prevTrack(); break;
  }
}

function loadTrack(idx) {
  if (!state.music.list.length) return;
  state.music.idx = (idx + state.music.list.length) % state.music.list.length;
  const track = state.music.list[state.music.idx];
  const a = state.music.audio;
  a.src = track.src;
  a.play().then(() => { state.music.playing = true; updatePlayerUI(); }).catch(()=>{});
  updatePlayerUI(true);
  // Attempt embedded cover art extraction if using placeholder cover
  if (track.cover.includes('cover-placeholder')) {
    extractCoverArt(track).then(url => {
      if (url) {
        track.cover = url;
        updatePlayerUI(true);
      }
    }).catch(()=>{});
  }
}

function togglePlay() {
  if (!state.music.audio) return;
  if (state.music.playing) { state.music.audio.pause(); state.music.playing = false; }
  else { state.music.audio.play(); state.music.playing = true; }
  updatePlayerUI();
}
function nextTrack() { loadTrack(state.music.idx + 1); }
function prevTrack() { loadTrack(state.music.idx - 1); }

function updatePlayerUI(resetMeta=false) {
  const track = state.music.list[state.music.idx];
  const titleEl = document.getElementById('mp-title');
  const artistEl = document.getElementById('mp-artist');
  const playBtn = document.querySelector('[data-mp=play]');
  if (track && resetMeta) {
    titleEl.textContent = track.title;
    artistEl.textContent = track.artist;
  // Background image handled via --player-cover CSS variable
  }
  // Apply cover image directly as background (preload to avoid flash)
  const player = document.querySelector('#music-player .mp__glass');
  if (player && track) {
    const img = new Image();
    img.onload = () => {
      player.style.backgroundImage = `url("${track.cover}")`;
      // Apply optional horizontal shift if provided in track metadata (pixels or css length)
      if (track.coverShift) {
        player.style.setProperty('--cover-shift', typeof track.coverShift === 'number' ? `${track.coverShift}px` : track.coverShift);
      } else {
        player.style.removeProperty('--cover-shift');
      }
    };
    img.onerror = () => {
      player.style.backgroundImage = 'none';
      player.style.backgroundColor = '#141c28';
    };
    img.src = track.cover;
  }
  if (playBtn) playBtn.textContent = state.music.playing ? '⏸' : '▶';
  updateProgress();
}

function updateProgress() {
  const a = state.music.audio; if (!a) return;
  const progress = document.getElementById('mp-progress'); if (!progress) return;
  if (a.duration) progress.value = (a.currentTime / a.duration) * 100;
  const timeEl = document.getElementById('mp-time');
  if (timeEl) timeEl.textContent = fmtTime(a.currentTime) + ' / ' + (a.duration ? fmtTime(a.duration) : '0:00');
}

function fmtTime(sec) { if (!isFinite(sec)) return '0:00'; const m = Math.floor(sec/60); const s = Math.floor(sec%60).toString().padStart(2,'0'); return `${m}:${s}`; }

// ─────────────────────────  MP3 COVER EXTRACTION  ─────────────────────
// Lightweight ID3v2 APIC frame parser (best‑effort, not exhaustive) to fetch album art.
async function extractCoverArt(track) {
  try {
    const resp = await fetch(track.src);
    if (!resp.ok) return null;
    const buf = await resp.arrayBuffer();
    const bytes = new Uint8Array(buf);
    // Check ID3 header
    if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return null; // 'ID3'
    const headerSize = syncSafeToInt(bytes.slice(6, 10));
    let ptr = 10; // skip header
    while (ptr < 10 + headerSize) {
      if (ptr + 10 > bytes.length) break;
      const frameId = textFrom(bytes.slice(ptr, ptr + 4));
      const frameSize = readFrameSize(bytes.slice(ptr + 4, ptr + 8));
      const frameFlags = bytes.slice(ptr + 8, ptr + 10); // unused
      if (!frameId.trim()) break;
      const frameDataStart = ptr + 10;
      const frameDataEnd = frameDataStart + frameSize;
      if (frameId === 'APIC') {
        const frame = bytes.slice(frameDataStart, frameDataEnd);
        // APIC: text encoding (1), MIME type (null-term), pic type (1), desc (null-term), data
        let o = 0;
        const encoding = frame[o]; o += 1;
        // MIME type
        let mime = '';
        while (o < frame.length && frame[o] !== 0x00) { mime += String.fromCharCode(frame[o]); o++; }
        o++; // null
        // picture type (skip)
        o++;
        // description (null-term depending on encoding)
        if (encoding === 0) { // ISO-8859-1
          while (o < frame.length && frame[o] !== 0x00) o++;
          o++;
        } else { // UTF-16 (very naive skip)
          while (o + 1 < frame.length && !(frame[o] === 0x00 && frame[o+1] === 0x00)) o += 2;
          o += 2;
        }
        const imgBytes = frame.slice(o);
        const blob = new Blob([imgBytes], { type: mime || 'image/jpeg' });
        return URL.createObjectURL(blob);
      }
      ptr = frameDataEnd;
    }
  } catch (e) {
    console.warn('[CoverExtract]', e);
  }
  return null;
}
function syncSafeToInt(arr){ return (arr[0]<<21) | (arr[1]<<14) | (arr[2]<<7) | arr[3]; }
function textFrom(arr){ return Array.from(arr).map(b=>String.fromCharCode(b)).join(''); }
function readFrameSize(arr){ return (arr[0]<<24) | (arr[1]<<16) | (arr[2]<<8) | arr[3]; }

// ───────────────────────  POWERPUFF FLYING BACKGROUND  ───────────────────────
const FLYER_ASSETS = [
  'assets/img/PowerPuff/HanniLoading.png',
  'assets/img/PowerPuff/MinjiLoading.png',
  'assets/img/PowerPuff/HaerinLoading.png',
  'assets/img/PowerPuff/DaniLoading.png',
  'assets/img/PowerPuff/HyeinLoading.png'
];
// Configuration: do not mirror (original GIFs already face travel direction)
const FLYER_INVERT = false;
let flyerTimer = null; let flyerCount = 0; const MAX_FLYERS = 4; // fewer simultaneous
// Effect configuration
const FLYER_EFFECTS = {
  trailCount: 2,         // number of trailing afterimages
  glow: true,            // apply neon glow filter
  hueRotateChance: 0.25, // 25% chance to hue-shift during flight
};
function initBackgroundFlyers(){
  const container = document.body;
  function spawnFlyer(){
  if (flyerCount >= MAX_FLYERS) return scheduleNext();
  const src = FLYER_ASSETS[Math.floor(Math.random()*FLYER_ASSETS.length)];
  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  const scale = 1.6 + Math.random()*0.9; // enlarged for PNG (1.6x - 2.5x base width)
  const duration = 1.0; // 1 second traverse (reverted)
  const startY = 12 + Math.random()*70; // keep within middle band
  const delay = Math.random()*1.2; // small stagger
  const invert = FLYER_INVERT; // single global orientation choice
  const glowFilter = FLYER_EFFECTS.glow ? 'drop-shadow(0 0 6px #ff6fe680) drop-shadow(0 0 12px #62ffbe50)' : 'drop-shadow(0 4px 8px #0009)';
  const hueAnim = Math.random() < FLYER_EFFECTS.hueRotateChance ? `, flyer-hue ${duration}s linear ${delay}s forwards` : '';
  img.style.cssText = `position:fixed; left:-220px; top:${startY}vh; width:${170*scale}px; height:auto; pointer-events:none; z-index:-2; opacity:0; filter:${glowFilter} brightness(1.05); will-change:transform,opacity,filter; animation:flyer-move ${duration}s linear ${delay}s forwards${hueAnim}; --sx:${invert? -1:1};`;
  container.appendChild(img); flyerCount++;
    // Trailing afterimages (clones) - not counted toward flyerCount
    if (FLYER_EFFECTS.trailCount > 0) {
      for (let i=1;i<=FLYER_EFFECTS.trailCount;i++) {
        const t = document.createElement('img');
        t.src = src; t.alt='';
        const trailDelay = delay + i*0.02; // slight stagger
        const trailOpacity = 0.25 / i;
        t.style.cssText = `position:fixed; left:-220px; top:${startY}vh; width:${170*scale}px; height:auto; pointer-events:none; z-index:-3; opacity:0; filter:blur(${1+i}px) drop-shadow(0 0 4px #ff6fe650); mix-blend-mode:screen; animation:flyer-move ${duration}s linear ${trailDelay}s forwards; --sx:${invert? -1:1};`;
        // Fade opacity via animation events (CSS alt approach would need extra keyframes)
        t.addEventListener('animationstart',()=>{ t.style.transition='opacity .25s'; t.style.opacity=trailOpacity; });
        t.addEventListener('animationend',()=> t.remove());
        container.appendChild(t);
      }
    }
    img.addEventListener('animationend', () => { img.remove(); flyerCount--; });
    scheduleNext();
  }
  function scheduleNext(){
  const nextIn = 3000 + Math.random()*5000; // 3s - 8s (adjusted for faster traversal)
    flyerTimer = setTimeout(spawnFlyer, nextIn);
  }
  // Preload assets quickly
  FLYER_ASSETS.forEach(src => { const i = new Image(); i.src = src; });
  scheduleNext();
}
// Keyframes injected via JS-friendly CSS if not present
const flyerAnimCSS = `@keyframes flyer-move { 0% { opacity:0; transform:translateX(0) scaleX(var(--sx,1)); } 15% { opacity:1; } 85% { opacity:1; } 100% { opacity:0; transform:translateX(calc(100vw + 400px)) scaleX(var(--sx,1)); } }`;
if (!document.querySelector('#flyer-anim-style')){
  const st = document.createElement('style'); st.id='flyer-anim-style'; st.textContent = flyerAnimCSS + `\n@keyframes flyer-hue { 0% { filter:hue-rotate(0deg); } 100% { filter:hue-rotate(360deg); } }`; document.head.appendChild(st);
}
