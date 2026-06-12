// Firebase config goes here. This version is GitHub Pages ready.
// For now, the app works in LOCAL DEMO MODE if you leave these placeholders.
// To make it truly online across laptop/admin/employee phones, paste your Firebase Web App config here.
window.firebaseConfig = {
  apiKey: "PASTE_FIREBASE_API_KEY_HERE",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};

window.APP_CONFIG = {
  restaurantName: "Restaurant Attendance",
  kioskCode: "RESTO123",
  qrSeconds: 30,
  demoAdmin: {
    name: "Admin Owner",
    email: "admin@restaurant.local",
    password: "admin123"
  },
  demoEmployee: {
    name: "Juan Employee",
    email: "juan@restaurant.local",
    password: "employee123"
  }
};
