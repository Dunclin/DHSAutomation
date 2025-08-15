// Ensure DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  // SPA routing
  const routes = Array.from(document.querySelectorAll('.route'));
  const setRoute = (name) => {
    routes.forEach(sec => sec.classList.toggle('active', sec.id === name));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const initial = (location.hash || '#home').replace('#', '');
  setRoute(initial);
  window.addEventListener('hashchange', () => setRoute((location.hash || '#home').replace('#', '')));

  // Header badge & buttons
  const userBadge  = document.getElementById('userBadge');
  const openAuthBtns = [document.getElementById('openAuth'), document.getElementById('openAuthHero'), document.getElementById('openAuthAccount')].filter(Boolean);

  // Modals & shared helpers
  const authOverlay = document.getElementById('authOverlay');
  const authModal   = document.getElementById('authModal');
  const closeAuth   = document.getElementById('closeAuth');
  const settingsOverlay = document.getElementById('settingsOverlay');
  const settingsModal   = document.getElementById('settingsModal');
  const closeSettings   = document.getElementById('closeSettings');
  const contactOverlay = document.getElementById('contactOverlay');
  const contactModal   = document.getElementById('contactModal');
  const closeContact   = document.getElementById('closeContact');

  const openModal = (overlay, modal) => { overlay.style.display = 'block'; modal.style.display = 'block'; };
  const closeModal = (overlay, modal) => { overlay.style.display = 'none'; modal.style.display = 'none'; };

  // Auth modal form elements
  const signupForm = document.getElementById('signupForm');
  const loginForm  = document.getElementById('loginForm');
  const showSignup = document.getElementById('showSignup');
  const showLogin  = document.getElementById('showLogin');
  const forgotPassword = document.getElementById('forgotPassword');

  // Account page elements
  const accountLoggedOut = document.getElementById('accountLoggedOut');
  const accountLoggedIn  = document.getElementById('accountLoggedIn');
  const userEmail  = document.getElementById('userEmail');
  const logoutBtn  = document.getElementById('logoutBtn');
  const openSettingsBtn = document.getElementById('openSettings');

  // Settings modal elements
  const prefsForm  = document.getElementById('prefsForm');
  const zoomLinkEl = document.getElementById('zoomLink');
  const zoomMeetingNumberEl = document.getElementById('zoomMeetingNumber');
  const zoomPasscodeEl = document.getElementById('zoomPasscode');
  const zoomDisplayNameEl = document.getElementById('zoomDisplayName');

  // Contact modal elements
  const openContactBtn = document.getElementById('openContact');
  const contactForm = document.getElementById('contactForm');

  // Remote elements
  const remoteEl   = document.getElementById('remoteContent');
  const authMsgEl  = document.getElementById('authMessage');

  const setMessage = (msg) => { if (authMsgEl) authMsgEl.textContent = msg || ''; };

  // Modal event wiring
  openAuthBtns.forEach(btn => btn.addEventListener('click', () => openModal(authOverlay, authModal)));
  closeAuth.addEventListener('click', () => closeModal(authOverlay, authModal));
  authOverlay.addEventListener('click', () => closeModal(authOverlay, authModal));

  openContactBtn.addEventListener('click', () => openModal(contactOverlay, contactModal));
  closeContact.addEventListener('click', () => closeModal(contactOverlay, contactModal));
  contactOverlay.addEventListener('click', () => closeModal(contactOverlay, contactModal));
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thanks! We will reach out.');
    contactForm.reset();
    closeModal(contactOverlay, contactModal);
  });

  openSettingsBtn?.addEventListener('click', () => openModal(settingsOverlay, settingsModal));
  closeSettings.addEventListener('click', () => closeModal(settingsOverlay, settingsModal));
  settingsOverlay.addEventListener('click', () => closeModal(settingsOverlay, settingsModal));

  // Auth modal tab switching
  const setActiveTab = (tab) => {
    if (tab === 'signup') {
      showSignup.classList.add('tab-active');
      showLogin.classList.remove('tab-active');
      signupForm.style.display = 'block';
      loginForm.style.display  = 'none';
    } else {
      showLogin.classList.add('tab-active');
      showSignup.classList.remove('tab-active');
      signupForm.style.display = 'none';
      loginForm.style.display  = 'block';
    }
  };
  showSignup.addEventListener('click', () => setActiveTab('signup'));
  showLogin.addEventListener('click', () => setActiveTab('login'));

  // Firebase guards
  let auth = null, db = null;
  try { auth = firebase.auth(); } catch (e) { console.warn('Auth not available:', e); }
  try { db = firebase.firestore(); } catch (e) { console.warn('Firestore not available:', e); }

  // Auth flows (modal)
  if (auth) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = e.target[0].value;
      const password = e.target[1].value;
      try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        setMessage(`Account created: ${cred.user.email}`);
        signupForm.reset();
        closeModal(authOverlay, authModal);
        location.hash = '#account';
      } catch (err) {
        alert(err.message);
      }
    });

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = e.target[0].value;
      const password = e.target[1].value;
      try {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        setMessage(`Logged in: ${cred.user.email}`);
        loginForm.reset();
        closeModal(authOverlay, authModal);
        location.hash = '#account';
      } catch (err) {
        alert(err.message);
      }
    });

    forgotPassword.addEventListener('click', async () => {
      const email = prompt('Enter your account email:');
      if (!email) return;
      try {
        await auth.sendPasswordResetEmail(email);
        alert('Password reset email sent.');
      } catch (err) {
        alert(err.message);
      }
    });

    logoutBtn?.addEventListener('click', async () => {
      try { await auth.signOut(); setMessage('Logged out.'); location.hash = '#home'; }
      catch (err) { setMessage(err.message); }
    });

    auth.onAuthStateChanged(async (user) => {
      if (user) {
        userBadge.style.display = 'inline-block';
        userBadge.textContent = user.email;

        document.getElementById('accountLoggedOut').style.display = 'none';
        document.getElementById('accountLoggedIn').style.display  = 'block';
        userEmail.textContent = `Signed in as: ${user.email}`;
        setMessage('');

        // Load profile (if Firestore)
        let profile = {};
        if (db) {
          try {
            const snap = await db.collection('profiles').doc(user.uid).get();
            profile = snap.exists ? snap.data() : {};
          } catch (err) {
            console.warn('Profile load failed:', err);
          }
        }
        // Pre-fill settings modal
        if (zoomLinkEl && profile.zoomLink) zoomLinkEl.value = profile.zoomLink;
        if (zoomMeetingNumberEl && profile.zoomMeetingNumber) zoomMeetingNumberEl.value = profile.zoomMeetingNumber;
        if (zoomPasscodeEl && profile.zoomPasscode) zoomPasscodeEl.value = profile.zoomPasscode;
        if (zoomDisplayNameEl && profile.zoomDisplayName) zoomDisplayNameEl.value = profile.zoomDisplayName;

        renderRemote(user, profile);
      } else {
        userBadge.style.display = 'none';
        userBadge.textContent = '';

        document.getElementById('accountLoggedOut').style.display = 'block';
        document.getElementById('accountLoggedIn').style.display  = 'none';

        renderRemote(null, null);
      }
    });
  } else {
    // If Firebase not configured, keep UI functional without auth
    openAuthBtns.forEach(btn => btn.addEventListener('click', () => alert('Configure Firebase in index.html to enable Sign In / Sign Up.')));
    openSettingsBtn?.addEventListener('click', () => alert('Configure Firebase to save Zoom settings.'));
  }

  // Save Zoom settings (in Settings modal)
  if (db && auth && prefsForm) {
    prefsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) { setMessage('Please sign in.'); return; }
      const zoomLink  = zoomLinkEl?.value?.trim() || '';
      const zoomMeetingNumber = zoomMeetingNumberEl?.value?.trim() || '';
      const zoomPasscode = zoomPasscodeEl?.value?.trim() || '';
      const zoomDisplayName = zoomDisplayNameEl?.value?.trim() || '';
      try {
        await db.collection('profiles').doc(user.uid).set(
          { zoomLink, zoomMeetingNumber, zoomPasscode, zoomDisplayName },
          { merge: true }
        );
        alert('Zoom settings saved.');
        closeModal(settingsOverlay, settingsModal);
        renderRemote(user, { zoomLink, zoomMeetingNumber, zoomPasscode, zoomDisplayName });
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Remote renderer (no inline fields anywhere)
  function renderRemote(user, profile) {
    if (!remoteEl) return;
    if (!user) { remoteEl.innerHTML = '<p>Please <strong>sign in</strong> to see your personalized Zoom session.</p>'; return; }

    const zoomLink  = profile?.zoomLink || '';
    const zoomMeetingNumber = profile?.zoomMeetingNumber || '';
    const zoomPasscode = profile?.zoomPasscode || '';
    const displayName = profile?.zoomDisplayName || user.email || 'PLC Guest';

    if (window.ZOOM_SDK_ENABLED && zoomMeetingNumber) {
      const url = new URL('zoom.html', window.location.href);
      url.searchParams.set('mn', zoomMeetingNumber);
      if (zoomPasscode) url.searchParams.set('pwd', zoomPasscode);
      url.searchParams.set('name', encodeURIComponent(displayName));
      remoteEl.innerHTML = `
        <div class="remote-cta card">
          <div class="left">
            <h3>Join Zoom</h3>
            <p>Use your Zoom link or join directly in your browser.</p>
          </div>
          <div class="right">
            <a href="${zoomLink || '#'}" target="_blank" rel="noopener"><button ${zoomLink ? '' : 'disabled'}>Open Zoom Link</button></a>
            <a href="${url.toString()}"><button>Join in Browser (Beta)</button></a>
          </div>
        </div>`;
    } else {
      if (!zoomLink) {
        remoteEl.innerHTML = '<div class="card"><p class="badge">Zoom</p><p>Add your Zoom meeting link via <strong>Account → Manage Zoom Settings</strong>.</p></div>';
        return;
      }
      remoteEl.innerHTML = `
        <div class="remote-cta card">
          <div class="left">
            <h3>Join Zoom</h3>
            <p>Your personalized Zoom room is ready.</p>
          </div>
          <div class="right">
            <a href="${zoomLink}" target="_blank" rel="noopener"><button>Open Zoom Meeting</button></a>
          </div>
        </div>`;
    }
  }
});
