/* =========================================================
   GO BIKE — AUTHENTICATION
   ========================================================= */

"use strict";

import {
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  auth,
  db
} from "./firebase.js";


/* =========================================================
   REGISTER
   ========================================================= */

const registerForm =
  document.getElementById("registerForm");

if (registerForm) {

  registerForm.addEventListener(
    "submit",
    handleRegistration
  );

}


async function handleRegistration(event) {

  event.preventDefault();

  const name =
    document.getElementById("name")?.value.trim();

  const phone =
    document.getElementById("phone")?.value.trim();

  const email =
    document.getElementById("email")?.value.trim();

  const password =
    document.getElementById("password")?.value;

  const message =
    document.getElementById("registerMessage");

  const button =
    document.getElementById("registerButton");


  /* -------------------------------------------------------
     Validation
     ------------------------------------------------------- */

  if (!name || !phone || !email || !password) {

    showMessage(
      message,
      "Please fill all required fields.",
      "error"
    );

    return;
  }


  if (name.length < 2) {

    showMessage(
      message,
      "Please enter a valid name.",
      "error"
    );

    return;
  }


  if (password.length < 6) {

    showMessage(
      message,
      "Password must contain at least 6 characters.",
      "error"
    );

    return;
  }


  /* -------------------------------------------------------
     Loading
     ------------------------------------------------------- */

  setButtonLoading(
    button,
    true
  );

  showMessage(
    message,
    "Creating your Go Bike account...",
    "loading"
  );


  try {

    /* -----------------------------------------------------
       Firebase Authentication
       ----------------------------------------------------- */

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    const user =
      userCredential.user;


    /* -----------------------------------------------------
       Update Firebase Auth profile
       ----------------------------------------------------- */

    await updateProfile(
      user,
      {
        displayName: name
      }
    );


    /* -----------------------------------------------------
       Create Firestore user profile
       ----------------------------------------------------- */

    await setDoc(
      doc(db, "users", user.uid),
      {

        uid: user.uid,

        role: "customer",

        name: name,

        phone: phone,

        email: email,

        photoURL: "",

        status: "active",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


    /* -----------------------------------------------------
       Create customer profile
       ----------------------------------------------------- */

    await setDoc(
      doc(db, "customers", user.uid),
      {

        uid: user.uid,

        name: name,

        phone: phone,

        email: email,

        photoURL: "",

        savedPlaces: {
          home: null,
          work: null
        },

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


    /* -----------------------------------------------------
       Success
       ----------------------------------------------------- */

    showMessage(
      message,
      "Account created successfully. Opening Go Bike...",
      "success"
    );


    setTimeout(() => {

      window.location.href =
        "../customer/home.html";

    }, 1000);


  } catch (error) {

    console.error(
      "[GO BIKE AUTH]",
      error
    );


    showMessage(
      message,
      getFriendlyAuthError(error),
      "error"
    );


    setButtonLoading(
      button,
      false
    );

  }

}


/* =========================================================
   BUTTON LOADING
   ========================================================= */

function setButtonLoading(
  button,
  loading
) {

  if (!button) {
    return;
  }

  button.disabled = loading;

  if (loading) {

    button.dataset.originalText =
      button.textContent;

    button.textContent =
      "Creating Account...";

  } else {

    button.textContent =
      button.dataset.originalText ||
      "Create Account";

  }

}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
  element,
  text,
  type
) {

  if (!element) {
    return;
  }

  element.textContent = text;

  element.className =
    `form-message ${type}`;

}


/* =========================================================
   FIREBASE ERROR → USER MESSAGE
   ========================================================= */

function getFriendlyAuthError(error) {

  switch (error.code) {

    case "auth/email-already-in-use":
      return "This email is already registered. Please login.";

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/weak-password":
      return "Please choose a stronger password.";

    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";

    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";

    case "permission-denied":
      return "Unable to create your profile. Please try again.";

    default:
      return "Unable to create account. Please try again.";

  }

}
