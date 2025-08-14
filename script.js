// Contact Form
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  alert('Thank you! Your message has been sent.');
  e.target.reset();
});

// Firebase Auth - Sign Up
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

// Firebase Auth - Login
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

// Optional: Track Auth State
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log('User logged in:', user.email);
  } else {
    console.log('No user logged in.');
  }
});


