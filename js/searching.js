"use strict";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  auth,
  db
} from "./firebase.js";


let currentUser = null;
let rideId = null;
let unsubscribeRide = null;
let map = null;
let pickupMarker = null;
let dropMarker = null;
let routeLine = null;


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializeCancelButton();

  initializeAuthentication();

});


/* =========================================================
   AUTH
========================================================= */

function initializeAuthentication() {

  onAuthStateChanged(auth, (user) => {

    if (!user) {

      window.location.href =
        "../auth/login.html";

      return;
    }

    currentUser = user;

    rideId =
      sessionStorage.getItem(
        "goBikeActiveRideId"
      );

    if (!rideId) {

      showError(
        "Active booking was not found."
      );

      return;
    }

    startRideListener();

  });

}


/* =========================================================
   REALTIME RIDE LISTENER
========================================================= */

function startRideListener() {

  const rideRef =
    doc(
      db,
      "rides",
      rideId
    );


  unsubscribeRide =
    onSnapshot(
      rideRef,
      (snapshot) => {

        if (!snapshot.exists()) {

          showError(
            "This booking no longer exists."
          );

          return;
        }


        const ride =
          snapshot.data();


        /*
         * Security check:
         * customer can only monitor own ride.
         */

        if (
          ride.customerId !==
          currentUser.uid
        ) {

          showError(
            "You do not have access to this booking."
          );

          stopRideListener();

          return;
        }


        updateRideScreen(
          ride
        );


        handleRideStatus(
          ride
        );

      },
      (error) => {

        console.error(
          "[GO BIKE SEARCHING]",
          error
        );

        showError(
          "Unable to update ride status. Please try again."
        );

      }
    );

}


/* =========================================================
   UPDATE SCREEN
========================================================= */

function updateRideScreen(
  ride
) {

  if (ride.pickup) {

    updateElement(
      "pickupAddress",
      formatLocation(
        ride.pickup
      )
    );

  }


  if (ride.drop) {

    updateElement(
      "dropAddress",
      formatLocation(
        ride.drop
      )
    );

  }


  if (
    typeof ride.estimatedFare ===
    "number"
  ) {

    updateElement(
      "fareValue",
      `₹${Math.round(
        ride.estimatedFare
      )}`
    );

  }


  initializeMap(
    ride
  );

}


/* =========================================================
   RIDE STATUS
========================================================= */

function handleRideStatus(
  ride
) {

  switch (ride.status) {

    case "searching":

      setSearchingText(
        "Finding your rider..."
      );

      break;


    case "requested":

      setSearchingText(
        "Looking for a nearby rider..."
      );

      break;


    case "accepted":

    case "driver_arriving":

    case "driver_arrived":

      stopRideListener();

      window.location.href =
        "ride-status.html";

      break;


    case "otp_verified":

    case "in_progress":

      stopRideListener();

      window.location.href =
        "ride-status.html";

      break;


    case "completed":

      stopRideListener();

      window.location.href =
        "trip.html";

      break;


    case "customer_cancelled":

    case "driver_cancelled":

      showError(
        "This booking has been cancelled."
      );

      disableCancelButton();

      break;


    default:

      setSearchingText(
        "Updating your ride..."
      );

  }

}


/* =========================================================
   MAP
========================================================= */

function initializeMap(
  ride
) {

  if (
    !ride.pickup ||
    !ride.drop
  ) {
    return;
  }


  const pickupLat =
    Number(
      ride.pickup.latitude
    );

  const pickupLng =
    Number(
      ride.pickup.longitude
    );

  const dropLat =
    Number(
      ride.drop.latitude
    );

  const dropLng =
    Number(
      ride.drop.longitude
    );


  if (
    !Number.isFinite(pickupLat) ||
    !Number.isFinite(pickupLng) ||
    !Number.isFinite(dropLat) ||
    !Number.isFinite(dropLng)
  ) {

    return;

  }


  if (!map) {

    map =
      L.map(
        "searchingMap",
        {
          zoomControl: true
        }
      );


    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          "&copy; OpenStreetMap contributors"
      }
    ).addTo(map);

  }


  if (!pickupMarker) {

    pickupMarker =
      L.marker(
        [
          pickupLat,
          pickupLng
        ]
      ).addTo(map);

  } else {

    pickupMarker.setLatLng(
      [
        pickupLat,
        pickupLng
      ]
    );

  }


  if (!dropMarker) {

    dropMarker =
      L.marker(
        [
          dropLat,
          dropLng
        ]
      ).addTo(map);

  } else {

    dropMarker.setLatLng(
      [
        dropLat,
        dropLng
      ]
    );

  }


  if (routeLine) {

    routeLine.remove();

  }


  routeLine =
    L.polyline(
      [
        [
          pickupLat,
          pickupLng
        ],
        [
          dropLat,
          dropLng
        ]
      ],
      {
        color: "#FFD600",
        weight: 4,
        opacity: .8,
        dashArray: "8 8"
      }
    ).addTo(map);


  const bounds =
    L.latLngBounds(
      [
        pickupLat,
        pickupLng
      ],
      [
        dropLat,
        dropLng
      ]
    );


  map.fitBounds(
    bounds,
    {
      padding: [
        40,
        40
      ]
    }
  );

}


/* =========================================================
   CANCEL BOOKING
========================================================= */

function initializeCancelButton() {

  const button =
    document.getElementById(
      "cancelRideButton"
    );


  if (!button) {
    return;
  }


  button.addEventListener(
    "click",
    cancelBooking
  );

}


async function cancelBooking() {

  if (
    !currentUser ||
    !rideId
  ) {
    return;
  }


  const confirmed =
    window.confirm(
      "Are you sure you want to cancel this parcel booking?"
    );


  if (!confirmed) {
    return;
  }


  const button =
    document.getElementById(
      "cancelRideButton"
    );


  if (button) {

    button.disabled = true;

    button.textContent =
      "CANCELLING...";

  }


  try {

    const rideRef =
      doc(
        db,
        "rides",
        rideId
      );


    await updateDoc(
      rideRef,
      {
        status:
          "customer_cancelled",

        cancellationReason:
          "Customer cancelled",

        cancelledAt:
          serverTimestamp()
      }
    );


    sessionStorage.removeItem(
      "goBikeActiveRideId"
    );


    window.location.href =
      "home.html";


  } catch (error) {

    console.error(
      "[GO BIKE CANCEL ERROR]",
      error
    );


    showError(
      "Unable to cancel booking. Please try again."
    );


    if (button) {

      button.disabled = false;

      button.textContent =
        "CANCEL BOOKING";

    }

  }

}


/* =========================================================
   HELPERS
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


function setSearchingText(
  text
) {

  const title =
    document.querySelector(
      ".searching-title h1"
    );


  if (!title) {
    return;
  }


  title.innerHTML =
    `${text}<span class="dots">...</span>`;

}


function showError(
  message
) {

  const element =
    document.getElementById(
      "searchError"
    );


  if (element) {

    element.textContent =
      message;

  }

}


function disableCancelButton() {

  const button =
    document.getElementById(
      "cancelRideButton"
    );


  if (button) {

    button.disabled = true;

  }

}


function stopRideListener() {

  if (
    typeof unsubscribeRide ===
    "function"
  ) {

    unsubscribeRide();

    unsubscribeRide =
      null;

  }

}


window.addEventListener(
  "beforeunload",
  stopRideListener
);
