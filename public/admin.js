/**
 * NETROAR STUDIOS — Admin Suite Controller
 */

let adminToken = sessionStorage.getItem('netroar_admin_token') || null;
let currentApps = [];
let currentSettings = {};

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

// Apps UI
const appsTableContainer = document.getElementById('admin-apps-table-container');
const appsCountEl = document.getElementById('admin-apps-count');
const searchAppsInput = document.getElementById('admin-search-apps');
const btnOpenCreateModal = document.getElementById('btn-open-create-modal');

// Modal Elements
const appModal = document.getElementById('admin-app-modal');
const modalCloseBtn = document.getElementById('admin-modal-close');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const appForm = document.getElementById('app-form');
const modalTitle = document.getElementById('admin-modal-title');

// Settings Elements
const settingsForm = document.getElementById('studio-settings-form');

// Backup Elements
const btnExportBackup = document.getElementById('btn-export-backup');
const btnTriggerImport = document.getElementById('btn-trigger-import');
const inputImportBackup = document.getElementById('input-import-backup');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupAuthFlow();
  setupTabs();
  setupModalActions();
  setupSettingsForm();
  setupBackupHandlers();
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

// Theme
function initTheme() {
  const saved = localStorage.getItem('netroar_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      const nxt = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nxt);
      localStorage.setItem('netroar_theme', nxt);
    });
  }
}

// Authentication
async function setupAuthFlow() {
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
        showToast('Authorization granted. Welcome to Studio Suite.');
        showDashboard();
      } else {
        showToast(data.error || 'Invalid passcode.', true);
      }
    } catch (err) {
      showToast('Network error during authentication.', true);
    }
  });

  btnLogout.addEventListener('click', () => {
    adminToken = null;
    sessionStorage.removeItem('netroar_admin_token');
    showToast('Logged out of Studio Suite.');
    showLogin();
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
  btnLogout.style.display = 'none';
  passcodeInput.value = '';
}

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboardScreen.style.display = 'block';
  btnLogout.style.display = 'inline-flex';
  loadDashboardData();
}

// Tabs
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

// Dashboard Data Loading
async function loadDashboardData() {
  await Promise.all([loadApps(), loadSettings()]);
}

async function loadApps() {
  try {
    const res = await fetch('/api/apps');
    const data = await res.json();
    if (data.success) {
      currentApps = data.apps;
      appsCountEl.textContent = currentApps.length;
      renderAdminAppsTable(currentApps);
    }
  } catch (err) {
    showToast('Error loading apps from database.', true);
  }
}

function renderAdminAppsTable(apps) {
  if (!apps || apps.length === 0) {
    appsTableContainer.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; color: var(--text-secondary);">
        <p style="font-size: 1.1rem; margin-bottom: 12px;">No software apps registered in database.</p>
        <button class="btn-primary" onclick="openCreateModal()">Add Your First App</button>
      </div>
    `;
    return;
  }

  const rowsHtml = apps.map(app => {
    const platformsText = (app.platforms || []).join(', ');
    const statusClass = (app.status || '').toLowerCase() === 'live' ? 'status-live' : 'status-beta';

    return `
      <tr style="border-bottom: 1px solid var(--border-subtle);">
        <td style="padding: 16px 12px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <img src="${app.icon || '/assets/logo/Netroar_To_Do_dark_v2.png'}" 
                 alt="${app.name}" 
                 style="width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: contain; background: var(--bg-surface-elevated); padding: 4px; border: 1px solid var(--border-glass);"
                 onerror="this.src='/assets/logo/Netroar_To_Do_dark_v2.png'">
            <div>
              <div style="font-weight: 800; font-size: 1rem; color: #ffffff; display: flex; align-items: center; gap: 6px;">
                ${app.name}
                ${app.isFeatured ? '<span style="color: var(--neon-mint); font-size: 0.9rem;" title="Featured">★</span>' : ''}
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono);">${app.slug} · ${app.category || 'App'}</div>
            </div>
          </div>
        </td>
        <td style="padding: 16px 12px; font-size: 0.88rem; color: var(--text-secondary);">
          ${platformsText}
        </td>
        <td style="padding: 16px 12px;">
          <span class="status-badge ${statusClass}">${app.status || 'Live'}</span>
        </td>
        <td style="padding: 16px 12px; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted);">
          v${app.version || '1.0.0'}
        </td>
        <td style="padding: 16px 12px; text-align: right;">
          <div style="display: inline-flex; gap: 8px;">
            <button class="btn-card-outline" style="height: 34px; padding: 0 12px; font-size: 0.82rem;" onclick="openEditModal('${app.id}')">
              Edit
            </button>
            <button class="btn-card-outline" style="height: 34px; padding: 0 12px; font-size: 0.82rem; color: #f87171; border-color: rgba(239, 68, 68, 0.3);" onclick="confirmDeleteApp('${app.id}', '${app.name.replace(/'/g, "\\'")}')">
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

// Search inside Admin table
searchAppsInput.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase().trim();
  if (!term) {
    renderAdminAppsTable(currentApps);
    return;
  }
  const filtered = currentApps.filter(a => {
    return (a.name || '').toLowerCase().includes(term) ||
           (a.category || '').toLowerCase().includes(term) ||
           (a.platforms || []).join(' ').toLowerCase().includes(term);
  });
  renderAdminAppsTable(filtered);
});

// Modal Setup
function setupModalActions() {
  btnOpenCreateModal.addEventListener('click', openCreateModal);
  modalCloseBtn.addEventListener('click', closeAdminModal);
  btnCancelModal.addEventListener('click', closeAdminModal);

  appModal.addEventListener('click', (e) => {
    if (e.target === appModal) closeAdminModal();
  });

  // Icon file picker to Data URL
  const iconFileInput = document.getElementById('form-icon-file');
  iconFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
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
          showToast('Icon uploaded successfully to server.');
        } else {
          // Fallback to storing raw data URL
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

  // Form Submit (Create or Update)
  appForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('form-app-id').value;
    const name = document.getElementById('form-app-name').value.trim();
    const slug = document.getElementById('form-app-slug').value.trim();
    const tagline = document.getElementById('form-app-tagline').value.trim();
    const description = document.getElementById('form-app-desc').value.trim();
    const category = document.getElementById('form-app-category').value;
    const status = document.getElementById('form-app-status').value;

    const selectedPlatforms = Array.from(document.querySelectorAll('input[name="platform"]:checked')).map(cb => cb.value);

    const websiteUrl = document.getElementById('form-app-website').value.trim();
    const downloadUrl = document.getElementById('form-app-download').value.trim();
    const repoUrl = document.getElementById('form-app-repo').value.trim();
    const icon = document.getElementById('form-app-icon').value.trim() || '/assets/logo/netroars-logo.png';

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

// Studio Settings
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
