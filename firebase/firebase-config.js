/* =========================================================
   GO BIKE — FIREBASE CORE
   ========================================================= */

"use strict";

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


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};


/* =========================================================
   INITIALIZE FIREBASE
   ========================================================= */

const app =
  initializeApp(firebaseConfig);


/* =========================================================
   SERVICES
   ========================================================= */

const auth =
  getAuth(app);

const db =
  getFirestore(app);

const rtdb =
  getDatabase(app);

const storage =
  getStorage(app);


/* =========================================================
   GLOBAL EXPORTS
   ========================================================= */

export {
  app,
  auth,
  db,
  rtdb,
  storage
};
