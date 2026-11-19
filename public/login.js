/**
 * NETROAR STUDIOS — Dedicated Login Gateway Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('studio-login-form');
  const passcodeInput = document.getElementById('login-passcode-input');
  const btnToggleEye = document.getElementById('btn-toggle-eye');
  const eyeIcon = document.getElementById('eye-icon');
  const alertBanner = document.getElementById('login-alert-banner');
  const btnSubmit = document.getElementById('btn-login-submit');
  const quickPasscodeBtn = document.getElementById('quick-passcode-btn');
  const sessionBadgeCard = document.getElementById('session-badge-card');
  const btnSessionLogout = document.getElementById('btn-session-logout');
  const toastNotify = document.getElementById('toast-notify');

  // Helper: Toast message
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

  // Helper: Alert banner on card
  function showAlert(message, type = 'error') {
    if (!alertBanner) return;
    alertBanner.className = `login-alert-banner ${type}`;
    alertBanner.innerHTML = message;
  }

  function hideAlert() {
    if (!alertBanner) return;
    alertBanner.className = 'login-alert-banner';
    alertBanner.style.display = 'none';
  }

  // 1. Check existing session
  const storedToken = sessionStorage.getItem('netroar_admin_token') || localStorage.getItem('netroar_admin_token');
  if (storedToken) {
    verifyExistingToken(storedToken);
  }

  async function verifyExistingToken(token) {
    try {
      const res = await fetch('/api/admin/verify-token', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.valid) {
        if (sessionBadgeCard && loginForm) {
          sessionBadgeCard.classList.add('visible');
          loginForm.style.display = 'none';
        }
      }
    } catch (err) {
      // Keep login form visible if check fails
    }
  }

  // 2. Toggle password visibility
  if (btnToggleEye && passcodeInput) {
    btnToggleEye.addEventListener('click', () => {
      const isPassword = passcodeInput.getAttribute('type') === 'password';
      passcodeInput.setAttribute('type', isPassword ? 'text' : 'password');
      if (eyeIcon) {
        eyeIcon.innerHTML = isPassword
          ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'
          : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
      }
    });
  }

  // 3. Quick passcode autofill
  if (quickPasscodeBtn && passcodeInput) {
    quickPasscodeBtn.addEventListener('click', () => {
      passcodeInput.value = 'netroar@admin2026';
      passcodeInput.focus();
      showToast('Master passcode filled.');
    });
  }

  // 4. Handle Login Form Submit
  if (loginForm && passcodeInput) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const passcode = passcodeInput.value.trim();
      if (!passcode) return;

      hideAlert();
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span>Verifying Credentials...</span>';
      }

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode })
        });
        const data = await res.json();

        if (data.success && data.token) {
          sessionStorage.setItem('netroar_admin_token', data.token);
          localStorage.setItem('netroar_admin_token', data.token);

          showAlert('● ACCESS GRANTED // TELEPORTING TO DASHBOARD...', 'success');
          showToast('Authorization verified. Welcome to Netroar Studios.');

          setTimeout(() => {
            window.location.href = '/admin';
          }, 600);
        } else {
          showAlert(`✖ AUTHENTICATION FAILED: ${data.error || 'Invalid passcode.'}`, 'error');
          showToast(data.error || 'Invalid master passcode.', true);
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<span>Authenticate &amp; Enter ❯</span>';
          }
          passcodeInput.select();
        }
      } catch (err) {
        showAlert('✖ SYSTEM ERROR: Failed to reach authentication server.', 'error');
        showToast('Network error during authentication.', true);
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = '<span>Authenticate &amp; Enter ❯</span>';
        }
      }
    });
  }

  // 5. Handle Active Session Log Out
  if (btnSessionLogout) {
    btnSessionLogout.addEventListener('click', () => {
      sessionStorage.removeItem('netroar_admin_token');
      localStorage.removeItem('netroar_admin_token');
      if (sessionBadgeCard) sessionBadgeCard.classList.remove('visible');
      if (loginForm) loginForm.style.display = 'block';
      if (passcodeInput) {
        passcodeInput.value = '';
        passcodeInput.focus();
      }
      showToast('Session ended. You have been logged out.');
    });
  }
});
