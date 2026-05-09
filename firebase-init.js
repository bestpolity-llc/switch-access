// ============================================================
// Firebase Init — shared across all switch-access pages
// ============================================================
const FIREBASE_CONFIG = {
  projectId: "studio-7107090270-b2521",
  appId: "1:391623099063:web:3d4918209ee0348a6dc332",
  apiKey: "AIzaSyAz76osZfWReApqfbCImAg12Iaf8daVKhg",
  storageBucket: "studio-7107090270-b2521.firebasestorage.app",
  authDomain: "studio-7107090270-b2521.firebaseapp.com",
  messagingSenderId: "391623099063"
};

firebase.initializeApp(FIREBASE_CONFIG);
const AUTH = firebase.auth();
const DB = firebase.firestore();
const GOOGLE_PROVIDER = new firebase.auth.GoogleAuthProvider();

// ============================================================
// AUTH
// ============================================================
let currentUser = null;
let authListeners = [];

function onAuthChange(callback) {
  authListeners.push(callback);
  if (currentUser !== null) callback(currentUser);
}

AUTH.onAuthStateChanged(user => {
  currentUser = user;
  authListeners.forEach(cb => cb(user));
});

async function signIn() {
  // Try popup first (fast, good UX on desktop)
  // Falls back to redirect (works on iPad where popups are blocked)
  try {
    await AUTH.signInWithPopup(GOOGLE_PROVIDER);
  } catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user' || e.message?.includes('popup')) {
      // Popup blocked — use redirect instead
      try {
        await AUTH.signInWithRedirect(GOOGLE_PROVIDER);
      } catch (e2) {
        console.error('Redirect sign-in also failed:', e2);
      }
    } else {
      console.error('Sign in error:', e);
    }
  }
}

// Handle redirect result (after Google sends user back)
(function() {
  try { AUTH.getRedirectResult(); } catch(e) {}
})();

async function signOut() {
  await AUTH.signOut();
}

// ============================================================
// PREFERENCES (Firestore)
// ============================================================
async function saveFirebasePrefs(uid, prefs) {
  try {
    await DB.collection('users').doc(uid).set({
      preferences: prefs,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn('Failed to save prefs to Firestore:', e);
  }
}

async function loadFirebasePrefs(uid) {
  try {
    const doc = await DB.collection('users').doc(uid).get();
    if (doc.exists) return doc.data().preferences || null;
    return null;
  } catch (e) {
    console.warn('Failed to load prefs from Firestore:', e);
    return null;
  }
}

// ============================================================
// FEEDBACK
// ============================================================
async function sendFeedback(uid, name, email, message, page) {
  try {
    await DB.collection('messages').add({
      uid: uid || null,
      name: name || '',
      email: email || '',
      message: message,
      page: page || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (e) {
    console.error('Failed to send feedback:', e);
    return false;
  }
}
