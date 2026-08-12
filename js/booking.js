/* =========================================================
   GO BIKE — PARCEL BOOKING
   Customer booking confirmation
   ========================================================= */

"use strict";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  auth,
  db
} from "./firebase.js";


let currentUser = null;
let bookingData = null;


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  loadBookingData();

  initializeBackButton();

  initializeConfirmButton();

  watchAuthentication();

});


/* =========================================================
   AUTHENTICATION
   ========================================================= */

function watchAuthentication() {

  onAuthStateChanged(
    auth,
    (user) => {

      if (!user) {

        showMessage(
          "Please login before booking a parcel."
        );

        setTimeout(() => {

          window.location.href =
            "../auth/login.html";

        }, 1200);

        return;
      }


      currentUser = user;

    }
  );

}


/* =========================================================
   LOAD MAP BOOKING
   ========================================================= */

function loadBookingData() {

  const savedBooking =
    sessionStorage.getItem(
      "goBikeBooking"
    );


  if (!savedBooking) {

    showMessage(
      "Pickup and drop location not found."
    );

    disableConfirmButton();

    return;

  }


  try {

    bookingData =
      JSON.parse(
        savedBooking
      );


    if (
      !bookingData.pickup ||
      !bookingData.drop
    ) {

      throw new Error(
        "Invalid booking data."
      );

    }


    displayBookingData();

  } catch (error) {

    console.error(
      "[GO BIKE BOOKING]",
      error
    );

    showMessage(
      "Unable to load booking details."
    );

    disableConfirmButton();

  }

}


/* =========================================================
   DISPLAY BOOKING
   ========================================================= */

function displayBookingData() {

  const pickup =
    bookingData.pickup;

  const drop =
    bookingData.drop;


  const pickupElement =
    document.getElementById(
      "pickupAddress"
    );

  const dropElement =
    document.getElementById(
      "dropAddress"
    );


  if (pickupElement) {

    pickupElement.textContent =
      formatLocation(
        pickup
      );

  }


  if (dropElement) {

    dropElement.textContent =
      formatLocation(
        drop
      );

  }


  /*
   * Temporary estimate.
   *
   * Final fare will later come from
   * secure backend/admin fare settings.
   */

  const distanceKm =
    calculateDistance(
      pickup.latitude,
      pickup.longitude,
      drop.latitude,
      drop.longitude
    );


  const baseFare = 30;

  const perKm = 10;

  const distanceFare =
    Math.max(
      0,
      distanceKm * perKm
    );


  const estimatedFare =
    Math.max(
      baseFare,
      baseFare + distanceFare
    );


  bookingData.distanceKm =
    Number(
      distanceKm.toFixed(2)
    );

  bookingData.estimatedFare =
    Math.round(
      estimatedFare
    );


  updateElement(
    "baseFare",
    `₹${baseFare}`
  );

  updateElement(
    "distanceFare",
    `₹${Math.round(distanceFare)}`
  );

  updateElement(
    "serviceFare",
    `₹${Math.round(estimatedFare)}`
  );

  updateElement(
    "totalFare",
    `₹${Math.round(estimatedFare)}`
  );

}


/* =========================================================
   CONFIRM BOOKING
   ========================================================= */

async function confirmBooking() {

  if (!currentUser) {

    showMessage(
      "Please login before booking."
    );

    return;

  }


  if (!bookingData) {

    showMessage(
      "Booking information is missing."
    );

    return;

  }


  const receiverName =
    document.getElementById(
      "receiverName"
    )?.value.trim();


  const receiverPhone =
    document.getElementById(
      "receiverPhone"
    )?.value.trim();


  const parcelType =
    document.getElementById(
      "parcelType"
    )?.value || "other";


  const deliveryNote =
    document.getElementById(
      "deliveryNote"
    )?.value.trim();


  /* -------------------------------------------------------
     Validation
     ------------------------------------------------------- */

  if (!receiverName) {

    showMessage(
      "Please enter receiver name."
    );

    return;

  }


  if (!receiverPhone) {

    showMessage(
      "Please enter receiver phone number."
    );

    return;

  }


  if (
    receiverPhone.length < 10
  ) {

    showMessage(
      "Please enter a valid receiver phone number."
    );

    return;

  }


  const button =
    document.getElementById(
      "confirmBookingButton"
    );


  setButtonLoading(
    button,
    true
  );


  showMessage(
    "Creating your parcel booking..."
  );


  try {

    /* -----------------------------------------------------
       CREATE RIDE / PARCEL DOCUMENT
       ----------------------------------------------------- */

    const rideData = {

      customerId:
        currentUser.uid,

      driverId:
        null,

      serviceType:
        "bike",

      category:
        "parcel",

      status:
        "searching",

      pickup: {

        latitude:
          Number(
            bookingData.pickup.latitude
          ),

        longitude:
          Number(
            bookingData.pickup.longitude
          )

      },

      drop: {

        latitude:
          Number(
            bookingData.drop.latitude
          ),

        longitude:
          Number(
            bookingData.drop.longitude
          )

      },

      distance:
        Number(
          bookingData.distanceKm || 0
        ),

      estimatedFare:
        Number(
          bookingData.estimatedFare || 0
        ),

      finalFare:
        null,

      receiver: {

        name:
          receiverName,

        phone:
          receiverPhone

      },

      parcel: {

        type:
          parcelType,

        note:
          deliveryNote

      },

      otpVerified:
        false,

      paymentStatus:
        "pending",

      cancellationReason:
        null,

      createdAt:
        serverTimestamp(),

      acceptedAt:
        null,

      startedAt:
        null,

      completedAt:
        null

    };


    /* -----------------------------------------------------
       FIRESTORE
       ----------------------------------------------------- */

    const rideReference =
      await addDoc(
        collection(
          db,
          "rides"
        ),
        rideData
      );


    console.log(
      "[GO BIKE] Booking created:",
      rideReference.id
    );


    /* -----------------------------------------------------
       SAVE RIDE ID
       ----------------------------------------------------- */

    sessionStorage.setItem(
      "goBikeActiveRideId",
      rideReference.id
    );


    /*
     * Remove temporary map booking data.
     */

    sessionStorage.removeItem(
      "goBikeBooking"
    );


    showMessage(
      "Parcel booking created. Finding a rider..."
    );


    /* -----------------------------------------------------
       NEXT SCREEN
       ----------------------------------------------------- */

    setTimeout(() => {

      window.location.href =
        "searching.html";

    }, 700);


  } catch (error) {

    console.error(
      "[GO BIKE BOOKING ERROR]",
      error
    );


    showMessage(
      getBookingErrorMessage(
        error
      )
    );


    setButtonLoading(
      button,
      false
    );

  }

}


/* =========================================================
   CONFIRM BUTTON
   ========================================================= */

function initializeConfirmButton() {

  const button =
    document.getElementById(
      "confirmBookingButton"
    );


  if (!button) {
    return;
  }


  button.addEventListener(
    "click",
    confirmBooking
  );

}


/* =========================================================
   BACK BUTTON
   ========================================================= */

function initializeBackButton() {

  const button =
    document.getElementById(
      "backButton"
    );


  if (!button) {
    return;
  }


  button.addEventListener(
    "click",
    () => {

      window.location.href =
        "home.html";

    }
  );

}


/* =========================================================
   DISTANCE
   ========================================================= */

function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {

  const earthRadius = 6371;


  const latitudeDifference =
    toRadians(
      lat2 - lat1
    );


  const longitudeDifference =
    toRadians(
      lon2 - lon1
    );


  const a =
    Math.sin(
      latitudeDifference / 2
    ) ** 2 +

    Math.cos(
      toRadians(lat1)
    ) *

    Math.cos(
      toRadians(lat2)
    ) *

    Math.sin(
      longitudeDifference / 2
    ) ** 2;


  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );


  return earthRadius * c;

}


function toRadians(
  degrees
) {

  return degrees *
    Math.PI /
    180;

}


/* =========================================================
   FORMAT LOCATION
   ========================================================= */

function formatLocation(
  location
) {

  if (
    !location ||
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number"
  ) {

    return "Location unavailable";

  }


  return (
    `${location.latitude.toFixed(5)}, ` +
    `${location.longitude.toFixed(5)}`
  );

}


/* =========================================================
   UI HELPERS
   ========================================================= */

function updateElement(
  id,
  value
) {

  const element =
    document.getElementById(id);


  if (element) {

    element.textContent =
      value;

  }

}


function showMessage(
  message
) {

  const element =
    document.getElementById(
      "bookingMessage"
    );


  if (element) {

    element.textContent =
      message;

  }

}


function disableConfirmButton() {

  const button =
    document.getElementById(
      "confirmBookingButton"
    );


  if (button) {

    button.disabled = true;

  }

}


function setButtonLoading(
  button,
  loading
) {

  if (!button) {
    return;
  }


  button.disabled =
    loading;


  if (loading) {

    button.dataset.originalText =
      button.textContent;

    button.textContent =
      "CREATING BOOKING...";

  } else {

    button.textContent =
      button.dataset.originalText ||
      "CONFIRM PARCEL BOOKING";

  }

}


/* =========================================================
   FIREBASE ERROR MESSAGE
   ========================================================= */

function getBookingErrorMessage(
  error
) {

  if (
    error?.code ===
    "permission-denied"
  ) {

    return (
      "Booking permission denied. " +
      "Please check Firebase security rules."
    );

  }


  if (
    error?.code ===
    "unavailable"
  ) {

    return (
      "Network problem. " +
      "Please check your internet connection."
    );

  }


  return (
    "Unable to create booking. " +
    "Please try again."
  );

}
