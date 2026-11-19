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
  initBottomAuthDock();
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
  const appsLinks = document.querySelectorAll('.apps-nav-pill, a[href="/apps"]');
  const newswireLinks = document.querySelectorAll('.spatial-nav-dock a[href*="chronicles"]');
  const adminLinks = document.querySelectorAll('.admin-suite-pill');
  const activePageDisplay = document.getElementById('telemetry-active-page-name');

  // Reset active classes
  document.querySelectorAll('.spatial-nav-dock a, .admin-suite-pill, .apps-nav-pill').forEach(el => {
    el.classList.remove('active');
  });

  let activeTitle = 'HOME';
  if (path === '/admin' || path === '/admin.html' || path.startsWith('/admin/') ||
      path === '/login' || path === '/login.html' || path.startsWith('/login/')) {
    adminLinks.forEach(el => el.classList.add('active'));
    activeTitle = 'LOGIN // ADMIN CONTROL';
  } else if (path.startsWith('/apps') || path.startsWith('/app/')) {
    appsLinks.forEach(el => el.classList.add('active'));
    activeTitle = (hash === '#taskflow' || path.includes('taskflow')) ? 'APPS // TASKFLOW' : 'STUDIO APPS';
  } else if (hash === '#chronicles' || hash === '#newswire') {
    newswireLinks.forEach(el => el.classList.add('active'));
    activeTitle = 'NEWSWIRE';
  } else if (hash === '#philosophy') {
    const philLink = document.querySelector('.spatial-nav-dock a[href*="philosophy"]');
    if (philLink) philLink.classList.add('active');
    activeTitle = 'PHILOSOPHY';
  } else if (hash === '#about') {
    const abLink = document.querySelector('.spatial-nav-dock a[href*="about"]');
    if (abLink) abLink.classList.add('active');
    activeTitle = 'ABOUT';
  } else {
    studioLinks.forEach(el => el.classList.add('active'));
    activeTitle = 'HOME';
  }

  if (activePageDisplay) {
    activePageDisplay.textContent = activeTitle;
  }
}

window.addEventListener('hashchange', syncActiveNav);
window.addEventListener('popstate', syncActiveNav);

// ==========================================================================
// FLOATING BOTTOM-LEFT AUTH & USER PROFILE CONTROLLER
// Real-time synchronization of Google Avatar image or Name initial
// ==========================================================================
function syncBottomAuthDock(user) {
  const dock = document.getElementById('bottom-auth-dock');
  const avatarSlot = document.getElementById('auth-dock-avatar-slot');
  const kicker = document.getElementById('auth-dock-kicker');
  const label = document.getElementById('auth-dock-label');
  if (!dock || !avatarSlot) return;

  if (user && (user.displayName || user.email || user.photoURL)) {
    dock.classList.add('logged-in');
    const name = user.displayName || (user.email ? user.email.split('@')[0] : 'Account');
    const initial = name.charAt(0).toUpperCase() || 'U';

    if (user.photoURL) {
      avatarSlot.innerHTML = `<img src="${user.photoURL}" class="auth-dock-circle-img" alt="${name}" referrerpolicy="no-referrer"><span class="auth-dock-beacon-dot"></span>`;
    } else {
      avatarSlot.innerHTML = `<div class="auth-dock-letter-circle">${initial}</div><span class="auth-dock-beacon-dot"></span>`;
    }

    if (kicker) {
      kicker.textContent = user.isAdmin ? 'FOUNDER // ADMIN' : 'PILOT // ONLINE';
    }

    if (label) {
      const firstName = name.split(' ')[0];
      label.innerHTML = `${firstName.toUpperCase()} <span class="auth-dock-arrow">❯</span>`;
    }
    dock.title = `Signed in as ${name} (${user.email || ''})`;
  } else {
    dock.classList.remove('logged-in');
    avatarSlot.innerHTML = `
      <svg class="login-user-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor">
        <circle cx="8" cy="5" r="3" stroke-width="1.5"/>
        <path d="M2.5 14c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5" stroke-width="1.5"/>
      </svg>
      <span class="auth-dock-beacon-dot"></span>
    `;
    if (kicker) {
      kicker.textContent = window.location.pathname.includes('admin') ? 'STUDIO ADMIN' : 'NETROAR ID';
    }
    if (label) {
      label.innerHTML = `${window.location.pathname.includes('admin') ? 'ADMIN' : 'LOGIN'} <span class="auth-dock-arrow">❯</span>`;
    }
    dock.title = 'Netroar Account / Login';
  }
}
window.syncBottomAuthDock = syncBottomAuthDock;

let authDockHideTimer = null;
let isHoveringAuthDock = false;

function initAuthDockScrollWatcher() {
  const dock = document.getElementById('bottom-auth-dock');
  if (!dock) return;

  function showDock() {
    dock.classList.add('dock-visible');
    if (authDockHideTimer) {
      clearTimeout(authDockHideTimer);
      authDockHideTimer = null;
    }
    authDockHideTimer = setTimeout(() => {
      if (!isHoveringAuthDock) {
        dock.classList.remove('dock-visible');
      }
    }, 3000);
  }

  // Initial appearance for 3 seconds on page load
  showDock();

  // Scroll listener: shows on scroll, auto-hides after 3s of scroll inactivity
  window.addEventListener('scroll', showDock, { passive: true });

  // Hover preservation: stays visible while mouse is over it
  dock.addEventListener('mouseenter', () => {
    isHoveringAuthDock = true;
    dock.classList.add('dock-visible');
    if (authDockHideTimer) {
      clearTimeout(authDockHideTimer);
      authDockHideTimer = null;
    }
  });

  dock.addEventListener('mouseleave', () => {
    isHoveringAuthDock = false;
    if (authDockHideTimer) {
      clearTimeout(authDockHideTimer);
    }
    authDockHideTimer = setTimeout(() => {
      if (!isHoveringAuthDock) {
        dock.classList.remove('dock-visible');
      }
    }, 3000);
  });
}

function initBottomAuthDock() {
  initAuthDockScrollWatcher();
  try {
    const raw = localStorage.getItem('netroar_auth_user');
    if (raw) {
      const user = JSON.parse(raw);
      syncBottomAuthDock(user);
    } else {
      syncBottomAuthDock(null);
    }
  } catch (e) {
    syncBottomAuthDock(null);
  }

  // Cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'netroar_auth_user') {
      try {
        const user = e.newValue ? JSON.parse(e.newValue) : null;
        syncBottomAuthDock(user);
      } catch (err) {
        syncBottomAuthDock(null);
      }
    }
  });

  // Background Firebase auth listener if connected
  if (typeof window !== 'undefined' && window.location.protocol !== 'file:') {
    import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js').then(({ initializeApp, getApps }) => {
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js').then(({ getAuth, onAuthStateChanged }) => {
        const firebaseConfig = {
          apiKey: "AIzaSyD4l_2GeTiD0DsZOAI0EOjjmwglX93GzZA",
          authDomain: "netroar-to-do-web.firebaseapp.com",
          projectId: "netroar-to-do-web",
          storageBucket: "netroar-to-do-web.firebasestorage.app",
          messagingSenderId: "92413755790",
          appId: "1:92413755790:web:c50f156fc1bd1ad27d24df"
        };
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
        const auth = getAuth(app);
        onAuthStateChanged(auth, (fbUser) => {
          if (fbUser) {
            const payload = {
              displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
              email: fbUser.email || '',
              photoURL: fbUser.photoURL || '',
              uid: fbUser.uid
            };
            localStorage.setItem('netroar_auth_user', JSON.stringify(payload));
            syncBottomAuthDock(payload);
          } else {
            const adminToken = sessionStorage.getItem('netroar_admin_token') || localStorage.getItem('netroar_admin_token');
            if (!adminToken) {
              localStorage.removeItem('netroar_auth_user');
              syncBottomAuthDock(null);
            }
          }
        });
      }).catch(() => {});
    }).catch(() => {});
  }
}

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
    scrollVelocity = (currentY - lastScrollY) * 0.055;
    lastScrollY = currentY;
  }, { passive: true });

  // Generate particle nodes with minimum distance spacing
  const particleCount = Math.min(Math.floor((width * height) / 18000), 70);
  const particles = [];
  const minStarDistance = 18; // Decreased minimum distance threshold for natural constellations without overlapping

  for (let i = 0; i < particleCount; i++) {
    let px = Math.random() * width;
    let py = Math.random() * height;
    let attempts = 0;

    // Ensure stars spawn at least minStarDistance apart
    while (attempts < 50) {
      let tooClose = false;
      for (let k = 0; k < particles.length; k++) {
        if (Math.hypot(px - particles[k].x, py - particles[k].y) < minStarDistance) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) break;
      px = Math.random() * width;
      py = Math.random() * height;
      attempts++;
    }

    particles.push({
      x: px,
      y: py,
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

      // Draw particle with hyperdrive streak on fast scroll (extended silky streak)
      if (Math.abs(scrollVelocity) > 0.2) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y - scrollVelocity * 5.8);
        ctx.strokeStyle = `rgba(0, 245, 184, ${p.baseAlpha * 0.95})`;
        ctx.lineWidth = p.radius * 0.95;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 245, 184, ${p.baseAlpha})`;
        ctx.fill();
      }

      // Enforce minimum distance & dynamic repulsion so stars never clump or overlap
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.hypot(dx, dy);

        // Repel particles if they get closer than minimum distance
        if (dist < minStarDistance) {
          const effectiveDist = dist > 0.1 ? dist : 0.1;
          const overlap = (minStarDistance - effectiveDist) * 0.5;
          const nx = dx / effectiveDist;
          const ny = dy / effectiveDist;

          // Push positions apart immediately so stars never touch
          p.x += nx * overlap * 0.25;
          p.y += ny * overlap * 0.25;
          p2.x -= nx * overlap * 0.25;
          p2.y -= ny * overlap * 0.25;

          // Impart gentle repulsion momentum
          p.vx += nx * 0.03;
          p.vy += ny * 0.03;
          p2.vx -= nx * 0.03;
          p2.vy -= ny * 0.03;
        }

        // Connect nearby particles with subtle energy lines
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
  const philosophySection = document.getElementById('philosophy');
  const aboutSection = document.getElementById('about');
  const homeNav = document.querySelector('.spatial-nav-dock a[href="/"]');
  const philosophyNav = document.querySelector('.spatial-nav-dock a[href*="philosophy"]');
  const newswireNav = document.querySelector('.spatial-nav-dock a[href*="chronicles"]');
  const aboutNav = document.querySelector('.spatial-nav-dock a[href*="about"]');

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

        // Dynamic Section Scrollspy on Home (HOME, PHILOSOPHY, NEWSWIRE, ABOUT)
        if (homeNav && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html'))) {
          const activePageDisplay = document.getElementById('telemetry-active-page-name');
          const navLinks = [homeNav, philosophyNav, newswireNav, aboutNav].filter(Boolean);

          function setNavActive(targetEl, title) {
            navLinks.forEach(link => link.classList.remove('active'));
            if (targetEl) targetEl.classList.add('active');
            if (activePageDisplay) activePageDisplay.textContent = title;
          }

          const aboutRect = aboutSection ? aboutSection.getBoundingClientRect() : null;
          const chroniclesRect = chroniclesSection ? chroniclesSection.getBoundingClientRect() : null;
          const philosophyRect = philosophySection ? philosophySection.getBoundingClientRect() : null;

          if (aboutRect && aboutRect.top <= 250 && aboutRect.bottom >= 120) {
            setNavActive(aboutNav, 'ABOUT');
          } else if (chroniclesRect && chroniclesRect.top <= 250 && chroniclesRect.bottom >= 120) {
            setNavActive(newswireNav, 'NEWSWIRE');
          } else if (philosophyRect && philosophyRect.top <= 250 && philosophyRect.bottom >= 120) {
            setNavActive(philosophyNav, 'PHILOSOPHY');
          } else if (scrollTop < 420) {
            setNavActive(homeNav, 'HOME');
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

      // Extended active viewing area so scroll effects start earlier & linger longer
      if (rect.bottom > -240 && rect.top < windowH + 240) {
        const clampedProg = Math.max(-1.5, Math.min(1.5, progress));

        // 1. Monolith and images remain rock-solid and stable with zero vertical scroll tilt distortion
        target.style.transform = 'none';

        // 2. Anamorphic Optical Glare Sweep across extended scroll zone
        if (glare) {
          const glareY = (-clampedProg * 58).toFixed(1);
          const glareOpacity = Math.max(0.12, 0.72 - Math.abs(clampedProg) * 0.35);
          glare.style.transform = `rotate(-22deg) translateY(${glareY}%)`;
          glare.style.opacity = glareOpacity.toFixed(2);
        }

        // 3. Center Focus Magnetic Lock (extended focus zone so effect stays longer)
        if (Math.abs(progress) < 0.44) {
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
