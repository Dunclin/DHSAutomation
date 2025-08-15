// Ensure DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  // Simple SPA routing: show one section at a time based on hash
  const routes = Array.from(document.querySelectorAll('.route'));
  const setRoute = (name) => {
    routes.forEach(sec => sec.classList.toggle('active', sec.id === name));
    // scroll to top of content on route change
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const initial = (location.hash || '#home').replace('#', '');
  setRoute(initial);
  window.addEventListener('hashchange', () => setRoute((location.hash || '#home').replace('#', '')));

  // Contact Form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      alert('Thank you! Your message has been sent.');
      e.target.reset();
    });
  }

  // Elements
  const userBadge  = document.getElementById('userBadge');
  const openAuthBtns = [document.getElementById('openAuth'), document.getElementById('openAuthHero'), document.getElementById('openAuthAccount')].filter(Boolean);
  const authOverlay = document.getElementById('authOverlay');
  const authModal   = document.getElementById('authModal');
  const closeAuth   = document.getElementById('closeAuth');

  const signupForm = document.getElementById('signupForm');
  const loginForm  = document.getElementById('loginForm');
  const showSignup = document.getElementById('showSignup');
  const showLogin  = document.getElementById('showLogin');

  const accountLoggedOut = document.getElementById('accountLoggedOut');
  const accountLoggedIn  = document.getElementById('accountLoggedIn');
  const userInfo   = document.getElementById('userInfo');
  const userEmail  = document.getElementById('userEmail');
  const logoutBtn  = document.getElementById('logoutBtn');
  const prefsCard  = document.getElementById('prefsCard');
  const prefsForm  = document.getElementById('prefsForm');
  const zoomLinkEl = document.getElementById('zoomLink');
  const zoomDisplayNameEl = document.getElementById('zoomDisplayName');
  const zoomMeetingNumberEl = document.getElementById('zoomMeetingNumber');
  const zoomPasscodeEl = document.getElementById('zoomPasscode');
  const authMsgEl  = document.getElementById('authMessage');
  const remoteEl   = document.getElementById('remoteContent');

  // Firestore
  const db = firebase.firestore();

  // Helpers
  const setMessage = (msg) => { if (authMsgEl) authMsgEl.textContent = msg || ''; };
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
  const openModal = (defaultTab='login') => {
    setActiveTab(defaultTab);
    authOverlay.style.display = 'block';
    authModal.style.display = 'block';
  };
  const closeModal = () => {
    authOverlay.style.display = 'none';
    authModal.style.display = 'none';
  };

  // Modal events
  openAuthBtns.forEach(btn => btn.addEventListener('click', () => openModal('login')));
  closeAuth.addEventListener('click', closeModal);
  authOverlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // Toggle handlers
  showSignup.addEventListener('click', () => setActiveTab('signup'));
  showLogin.addEventListener('click', () => setActiveTab('login'));

  // Sign Up
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = e.target[0].value;
      const password = e.target[1].value;
      try {
        const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
        setMessage(`Account created: ${cred.user.email}`);
        e.target.reset();
        closeModal();
        // Navigate to account page
        location.hash = '#account';
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = e.target[0].value;
      const password = e.target[1].value;
      try {
        const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
        setMessage(`Logged in: ${cred.user.email}`);
        e.target.reset();
        closeModal();
        // Navigate to account page
        location.hash = '#account';
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await firebase.auth().signOut();
        setMessage('Logged out.');
        location.hash = '#home';
      } catch (err) {
        setMessage(err.message);
      }
    });
  }

  // Render remote Zoom card
  const renderRemote = (user, profile) => {
    if (!remoteEl) return;
    if (!user) {
      remoteEl.innerHTML = '<p>Please <strong>sign in</strong> to see your personalized Zoom session.</p>';
      return;
    }
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
        remoteEl.innerHTML = '<div class="card"><p class="badge">Zoom</p><p>Add your Zoom meeting link in <strong>Account → Your Zoom Meeting Settings</strong>.</p></div>';
        return;
      }
      remoteEl.innerHTML = `
        <div class="remote-cta card">
          <div class="left">
            <h3>Join Zoom</h3>
            <p>Your personalized Zoom room is ready.</p>
          </div>
          <div class="right">
            <a href="${zoomLink}" target="_blank" rel="noopener">
              <button>Open Zoom Meeting</button>
            </a>
          </div>
        </div>`;
    }
  };

  // Auth state changes
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      // Header badge
      userBadge.style.display = 'inline-block';
      userBadge.textContent = user.email;

      // Account area
      accountLoggedOut.style.display = 'none';
      accountLoggedIn.style.display = 'block';
      userEmail.textContent = `Signed in as: ${user.email}`;
      setMessage('');

      // Load profile
      let profile = null;
      try {
        const snap = await db.collection('profiles').doc(user.uid).get();
        profile = snap.exists ? snap.data() : {};
      } catch (err) {
        console.warn('Failed to load profile:', err);
      }

      // Populate prefs
      if (profile) {
        if (zoomLinkEl && profile.zoomLink) zoomLinkEl.value = profile.zoomLink;
        if (zoomMeetingNumberEl && profile.zoomMeetingNumber) zoomMeetingNumberEl.value = profile.zoomMeetingNumber;
        if (zoomPasscodeEl && profile.zoomPasscode) zoomPasscodeEl.value = profile.zoomPasscode;
        if (zoomDisplayNameEl && profile.zoomDisplayName) zoomDisplayNameEl.value = profile.zoomDisplayName;
      }

      renderRemote(user, profile);
    } else {
      // Header badge
      userBadge.style.display = 'none';
      userBadge.textContent = '';

      // Account area
      accountLoggedOut.style.display = 'block';
      accountLoggedIn.style.display = 'none';

      renderRemote(null, null);
    }
  });

  // Save preferences
  if (prefsForm) {
    prefsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const zoomLink  = zoomLinkEl?.value?.trim() || '';
      const zoomMeetingNumber = zoomMeetingNumberEl?.value?.trim() || '';
      const zoomPasscode = zoomPasscodeEl?.value?.trim() || '';
      const zoomDisplayName = zoomDisplayNameEl?.value?.trim() || '';
      const user = firebase.auth().currentUser;
      if (!user) { setMessage('Please sign in.'); return; }
      try {
        await db.collection('profiles').doc(user.uid).set(
          { zoomLink, zoomMeetingNumber, zoomPasscode, zoomDisplayName },
          { merge: true }
        );
        setMessage('Zoom settings saved.');
        // Re-render remote card
        renderRemote(user, { zoomLink, zoomMeetingNumber, zoomPasscode, zoomDisplayName });
      } catch (err) {
        setMessage(err.message);
      }
    });
  }
});
