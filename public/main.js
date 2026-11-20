/**
 * NETROAR STUDIOS — Official Flagship Showcase Engine
 * Device-aware rendering: Windows, Android, and Mixed ecosystem previews.
 */

let flagshipApp = null;
let currentDeviceView = 'windows'; // 'windows' | 'android' | 'mixed'
let currentScreenshotIndex = 0;
let currentScreenshotList = [];
let userDetectedOS = 'windows';

// Security: XSS sanitizer for HTML string rendering
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// DOM Elements
const flagshipSlot = document.getElementById('flagship-app-slot');
const themeToggleBtn = document.getElementById('theme-toggle');
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  detectUserOS();
  fetchFlagshipData();
  setupLightbox();
});

// Device OS Detection
function detectUserOS() {
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) {
    userDetectedOS = 'android';
    currentDeviceView = 'android';
  } else if (/windows/i.test(ua)) {
    userDetectedOS = 'windows';
    currentDeviceView = 'windows';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    userDetectedOS = 'ios';
    currentDeviceView = 'mixed';
  } else if (/mac/i.test(ua)) {
    userDetectedOS = 'mac';
    currentDeviceView = 'mixed';
  } else {
    userDetectedOS = 'web';
    currentDeviceView = 'mixed';
  }
}

// Theme
function initTheme() {
  const savedTheme = localStorage.getItem('netroar_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('netroar_theme', next);
      updateThemeIcon(next);
    });
  }
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (!icon) return;
  if (theme === 'light') {
    icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
  } else {
    icon.innerHTML = `
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    `;
  }
}

// Fetch Flagship Data
async function fetchFlagshipData() {
  try {
    const res = await fetch('/api/apps');
    const data = await res.json();
    if (data.success && Array.isArray(data.apps) && data.apps.length > 0) {
      flagshipApp = data.apps[0];
      buildScreenshotList();
      renderFlagshipCard();
    }
  } catch (err) {
    console.error('Failed to load app data:', err);
  }
}

// Compile screenshots according to current view
function buildScreenshotList() {
  if (!flagshipApp || !flagshipApp.screenshots) return;
  const winScreens = (flagshipApp.screenshots.windows || []).map(s => ({ ...s, platform: 'Windows Desktop' }));
  const droidScreens = (flagshipApp.screenshots.android || []).map(s => ({ ...s, platform: 'Android Mobile' }));

  if (currentDeviceView === 'windows') {
    currentScreenshotList = winScreens;
  } else if (currentDeviceView === 'android') {
    currentScreenshotList = droidScreens;
  } else {
    // Mixed: Interleave windows and android
    currentScreenshotList = [];
    const maxLen = Math.max(winScreens.length, droidScreens.length);
    for (let i = 0; i < maxLen; i++) {
      if (winScreens[i]) currentScreenshotList.push(winScreens[i]);
      if (droidScreens[i]) currentScreenshotList.push(droidScreens[i]);
    }
  }

  currentScreenshotIndex = 0;
}

// Render the Flagship Card (Exact Match to User Wireframe)
function renderFlagshipCard() {
  if (!flagshipApp) return;

  const app = flagshipApp;
  const detectedLabel = userDetectedOS === 'windows' ? 'Detected: Windows PC 🪟' :
                        userDetectedOS === 'android' ? 'Detected: Android Mobile 🤖' :
                        userDetectedOS === 'ios' ? 'Detected: Apple iOS 🍎' :
                        userDetectedOS === 'mac' ? 'Detected: macOS 💻' : 'Detected: Web Client 🌐';

  // Primary action button tailored to detected device
  let primaryCtaHtml = '';
  if (userDetectedOS === 'windows') {
    primaryCtaHtml = `
      <a href="${app.windowsDownloadUrl || app.downloadUrl || 'https://netroar-to-do.onrender.com'}" target="_blank" class="btn-flagship-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Download for Windows (.exe)</span>
      </a>
      <a href="${app.websiteUrl || 'https://netroar-to-do.onrender.com'}" target="_blank" class="btn-flagship-outline">
        <span>Launch Web Version ↗</span>
      </a>
      <a href="${app.androidDownloadUrl || app.downloadUrl || '#'}" target="_blank" class="btn-flagship-outline" style="color: var(--accent-android);">
        <span>Android APK</span>
      </a>
    `;
  } else if (userDetectedOS === 'android') {
    primaryCtaHtml = `
      <a href="${app.androidDownloadUrl || app.downloadUrl || 'https://netroar-to-do.onrender.com'}" target="_blank" class="btn-flagship-primary" style="background: var(--accent-android); color: #021a0c; box-shadow: 0 0 25px rgba(61, 220, 132, 0.4);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Download Android APK</span>
      </a>
      <a href="${app.websiteUrl || 'https://netroar-to-do.onrender.com'}" target="_blank" class="btn-flagship-outline">
        <span>Launch Web Version ↗</span>
      </a>
      <a href="${app.windowsDownloadUrl || app.downloadUrl || '#'}" target="_blank" class="btn-flagship-outline">
        <span>Windows Setup</span>
      </a>
    `;
  } else {
    primaryCtaHtml = `
      <a href="${app.websiteUrl || 'https://netroar-to-do.onrender.com'}" target="_blank" class="btn-flagship-primary">
        <span>Launch Official Web App ↗</span>
      </a>
      <a href="${app.windowsDownloadUrl || 'https://netroar-to-do.onrender.com'}" target="_blank" class="btn-flagship-outline">
        <span>Windows Setup (.exe)</span>
      </a>
      <a href="${app.androidDownloadUrl || 'https://netroar-to-do.onrender.com'}" target="_blank" class="btn-flagship-outline" style="color: var(--accent-android);">
        <span>Android APK</span>
      </a>
    `;
  }

  // Active screenshot preview
  const currentScreen = currentScreenshotList[currentScreenshotIndex] || { src: '/assets/screenshots/01_Desktop_Overview.png', title: 'TaskFlow Overview' };

  // Thumbnails HTML
  const thumbsHtml = currentScreenshotList.map((screen, idx) => `
    <div class="thumb-item ${idx === currentScreenshotIndex ? 'active' : ''}" data-idx="${idx}">
      <img src="${screen.src}" alt="${screen.title}" class="thumb-img" loading="lazy">
      <span class="thumb-badge">${screen.platform?.includes('Android') ? 'Android' : 'Windows'}</span>
    </div>
  `).join('');

  // Features list (escaped)
  const featuresHtml = (app.features || []).map(f => `
    <div class="feature-pill-card">
      <span style="color: var(--accent-primary); font-weight: 800; font-size: 1.1rem;">✓</span>
      <div>${escapeHtml(f)}</div>
    </div>
  `).join('');

  const safeAppName = escapeHtml(app.name || 'Netroar App');
  const safeAppTagline = escapeHtml(app.tagline || 'The Next-Gen Cyber-Acrylic Productivity & Gamified Task Ecosystem');
  const safeAppDescription = escapeHtml(app.description || '');
  const safeAppIcon = escapeHtml(app.icon || '/assets/logo/Netroar_To_Do_dark_v2.png');
  const safeAppVersion = escapeHtml(app.version || '1.2.0');
  const safeAppRating = escapeHtml(String(app.rating || '4.9'));
  const safeAppReviewCount = escapeHtml(String(app.reviewCount || 142));

  flagshipSlot.innerHTML = `
    <article class="flagship-card" id="taskflow-card">
      
      <!-- 1. Top Section: Large Icon + App Title & Metadata -->
      <div class="flagship-header-row">
        <div class="flagship-icon-box">
          <img src="${safeAppIcon}" 
               alt="${safeAppName} Icon" 
               class="flagship-icon-img"
               onerror="this.src='/assets/logo/netroars-logo.png'">
        </div>

        <div class="flagship-title-area">
          <div class="flagship-tag-row">
            <span class="flagship-publisher-tag">Netroar Studios Flagship</span>
            <span class="flagship-rating-badge">★ ${safeAppRating} (${safeAppReviewCount} Verified Reviews)</span>
            <span class="status-badge status-live">OFFICIAL STABLE</span>
          </div>

          <h2 class="flagship-name">${safeAppName}</h2>
          <div class="flagship-category-subtitle">${safeAppTagline}</div>
        </div>
      </div>

      <!-- 2. Middle Section: Description + Tags & CTAs -->
      <div class="flagship-middle-section">
        <p class="flagship-description-text">${safeAppDescription}</p>

        <div class="flagship-pills-row">
          <span class="flagship-pill detected-device">${detectedLabel}</span>
          <span class="flagship-pill platform-win">🪟 Windows 10/11 (v${safeAppVersion})</span>
          <span class="flagship-pill platform-droid">🤖 Android 8.0+ (APK)</span>
          <span class="flagship-pill platform-web">🌐 Web Cloud Sync</span>
          <span class="flagship-pill" style="color: #fff;">💎 100% Free & Open</span>
        </div>

        <div class="flagship-actions-row">
          ${primaryCtaHtml}
          <a href="${app.repoUrl || 'https://github.com/princegaming06/Netroar-To-Do-Official-WebPage'}" target="_blank" class="btn-flagship-outline" title="GitHub Repository">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      </div>

      <!-- 3. Bottom Section: Large Interactive Screenshot Showcase Container -->
      <div class="flagship-media-showcase">
        <div class="media-control-bar">
          <div class="device-switcher-group">
            <button class="device-switch-btn ${currentDeviceView === 'windows' ? 'active' : ''}" data-view="windows">
              🪟 Windows Desktop (${(app.screenshots?.windows || []).length})
            </button>
            <button class="device-switch-btn ${currentDeviceView === 'android' ? 'active' : ''}" data-view="android">
              🤖 Android Mobile (${(app.screenshots?.android || []).length})
            </button>
            <button class="device-switch-btn ${currentDeviceView === 'mixed' ? 'active' : ''}" data-view="mixed">
              ✨ Mixed Showcase (${(app.screenshots?.windows || []).length + (app.screenshots?.android || []).length})
            </button>
          </div>

          <div class="media-caption-info">
            <span>Click any image to zoom in full HD 🔍</span>
          </div>
        </div>

        <!-- Main Display Stage -->
        <div class="main-stage-preview" id="main-stage" title="Click to view full screen">
          <button class="main-stage-nav-btn nav-prev" id="btn-prev-screen" aria-label="Previous Screenshot">❮</button>
          <img src="${currentScreen.src}" alt="${currentScreen.title}" class="main-stage-img" id="main-stage-img">
          <button class="main-stage-nav-btn nav-next" id="btn-next-screen" aria-label="Next Screenshot">❯</button>
          <div class="main-stage-overlay-tag" id="main-stage-tag">${currentScreen.title} (${currentScreen.platform || 'Screenshot'})</div>
        </div>

        <!-- Horizontal Thumbnails Carousel -->
        <div class="thumbnails-carousel" id="thumbnails-carousel">
          ${thumbsHtml}
        </div>
      </div>

      <!-- 4. Key Capabilities & Ecosystem Features -->
      <div style="margin-top: 36px;">
        <h3 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.01em; color: var(--text-primary);">
          Core Architecture & Ecosystem Pillars
        </h3>
        <div class="flagship-features-summary">
          ${featuresHtml}
        </div>
      </div>

    </article>
  `;

  attachShowcaseEvents();
}

// Attach Interactive Showcase Events
function attachShowcaseEvents() {
  // Device view switcher pills
  document.querySelectorAll('.device-switch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.currentTarget.getAttribute('data-view');
      if (view === currentDeviceView) return;
      currentDeviceView = view;
      buildScreenshotList();
      renderFlagshipCard();
    });
  });

  // Previous button
  const prevBtn = document.getElementById('btn-prev-screen');
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateScreenshot(-1);
    });
  }

  // Next button
  const nextBtn = document.getElementById('btn-next-screen');
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateScreenshot(1);
    });
  }

  // Main stage click -> open Lightbox
  const mainStage = document.getElementById('main-stage');
  if (mainStage) {
    mainStage.addEventListener('click', () => {
      const screen = currentScreenshotList[currentScreenshotIndex];
      if (screen && screen.src) openLightbox(screen.src);
    });
  }

  // Thumbnails click
  document.querySelectorAll('.thumb-item').forEach(thumb => {
    thumb.addEventListener('click', (e) => {
      const idx = Number(e.currentTarget.getAttribute('data-idx'));
      selectScreenshot(idx);
    });
  });
}

function selectScreenshot(idx) {
  if (idx < 0 || idx >= currentScreenshotList.length) return;
  currentScreenshotIndex = idx;
  const screen = currentScreenshotList[currentScreenshotIndex];

  const mainImg = document.getElementById('main-stage-img');
  const mainTag = document.getElementById('main-stage-tag');

  if (mainImg) {
    mainImg.style.opacity = '0.4';
    setTimeout(() => {
      mainImg.src = screen.src;
      mainImg.alt = screen.title;
      mainImg.style.opacity = '1';
    }, 150);
  }

  if (mainTag) {
    mainTag.textContent = `${screen.title} (${screen.platform || 'Screenshot'})`;
  }

  // Update active thumbnail
  document.querySelectorAll('.thumb-item').forEach((item, i) => {
    item.classList.toggle('active', i === currentScreenshotIndex);
    if (i === currentScreenshotIndex) {
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });
}

function navigateScreenshot(direction) {
  let nextIdx = currentScreenshotIndex + direction;
  if (nextIdx < 0) nextIdx = currentScreenshotList.length - 1;
  if (nextIdx >= currentScreenshotList.length) nextIdx = 0;
  selectScreenshot(nextIdx);
}

// Lightbox
function setupLightbox() {
  if (!lightboxClose || !lightboxModal) return;

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxModal.addEventListener('click', (e) => {
    if (e.target === lightboxModal) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxModal.classList.contains('active')) {
      closeLightbox();
    }
    if (lightboxModal.classList.contains('active')) {
      if (e.key === 'ArrowLeft') navigateScreenshot(-1);
      if (e.key === 'ArrowRight') navigateScreenshot(1);
    }
  });
}

function openLightbox(src) {
  lightboxImg.src = src;
  lightboxModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightboxModal.classList.remove('active');
  document.body.style.overflow = '';
}
