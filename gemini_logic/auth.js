import { auth, db } from './config.js';

// --- Signup Function ---
async function signupUser(email, password) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    console.log("User signed up:", user);

    // Store initial user settings in Firestore
    await db.collection("users").doc(user.uid).set({
      email: user.email,
      preferences: {
        unit: "celsius", // Default to Celsius
        theme: "light",  // Default to Light
        language: "en"   // Default to English
      },
      savedLocations: []
    });
    alert("Signup successful! Please login.");
    // Optionally redirect to login page or dashboard
    window.location.href = '/'; // Or your dashboard page
  } catch (error) {
    console.error("Error signing up:", error.message);
    alert(`Signup failed: ${error.message}`);
  }
}

// --- Login Function ---
async function loginUser(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    console.log("User logged in:", user);
    alert("Login successful!");
    // Redirect to dashboard
    window.location.href = '/ai_weather_dashboard_for_skypulse_ai/index.html';
  } catch (error) {
    console.error("Error logging in:", error.message);
    alert(`Login failed: ${error.message}`);
  }
}

// --- Logout Function ---
async function logoutUser() {
  try {
    await auth.signOut();
    console.log("User logged out.");
    alert("Logged out successfully!");
    // Redirect to login page
    window.location.href = '/'; // Or your login page
  } catch (error) {
    console.error("Error logging out:", error.message);
    alert(`Logout failed: ${error.message}`);
  }
}

// --- Auth State Listener ---
auth.onAuthStateChanged(user => {
  if (user) {
    console.log("User is logged in:", user.uid);
    // You might want to update UI elements or redirect here if needed
  } else {
    console.log("User is logged out.");
    // Redirect to login page if on a protected route
    // Example: if (!window.location.pathname.includes('login') && !window.location.pathname.includes('signup')) {
    //   window.location.href = '/';
    // }
  }
});

export { signupUser, loginUser, logoutUser };