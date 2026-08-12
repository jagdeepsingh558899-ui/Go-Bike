/* =========================================================
   GO BIKE — FIREBASE INITIALIZATION
   ========================================================= */

"use strict";


// Firebase SDK modules
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  getDatabase
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

import {
  getStorage
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";


// ---------------------------------------------------------
// Firebase configuration
// ---------------------------------------------------------

const firebaseConfig =
  window.GoBikeFirebaseConfig;

if (!firebaseConfig) {

  throw new Error(
    "Go Bike Firebase configuration not found."
  );

}


// ---------------------------------------------------------
// Initialize Firebase
// ---------------------------------------------------------

const app =
  initializeApp(firebaseConfig);


// ---------------------------------------------------------
// Firebase services
// ---------------------------------------------------------

const auth =
  getAuth(app);

const db =
  getFirestore(app);

const realtimeDb =
  getDatabase(app);

const storage =
  getStorage(app);


// ---------------------------------------------------------
// Export services
// ---------------------------------------------------------

export {
  app,
  auth,
  db,
  realtimeDb,
  storage
};


// ---------------------------------------------------------
// Go Bike global state
// ---------------------------------------------------------

window.GoBikeFirebase = {
  app,
  auth,
  db,
  realtimeDb,
  storage
};


if (window.GoBike) {

  window.GoBike.firebaseReady = true;

  window.GoBike.log(
    "Firebase initialized successfully."
  );

}
