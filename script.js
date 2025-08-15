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
  const authMsgEl  = document.getElementById('authMessage');

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

  // Auth state changes
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // Show user info
      if (authForms) authForms.style.display = 'none';
      if (switchBar) switchBar.style.display = 'none';
      if (userInfo) userInfo.style.display = 'block';
      if (userEmail) userEmail.textContent = `Logged in as: ${user.email}`;
      setMessage('');
    } else {
      // Show auth forms
      if (authForms) authForms.style.display = 'block';
      if (switchBar) switchBar.style.display = 'inline-flex';
      if (userInfo) userInfo.style.display = 'none';
      if (signupForm && loginForm) {
        // default to Sign Up visible
        signupForm.style.display = 'block';
        loginForm.style.display  = 'none';
        setActiveTab('signup');
      }
    }
  });
});
