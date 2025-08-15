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
  const teamsLinkEl= document.getElementById('teamsLink');
  const zoomLinkEl = document.getElementById('zoomLink');
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
      remoteEl.innerHTML = '<p>Please <strong>log in</strong> to see your personalized remote session link (Teams or Zoom).</p>';
      return;
    }
    const platform = profile?.platform || null;
    const teamsLink = profile?.teamsLink || '';
    const zoomLink  = profile?.zoomLink || '';

    if (!platform) {
      remoteEl.innerHTML = '<p class="badge">No platform selected</p><p>Choose your preferred remote platform in the <strong>Account</strong> section.</p>';
      return;
    }

    if (platform === 'teams') {
      if (!teamsLink) {
        remoteEl.innerHTML = '<p class="badge">Teams selected</p><p>Add your Teams meeting link in <strong>Account → Remote Work Preference</strong>.</p>';
        return;
      }
      remoteEl.innerHTML = `
        <div class="remote-cta">
          <div class="left">
            <h3>Join Microsoft Teams</h3>
            <p>Your personalized Teams session link is ready.</p>
          </div>
          <div class="right">
            <a href="${teamsLink}" target="_blank" rel="noopener">
              <button>Open Teams Meeting</button>
            </a>
          </div>
        </div>`;
      return;
    }

    if (platform === 'zoom') {
      if (!zoomLink) {
        remoteEl.innerHTML = '<p class="badge">Zoom selected</p><p>Add your Zoom meeting link in <strong>Account → Remote Work Preference</strong>.</p>';
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
      return;
    }

    remoteEl.textContent = 'Unknown platform preference.';
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
      const platform = (new FormData(prefsForm)).get('platform');
      const teamsLink = teamsLinkEl?.value?.trim() || '';
      const zoomLink  = zoomLinkEl?.value?.trim() || '';
      const user = firebase.auth().currentUser;
      if (!user) { setMessage('Please log in.'); return; }
      try {
        await db.collection('profiles').doc(user.uid).set({ platform, teamsLink, zoomLink }, { merge: true });
        setMessage('Preference saved.');
        // Re-render remote card
        renderRemote(user, { platform, teamsLink, zoomLink });
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
        const platform = profile.platform;
        if (platform) {
          const radio = document.querySelector(`input[name="platform"][value="${platform}"]`);
          if (radio) radio.checked = true;
        }
        if (teamsLinkEl && profile.teamsLink) teamsLinkEl.value = profile.teamsLink;
        if (zoomLinkEl && profile.zoomLink) zoomLinkEl.value = profile.zoomLink;
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
