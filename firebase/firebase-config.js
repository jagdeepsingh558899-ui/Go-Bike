/* =========================================================
   GO BIKE — FIREBASE CONFIGURATION
   ========================================================= */

"use strict";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};


/*
 * Firebase configuration is intentionally kept
 * in one canonical file.
 *
 * IMPORTANT:
 * Firebase Security Rules are responsible for
 * protecting your database and user data.
 */

window.GoBikeFirebaseConfig = firebaseConfig;
