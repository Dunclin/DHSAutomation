// Ensure DOM loaded
document.addEventListener('DOMContentLoaded', () => {
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
  const switchBar  = document.getElementById('switchBar');
  const authForms  = document.getElementById('authForms');
  const signupForm = document.getElementById('signupForm');
  const loginForm  = document.getElementById('loginForm');
  const showSignup = document.getElementById('showSignup');
  const showLogin  = document.getElementById('showLogin');
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
    if (!showSignup || !showLogin) return;
    if (tab === 'signup') {
      showSignup.classList.add('tab-active');
      showLogin.classList.remove('tab-active');
    } else {
      showLogin.classList.add('tab-active');
      showSignup.classList.remove('tab-active');
    }
  };

  const renderRemote = (user, profile) => {
    if (!remoteEl) return;
    if (!user) {
      remoteEl.innerHTML = '<p>Please <strong>log in</strong> to see your personalized Zoom session.</p>';
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
        <div class="remote-cta">
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
        remoteEl.innerHTML = '<p class="badge">Zoom</p><p>Add your Zoom meeting link in <strong>Account → Your Zoom Meeting Settings</strong>.</p>';
        return;
      }
      remoteEl.innerHTML = `
        <div class="remote-cta">
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

  // Toggle handlers
  if (showSignup && showLogin && signupForm && loginForm) {
    showSignup.addEventListener('click', () => {
      signupForm.style.display = 'block';
      loginForm.style.display  = 'none';
      setActiveTab('signup');
    });
    showLogin.addEventListener('click', () => {
      signupForm.style.display = 'none';
      loginForm.style.display  = 'block';
      setActiveTab('login');
    });
  }

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
      } catch (err) {
        setMessage(err.message);
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
      } catch (err) {
        setMessage(err.message);
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await firebase.auth().signOut();
        setMessage('Logged out.');
      } catch (err) {
        setMessage(err.message);
      }
    });
  }

  // Save preferences
  if (prefsForm) {
    prefsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const zoomLink  = zoomLinkEl?.value?.trim() || '';
      const zoomMeetingNumber = zoomMeetingNumberEl?.value?.trim() || '';
      const zoomPasscode = zoomPasscodeEl?.value?.trim() || '';
      const zoomDisplayName = zoomDisplayNameEl?.value?.trim() || '';
      const user = firebase.auth().currentUser;
      if (!user) { setMessage('Please log in.'); return; }
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

  // Auth state changes
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      // UI visibility
      if (authForms) authForms.style.display = 'none';
      if (switchBar) switchBar.style.display = 'none';
      if (userInfo) userInfo.style.display = 'block';
      if (prefsCard) prefsCard.style.display = 'block';
      if (userEmail) userEmail.textContent = `Logged in as: ${user.email}`;
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
      // UI visibility for logged-out
      if (authForms) authForms.style.display = 'block';
      if (switchBar) switchBar.style.display = 'inline-flex';
      if (userInfo) userInfo.style.display = 'none';
      if (prefsCard) prefsCard.style.display = 'none';
      if (signupForm && loginForm) {
        signupForm.style.display = 'block';
        loginForm.style.display  = 'none';
        setActiveTab('signup');
      }
      renderRemote(null, null);
    }
  });
});
