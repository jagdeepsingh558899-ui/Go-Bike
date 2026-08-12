/* =========================================================
   GO BIKE — MAIN APPLICATION
   ========================================================= */

"use strict";


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializeSplashScreen();

  initializeCurrentYear();

  initializeServiceWorker();

});


/* =========================================================
   SPLASH SCREEN
   ========================================================= */

function initializeSplashScreen() {

  const splashScreen =
    document.getElementById("splashScreen");

  const app =
    document.getElementById("app");

  if (!splashScreen || !app) {
    return;
  }

  /*
   * Keep the splash visible briefly so the app
   * feels like a real mobile application.
   */

  window.setTimeout(() => {

    splashScreen.classList.add("hide");

    app.classList.remove("hidden");

  }, 1400);

}


/* =========================================================
   CURRENT YEAR
   ========================================================= */

function initializeCurrentYear() {

  const yearElement =
    document.getElementById("currentYear");

  if (!yearElement) {
    return;
  }

  yearElement.textContent =
    new Date().getFullYear();

}


/* =========================================================
   SERVICE WORKER
   ========================================================= */

function initializeServiceWorker() {

  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {

    navigator.serviceWorker
      .register("sw.js")
      .then((registration) => {

        console.log(
          "Go Bike Service Worker registered:",
          registration.scope
        );

      })
      .catch((error) => {

        console.warn(
          "Service Worker registration failed:",
          error
        );

      });

  });

}


/* =========================================================
   GLOBAL APP OBJECT
   ========================================================= */

window.GoBike = {

  appName: "Go Bike",

  version: "1.0.0",

  environment: "development",

  /*
   * These will be connected later.
   */

  firebaseReady: false,

  user: null,

  role: null,

  ride: null,

  order: null

};


/* =========================================================
   SAFE LOGGING
   ========================================================= */

window.GoBike.log = function (...messages) {

  if (
    window.GoBike.environment ===
    "development"
  ) {

    console.log(
      "[GO BIKE]",
      ...messages
    );

  }

};


/* =========================================================
   USER ROLE
   ========================================================= */

window.GoBike.setRole = function (role) {

  const allowedRoles = [
    "customer",
    "rider",
    "admin"
  ];

  if (!allowedRoles.includes(role)) {

    console.warn(
      "[GO BIKE] Invalid role:",
      role
    );

    return false;

  }

  window.GoBike.role = role;

  return true;

};


/* =========================================================
   BASIC NAVIGATION
   ========================================================= */

window.GoBike.goTo = function (path) {

  if (!path) {
    return;
  }

  window.location.href = path;

};


/* =========================================================
   ERROR MESSAGE
   ========================================================= */

window.GoBike.showError = function (message) {

  /*
   * Temporary implementation.
   *
   * Later this will become the Go Bike
   * premium toast/notification system.
   */

  if (!message) {
    return;
  }

  console.error(
    "[GO BIKE ERROR]",
    message
  );

};


/* =========================================================
   LOADING STATE
   ========================================================= */

window.GoBike.setLoading = function (
  element,
  loading
) {

  if (!element) {
    return;
  }

  if (loading) {

    element.setAttribute(
      "aria-busy",
      "true"
    );

    element.disabled = true;

  } else {

    element.removeAttribute(
      "aria-busy"
    );

    element.disabled = false;

  }

};


/* =========================================================
   NETWORK STATUS
   ========================================================= */

window.addEventListener(
  "online",
  () => {

    window.GoBike.log(
      "Internet connection restored."
    );

  }
);


window.addEventListener(
  "offline",
  () => {

    window.GoBike.log(
      "Internet connection lost."
    );

  }
);
