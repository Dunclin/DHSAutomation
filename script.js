// Contact Form
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  alert('Thank you! Your message has been sent.');
  e.target.reset();
});

// Elements
const authForms = document.getElementById('authForms');
const userInfo = document.getElementById('userInfo');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

// Sign Up
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target[0].value;
  const password = e.target[1].value;

  try {
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    document.getElementById('authMessage').textContent = `Account created: ${userCredential.user.email}`;
    e.target.reset();
  } catch (error) {
    document.getElementById('authMessage').textContent = error.message;
  }
});

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target[0].value;
  const password = e.target[1].value;

  try {
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    document.getElementById('authMessage').textContent = `Logged in: ${userCredential.user.email}`;
    e.target.reset();
  } catch (error) {
    document.getElementById('authMessage').textContent = error.message;
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await firebase.auth().signOut();
  document.getElementById('authMessage').textContent = 'Logged out.';
});

// Auth State
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    authForms.style.display = 'none';
    userInfo.style.display = 'block';
    userEmail.textContent = `Logged in as: ${user.email}`;
  } else {
    authForms.style.display = 'flex';
    userInfo.style.display = 'none';
    userEmail.textContent = '';
  }
});
