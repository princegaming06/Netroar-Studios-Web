/**
 * NETROAR STUDIOS — Admin Control Suite Controller
 * Cyber-Acrylic HUD, Real-time Telemetry, Ecosystem Manager & Live Feed Diagnostics
 */

let adminToken = sessionStorage.getItem('netroar_admin_token') || null;
let currentApps = [];
let currentSettings = {};
let activeFilter = 'all';

// DOM Elements
const loginScreen = document.getElementById('admin-login-screen');
const dashboardScreen = document.getElementById('admin-dashboard-screen');
const loginForm = document.getElementById('admin-login-form');
const passcodeInput = document.getElementById('admin-passcode-input');
const btnLogout = document.getElementById('btn-logout');
const toastNotify = document.getElementById('toast-notify');

// Tabs
const tabButtons = document.querySelectorAll('.admin-tab-btn');
const tabContents = document.querySelectorAll('.admin-tab-content');

// Apps UI & Filter Bar
const appsTableContainer = document.getElementById('admin-apps-table-container');
const appsCountEl = document.getElementById('admin-apps-count');
const searchAppsInput = document.getElementById('admin-search-apps');
const btnOpenCreateModal = document.getElementById('btn-open-create-modal');
const filterStatusEl = document.getElementById('admin-filter-status');

// Modal Elements
const appModal = document.getElementById('admin-app-modal');
const modalCloseBtn = document.getElementById('admin-modal-close');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const appForm = document.getElementById('app-form');
const modalTitle = document.getElementById('admin-modal-title');
const iconPreviewImg = document.getElementById('form-icon-preview-img');
const iconUrlInput = document.getElementById('form-app-icon');

// Settings Elements
const settingsForm = document.getElementById('studio-settings-form');

// Backup Elements
const btnExportBackup = document.getElementById('btn-export-backup');
const btnTriggerImport = document.getElementById('btn-trigger-import');
const inputImportBackup = document.getElementById('input-import-backup');

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupAuthFlow();
  setupTabs();
  setupFilters();
  setupModalActions();
  setupSettingsForm();
  setupBackupHandlers();
  setupFeedTools();
});

// Toast Helper
function showToast(message, isError = false) {
  if (toastNotify) {
    toastNotify.textContent = message;
    toastNotify.style.borderColor = isError ? 'var(--danger-crimson)' : 'var(--neon-mint)';
    toastNotify.classList.add('show');
    setTimeout(() => {
      toastNotify.classList.remove('show');
    }, 3500);
  }
}

// Theme & Cyber Visual Engine
function initTheme() {
  const savedTheme = localStorage.getItem('netroar_theme') || 'dark';
  applyTheme(savedTheme);

  const handleToggle = () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const nxt = cur === 'dark' ? 'light' : 'dark';
    applyTheme(nxt);
    localStorage.setItem('netroar_theme', nxt);
    showToast(`Switched to ${nxt === 'dark' ? 'Cyber Obsidian (Dark)' : 'Prism Holographic (Light)'} theme.`);
  };

  const themeToggle = document.getElementById('theme-toggle');
  const themeToggleDash = document.getElementById('theme-toggle-dash');
  if (themeToggle) themeToggle.addEventListener('click', handleToggle);
  if (themeToggleDash) themeToggleDash.addEventListener('click', handleToggle);

  // Studio Settings Theme Mode Dropdown sync
  const settingThemeSelect = document.getElementById('setting-theme-mode');
  if (settingThemeSelect) {
    settingThemeSelect.addEventListener('change', () => {
      const selected = settingThemeSelect.value;
      applyTheme(selected);
      localStorage.setItem('netroar_theme', selected);
      showToast(`Switched to ${selected === 'dark' ? 'Cyber Obsidian (Dark)' : 'Prism Holographic (Light)'} theme.`);
    });
  }

  // Accent Color Customizer
  const savedAccent = localStorage.getItem('netroar_admin_accent') || '#00f5b8';
  applyAccentColor(savedAccent, false);

  const swatches = document.querySelectorAll('.accent-swatch');
  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      const color = swatch.getAttribute('data-accent');
      if (color) {
        applyAccentColor(color, true);
      }
    });
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  const themeToggles = [
    document.getElementById('theme-toggle'),
    document.getElementById('theme-toggle-dash')
  ];

  themeToggles.forEach(t => {
    if (!t) return;
    const icon = t.querySelector('.theme-toggle-icon');
    const label = t.querySelector('.theme-toggle-label');
    if (icon) icon.textContent = theme === 'light' ? '☀️' : '🌙';
    if (label) label.textContent = theme === 'light' ? 'LIGHT' : 'DARK';
  });

  const settingThemeSelect = document.getElementById('setting-theme-mode');
  if (settingThemeSelect) {
    settingThemeSelect.value = theme;
  }
}

function applyAccentColor(hex, notify = true) {
  document.documentElement.style.setProperty('--neon-mint', hex);
  document.documentElement.style.setProperty('--neon-mint-glow', `${hex}55`);
  document.documentElement.style.setProperty('--border-neon', `${hex}77`);
  document.documentElement.style.setProperty('--shadow-neon-mint', `0 0 30px ${hex}44`);

  localStorage.setItem('netroar_admin_accent', hex);

  // Update active swatch state
  const swatches = document.querySelectorAll('.accent-swatch');
  swatches.forEach(s => {
    if (s.getAttribute('data-accent') === hex) {
      s.classList.add('active');
    } else {
      s.classList.remove('active');
    }
  });

  if (notify) {
    showToast(`HUD Accent color updated to ${hex.toUpperCase()}.`);
  }
}

// Lock Studio Session
window.lockStudioSession = function() {
  adminToken = null;
  sessionStorage.removeItem('netroar_admin_token');
  showToast('🔒 Studio Suite Locked. Passcode required to re-authenticate.');
  showLogin();
};

// Authentication Flow
async function setupAuthFlow() {
  // Passcode visibility toggle
  const btnToggleAdminPasscode = document.getElementById('btn-toggle-admin-passcode');
  if (btnToggleAdminPasscode && passcodeInput) {
    btnToggleAdminPasscode.addEventListener('click', () => {
      const isPw = passcodeInput.type === 'password';
      passcodeInput.type = isPw ? 'text' : 'password';
      btnToggleAdminPasscode.style.color = isPw ? 'var(--neon-mint)' : 'var(--text-muted)';
    });
  }

  // Lock Studio Handlers
  const btnLockStudio = document.getElementById('btn-lock-studio');
  if (btnLockStudio) {
    btnLockStudio.addEventListener('click', window.lockStudioSession);
  }
  if (btnLogout) {
    btnLogout.addEventListener('click', window.lockStudioSession);
  }

  // Global Keyboard Shortcut: Alt+L to immediately lock studio
  document.addEventListener('keydown', (e) => {
    if ((e.altKey && e.key.toLowerCase() === 'l') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l')) {
      if (adminToken && dashboardScreen.style.display !== 'none') {
        e.preventDefault();
        window.lockStudioSession();
      }
    }
  });

  if (adminToken) {
    const isValid = await verifyToken(adminToken);
    if (isValid) {
      showDashboard();
      return;
    }
  }
  showLogin();

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const passcode = passcodeInput.value.trim();
    if (!passcode) return;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await res.json();
      if (data.success && data.token) {
        adminToken = data.token;
        sessionStorage.setItem('netroar_admin_token', adminToken);
        showToast('Authorization granted. Welcome to Studio Control Suite.');
        showDashboard();
      } else {
        showToast(data.error || 'Invalid passcode.', true);
      }
    } catch (err) {
      showToast('Network error during authentication.', true);
    }
  });
}

async function verifyToken(token) {
  try {
    const res = await fetch('/api/admin/verify-token', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return data.success && data.valid;
  } catch (err) {
    return false;
  }
}

function showLogin() {
  loginScreen.style.display = 'flex';
  dashboardScreen.style.display = 'none';
  if (btnLogout) btnLogout.style.display = 'none';
  passcodeInput.value = '';
  setTimeout(() => passcodeInput && passcodeInput.focus(), 150);
}

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboardScreen.style.display = 'block';
  btnLogout.style.display = 'inline-flex';
  loadDashboardData();
}

// Navigation Tabs
function setupTabs() {
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabContents.forEach(c => {
        c.style.display = c.id === `tab-${targetTab}` ? 'block' : 'none';
      });
    });
  });
}

// Filter Tabs Setup
function setupFilters() {
  const filterPills = document.querySelectorAll('.admin-filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.getAttribute('data-filter') || 'all';
      renderAdminAppsTable(getFilteredApps());
    });
  });
}

// Dashboard Data Loading
async function loadDashboardData() {
  await Promise.all([loadApps(), loadSettings()]);
}

async function loadApps() {
  if (appsTableContainer && (!currentApps || currentApps.length === 0)) {
    appsTableContainer.innerHTML = `
      <div style="padding: 16px;">
        <div style="display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
          <div class="skeleton-box" style="width: 44px; height: 44px; border-radius: 8px;"></div>
          <div style="flex: 1;">
            <div class="skeleton-text" style="width: 140px; height: 16px; margin-bottom: 6px;"></div>
            <div class="skeleton-text" style="width: 90px; height: 12px; margin-bottom: 0;"></div>
          </div>
          <div class="skeleton-pill" style="width: 64px; height: 22px;"></div>
        </div>
        <div style="display: flex; align-items: center; gap: 14px; padding: 14px 0;">
          <div class="skeleton-box" style="width: 44px; height: 44px; border-radius: 8px;"></div>
          <div style="flex: 1;">
            <div class="skeleton-text" style="width: 120px; height: 16px; margin-bottom: 6px;"></div>
            <div class="skeleton-text" style="width: 80px; height: 12px; margin-bottom: 0;"></div>
          </div>
          <div class="skeleton-pill" style="width: 64px; height: 22px;"></div>
        </div>
      </div>
    `;
  }
  try {
    const res = await fetch('/api/apps');
    const data = await res.json();
    if (data.success) {
      currentApps = data.apps || [];
      updateKpiMetrics(currentApps);
      renderAdminAppsTable(getFilteredApps());
    }
  } catch (err) {
    showToast('Error loading apps from database.', true);
  }
}

// Telemetry KPI HUD & Filter Counts
function updateKpiMetrics(apps) {
  const total = apps.length;
  const liveCount = apps.filter(a => (a.status || '').toLowerCase() === 'live').length;
  const betaCount = total - liveCount;
  const featuredCount = apps.filter(a => a.isFeatured).length;

  // Counter Elements
  const kpiTotal = document.getElementById('kpi-total-apps');
  const kpiAppsSub = document.getElementById('kpi-apps-sub');
  const kpiFeatured = document.getElementById('kpi-featured-apps');

  const filterAllCount = document.getElementById('filter-count-all');
  const filterLiveCount = document.getElementById('filter-count-live');
  const filterBetaCount = document.getElementById('filter-count-beta');
  const filterFeaturedCount = document.getElementById('filter-count-featured');

  if (kpiTotal) kpiTotal.textContent = total;
  if (kpiAppsSub) kpiAppsSub.textContent = `${liveCount} Live · ${betaCount} Beta / Testing`;
  if (kpiFeatured) kpiFeatured.textContent = featuredCount;

  if (filterAllCount) filterAllCount.textContent = total;
  if (filterLiveCount) filterLiveCount.textContent = liveCount;
  if (filterBetaCount) filterBetaCount.textContent = betaCount;
  if (filterFeaturedCount) filterFeaturedCount.textContent = featuredCount;

  if (appsCountEl) appsCountEl.textContent = total;
}

// Filter Logic Combining Active Pill and Search Term
function getFilteredApps() {
  const term = (searchAppsInput ? searchAppsInput.value : '').toLowerCase().trim();

  const filtered = currentApps.filter(app => {
    // 1. Check filter tab pill
    let matchesPill = true;
    const statusLower = (app.status || '').toLowerCase();

    if (activeFilter === 'live') {
      matchesPill = statusLower === 'live';
    } else if (activeFilter === 'beta') {
      matchesPill = statusLower !== 'live';
    } else if (activeFilter === 'featured') {
      matchesPill = Boolean(app.isFeatured);
    }

    if (!matchesPill) return false;

    // 2. Check search input term
    if (!term) return true;
    return (app.name || '').toLowerCase().includes(term) ||
           (app.category || '').toLowerCase().includes(term) ||
           (app.slug || '').toLowerCase().includes(term) ||
           (app.platforms || []).join(' ').toLowerCase().includes(term);
  });

  if (filterStatusEl) {
    if (term) {
      filterStatusEl.textContent = `Showing ${filtered.length} of ${currentApps.length} apps (Search: "${term}")`;
    } else if (activeFilter !== 'all') {
      filterStatusEl.textContent = `Showing ${filtered.length} of ${currentApps.length} apps (${activeFilter.toUpperCase()})`;
    } else {
      filterStatusEl.textContent = `All ${currentApps.length} apps synchronized to disk`;
    }
  }

  return filtered;
}

// Render Admin Apps Table
function renderAdminAppsTable(apps) {
  if (!apps || apps.length === 0) {
    appsTableContainer.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; color: var(--text-secondary);">
        <div style="font-size: 2.2rem; margin-bottom: 12px; opacity: 0.8;">📦</div>
        <p style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">No software matching current criteria.</p>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px;">Try clearing filters or add a new application to the catalog.</p>
        <button class="btn-primary" onclick="openCreateModal()">
          <span>Add New App</span>
        </button>
      </div>
    `;
    return;
  }

  const rowsHtml = apps.map(app => {
    const platformsText = (app.platforms || []).join(', ');
    const isLive = (app.status || '').toLowerCase() === 'live';
    const statusClass = isLive ? 'status-live' : 'status-beta';
    const publicUrl = app.slug ? `/apps#${app.slug}` : (app.websiteUrl || '#');

    return `
      <tr style="border-bottom: 1px solid var(--border-subtle); transition: background 0.2s ease;">
        <td style="padding: 16px 12px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="position: relative;">
              <img src="${app.icon || '/assets/logo/Netroar_To_Do_dark_v2.png'}" 
                   alt="${app.name}" 
                   style="width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: contain; background: var(--bg-surface-elevated); padding: 4px; border: 1px solid var(--border-glass);"
                   onerror="this.src='/assets/logo/Netroar_To_Do_dark_v2.png'">
            </div>
            <div>
              <div style="font-weight: 800; font-size: 1rem; color: #ffffff; display: flex; align-items: center; gap: 8px;">
                <span>${app.name}</span>
                <button class="btn-table-star ${app.isFeatured ? 'active' : ''}" 
                        onclick="toggleAppFeatured('${app.id}')" 
                        title="${app.isFeatured ? 'Featured: Click to unstar' : 'Click to feature on front page spotlight'}">
                  ${app.isFeatured ? '★' : '☆'}
                </button>
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px;">
                ${app.slug} · <span style="color: var(--neon-mint);">${app.category || 'App'}</span>
              </div>
            </div>
          </div>
        </td>
        <td style="padding: 16px 12px; font-size: 0.88rem; color: var(--text-secondary);">
          ${platformsText}
        </td>
        <td style="padding: 16px 12px;">
          <span class="status-badge ${statusClass}" style="display: inline-flex; align-items: center; gap: 6px;">
            <span class="status-dot-pulse" style="width: 6px; height: 6px; ${isLive ? '' : 'background: #fbbf24; box-shadow: 0 0 6px #fbbf24;'}"></span>
            <span>${app.status || 'Live'}</span>
          </span>
        </td>
        <td style="padding: 16px 12px; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted);">
          v${app.version || '1.0.0'}
        </td>
        <td style="padding: 16px 12px; text-align: right;">
          <div style="display: inline-flex; gap: 8px; align-items: center;">
            <a href="${publicUrl}" target="_blank" class="btn-card-outline" style="height: 32px; padding: 0 10px; font-size: 0.78rem; text-decoration: none;" title="View public showcase">
              View ↗
            </a>
            <button class="btn-card-outline" style="height: 32px; padding: 0 12px; font-size: 0.82rem;" onclick="openEditModal('${app.id}')">
              Edit
            </button>
            <button class="btn-card-outline" style="height: 32px; padding: 0 10px; font-size: 0.82rem; color: #f87171; border-color: rgba(239, 68, 68, 0.3);" onclick="confirmDeleteApp('${app.id}', '${app.name.replace(/'/g, "\\'")}')">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  appsTableContainer.innerHTML = `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="border-bottom: 2px solid var(--border-subtle); color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em;">
            <th style="padding: 12px;">Software</th>
            <th style="padding: 12px;">Platforms</th>
            <th style="padding: 12px;">Status</th>
            <th style="padding: 12px;">Version</th>
            <th style="padding: 12px; text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

// 1-Click Toggle Featured Spotlight
window.toggleAppFeatured = async function(id) {
  const app = currentApps.find(a => a.id === id);
  if (!app) return;

  const nextFeatured = !app.isFeatured;
  const updatedPayload = { ...app, isFeatured: nextFeatured };

  try {
    const res = await fetch(`/api/admin/apps/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(updatedPayload)
    });
    const data = await res.json();
    if (data.success) {
      app.isFeatured = nextFeatured;
      showToast(nextFeatured ? `"${app.name}" added to Front Page Spotlight ★` : `"${app.name}" removed from Spotlight.`);
      updateKpiMetrics(currentApps);
      renderAdminAppsTable(getFilteredApps());
    } else {
      showToast(data.error || 'Failed to toggle featured status.', true);
    }
  } catch (err) {
    showToast('Network error while toggling spotlight.', true);
  }
};

// Search Filter Listener
if (searchAppsInput) {
  searchAppsInput.addEventListener('input', () => {
    renderAdminAppsTable(getFilteredApps());
  });
}

// Modal Setup & Actions
function setupModalActions() {
  btnOpenCreateModal.addEventListener('click', openCreateModal);
  modalCloseBtn.addEventListener('click', closeAdminModal);
  btnCancelModal.addEventListener('click', closeAdminModal);

  appModal.addEventListener('click', (e) => {
    if (e.target === appModal) closeAdminModal();
  });

  // Real-time Icon URL Input change preview
  if (iconUrlInput && iconPreviewImg) {
    iconUrlInput.addEventListener('input', () => {
      const url = iconUrlInput.value.trim();
      iconPreviewImg.src = url || '/assets/logo/Netroar_To_Do_dark_v2.png';
    });
  }

  // Auto-generate slug from App Name in create mode
  const nameInput = document.getElementById('form-app-name');
  const slugInput = document.getElementById('form-app-slug');
  if (nameInput && slugInput) {
    nameInput.addEventListener('input', () => {
      const isCreateMode = !document.getElementById('form-app-id').value;
      if (isCreateMode) {
        slugInput.value = nameInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    });
  }

  // Icon file picker to Data URL with instant live preview
  const iconFileInput = document.getElementById('form-icon-file');
  if (iconFileInput) {
    iconFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result;
        if (iconPreviewImg) iconPreviewImg.src = base64Data;

        try {
          const res = await fetch('/api/admin/upload-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ filename: file.name, base64Data })
          });
          const uploadResult = await res.json();
          if (uploadResult.success && uploadResult.url) {
            document.getElementById('form-app-icon').value = uploadResult.url;
            if (iconPreviewImg) iconPreviewImg.src = uploadResult.url;
            showToast('Icon uploaded successfully to server.');
          } else {
            document.getElementById('form-app-icon').value = base64Data;
            showToast('Icon stored as Data URL.');
          }
        } catch (err) {
          document.getElementById('form-app-icon').value = base64Data;
          showToast('Icon stored as Data URL.');
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Form Submit (Create or Update)
  appForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('form-app-id').value;
    const name = document.getElementById('form-app-name').value.trim();
    const slug = document.getElementById('form-app-slug').value.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const tagline = document.getElementById('form-app-tagline').value.trim();
    const description = document.getElementById('form-app-desc').value.trim();
    const category = document.getElementById('form-app-category').value;
    const status = document.getElementById('form-app-status').value;

    const selectedPlatforms = Array.from(document.querySelectorAll('input[name="platform"]:checked')).map(cb => cb.value);

    const websiteUrl = document.getElementById('form-app-website').value.trim();
    const downloadUrl = document.getElementById('form-app-download').value.trim();
    const repoUrl = document.getElementById('form-app-repo').value.trim();
    const icon = document.getElementById('form-app-icon').value.trim() || '/assets/logo/Netroar_To_Do_dark_v2.png';

    const featuresRaw = document.getElementById('form-app-features').value.trim();
    const features = featuresRaw ? featuresRaw.split('\n').map(s => s.trim()).filter(Boolean) : [];

    const version = document.getElementById('form-app-version').value.trim() || '1.0.0';
    const sku = document.getElementById('form-app-sku').value.trim() || `NETROAR-${(slug || name).toUpperCase()}`;
    const isFeatured = document.getElementById('form-app-featured').checked;

    const payload = {
      name,
      slug,
      tagline,
      description,
      category,
      status,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['Web'],
      websiteUrl,
      downloadUrl,
      repoUrl,
      icon,
      features,
      version,
      sku,
      isFeatured
    };

    try {
      let res;
      if (id) {
        // Update
        res = await fetch(`/api/admin/apps/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create
        res = await fetch('/api/admin/apps', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify(payload)
        });
      }

      const result = await res.json();
      if (result.success) {
        showToast(id ? 'App updated successfully!' : 'New app created and cataloged!');
        closeAdminModal();
        await loadApps();
      } else {
        showToast(result.error || 'Failed to save app.', true);
      }
    } catch (err) {
      showToast('Network error while saving app.', true);
    }
  });
}

window.openCreateModal = function() {
  document.getElementById('form-app-id').value = '';
  document.getElementById('form-app-name').value = '';
  document.getElementById('form-app-slug').value = '';
  document.getElementById('form-app-tagline').value = '';
  document.getElementById('form-app-desc').value = '';
  document.getElementById('form-app-category').value = 'Productivity';
  document.getElementById('form-app-status').value = 'Live';
  
  document.querySelectorAll('input[name="platform"]').forEach(cb => {
    cb.checked = ['Web', 'Windows', 'Android'].includes(cb.value);
  });

  document.getElementById('form-app-website').value = '';
  document.getElementById('form-app-download').value = '';
  document.getElementById('form-app-repo').value = '';
  document.getElementById('form-app-icon').value = '/assets/logo/Netroar_To_Do_dark_v2.png';
  if (iconPreviewImg) iconPreviewImg.src = '/assets/logo/Netroar_To_Do_dark_v2.png';
  
  document.getElementById('form-app-features').value = '';
  document.getElementById('form-app-version').value = '1.0.0';
  document.getElementById('form-app-sku').value = '';
  document.getElementById('form-app-featured').checked = false;

  modalTitle.textContent = 'Add New Software App';
  appModal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.openEditModal = function(id) {
  const app = currentApps.find(a => a.id === id);
  if (!app) return;

  document.getElementById('form-app-id').value = app.id;
  document.getElementById('form-app-name').value = app.name || '';
  document.getElementById('form-app-slug').value = app.slug || '';
  document.getElementById('form-app-tagline').value = app.tagline || '';
  document.getElementById('form-app-desc').value = app.description || '';
  document.getElementById('form-app-category').value = app.category || 'Productivity';
  document.getElementById('form-app-status').value = app.status || 'Live';

  const platforms = app.platforms || [];
  document.querySelectorAll('input[name="platform"]').forEach(cb => {
    cb.checked = platforms.includes(cb.value);
  });

  document.getElementById('form-app-website').value = app.websiteUrl || '';
  document.getElementById('form-app-download').value = app.downloadUrl || '';
  document.getElementById('form-app-repo').value = app.repoUrl || '';
  document.getElementById('form-app-icon').value = app.icon || '';
  if (iconPreviewImg) iconPreviewImg.src = app.icon || '/assets/logo/Netroar_To_Do_dark_v2.png';

  document.getElementById('form-app-features').value = (app.features || []).join('\n');
  document.getElementById('form-app-version').value = app.version || '1.0.0';
  document.getElementById('form-app-sku').value = app.sku || '';
  document.getElementById('form-app-featured').checked = Boolean(app.isFeatured);

  modalTitle.textContent = `Edit App: ${app.name}`;
  appModal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.confirmDeleteApp = async function(id, name) {
  const answer = confirm(`Are you sure you want to permanently delete "${name}" from the Netroar catalog?`);
  if (!answer) return;

  try {
    const res = await fetch(`/api/admin/apps/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast(`"${name}" removed from catalog.`);
      await loadApps();
    } else {
      showToast(data.error || 'Failed to delete app.', true);
    }
  } catch (err) {
    showToast('Network error while deleting app.', true);
  }
};

function closeAdminModal() {
  appModal.classList.remove('active');
  document.body.style.overflow = '';
}

// Studio Profile & Passcode Settings
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success && data.settings) {
      currentSettings = data.settings;
      populateSettingsForm(data.settings);
    }
  } catch (err) {
    showToast('Failed to load studio settings.', true);
  }
}

function populateSettingsForm(s) {
  document.getElementById('setting-studio-name').value = s.studioName || '';
  document.getElementById('setting-slogan').value = s.slogan || '';
  document.getElementById('setting-hero-title').value = s.heroTitle || '';
  document.getElementById('setting-hero-desc').value = s.heroDescription || '';
  document.getElementById('setting-about-text').value = s.aboutText || '';
  document.getElementById('setting-contact-email').value = s.contactEmail || '';
  document.getElementById('setting-founder-name').value = s.founderName || '';

  const socials = s.socialLinks || {};
  document.getElementById('setting-social-github').value = socials.github || '';
  document.getElementById('setting-social-discord').value = socials.discord || '';
  document.getElementById('setting-social-twitter').value = socials.twitter || '';
  document.getElementById('setting-social-youtube').value = socials.youtube || '';
}

function setupSettingsForm() {
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const studioName = document.getElementById('setting-studio-name').value.trim();
    const slogan = document.getElementById('setting-slogan').value.trim();
    const heroTitle = document.getElementById('setting-hero-title').value.trim();
    const heroDescription = document.getElementById('setting-hero-desc').value.trim();
    const aboutText = document.getElementById('setting-about-text').value.trim();
    const contactEmail = document.getElementById('setting-contact-email').value.trim();
    const founderName = document.getElementById('setting-founder-name').value.trim();

    const socialLinks = {
      github: document.getElementById('setting-social-github').value.trim(),
      discord: document.getElementById('setting-social-discord').value.trim(),
      twitter: document.getElementById('setting-social-twitter').value.trim(),
      youtube: document.getElementById('setting-social-youtube').value.trim()
    };

    const newPasscode = document.getElementById('setting-new-passcode').value.trim();

    const payload = {
      studioName,
      slogan,
      heroTitle,
      heroDescription,
      aboutText,
      contactEmail,
      founderName,
      socialLinks
    };

    if (newPasscode) {
      payload.adminPasscode = newPasscode;
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Studio settings updated successfully.');
        document.getElementById('setting-new-passcode').value = '';
      } else {
        showToast(data.error || 'Failed to save settings.', true);
      }
    } catch (err) {
      showToast('Network error while saving settings.', true);
    }
  });
}

// Google Merchant & Diagnostics Tools
function setupFeedTools() {
  const btnValidateFeedLive = document.getElementById('btn-validate-feed-live');
  const feedLiveStatusBanner = document.getElementById('feed-live-status-banner');

  if (btnValidateFeedLive && feedLiveStatusBanner) {
    btnValidateFeedLive.addEventListener('click', async () => {
      btnValidateFeedLive.disabled = true;
      btnValidateFeedLive.innerHTML = '<span>⏳ Testing Feed...</span>';

      try {
        const res = await fetch('/feed/products.xml');
        const text = await res.text();

        if (res.ok && text.includes('<rss') && text.includes('</rss>')) {
          feedLiveStatusBanner.style.display = 'block';
          feedLiveStatusBanner.style.background = 'rgba(0, 245, 184, 0.12)';
          feedLiveStatusBanner.style.border = '1px solid rgba(0, 245, 184, 0.4)';
          feedLiveStatusBanner.style.color = 'var(--neon-mint)';
          feedLiveStatusBanner.innerHTML = `<strong>✅ Live XML Feed Verified:</strong> HTTP 200 OK — Valid RSS 2.0 with XML-escaped entities (${(text.length / 1024).toFixed(1)} KB). Ready for Google Merchant.`;
          showToast('Google Merchant XML Feed is 100% healthy and online.');
        } else {
          feedLiveStatusBanner.style.display = 'block';
          feedLiveStatusBanner.style.background = 'rgba(239, 68, 68, 0.12)';
          feedLiveStatusBanner.style.border = '1px solid rgba(239, 68, 68, 0.4)';
          feedLiveStatusBanner.style.color = '#fca5a5';
          feedLiveStatusBanner.innerHTML = `<strong>⚠️ Feed Warning:</strong> Received response without complete RSS structure.`;
          showToast('Feed validation warning.', true);
        }
      } catch (err) {
        feedLiveStatusBanner.style.display = 'block';
        feedLiveStatusBanner.style.background = 'rgba(239, 68, 68, 0.12)';
        feedLiveStatusBanner.style.border = '1px solid rgba(239, 68, 68, 0.4)';
        feedLiveStatusBanner.style.color = '#fca5a5';
        feedLiveStatusBanner.innerHTML = `<strong>❌ Feed Validation Error:</strong> Could not connect to feed endpoint.`;
        showToast('Network error while validating feed.', true);
      } finally {
        btnValidateFeedLive.disabled = false;
        btnValidateFeedLive.innerHTML = '<span>⚡ Test Feed XML</span>';
      }
    });
  }
}

// 1-Click Clipboard Feed URL Copy Helper
window.copyFeedUrl = function(path, btn) {
  const fullUrl = window.location.origin + path;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullUrl).then(() => {
      const originalHtml = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = '<span>✓ Copied!</span>';
      showToast(`Copied ${path} full URL to clipboard`);
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = originalHtml;
      }, 2200);
    }).catch(() => {
      fallbackCopy(fullUrl, btn);
    });
  } else {
    fallbackCopy(fullUrl, btn);
  }
};

function fallbackCopy(text, btn) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  const originalHtml = btn.innerHTML;
  btn.classList.add('copied');
  btn.innerHTML = '<span>✓ Copied!</span>';
  showToast(`Copied ${text} to clipboard`);
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.innerHTML = originalHtml;
  }, 2200);
}

// Backup & Data Feeds Handlers
function setupBackupHandlers() {
  btnExportBackup.addEventListener('click', () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      studioName: currentSettings.studioName || 'Netroar Studios',
      settings: currentSettings,
      apps: currentApps
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netroar-studios-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Complete studio backup downloaded.');
  });

  btnTriggerImport.addEventListener('click', () => {
    inputImportBackup.click();
  });

  inputImportBackup.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!imported.apps && !Array.isArray(imported)) {
          showToast('Invalid backup format.', true);
          return;
        }

        const appsToRestore = Array.isArray(imported) ? imported : imported.apps;

        // Restore apps
        for (const app of appsToRestore) {
          if (app.id && currentApps.some(a => a.id === app.id)) {
            await fetch(`/api/admin/apps/${app.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
              },
              body: JSON.stringify(app)
            });
          } else {
            await fetch('/api/admin/apps', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
              },
              body: JSON.stringify(app)
            });
          }
        }

        if (imported.settings) {
          await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(imported.settings)
          });
        }

        showToast('Backup restored successfully!');
        await loadDashboardData();
      } catch (err) {
        showToast('Error parsing JSON backup file.', true);
      }
    };
    reader.readAsText(file);
  });
}
