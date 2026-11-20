/**
 * NETROAR APP STUDIOS — Flagship Controller
 * Tap Icon or Name -> redirects to official webpage
 * Next & Previous icons -> scroll through mixed screenshots
 */

let appData = null;
let screenshotList = [];
let currentIndex = 0;

// DOM Elements
const appIconLink = document.getElementById('app-icon-link');
const appIconImg = document.getElementById('studio-app-icon');
const appNameLink = document.getElementById('app-name-link');
const appDesc = document.getElementById('studio-app-description');

const mainImg = document.getElementById('showcase-main-img');
const captionEl = document.getElementById('showcase-caption');
const counterEl = document.getElementById('showcase-counter');
const prevBtn = document.getElementById('btn-showcase-prev');
const nextBtn = document.getElementById('btn-showcase-next');
const stage = document.getElementById('showcase-stage');

const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

document.addEventListener('DOMContentLoaded', () => {
  initAppStudios();
  setupNavigation();
  setupLightbox();
});

async function initAppStudios() {
  try {
    const res = await fetch('/api/apps');
    const data = await res.json();
    if (data.success && Array.isArray(data.apps) && data.apps.length > 0) {
      appData = data.apps[0];
      populateAppInfo(appData);
      buildMixedScreenshots(appData);
      renderActiveScreenshot();
    }
  } catch (err) {
    console.error('Failed to load app data:', err);
  }
}

function populateAppInfo(app) {
  const officialWebUrl = app.websiteUrl || 'https://netroar-to-do.onrender.com';

  // Wire icon and name links to redirect directly to official webpage
  if (appIconLink) appIconLink.href = officialWebUrl;
  if (appNameLink) {
    appNameLink.href = officialWebUrl;
    appNameLink.textContent = (app.name || 'Netroar App') + ' ';
    const arrowSpan = document.createElement('span');
    arrowSpan.style.fontSize = '0.8em';
    arrowSpan.textContent = '↗';
    appNameLink.appendChild(arrowSpan);
  }
  if (appIconImg && app.icon) {
    appIconImg.src = app.icon;
  }
  if (appDesc && app.description) {
    appDesc.textContent = app.description;
  }
}

// Device detection + mixed image list
function buildMixedScreenshots(app) {
  const ua = navigator.userAgent || '';
  const isAndroid = /android/i.test(ua);
  const isWindows = /windows/i.test(ua);

  const winScreens = (app.screenshots?.windows || []).map(s => ({
    ...s,
    platform: 'Windows Desktop'
  }));

  const droidScreens = (app.screenshots?.android || []).map(s => ({
    ...s,
    platform: 'Android Mobile'
  }));

  if (isAndroid) {
    // Prioritize Android mobile screens for mobile visitors
    screenshotList = [...droidScreens, ...winScreens];
  } else if (isWindows) {
    // Prioritize Windows desktop screens for Windows visitors
    screenshotList = [...winScreens, ...droidScreens];
  } else {
    // Mixed interleave
    screenshotList = [];
    const max = Math.max(winScreens.length, droidScreens.length);
    for (let i = 0; i < max; i++) {
      if (winScreens[i]) screenshotList.push(winScreens[i]);
      if (droidScreens[i]) screenshotList.push(droidScreens[i]);
    }
  }

  // Fallback if empty
  if (screenshotList.length === 0) {
    screenshotList = [
      { src: '/assets/screenshots/01_Desktop_Overview.png', title: 'TaskFlow Desktop Overview', platform: 'Windows Desktop' }
    ];
  }

  currentIndex = 0;
}

function renderActiveScreenshot() {
  if (screenshotList.length === 0) return;
  const current = screenshotList[currentIndex];

  if (mainImg) {
    mainImg.style.opacity = '0.3';
    setTimeout(() => {
      mainImg.src = current.src;
      mainImg.alt = current.title;
      mainImg.style.opacity = '1';
    }, 120);
  }

  if (captionEl) {
    captionEl.textContent = `${current.title} (${current.platform || 'Screenshot'})`;
  }

  if (counterEl) {
    counterEl.textContent = `${currentIndex + 1} / ${screenshotList.length}`;
  }
}

function setupNavigation() {
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToPrev();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToNext();
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goToPrev();
    if (e.key === 'ArrowRight') goToNext();
  });

  // Touch Swipe for mobile devices
  let touchStartX = 0;
  let touchEndX = 0;

  if (stage) {
    stage.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleGesture();
    }, { passive: true });
  }

  function handleGesture() {
    const swipeDist = touchEndX - touchStartX;
    if (Math.abs(swipeDist) > 40) {
      if (swipeDist < 0) {
        goToNext(); // Swiped left -> show next
      } else {
        goToPrev(); // Swiped right -> show prev
      }
    }
  }

  // Click on stage opens lightbox
  if (stage) {
    stage.addEventListener('click', () => {
      const current = screenshotList[currentIndex];
      if (current && current.src) openLightbox(current.src);
    });
  }
}

function goToPrev() {
  if (screenshotList.length === 0) return;
  currentIndex = (currentIndex - 1 + screenshotList.length) % screenshotList.length;
  renderActiveScreenshot();
}

function goToNext() {
  if (screenshotList.length === 0) return;
  currentIndex = (currentIndex + 1) % screenshotList.length;
  renderActiveScreenshot();
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
