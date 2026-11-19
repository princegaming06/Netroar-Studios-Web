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
  initSpatialScrollEffects();
  initAppsPageRouting();
  initMinimalAppsGrid();
  initFlagshipConsole();
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
  const activePageDisplay = document.getElementById('telemetry-active-page-name');

  // Reset active classes
  document.querySelectorAll('.spatial-nav-dock a, .admin-suite-pill').forEach(el => {
    el.classList.remove('active');
  });

  let activeTitle = 'STUDIO';
  if (path === '/admin' || path === '/admin.html' || path.startsWith('/admin/')) {
    adminLinks.forEach(el => el.classList.add('active'));
    activeTitle = 'ADMIN CONTROL PANEL';
  } else if (path.startsWith('/apps') || path.startsWith('/app/')) {
    appsLinks.forEach(el => el.classList.add('active'));
    activeTitle = (hash === '#taskflow' || path.includes('taskflow')) ? 'APPS // TASKFLOW' : 'STUDIO APPS';
  } else if (hash === '#chronicles' || hash === '#newswire') {
    newswireLinks.forEach(el => el.classList.add('active'));
    activeTitle = 'NEWSWIRE';
  } else {
    studioLinks.forEach(el => el.classList.add('active'));
    activeTitle = 'STUDIO';
  }

  if (activePageDisplay) {
    activePageDisplay.textContent = activeTitle;
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
    const activePageDisplay = document.getElementById('telemetry-active-page-name');
    if (activePageDisplay) activePageDisplay.textContent = 'APPS // TASKFLOW';
    playLaserBeep(620, 0.08, 'triangle');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showCatalog() {
    consoleView.classList.remove('view-visible');
    consoleView.classList.add('view-hidden');
    catalogView.classList.remove('view-hidden');
    catalogView.classList.add('view-visible');
    const activePageDisplay = document.getElementById('telemetry-active-page-name');
    if (activePageDisplay) activePageDisplay.textContent = 'STUDIO APPS';
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

      // Draw particle with hyperdrive streak on fast scroll
      if (Math.abs(scrollVelocity) > 0.35) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y - scrollVelocity * 4.2);
        ctx.strokeStyle = `rgba(0, 245, 184, ${p.baseAlpha * 0.9})`;
        ctx.lineWidth = p.radius * 0.95;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 245, 184, ${p.baseAlpha})`;
        ctx.fill();
      }

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
  const header = document.querySelector('.spatial-header');
  const scrollTopBtn = document.getElementById('scroll-top-beacon');
  const chroniclesSection = document.getElementById('chronicles');
  const studioNav = document.querySelector('.spatial-nav-dock a[href="/"]');
  const newswireNav = document.querySelector('.spatial-nav-dock a[href*="chronicles"]');

  let lastScrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollThreshold = 8;

  // 1. Scroll listener for progress, auto-hide header, and scroll-top beacon
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        const delta = scrollTop - lastScrollTop;

        // Auto-Hide Header on Scroll Down, Reveal on Scroll Up
        if (header) {
          if (scrollTop <= 45) {
            header.classList.remove('header-hidden');
            header.classList.remove('scrolled');
          } else {
            header.classList.add('scrolled');
            if (delta > scrollThreshold && scrollTop > 100) {
              // Scrolling DOWN: hide header off-screen
              header.classList.add('header-hidden');
            } else if (delta < -scrollThreshold) {
              // Scrolling UP: reveal header into view
              header.classList.remove('header-hidden');
            }
          }
        }

        lastScrollTop = Math.max(0, scrollTop);

        // Floating Scroll-To-Top Beacon with Circular Progress Ring
        if (scrollTopBtn) {
          if (scrollTop > 320) {
            scrollTopBtn.classList.add('visible');
          } else {
            scrollTopBtn.classList.remove('visible');
          }

          const beaconProgressCircle = document.getElementById('beacon-dial-progress');
          if (beaconProgressCircle) {
            const circumference = 125.66; // 2 * PI * 20
            const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;
            beaconProgressCircle.style.strokeDashoffset = offset.toFixed(2);
          }
        }

        // Dynamic Section Scrollspy on Home
        if (chroniclesSection && studioNav && newswireNav && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html'))) {
          const rect = chroniclesSection.getBoundingClientRect();
          const activePageDisplay = document.getElementById('telemetry-active-page-name');
          if (rect.top <= 200 && rect.bottom >= 150) {
            studioNav.classList.remove('active');
            newswireNav.classList.add('active');
            if (activePageDisplay) activePageDisplay.textContent = 'NEWSWIRE';
          } else if (rect.top > 200) {
            newswireNav.classList.remove('active');
            studioNav.classList.add('active');
            if (activePageDisplay) activePageDisplay.textContent = 'STUDIO';
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
    '.scroll-reveal, .popular-spotlight-monolith, .chronicle-card, .app-minimal-card, .popular-quad-card, .login-hud-card, .admin-tabs-nav'
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
// 10. CINEMATIC SPATIAL SCROLL ENGINE
// Features:
// - Continuous 3D Perspective Parallax & Dynamic Horizon Tilt on Scroll
// - Anamorphic Optical Glare Sweep across Cyber Acrylic Glass
// - Center Viewport Magnetic Lock & Focus Illumination (Concinnity)
// - Living Quantum Particle Hyperspace Streak Inertia on Scroll Velocity
// - Dynamic Circular Progress Meter on Teleport Beacon
// - Butter-Smooth 60-144 FPS Hardware Accelerated Motion
// ==========================================================================
function initSpatialScrollEffects() {
  const monolith = document.getElementById('popular-spotlight-monolith');
  const consoleRig = document.getElementById('flagship-console-rig');
  const glare = document.getElementById('monolith-optical-glare') || document.getElementById('console-optical-glare');
  const quadCards = document.querySelectorAll('.popular-quad-card');

  let ticking = false;

  function updateSpatialScroll() {
    const target = monolith || consoleRig;
    const windowH = window.innerHeight;

    if (target) {
      const rect = target.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const progress = (centerY - windowH / 2) / (windowH / 2); // -1 (top) to 0 (center) to +1 (bottom)

      // Only calculate if target is in active viewing area
      if (rect.bottom > -100 && rect.top < windowH + 100) {
        const clampedProg = Math.max(-1.2, Math.min(1.2, progress));

        // 1. Monolith and images remain rock-solid and stable with zero vertical scroll tilt distortion
        target.style.transform = 'none';

        // 2. Anamorphic Optical Glare Sweep
        if (glare) {
          const glareY = (-clampedProg * 45).toFixed(1);
          const glareOpacity = Math.max(0.12, 0.65 - Math.abs(clampedProg) * 0.45);
          glare.style.transform = `rotate(-22deg) translateY(${glareY}%)`;
          glare.style.opacity = glareOpacity.toFixed(2);
        }

        // 3. Center Focus Magnetic Lock
        if (Math.abs(progress) < 0.28) {
          target.classList.add('in-focus');
        } else {
          target.classList.remove('in-focus');
        }
      }
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateSpatialScroll);
      ticking = true;
    }
  }, { passive: true });

  // Initial calculation
  updateSpatialScroll();

  // Expose API helpers for backward compatibility
  window.netroarBreak = () => showToast('⚡ [SPATIAL SCROLL] Active 3D Horizon Tilt in Effect');
  window.netroarConcatenate = () => showToast('🔗 [SPATIAL SCROLL] Center Monolithic Focus Locked');
  window.netroarConcinnate = window.netroarConcatenate;
  window.netroarCycle = () => showToast('↺ [SPATIAL SCROLL] Continuous Parallax Scrub Active');
}
