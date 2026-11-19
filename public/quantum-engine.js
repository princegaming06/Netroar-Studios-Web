/**
 * NETROAR STUDIOS — QUANTUM AERO-SPATIAL ENGINE
 * Features:
 * - Living Interactive Particle Vortex (HTML5 Canvas)
 * - Pure Web Audio API Aerospace Haptic Sound Synthesizer (Zero audio files needed!)
 * - Gyroscopic 3D Perspective Tilt Rig
 * - Direct Tap Redirection on Icon & Name to official webpage
 * - Next/Previous Tactile Screenshot Carousel with Mixed Platform Detection
 * - Interactive Command Terminal
 */

let audioEnabled = false;
let audioCtx = null;
let currentScreenshotIndex = 0;
let screenshotData = [];
const OFFICIAL_TASKFLOW_URL = 'https://netroar-to-do.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  initQuantumCanvas();
  initAudioSystem();
  initTelemetryClock();
  syncActiveNav();
  initScrollEngine();
  initBreakConcatenateEngine();
  initAppsPageRouting();
  initMinimalAppsGrid();
  initFlagshipConsole();
  initTerminal();
  init3DRigTilt();
  initLightbox();
});

// ==========================================================================
// ACTIVE PAGE NAVIGATION CONTROLLER
// Guarantees 100% accurate active status across all pages & links
// ==========================================================================
function syncActiveNav() {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  const studioLinks = document.querySelectorAll('.spatial-nav-dock a[href="/"]');
  const appsLinks = document.querySelectorAll('.spatial-nav-dock a[href="/apps"]');
  const newswireLinks = document.querySelectorAll('.spatial-nav-dock a[href*="chronicles"]');
  const adminLinks = document.querySelectorAll('.admin-suite-pill');

  // Reset active classes
  document.querySelectorAll('.spatial-nav-dock a, .admin-suite-pill').forEach(el => {
    el.classList.remove('active');
  });

  if (path === '/admin' || path === '/admin.html' || path.startsWith('/admin/')) {
    adminLinks.forEach(el => el.classList.add('active'));
  } else if (path.startsWith('/apps') || path.startsWith('/app/')) {
    appsLinks.forEach(el => el.classList.add('active'));
  } else if (hash === '#chronicles' || hash === '#newswire') {
    newswireLinks.forEach(el => el.classList.add('active'));
  } else {
    studioLinks.forEach(el => el.classList.add('active'));
  }
}

window.addEventListener('hashchange', syncActiveNav);
window.addEventListener('popstate', syncActiveNav);

// ==========================================================================
// 0. APPS PAGE DUAL-VIEW ROUTER & CONTROLLER
// Seamless transition: Minimal Card (Icon + Name Only) -> Flagship Console Rig
// ==========================================================================
function initAppsPageRouting() {
  const catalogView = document.getElementById('apps-catalog-view');
  const consoleView = document.getElementById('flagship-console-view');
  const backBtn = document.getElementById('btn-back-to-catalog');
  const taskflowCard = document.getElementById('taskflow-card');

  if (!catalogView || !consoleView) return;

  function showConsole() {
    catalogView.classList.remove('view-visible');
    catalogView.classList.add('view-hidden');
    consoleView.classList.remove('view-hidden');
    consoleView.classList.add('view-visible');
    playLaserBeep(620, 0.08, 'triangle');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showCatalog() {
    consoleView.classList.remove('view-visible');
    consoleView.classList.add('view-hidden');
    catalogView.classList.remove('view-hidden');
    catalogView.classList.add('view-visible');
    playSlideSound();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Check URL state on load
  const hash = window.location.hash;
  const path = window.location.pathname;
  if (hash === '#taskflow' || hash === '#console' || path.startsWith('/app/')) {
    showConsole();
  } else {
    showCatalog();
  }

  // Wire initial static card
  if (taskflowCard) {
    taskflowCard.addEventListener('click', () => {
      history.pushState(null, '', '/apps#taskflow');
      showConsole();
    });
    taskflowCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        history.pushState(null, '', '/apps#taskflow');
        showConsole();
      }
    });
  }

  // Wire back button
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      history.pushState(null, '', '/apps');
      showCatalog();
    });
  }

  // Support browser back/forward buttons
  window.addEventListener('popstate', () => {
    if (window.location.hash === '#taskflow' || window.location.pathname.startsWith('/app/')) {
      showConsole();
    } else {
      showCatalog();
    }
  });

  // Expose switcher to window
  window.netroarShowConsole = showConsole;
  window.netroarShowCatalog = showCatalog;
}

// ==========================================================================
// 0.1 MINIMAL APPS GRID (ICON + NAME ONLY)
// ==========================================================================
async function initMinimalAppsGrid() {
  const grid = document.getElementById('apps-minimal-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/apps');
    const data = await res.json();
    if (data.success && Array.isArray(data.apps) && data.apps.length > 0) {
      grid.innerHTML = data.apps.map(app => `
        <div class="app-minimal-card" role="button" tabindex="0" title="Tap to enter ${app.name} Console">
          <div class="app-minimal-icon-box">
            <img src="${app.icon || '/assets/logo/Netroar_To_Do_dark_v2.png'}" alt="${app.name} Icon" class="app-minimal-icon-img" onerror="this.src='/assets/logo/netroar-studios-logo-dark.png'">
          </div>
          <h3 class="app-minimal-name">${app.name}</h3>
        </div>
      `).join('');

      // Wire tap-to-open console on cards
      grid.querySelectorAll('.app-minimal-card').forEach(card => {
        function activate() {
          if (window.netroarShowConsole) {
            history.pushState(null, '', '/apps#taskflow');
            window.netroarShowConsole();
          } else {
            window.location.href = '/apps#taskflow';
          }
        }
        card.addEventListener('click', activate);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activate();
          }
        });
      });
    }
  } catch (err) {
    console.warn('Using static minimal grid card');
  }
}

// ==========================================================================
// 1. LIVING AMBIENT QUANTUM CANVAS (PARTICLE VORTEX)
// ==========================================================================
function initQuantumCanvas() {
  const canvas = document.getElementById('ambient-quantum-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Track mouse coordinates for canvas & CSS spotlight
  let mouseX = width / 2;
  let mouseY = height / 2;
  let isMouseOver = false;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    isMouseOver = true;
    document.documentElement.style.setProperty('--mouse-x', `${mouseX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${mouseY}px`);
  });

  window.addEventListener('mouseleave', () => {
    isMouseOver = false;
  });

  // Track scroll velocity for kinetic particle drift
  let lastScrollY = window.scrollY;
  let scrollVelocity = 0;
  window.addEventListener('scroll', () => {
    const currentY = window.scrollY;
    scrollVelocity = (currentY - lastScrollY) * 0.04;
    lastScrollY = currentY;
  }, { passive: true });

  // Generate particle nodes
  const particleCount = Math.min(Math.floor((width * height) / 18000), 70);
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.5 + 0.8,
      baseAlpha: Math.random() * 0.4 + 0.15
    });
  }

  function renderFrame() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Slight attraction toward cursor if nearby
      if (isMouseOver) {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 20) {
          p.vx += (dx / dist) * 0.02;
          p.vy += (dy / dist) * 0.02;
        }
      }

      // Drag
      p.vx *= 0.985;
      p.vy *= 0.985;

      p.x += p.vx;
      p.y += p.vy - (scrollVelocity * 0.35);

      // Wrap edges
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 245, 184, ${p.baseAlpha})`;
      ctx.fill();

      // Connect nearby particles with subtle energy lines
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0, 245, 184, ${0.12 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }
    }

    scrollVelocity *= 0.94;
    requestAnimationFrame(renderFrame);
  }

  renderFrame();
}

// ==========================================================================
// 2. PURE WEB AUDIO SYNTHESIZER (ZERO EXTERNAL ASSETS NEEDED)
// ==========================================================================
function initAudioSystem() {
  const audioBtn = document.getElementById('btn-audio-toggle');
  const storedAudio = localStorage.getItem('netroar_audio_active');
  audioEnabled = storedAudio === 'true';
  updateAudioUi();

  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      localStorage.setItem('netroar_audio_active', audioEnabled);
      updateAudioUi();
      if (audioEnabled) {
        ensureAudioCtx();
        playLaserBeep(520, 0.08, 'sine');
      }
    });
  }
}

function updateAudioUi() {
  const audioBtn = document.getElementById('btn-audio-toggle');
  const audioLabel = document.getElementById('audio-toggle-label');
  if (!audioBtn) return;
  audioBtn.classList.toggle('audio-active', audioEnabled);
  if (audioLabel) {
    audioLabel.textContent = audioEnabled ? 'HAPTICS: ON' : 'HAPTICS: OFF';
  }
}

function ensureAudioCtx() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playLaserBeep(freq = 440, duration = 0.06, type = 'sine') {
  if (!audioEnabled) return;
  try {
    ensureAudioCtx();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, audioCtx.currentTime + duration);

    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) {}
}

function playSlideSound() {
  if (!audioEnabled) return;
  try {
    ensureAudioCtx();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(680, audioCtx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch (err) {}
}

function playWarpSound() {
  if (!audioEnabled) return;
  try {
    ensureAudioCtx();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.09, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch (err) {}
}

function playBreakSound() {
  if (!audioEnabled) return;
  try {
    ensureAudioCtx();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    // 1. Initial High-Velocity Structural Impact Shatter (Sawtooth sweep)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(1800, now);
    osc1.frequency.exponentialRampToValueAtTime(80, now + 0.35);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // 2. Crystal / Acrylic Fracture Crunch (Triangle harmonic)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(960, now + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(140, now + 0.4);
    gain2.gain.setValueAtTime(0.09, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.02);
    osc2.stop(now + 0.4);

    // 3. Staggered secondary debris impacts (Pieces hitting floor)
    [0.12, 0.22, 0.34, 0.48].forEach((delay, idx) => {
      const debrisOsc = audioCtx.createOscillator();
      const debrisGain = audioCtx.createGain();
      debrisOsc.type = 'triangle';
      debrisOsc.frequency.setValueAtTime(320 - (idx * 45), now + delay);
      debrisOsc.frequency.exponentialRampToValueAtTime(60, now + delay + 0.08);
      debrisGain.gain.setValueAtTime(0.05, now + delay);
      debrisGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
      debrisOsc.connect(debrisGain);
      debrisGain.connect(audioCtx.destination);
      debrisOsc.start(now + delay);
      debrisOsc.stop(now + delay + 0.08);
    });
  } catch (err) {}
}

function playConcatenateSound() {
  if (!audioEnabled) return;
  try {
    ensureAudioCtx();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    // 1. Reverse-gravity magnetic vacuum hum (Frequency rising upwards against gravity)
    const vacuumOsc = audioCtx.createOscillator();
    const vacuumGain = audioCtx.createGain();
    vacuumOsc.type = 'sine';
    vacuumOsc.frequency.setValueAtTime(75, now);
    vacuumOsc.frequency.exponentialRampToValueAtTime(540, now + 0.72);
    vacuumGain.gain.setValueAtTime(0.03, now);
    vacuumGain.gain.linearRampToValueAtTime(0.12, now + 0.65);
    vacuumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.78);
    vacuumOsc.connect(vacuumGain);
    vacuumGain.connect(audioCtx.destination);
    vacuumOsc.start(now);
    vacuumOsc.stop(now + 0.78);

    // 2. High-impact magnetic docking snap at impact moment (0.72s)
    const snapOsc = audioCtx.createOscillator();
    const snapGain = audioCtx.createGain();
    snapOsc.type = 'sawtooth';
    snapOsc.frequency.setValueAtTime(260, now + 0.72);
    snapOsc.frequency.exponentialRampToValueAtTime(45, now + 0.95);
    snapGain.gain.setValueAtTime(0.16, now + 0.72);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    snapOsc.connect(snapGain);
    snapGain.connect(audioCtx.destination);
    snapOsc.start(now + 0.72);
    snapOsc.stop(now + 0.95);

    // 3. Shimmering harmonic lock chord (C5 + G5 + C6)
    [523.25, 783.99, 1046.5].forEach((freq, i) => {
      const chordOsc = audioCtx.createOscillator();
      const chordGain = audioCtx.createGain();
      chordOsc.type = 'triangle';
      chordOsc.frequency.setValueAtTime(freq, now + 0.74 + (i * 0.02));
      chordGain.gain.setValueAtTime(0.06, now + 0.74 + (i * 0.02));
      chordGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      chordOsc.connect(chordGain);
      chordGain.connect(audioCtx.destination);
      chordOsc.start(now + 0.74 + (i * 0.02));
      chordOsc.stop(now + 1.1);
    });
  } catch (err) {}
}

// ==========================================================================
// 3. TELEMETRY CLOCK
// ==========================================================================
function initTelemetryClock() {
  const clockEl = document.getElementById('telemetry-clock');
  if (!clockEl) return;

  function update() {
    const now = new Date();
    const utc = now.toISOString().slice(11, 19) + ' UTC';
    clockEl.textContent = utc;
  }
  update();
  setInterval(update, 1000);
}

// ==========================================================================
// 4. FLAGSHIP CONSOLE SHOWCASE (NETROAR TASKFLOW)
// ==========================================================================
async function initFlagshipConsole() {
  const iconAnchor = document.getElementById('teleport-icon-link');
  const titleAnchor = document.getElementById('teleport-title-link');
  const prevBtn = document.getElementById('btn-bay-prev');
  const nextBtn = document.getElementById('btn-bay-next');
  const stage = document.getElementById('viewport-stage');

  // Load app data from database
  try {
    const res = await fetch('/api/apps');
    const data = await res.json();
    if (data.success && data.apps && data.apps.length > 0) {
      const app = data.apps[0];
      buildScreenshotArray(app);
      renderActiveFrame();
    }
  } catch (err) {
    console.warn('Using default screenshot list');
    buildDefaultScreenshotArray();
    renderActiveFrame();
  }

  // Direct redirection when tapping App Icon or App Name
  function handleTeleport(e) {
    playWarpSound();
    showToast('Redirecting to Netroar TaskFlow Official Webpage...');
  }

  if (iconAnchor) {
    iconAnchor.href = OFFICIAL_TASKFLOW_URL;
    iconAnchor.addEventListener('click', handleTeleport);
  }

  if (titleAnchor) {
    titleAnchor.href = OFFICIAL_TASKFLOW_URL;
    titleAnchor.addEventListener('click', handleTeleport);
  }

  // Next / Previous Navigation Arrows
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToPrevScreenshot();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToNextScreenshot();
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goToPrevScreenshot();
    if (e.key === 'ArrowRight') goToNextScreenshot();
  });

  // Touch swipe support for mobile
  let touchStartX = 0;
  let touchEndX = 0;
  if (stage) {
    stage.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchEndX - touchStartX > 40) goToPrevScreenshot();
      if (touchStartX - touchEndX > 40) goToNextScreenshot();
    }, { passive: true });

    // Click on active screenshot opens Lightbox
    stage.addEventListener('click', () => {
      const current = screenshotData[currentScreenshotIndex];
      if (current && current.src) openLightbox(current.src);
    });

    // Mouse wheel & trackpad scroll navigation over showcase bay
    let wheelDebounce = false;
    stage.addEventListener('wheel', (e) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 20) return;
      e.preventDefault();

      if (!wheelDebounce) {
        wheelDebounce = true;
        if (delta > 0) {
          goToNextScreenshot();
        } else {
          goToPrevScreenshot();
        }
        setTimeout(() => { wheelDebounce = false; }, 280);
      }
    }, { passive: false });
  }
}

function buildScreenshotArray(app) {
  const ua = navigator.userAgent || '';
  const isAndroid = /android/i.test(ua);

  const winScreens = (app.screenshots?.windows || []).map(s => ({
    ...s,
    platform: 'Windows Desktop'
  }));
  const droidScreens = (app.screenshots?.android || []).map(s => ({
    ...s,
    platform: 'Android Mobile'
  }));

  if (isAndroid) {
    screenshotData = [...droidScreens, ...winScreens];
  } else {
    screenshotData = [...winScreens, ...droidScreens];
  }

  if (screenshotData.length === 0) buildDefaultScreenshotArray();
  currentScreenshotIndex = 0;
}

function buildDefaultScreenshotArray() {
  screenshotData = [
    { src: '/assets/screenshots/01_Desktop_Overview.png', title: 'Desktop Cyber Matrix & HUD', platform: 'Windows Desktop' },
    { src: '/assets/screenshots/02_Global_Shortcut_Shift_Esc.png', title: 'Global Quick Summon (Shift+Esc)', platform: 'Windows Desktop' },
    { src: '/assets/screenshots/04_Live_Countdown_Timers.png', title: 'Real-Time Precision Countdown Sprints', platform: 'Windows Desktop' },
    { src: '/assets/screenshots/05_RPG_Gamification_Engine.png', title: 'RPG Level Progression & Rewards Engine', platform: 'Windows Desktop' },
    { src: '/assets/screenshots/android/01_Hero_Gamified_Task_Manager.png', title: 'Android Companion Task Hub', platform: 'Android Mobile' },
    { src: '/assets/screenshots/android/02_Real_Time_Countdown_Timers.png', title: 'Mobile Live Focus Timers', platform: 'Android Mobile' },
    { src: '/assets/screenshots/android/07_RPG_Accountability_And_History.png', title: 'RPG Accountability Log', platform: 'Android Mobile' }
  ];
}

function renderActiveFrame() {
  if (screenshotData.length === 0) return;
  const current = screenshotData[currentScreenshotIndex];

  const mainImg = document.getElementById('active-screenshot-img');
  const captionEl = document.getElementById('bay-caption-text');
  const counterEl = document.getElementById('bay-counter-display');

  if (mainImg) {
    mainImg.style.opacity = '0.2';
    mainImg.style.transform = 'scale(0.98)';
    setTimeout(() => {
      mainImg.src = current.src;
      mainImg.alt = current.title;
      mainImg.style.opacity = '1';
      mainImg.style.transform = 'scale(1)';
    }, 140);
  }

  if (captionEl) {
    captionEl.textContent = `${current.title} [${current.platform || 'Screenshot'}]`;
  }

  if (counterEl) {
    const padIndex = String(currentScreenshotIndex + 1).padStart(2, '0');
    const padTotal = String(screenshotData.length).padStart(2, '0');
    counterEl.textContent = `${padIndex} / ${padTotal}`;
  }
}

function goToPrevScreenshot() {
  if (screenshotData.length === 0) return;
  currentScreenshotIndex = (currentScreenshotIndex - 1 + screenshotData.length) % screenshotData.length;
  playSlideSound();
  renderActiveFrame();
}

function goToNextScreenshot() {
  if (screenshotData.length === 0) return;
  currentScreenshotIndex = (currentScreenshotIndex + 1) % screenshotData.length;
  playSlideSound();
  renderActiveFrame();
}

// ==========================================================================
// 5. GYROSCOPIC 3D RIG TILT
// ==========================================================================
function init3DRigTilt() {
  const rig = document.getElementById('flagship-console-rig');
  const container = document.getElementById('flagship-console-wrapper');
  if (!rig || !container) return;

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotX = (-y / rect.height) * 9;
    const rotY = (x / rect.width) * 9;

    rig.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(10px)`;
  });

  container.addEventListener('mouseleave', () => {
    rig.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0px)';
  });
}

// ==========================================================================
// 6. INTERACTIVE COMMAND TERMINAL
// ==========================================================================
function initTerminal() {
  const terminalInput = document.getElementById('terminal-input');
  const pills = document.querySelectorAll('.cmd-pill');

  function handleCommand(cmd) {
    const clean = cmd.toLowerCase().trim();
    playLaserBeep(600, 0.05, 'triangle');

    if (clean === 'launch' || clean === 'open') {
      window.open(OFFICIAL_TASKFLOW_URL, '_blank');
      showToast('Executing: Launch Netroar TaskFlow Web');
    } else if (clean === 'download' || clean === 'get') {
      window.open(`${OFFICIAL_TASKFLOW_URL}/#download`, '_blank');
      showToast('Executing: Navigate to Official Downloads');
    } else if (clean === 'admin' || clean === 'login') {
      window.location.href = '/admin';
    } else if (clean === 'apps' || clean === 'app studios') {
      window.location.href = '/apps';
    } else if (clean === 'github' || clean === 'source') {
      window.open('https://github.com/princegaming06/Netroar-To-Do-Official-WebPage', '_blank');
    } else if (clean === 'feed' || clean === 'merchant') {
      window.open('/feed/products.xml', '_blank');
    } else if (clean === 'break' || clean === 'shatter') {
      if (window.netroarBreak) window.netroarBreak();
    } else if (clean === 'concatenate' || clean === 'concinate' || clean === 'assemble' || clean === 'fuse') {
      if (window.netroarConcatenate) window.netroarConcatenate();
    } else if (clean === 'cycle' || clean === 'kinetic') {
      if (window.netroarCycle) window.netroarCycle();
    } else {
      showToast(`Command not recognized: "${clean}". Try "launch", "download", "break", or "concatenate".`);
    }

    if (terminalInput) terminalInput.value = '';
  }

  if (terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleCommand(terminalInput.value);
      }
    });
  }

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const cmd = pill.getAttribute('data-cmd');
      if (cmd) handleCommand(cmd);
    });
  });
}

// ==========================================================================
// 7. LIGHTBOX MODAL
// ==========================================================================
function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const closeBtn = document.getElementById('lightbox-close');
  if (!modal || !closeBtn) return;

  closeBtn.addEventListener('click', closeLightbox);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeLightbox();
    }
  });
}

function openLightbox(src) {
  const modal = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-img');
  if (!modal || !img) return;
  img.src = src;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// ==========================================================================
// 8. TOAST SYSTEM
// ==========================================================================
function showToast(msg) {
  let toast = document.getElementById('quantum-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'quantum-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

// ==========================================================================
// 9. SCROLL ENGINE & KINETIC SYSTEM
// Features:
// - Laser scroll progress indicator bar
// - Spatial Header elevation & compression
// - Active page section scrollspy (Studio vs Newswire)
// - IntersectionObserver scroll-reveal animations
// - Floating teleport beacon (Scroll-to-top)
// - Smooth anchor jumps with header height offset
// ==========================================================================
function initScrollEngine() {
  const progressBar = document.getElementById('scroll-laser-bar');
  const header = document.querySelector('.spatial-header');
  const scrollTopBtn = document.getElementById('scroll-top-beacon');
  const chroniclesSection = document.getElementById('chronicles');
  const studioNav = document.querySelector('.spatial-nav-dock a[href="/"]');
  const newswireNav = document.querySelector('.spatial-nav-dock a[href*="chronicles"]');

  // 1. Scroll listener for progress, header elevation, and scroll-top beacon
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

        // Laser Progress Bar
        if (progressBar) {
          progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }

        // Header Elevation & Compression
        if (header) {
          if (scrollTop > 45) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }
        }

        // Floating Scroll-To-Top Beacon
        if (scrollTopBtn) {
          if (scrollTop > 350) {
            scrollTopBtn.classList.add('visible');
          } else {
            scrollTopBtn.classList.remove('visible');
          }
        }

        // Dynamic Section Scrollspy on Home
        if (chroniclesSection && studioNav && newswireNav && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html'))) {
          const rect = chroniclesSection.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 150) {
            studioNav.classList.remove('active');
            newswireNav.classList.add('active');
          } else if (rect.top > 200) {
            newswireNav.classList.remove('active');
            studioNav.classList.add('active');
          }
        }

        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // 2. Scroll to top button trigger
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      playLaserBeep(700, 0.06, 'triangle');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 3. Smooth Anchor Scroll with Header Offset
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#' || targetId.length <= 1) return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        playSlideSound();
        const headerHeight = header ? header.offsetHeight + 24 : 80;
        const targetPos = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({
          top: Math.max(0, targetPos),
          behavior: 'smooth'
        });
      }
    });
  });

  // 4. Scroll-Reveal IntersectionObserver
  const revealElements = document.querySelectorAll(
    '.scroll-reveal, .popular-spotlight-monolith, .chronicle-card, .terminal-box, .app-minimal-card, .popular-quad-card, .login-hud-card, .admin-tabs-nav'
  );

  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach((el, index) => {
      el.classList.add('scroll-reveal');
      if (el.classList.contains('chronicle-card') || el.classList.contains('popular-quad-card')) {
        el.style.transitionDelay = `${(index % 4) * 0.1}s`;
      }
      revealObserver.observe(el);
    });
  } else {
    revealElements.forEach(el => el.classList.add('revealed'));
  }
}

// ==========================================================================
// 10. QUANTUM ELEMENT BREAK & CONCATENATE ENGINE
// Features:
// - Dynamic 3D Polygonal Sharding & Fracture Mechanics (Element Break)
// - Magnetic Quantum Velocity Reassembly & Seam Fusion (Concatenate Event)
// - Custom DOM Events: 'netroar:elementBreak', 'netroar:elementConcatenate', 'netroar:elementCycle'
// - Velocity Scroll Integration & Interactive Cyber HUD Controls
// - Full Web Audio Haptic Feedback (playBreakSound, playConcatenateSound)
// ==========================================================================
function initBreakConcatenateEngine() {
  const dock = document.getElementById('quantum-kinetic-dock');
  const beacon = document.getElementById('kinetic-beacon-dot');
  const cohesionVal = document.getElementById('kinetic-cohesion-status');
  const shardVal = document.getElementById('kinetic-shard-count');
  const btnBreak = document.getElementById('btn-trigger-break');
  const btnConcatenate = document.getElementById('btn-trigger-concatenate');
  const btnCycle = document.getElementById('btn-trigger-cycle');
  const heroTitle = document.getElementById('hero-quantum-title');

  function getActiveChassis(selector) {
    if (selector && typeof selector === 'string') {
      return document.querySelector(selector);
    }
    return document.getElementById('popular-spotlight-monolith') ||
           document.getElementById('flagship-console-rig') ||
           document.querySelector('.quantum-break-chassis');
  }

  // 1. Element Break Function
  function triggerBreak(targetSelector) {
    const chassis = getActiveChassis(targetSelector);
    if (!chassis) return;

    chassis.classList.remove('element-concatenating', 'element-concatenated');
    chassis.classList.add('element-broken');

    if (dock) {
      dock.classList.remove('dock-concatenated');
      dock.classList.add('dock-broken');
    }
    if (beacon) {
      beacon.className = 'kinetic-beacon broken';
    }
    if (cohesionVal) {
      cohesionVal.textContent = 'SHATTERED (0% COHESION)';
      cohesionVal.className = 'kinetic-status-val broken';
    }
    if (shardVal) {
      shardVal.textContent = '12 PIECES (FALLEN TO FLOOR)';
    }

    playBreakSound();

    // Dispatch Standard Custom Events
    const breakEvent = new CustomEvent('netroar:elementBreak', {
      bubbles: true,
      detail: { target: chassis, shards: 12, state: 'broken', timestamp: Date.now() }
    });
    document.dispatchEvent(breakEvent);
    document.dispatchEvent(new CustomEvent('element:break', { bubbles: true, detail: breakEvent.detail }));

    showToast('⚡ [QUANTUM KINETIC] Element Shattered: 12 Pieces Fallen to Ground Plane');
  }

  // 2. Element Concatenate / Concinnate Function
  function triggerConcatenate(targetSelector) {
    const chassis = getActiveChassis(targetSelector);
    if (!chassis) return;

    chassis.classList.remove('element-broken');
    chassis.classList.add('element-concatenating');

    if (dock) {
      dock.classList.remove('dock-broken');
    }
    if (beacon) {
      beacon.className = 'kinetic-beacon concatenating';
    }
    if (cohesionVal) {
      cohesionVal.textContent = 'CONCATENATING... [REVERSE GRAVITY]';
      cohesionVal.className = 'kinetic-status-val concatenating';
    }
    if (shardVal) {
      shardVal.textContent = 'REASSEMBLING PIECES FROM FLOOR...';
    }

    playConcatenateSound();

    // Dispatch Standard Custom Events
    const concatEvent = new CustomEvent('netroar:elementConcatenate', {
      bubbles: true,
      detail: { target: chassis, state: 'concatenating', timestamp: Date.now() }
    });
    document.dispatchEvent(concatEvent);
    document.dispatchEvent(new CustomEvent('element:concatenate', { bubbles: true, detail: concatEvent.detail }));

    setTimeout(() => {
      chassis.classList.remove('element-concatenating');
      chassis.classList.add('element-concatenated');

      if (dock) {
        dock.classList.add('dock-concatenated');
      }
      if (beacon) {
        beacon.className = 'kinetic-beacon';
      }
      if (cohesionVal) {
        cohesionVal.textContent = '100% MONOLITH';
        cohesionVal.className = 'kinetic-status-val';
      }
      if (shardVal) {
        shardVal.textContent = '0 (SOLID COHESION)';
      }

      showToast('🔗 [QUANTUM KINETIC] Concatenate Complete: Monolithic Cohesion Restored (100%)');

      setTimeout(() => {
        chassis.classList.remove('element-concatenated');
        if (dock) dock.classList.remove('dock-concatenated');
      }, 900);
    }, 850);
  }

  // 3. Auto-Cycle Break and Concatenate
  let isCycling = false;
  function triggerCycle(targetSelector) {
    if (isCycling) return;
    isCycling = true;
    showToast('↺ [QUANTUM KINETIC] Initiating Break & Concatenate Kinetic Cycle...');

    triggerBreak(targetSelector);

    setTimeout(() => {
      triggerConcatenate(targetSelector);
      setTimeout(() => { isCycling = false; }, 1000);
    }, 2200);
  }

  // Bind Buttons
  if (btnBreak) btnBreak.addEventListener('click', () => triggerBreak());
  if (btnConcatenate) btnConcatenate.addEventListener('click', () => triggerConcatenate());
  if (btnCycle) btnCycle.addEventListener('click', () => triggerCycle());

  // Listen to Global Custom Events
  document.addEventListener('netroar:break', (e) => triggerBreak(e.detail?.target));
  document.addEventListener('netroar:concatenate', (e) => triggerConcatenate(e.detail?.target));
  document.addEventListener('netroar:concinnate', (e) => triggerConcatenate(e.detail?.target));
  document.addEventListener('netroar:cycle', (e) => triggerCycle(e.detail?.target));

  // Expose API to Window
  window.netroarBreak = triggerBreak;
  window.netroarConcatenate = triggerConcatenate;
  window.netroarConcinnate = triggerConcatenate;
  window.netroarCycle = triggerCycle;

  // ========================================================================
  // SCROLL DOWN & SCROLL UP EVENT CONTROLLER
  // Scroll Down -> Break and Fall in Pieces
  // Scroll Up   -> Concatenate and Reassemble in Place
  // ========================================================================
  let lastScrollY = window.scrollY || document.documentElement.scrollTop;
  const scrollSensitivity = 18; // px delta required to trigger
  let scrollTicking = false;
  let scrollResetTimer = null;

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY || document.documentElement.scrollTop;
        const delta = currentScrollY - lastScrollY;
        const chassis = getActiveChassis();

        if (chassis) {
          const rect = chassis.getBoundingClientRect();
          // Active interaction zone: card is in view
          const inActiveZone = rect.top < window.innerHeight * 0.85 && rect.bottom > 120;

          if (inActiveZone) {
            const scrollDirBadge = document.getElementById('scroll-dir-badge');

            // 1. SCROLL DOWN -> BREAK AND FALL IN PIECES
            if (delta > scrollSensitivity) {
              if (scrollDirBadge) {
                scrollDirBadge.classList.add('dir-down');
                scrollDirBadge.classList.remove('dir-up');
              }
              if (!chassis.classList.contains('element-broken') && !chassis.classList.contains('element-concatenating')) {
                triggerBreak(chassis);
              }
            } 
            // 2. SCROLL UP -> CONCATENATE AND REASSEMBLE
            else if (delta < -scrollSensitivity) {
              if (scrollDirBadge) {
                scrollDirBadge.classList.add('dir-up');
                scrollDirBadge.classList.remove('dir-down');
              }
              if (chassis.classList.contains('element-broken') && !chassis.classList.contains('element-concatenating')) {
                triggerConcatenate(chassis);
              }
            }

            clearTimeout(scrollResetTimer);
            scrollResetTimer = setTimeout(() => {
              if (scrollDirBadge) {
                scrollDirBadge.classList.remove('dir-down', 'dir-up');
              }
            }, 600);
          }
        }

        lastScrollY = currentScrollY;
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  // Optional Hero Title Click to trigger Break & Concatenate
  if (heroTitle) {
    heroTitle.style.cursor = 'pointer';
    heroTitle.title = 'Click to trigger Quantum Break & Concatenate on Monolith';
    heroTitle.addEventListener('click', () => {
      triggerCycle();
    });
  }
}
