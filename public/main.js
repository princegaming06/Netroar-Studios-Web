/**
 * NETROAR STUDIOS — Official Catalog Client Engine
 */

let allApps = [];
let studioSettings = {};
let currentPlatformFilter = 'all';
let currentCategoryFilter = 'all';
let currentSearchTerm = '';
let currentSort = 'featured';

// DOM Elements
const appsGrid = document.getElementById('apps-grid');
const searchInput = document.getElementById('app-search-input');
const sortSelect = document.getElementById('sort-select');
const platformPills = document.querySelectorAll('#platform-filters .filter-pill');
const categoryPills = document.querySelectorAll('#category-filters .filter-pill');
const themeToggleBtn = document.getElementById('theme-toggle');

// Modal Elements
const appModal = document.getElementById('app-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalAppIcon = document.getElementById('modal-app-icon');
const modalAppName = document.getElementById('modal-app-name');
const modalCategory = document.getElementById('modal-category');
const modalStatusBadge = document.getElementById('modal-status-badge');
const modalVersionSku = document.getElementById('modal-version-sku');
const modalDescription = document.getElementById('modal-description');
const modalFeaturesList = document.getElementById('modal-features-list');
const modalActionsArea = document.getElementById('modal-actions-area');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  fetchStudioSettings();
  fetchApps();
  setupEventListeners();
});

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('netroar_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('netroar_theme', next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (!icon) return;
  if (theme === 'light') {
    icon.innerHTML = `
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    `;
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

// Fetch Settings
async function fetchStudioSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success && data.settings) {
      studioSettings = data.settings;
      applyStudioSettings(data.settings);
    }
  } catch (err) {
    console.warn('Unable to load studio settings, using fallbacks:', err);
  }
}

function applyStudioSettings(settings) {
  if (settings.studioName) {
    document.title = `${settings.studioName} — Official Software & Apps Catalog`;
    const headerTitle = document.getElementById('header-studio-name');
    if (headerTitle) headerTitle.textContent = settings.studioName;
    const footerCopy = document.getElementById('footer-studio-copy');
    if (footerCopy) footerCopy.textContent = settings.studioName;
  }
  if (settings.heroTitle) {
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle) heroTitle.innerHTML = settings.heroTitle.replace(/\n/g, '<br>');
  }
  if (settings.heroDescription) {
    const heroDesc = document.getElementById('hero-description');
    if (heroDesc) heroDesc.textContent = settings.heroDescription;
  }
  if (settings.aboutText) {
    const aboutText = document.getElementById('about-studio-text');
    if (aboutText) aboutText.textContent = settings.aboutText;
  }
}

// Fetch Apps
async function fetchApps() {
  try {
    appsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚡</div>
        <div class="empty-state-title">Connecting to Netroar Ecosystem...</div>
        <div class="empty-state-desc">Synchronizing production apps and catalog details.</div>
      </div>
    `;

    const res = await fetch('/api/apps');
    const data = await res.json();
    if (data.success && Array.isArray(data.apps)) {
      allApps = data.apps;
      const totalEl = document.getElementById('stat-total-apps');
      if (totalEl) totalEl.textContent = allApps.length;
      updateJsonLdSchema(allApps);
      renderApps();
    }
  } catch (err) {
    console.error('Error fetching apps:', err);
    appsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Catalog Temporarily Unavailable</div>
        <div class="empty-state-desc">Please ensure server is running at http://localhost:3000</div>
      </div>
    `;
  }
}

// Event Listeners
function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value.toLowerCase().trim();
    renderApps();
  });

  // Sort
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderApps();
  });

  // Platform Filter Pills
  platformPills.forEach(pill => {
    pill.addEventListener('click', () => {
      platformPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentPlatformFilter = pill.getAttribute('data-platform');
      renderApps();
    });
  });

  // Category Filter Pills
  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategoryFilter = pill.getAttribute('data-category');
      renderApps();
    });
  });

  // Modal Close
  modalCloseBtn.addEventListener('click', closeModal);
  appModal.addEventListener('click', (e) => {
    if (e.target === appModal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && appModal.classList.contains('active')) {
      closeModal();
    }
  });
}

// Render Apps Filtered & Sorted
function renderApps() {
  let filtered = allApps.filter(app => {
    // Platform filter
    if (currentPlatformFilter !== 'all') {
      const matchPlatform = app.platforms.some(p => p.toLowerCase().includes(currentPlatformFilter));
      if (!matchPlatform) return false;
    }

    // Category filter
    if (currentCategoryFilter !== 'all') {
      if ((app.category || '').toLowerCase() !== currentCategoryFilter) return false;
    }

    // Search query
    if (currentSearchTerm) {
      const haystack = [
        app.name,
        app.tagline,
        app.description,
        app.category,
        ...(app.platforms || []),
        ...(app.features || [])
      ].join(' ').toLowerCase();

      if (!haystack.includes(currentSearchTerm)) return false;
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (currentSort === 'featured') {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (b.rating || 0) - (a.rating || 0);
    }
    if (currentSort === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (currentSort === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (currentSort === 'newest') {
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    }
    return 0;
  });

  if (filtered.length === 0) {
    appsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No Matching Software Found</div>
        <div class="empty-state-desc">Try clearing your search filters or check back for new releases.</div>
      </div>
    `;
    return;
  }

  appsGrid.innerHTML = filtered.map(app => createAppCardHtml(app)).join('');

  // Wire Details Buttons
  document.querySelectorAll('.btn-view-details').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const appId = e.currentTarget.getAttribute('data-id');
      const found = allApps.find(a => a.id === appId);
      if (found) openModal(found);
    });
  });
}

// HTML Card Generator
function createAppCardHtml(app) {
  const isFeatured = Boolean(app.isFeatured);
  const statusClass = (app.status || '').toLowerCase() === 'live' ? 'status-live' : 
                      (app.status || '').toLowerCase() === 'beta' ? 'status-beta' : 'status-early';

  const platformBadgesHtml = (app.platforms || []).map(p => {
    const pLower = p.toLowerCase();
    const platClass = pLower.includes('web') ? 'platform-web' : 
                      pLower.includes('windows') ? 'platform-windows' : 
                      pLower.includes('android') ? 'platform-android' : '';
    const icon = pLower.includes('web') ? '🌐' : pLower.includes('windows') ? '🪟' : pLower.includes('android') ? '🤖' : '⚡';
    return `<span class="platform-badge ${platClass}">${icon} ${p}</span>`;
  }).join('');

  const visitUrl = app.websiteUrl || app.downloadUrl || '#';
  const hasVisit = Boolean(app.websiteUrl || app.downloadUrl);

  return `
    <article class="app-card ${isFeatured ? 'featured-card' : ''}" id="${app.slug}">
      ${isFeatured ? '<span class="featured-badge">Featured</span>' : ''}
      
      <div>
        <div class="app-header-area">
          <div class="app-icon-wrap">
            <img src="${app.icon || '/assets/logo/netroars-logo.png'}" 
                 alt="${app.name} Icon" 
                 class="app-icon-img"
                 onerror="this.src='/assets/logo/netroars-logo.png'">
          </div>
          <div class="app-title-wrap">
            <h3 class="app-name">${app.name}</h3>
            <span class="app-category-tag">${app.category || 'Software'}</span>
          </div>
        </div>

        <p class="app-tagline">${app.tagline || app.description || ''}</p>
      </div>

      <div>
        <div class="app-meta-row">
          <div class="platform-badges">
            ${platformBadgesHtml}
          </div>
          <span class="status-badge ${statusClass}">${app.status || 'Live'}</span>
        </div>

        <div class="app-actions">
          ${hasVisit ? `
            <a href="${visitUrl}" target="_blank" class="btn-card-primary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              <span>Launch / Get</span>
            </a>
          ` : `
            <button class="btn-card-primary btn-view-details" data-id="${app.id}">
              <span>View Specs</span>
            </button>
          `}

          <button class="btn-card-outline btn-view-details" data-id="${app.id}" title="View detailed features and download links">
            <span>Details</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

// Modal Actions
function openModal(app) {
  modalAppIcon.src = app.icon || '/assets/logo/netroars-logo.png';
  modalAppName.textContent = app.name;
  modalCategory.textContent = app.category || 'Software';
  modalStatusBadge.textContent = app.status || 'LIVE';
  modalStatusBadge.className = `status-badge ${app.status?.toLowerCase() === 'live' ? 'status-live' : 'status-beta'}`;
  modalVersionSku.textContent = `v${app.version || '1.0.0'} · SKU: ${app.sku || 'NETROAR-01'} · License: ${app.pricing || 'Free'}`;
  modalDescription.textContent = app.description || app.tagline || '';

  // Features list
  if (Array.isArray(app.features) && app.features.length > 0) {
    modalFeaturesList.innerHTML = app.features.map(f => `<li>${f}</li>`).join('');
  } else {
    modalFeaturesList.innerHTML = `<li>Full high-performance integration and cyber-acrylic UI.</li>`;
  }

  // Action buttons
  let actionsHtml = '';
  if (app.websiteUrl) {
    actionsHtml += `
      <a href="${app.websiteUrl}" target="_blank" class="btn-card-primary">
        <span>Visit Official Website</span>
      </a>
    `;
  }
  if (app.downloadUrl && app.downloadUrl !== app.websiteUrl) {
    actionsHtml += `
      <a href="${app.downloadUrl}" target="_blank" class="btn-card-outline">
        <span>Direct Download</span>
      </a>
    `;
  }
  if (app.repoUrl) {
    actionsHtml += `
      <a href="${app.repoUrl}" target="_blank" class="btn-card-outline" title="GitHub Source">
        <span>GitHub</span>
      </a>
    `;
  }

  modalActionsArea.innerHTML = actionsHtml;
  appModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  appModal.classList.remove('active');
  document.body.style.overflow = '';
}

// Structured Data for Googlebot & Google Merchant AI Scanner
function updateJsonLdSchema(apps) {
  const schemaEl = document.getElementById('studio-schema');
  if (!schemaEl) return;

  const origin = window.location.origin;
  const itemList = apps.map((app, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "item": {
      "@type": "SoftwareApplication",
      "name": app.name,
      "operatingSystem": (app.platforms || []).join(', '),
      "applicationCategory": app.category || "UtilitiesApplication",
      "description": app.description || app.tagline,
      "url": app.websiteUrl || `${origin}/#${app.slug}`,
      "image": app.icon?.startsWith('http') ? app.icon : `${origin}${app.icon}`,
      "softwareVersion": app.version || "1.0.0",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": String(app.rating || 4.9),
        "reviewCount": String(app.reviewCount || 100)
      }
    }
  }));

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": studioSettings.studioName || "Netroar Studios",
        "url": origin,
        "logo": `${origin}/assets/logo/netroars-logo.png`,
        "description": studioSettings.heroDescription,
        "founder": {
          "@type": "Person",
          "name": studioSettings.founderName || "Prince Singh"
        }
      },
      {
        "@type": "ItemList",
        "name": "Netroar Studios Products Catalog",
        "itemListElement": itemList
      }
    ]
  };

  schemaEl.textContent = JSON.stringify(structuredData, null, 2);
}
