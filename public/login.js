/**
 * NETROAR STUDIOS — Pure Firebase Auth & Cloud Account Gateway
 * Powered by Firebase Modular SDK (Netroar To Do Web Cloud Engine)
 */

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// 1. Firebase Configuration from Netroar To Do Web
const firebaseConfig = {
  apiKey: "AIzaSyD4l_2GeTiD0DsZOAI0EOjjmwglX93GzZA",
  authDomain: "netroar-to-do-web.firebaseapp.com",
  projectId: "netroar-to-do-web",
  storageBucket: "netroar-to-do-web.firebasestorage.app",
  messagingSenderId: "92413755790",
  appId: "1:92413755790:web:c50f156fc1bd1ad27d24df",
  measurementId: "G-022F0VE5E8"
};

const ADMIN_EMAILS = [
  'princegaming5555@netroar.dev',
  'princegaming5555@gmail.com',
  'admin@netroar.dev'
];

function isEmailAdmin(email) {
  if (!email) return false;
  const clean = String(email).trim().toLowerCase();
  return ADMIN_EMAILS.includes(clean) || clean.endsWith('@netroar.dev');
}

// 2. Initialize Firebase SDK
let app = null;
let auth = null;
let db = null;
let googleProvider = null;
let firebaseReady = false;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  firebaseReady = true;
} catch (err) {
  console.warn('Firebase initialization warning:', err);
}

// 3. Friendly Error Messages
function getFriendlyErrorMessage(err) {
  if (!err) return 'An unexpected error occurred.';
  const code = err.code || '';
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email. Please check your spelling or register.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify and retry.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by browser. Please allow popups for Netroar.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    default:
      return err.message || 'Authentication error. Please retry.';
  }
}

// 4. Main Controller
document.addEventListener('DOMContentLoaded', () => {
  // Views
  const viewSignIn = document.getElementById('view-signin');
  const viewSignUp = document.getElementById('view-signup');
  const viewForgot = document.getElementById('view-forgot');

  // Switch triggers
  const btnGotoSignup = document.getElementById('btn-goto-signup');
  const btnGotoSignin = document.getElementById('btn-goto-signin');
  const linkGotoForgot = document.getElementById('link-goto-forgot');
  const btnCancelForgot = document.getElementById('btn-cancel-forgot');

  // Notifications
  const alertBanner = document.getElementById('login-alert-banner');
  const toastNotify = document.getElementById('toast-notify');

  // Forms
  const formSignIn = document.getElementById('form-email-signin');
  const formSignUp = document.getElementById('form-email-signup');
  const formForgot = document.getElementById('form-forgot-password');
  const formPasscode = document.getElementById('studio-login-form');

  // Profile session card elements
  const sessionBadgeCard = document.getElementById('session-badge-card');
  const profileAdminCrown = document.getElementById('profile-admin-crown');
  const profileUserPill = document.getElementById('profile-user-pill');
  const profileUserAvatar = document.getElementById('profile-user-avatar');
  const profileUserMonogram = document.getElementById('profile-user-monogram');
  const profileDisplayName = document.getElementById('profile-display-name');
  const profileDisplayEmail = document.getElementById('profile-display-email');
  const btnProfileAdminStudio = document.getElementById('btn-profile-admin-studio');
  const btnSessionLogout = document.getElementById('btn-session-logout');

  // Google buttons
  const btnGoogleSignIn = document.getElementById('btn-google-signin');
  const btnGoogleSignUp = document.getElementById('btn-google-signup');

  // Eye buttons
  const btnToggleSignInEye = document.getElementById('btn-toggle-signin-eye');
  const inputSignInPassword = document.getElementById('signin-password-input');
  const btnToggleSignUpEye = document.getElementById('btn-toggle-signup-eye');
  const inputSignUpPassword = document.getElementById('signup-password-input');
  const inputSignUpConfirm = document.getElementById('signup-confirm-input');

  // Strength segments
  const seg1 = document.getElementById('strength-seg-1');
  const seg2 = document.getElementById('strength-seg-2');
  const seg3 = document.getElementById('strength-seg-3');
  const seg4 = document.getElementById('strength-seg-4');
  const strengthLabelText = document.getElementById('strength-label-text');

  const inputForgotEmail = document.getElementById('forgot-email-input');
  const inputMasterPasscode = document.getElementById('login-passcode-input');

  // UI Helpers
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

  function switchView(target) {
    hideAlert();
    [viewSignIn, viewSignUp, viewForgot].forEach(v => v?.classList.remove('active'));
    if (sessionBadgeCard) sessionBadgeCard.classList.remove('visible');

    if (target === 'signup') {
      viewSignUp?.classList.add('active');
    } else if (target === 'forgot') {
      viewForgot?.classList.add('active');
    } else {
      viewSignIn?.classList.add('active');
    }
  }

  // Bind view switchers
  btnGotoSignup?.addEventListener('click', () => switchView('signup'));
  btnGotoSignin?.addEventListener('click', () => switchView('signin'));
  linkGotoForgot?.addEventListener('click', () => {
    const prefill = document.getElementById('signin-email-input')?.value.trim();
    if (prefill && inputForgotEmail) inputForgotEmail.value = prefill;
    switchView('forgot');
  });
  btnCancelForgot?.addEventListener('click', () => switchView('signin'));

  // Eye Toggles
  function bindEye(btn, input) {
    if (!btn || !input) return;
    btn.addEventListener('click', () => {
      const isPass = input.getAttribute('type') === 'password';
      input.setAttribute('type', isPass ? 'text' : 'password');
    });
  }
  bindEye(btnToggleSignInEye, inputSignInPassword);
  bindEye(btnToggleSignUpEye, inputSignUpPassword);

  // Password strength calculation
  inputSignUpPassword?.addEventListener('input', (e) => {
    const val = e.target.value;
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val) || /[A-Z]/.test(val)) score++;

    [seg1, seg2, seg3, seg4].forEach(s => s ? s.className = 'strength-segment' : null);
    if (score >= 1 && seg1) seg1.classList.add(score === 1 ? 'active-weak' : score === 2 ? 'active-fair' : score === 3 ? 'active-good' : 'active-strong');
    if (score >= 2 && seg2) seg2.classList.add(score === 2 ? 'active-fair' : score === 3 ? 'active-good' : 'active-strong');
    if (score >= 3 && seg3) seg3.classList.add(score === 3 ? 'active-good' : 'active-strong');
    if (score >= 4 && seg4) seg4.classList.add('active-strong');

    const labels = ['Enter password', 'Weak', 'Fair', 'Good', 'Strong'];
    if (strengthLabelText) strengthLabelText.textContent = `Strength: ${labels[score] || 'Weak'}`;
  });

  // 5. Render Active User Profile
  async function renderUserProfile(user, providerType = 'Google OAuth 2.0') {
    if (!user) return;
    const email = user.email || '';
    const name = user.displayName || user.name || email.split('@')[0] || 'Netroar Pilot';
    const avatar = user.photoURL || user.avatar || '';
    const uid = user.uid || user.id || 'N/A';
    const isAdmin = isEmailAdmin(email) || Boolean(user.isAdmin);

    // Sync to Firestore if db is ready
    if (db && user.uid) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name,
          email,
          avatar,
          provider: providerType,
          isAdmin,
          lastLoginAt: serverTimestamp(),
          updatedAtIso: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore user profile sync warning:', err);
      }
    }

    // Call server for admin session token if administrator
    if (isAdmin) {
      try {
        const adminRes = await fetch('/api/admin/firebase-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, uid })
        });
        const adminData = await adminRes.json();
        if (adminData.success && adminData.token) {
          sessionStorage.setItem('netroar_admin_token', adminData.token);
          localStorage.setItem('netroar_admin_token', adminData.token);
        }
      } catch (err) {
        console.warn('Backend admin auth sync error:', err);
      }
    }

    // Hide input forms
    [viewSignIn, viewSignUp, viewForgot].forEach(v => v?.classList.remove('active'));
    hideAlert();

    // Populate profile card
    if (profileAdminCrown) profileAdminCrown.style.display = isAdmin ? 'block' : 'none';
    if (profileUserPill) profileUserPill.style.display = isAdmin ? 'none' : 'inline-flex';

    if (profileDisplayName) profileDisplayName.textContent = name;
    if (profileDisplayEmail) profileDisplayEmail.textContent = email;

    if (avatar && profileUserAvatar) {
      profileUserAvatar.src = avatar;
      profileUserAvatar.style.display = 'block';
      if (profileUserMonogram) profileUserMonogram.style.display = 'none';
    } else if (profileUserMonogram) {
      profileUserMonogram.textContent = name.charAt(0).toUpperCase();
      profileUserMonogram.style.display = 'flex';
      if (profileUserAvatar) profileUserAvatar.style.display = 'none';
    }

    if (btnProfileAdminStudio) {
      btnProfileAdminStudio.style.display = isAdmin ? 'inline-flex' : 'none';
    }

    if (sessionBadgeCard) {
      sessionBadgeCard.classList.add('visible');
    }
  }

  // 6. Real-time Firebase Auth State Listener
  if (firebaseReady && auth) {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const providerId = firebaseUser.providerData?.[0]?.providerId === 'google.com'
          ? 'Google OAuth 2.0'
          : 'Firebase Email/Password';
        renderUserProfile(firebaseUser, providerId);
      } else {
        // Check if master passcode session exists
        const localAdminToken = sessionStorage.getItem('netroar_admin_token') || localStorage.getItem('netroar_admin_token');
        if (localAdminToken) {
          try {
            const res = await fetch('/api/admin/verify-token', {
              headers: { 'Authorization': `Bearer ${localAdminToken}` }
            });
            const data = await res.json();
            if (data.success && data.valid) {
              renderUserProfile({
                uid: 'NETROAR-STUDIO-ADMIN',
                name: 'Prince Singh',
                email: 'princegaming5555@gmail.com',
                isAdmin: true
              }, 'Studio Master Passcode');
            }
          } catch {}
        }
      }
    });
  }

  // 7. Google Sign-In Handler
  async function handleGoogleAuth(btn) {
    if (!firebaseReady || !auth || !googleProvider) {
      showAlert('Firebase service is connecting. Please retry in a moment.', 'error');
      return;
    }
    hideAlert();
    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>Opening Google Secure Login...</span>';

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      showToast(`Welcome back, ${user.displayName || 'Pilot'}!`);
      renderUserProfile(user, 'Google OAuth 2.0');
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      showAlert(getFriendlyErrorMessage(err), 'error');
      showToast('Google authentication failed.', true);
    } finally {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  }

  btnGoogleSignIn?.addEventListener('click', () => handleGoogleAuth(btnGoogleSignIn));
  btnGoogleSignUp?.addEventListener('click', () => handleGoogleAuth(btnGoogleSignUp));

  // 8. Email Sign-In Handler
  formSignIn?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signin-email-input')?.value.trim();
    const password = inputSignInPassword?.value;
    const btnSubmit = document.getElementById('btn-signin-submit');

    if (!email || !password) return;
    hideAlert();

    if (!firebaseReady || !auth) {
      showAlert('Firebase authentication service connecting...', 'error');
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span>Authenticating...</span>';

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      showToast('Sign in successful!');
      renderUserProfile(userCred.user, 'Firebase Email/Password');
    } catch (err) {
      console.error('Email sign in error:', err);
      showAlert(getFriendlyErrorMessage(err), 'error');
      showToast('Invalid credentials.', true);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<span>Sign In to Netroar ❯</span>';
    }
  });

  // 9. Email Registration Handler (Create Account)
  formSignUp?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name-input')?.value.trim();
    const email = document.getElementById('signup-email-input')?.value.trim();
    const password = inputSignUpPassword?.value;
    const confirm = inputSignUpConfirm?.value;
    const terms = document.getElementById('signup-terms')?.checked;
    const btnSubmit = document.getElementById('btn-signup-submit');

    if (!email || !password) return;

    if (password !== confirm) {
      showAlert('Passwords do not match. Please re-enter your password confirmation.', 'error');
      return;
    }
    if (password.length < 6) {
      showAlert('Password must contain at least 6 characters.', 'error');
      return;
    }
    if (!terms) {
      showAlert('Please accept the Terms of Service to create an account.', 'error');
      return;
    }

    hideAlert();
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span>Creating Account...</span>';

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(userCred.user, { displayName: name });
      }
      showToast(`Welcome to Netroar, ${name || 'Pilot'}!`);
      renderUserProfile(userCred.user, 'Firebase Email/Password');
    } catch (err) {
      console.error('Sign up error:', err);
      showAlert(getFriendlyErrorMessage(err), 'error');
      showToast('Account creation failed.', true);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<span>Create Netroar Account ❯</span>';
    }
  });

  // 10. Forgot Password Handler
  formForgot?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = inputForgotEmail?.value.trim();
    const btnSubmit = document.getElementById('btn-forgot-submit');
    if (!email) return;

    hideAlert();
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span>Dispatching Reset Link...</span>';

    try {
      await sendPasswordResetEmail(auth, email);
      showAlert(`Password reset link dispatched to <strong>${email}</strong>. Please check your inbox and spam folder.`, 'success');
      showToast('Reset email dispatched.');
    } catch (err) {
      console.error('Password reset error:', err);
      showAlert(getFriendlyErrorMessage(err), 'error');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<span>Send Password Reset Link ❯</span>';
    }
  });

  // 11. Master Passcode Form Handler (Fallback)
  formPasscode?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const passcode = inputMasterPasscode?.value.trim();
    const btnSubmit = document.getElementById('btn-login-submit');
    if (!passcode) return;

    hideAlert();
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

        renderUserProfile({
          uid: 'NETROAR-STUDIO-ADMIN',
          name: 'Prince Singh',
          email: 'princegaming5555@gmail.com',
          isAdmin: true
        }, 'Studio Master Passcode');

        setTimeout(() => {
          window.location.href = '/admin';
        }, 500);
      }
    } catch (err) {
      console.warn('Passcode fallback submit error:', err);
    }
  });

  // 12. Log Out Handler
  btnSessionLogout?.addEventListener('click', async () => {
    sessionStorage.removeItem('netroar_admin_token');
    localStorage.removeItem('netroar_admin_token');

    if (firebaseReady && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Firebase sign out error:', err);
      }
    }

    if (sessionBadgeCard) sessionBadgeCard.classList.remove('visible');
    switchView('signin');
    showToast('Session ended. You have been logged out.');
  });
});
