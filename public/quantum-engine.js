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
  initFlagshipConsole();
  initTerminal();
  init3DRigTilt();
  initLightbox();
});

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
      p.y += p.vy;

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
    } else {
      showToast(`Command not recognized: "${clean}". Try "launch", "download", or "apps".`);
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
