/* =========================================================
   GO BIKE — CUSTOMER MAP
   Pickup / Drop selection using Leaflet + OpenStreetMap
   ========================================================= */

"use strict";


let customerMap = null;

let pickupMarker = null;
let dropMarker = null;

let pickupLocation = null;
let dropLocation = null;

let mapSelectionMode = "pickup";

let routeLine = null;


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializeCustomerMap();

  initializeMapControls();

});


/* =========================================================
   MAP INITIALIZATION
   ========================================================= */

function initializeCustomerMap() {

  const mapElement =
    document.getElementById("customerMap");

  if (!mapElement) {
    return;
  }

  if (typeof L === "undefined") {

    console.error(
      "[GO BIKE] Leaflet is not loaded."
    );

    return;
  }


  /*
   * Default India center.
   * Actual customer location will replace this
   * when GPS permission is granted.
   */

  customerMap = L.map(
    mapElement,
    {
      zoomControl: true,
      attributionControl: true
    }
  ).setView(
    [20.5937, 78.9629],
    5
  );


  /* OpenStreetMap */

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,

      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
  ).addTo(customerMap);


  /*
   * Map click:
   *
   * First click = Pickup
   * Second click = Drop
   */

  customerMap.on(
    "click",
    handleMapClick
  );


  /*
   * Try to get customer's current location.
   */

  locateCustomer();


  /*
   * Leaflet sometimes needs resize
   * after the mobile layout appears.
   */

  setTimeout(() => {

    if (customerMap) {
      customerMap.invalidateSize();
    }

  }, 300);

}


/* =========================================================
   MAP CLICK
   ========================================================= */

function handleMapClick(event) {

  const latitude =
    event.latlng.lat;

  const longitude =
    event.latlng.lng;


  if (mapSelectionMode === "pickup") {

    setPickupLocation(
      latitude,
      longitude,
      true
    );

    mapSelectionMode = "drop";

    updateButtonText();

    return;
  }


  if (mapSelectionMode === "drop") {

    setDropLocation(
      latitude,
      longitude,
      true
    );

    mapSelectionMode = "pickup";

    updateButtonText();

    calculateFare();

  }

}


/* =========================================================
   PICKUP
   ========================================================= */

function setPickupLocation(
  latitude,
  longitude,
  moveMap
) {

  pickupLocation = {
    latitude,
    longitude
  };


  if (pickupMarker) {

    pickupMarker.setLatLng([
      latitude,
      longitude
    ]);

  } else {

    pickupMarker =
      L.marker(
        [
          latitude,
          longitude
        ],
        {
          title: "Pickup"
        }
      )
      .addTo(customerMap)
      .bindPopup("Pickup Location");

  }


  pickupMarker.openPopup();


  setInputValue(
    "pickupInput",
    formatCoordinates(
      latitude,
      longitude
    )
  );


  if (moveMap) {

    customerMap.setView(
      [
        latitude,
        longitude
      ],
      16,
      {
        animate: true
      }
    );

  }


  reverseGeocode(
    latitude,
    longitude,
    "pickupInput"
  );

}


/* =========================================================
   DROP
   ========================================================= */

function setDropLocation(
  latitude,
  longitude,
  moveMap
) {

  dropLocation = {
    latitude,
    longitude
  };


  if (dropMarker) {

    dropMarker.setLatLng([
      latitude,
      longitude
    ]);

  } else {

    dropMarker =
      L.marker(
        [
          latitude,
          longitude
        ],
        {
          title: "Drop"
        }
      )
      .addTo(customerMap)
      .bindPopup("Drop Location");

  }


  dropMarker.openPopup();


  setInputValue(
    "dropInput",
    formatCoordinates(
      latitude,
      longitude
    )
  );


  if (moveMap) {

    customerMap.setView(
      [
        latitude,
        longitude
      ],
      15,
      {
        animate: true
      }
    );

  }


  reverseGeocode(
    latitude,
    longitude,
    "dropInput"
  );

}


/* =========================================================
   CURRENT LOCATION
   ========================================================= */

function locateCustomer() {

  if (!navigator.geolocation) {

    console.warn(
      "[GO BIKE] Geolocation is not supported."
    );

    return;
  }


  navigator.geolocation.getCurrentPosition(

    (position) => {

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;


      /*
       * Only use current location as pickup
       * if pickup has not already been selected.
       */

      if (!pickupLocation) {

        setPickupLocation(
          latitude,
          longitude,
          false
        );

        mapSelectionMode = "drop";

        updateButtonText();

      }


      customerMap.setView(
        [
          latitude,
          longitude
        ],
        16,
        {
          animate: true
        }
      );

    },

    (error) => {

      console.warn(
        "[GO BIKE] Location unavailable:",
        error.message
      );

    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    }

  );

}


/* =========================================================
   CURRENT LOCATION BUTTON
   ========================================================= */

function initializeMapControls() {

  const locationButton =
    document.getElementById(
      "currentLocationButton"
    );


  if (locationButton) {

    locationButton.addEventListener(
      "click",
      () => {

        locateCustomer();

      }
    );

  }


  const pickupInput =
    document.getElementById(
      "pickupInput"
    );

  const dropInput =
    document.getElementById(
      "dropInput"
    );


  if (pickupInput) {

    pickupInput.addEventListener(
      "focus",
      () => {

        mapSelectionMode = "pickup";

        updateButtonText();

      }
    );

  }


  if (dropInput) {

    dropInput.addEventListener(
      "focus",
      () => {

        mapSelectionMode = "drop";

        updateButtonText();

      }
    );

  }


  const bookButton =
    document.getElementById(
      "bookRideButton"
    );


  if (bookButton) {

    bookButton.addEventListener(
      "click",
      handleBookingClick
    );

  }

}


/* =========================================================
   REVERSE GEOCODING
   ========================================================= */

async function reverseGeocode(
  latitude,
  longitude,
  inputId
) {

  const input =
    document.getElementById(inputId);

  if (!input) {
    return;
  }


  try {

    const url =
      "https://nominatim.openstreetmap.org/reverse" +
      `?format=jsonv2&lat=${encodeURIComponent(latitude)}` +
      `&lon=${encodeURIComponent(longitude)}`;


    const response =
      await fetch(url, {
        headers: {
          "Accept": "application/json"
        }
      });


    if (!response.ok) {
      throw new Error(
        "Geocoding request failed."
      );
    }


    const data =
      await response.json();


    if (data.display_name) {

      input.value =
        data.display_name;

    }

  } catch (error) {

    console.warn(
      "[GO BIKE] Reverse geocoding failed:",
      error
    );

  }

}


/* =========================================================
   FARE CALCULATION
   ========================================================= */

function calculateFare() {

  if (
    !pickupLocation ||
    !dropLocation
  ) {
    return;
  }


  const distanceKm =
    calculateDistance(
      pickupLocation.latitude,
      pickupLocation.longitude,
      dropLocation.latitude,
      dropLocation.longitude
    );


  /*
   * TEMPORARY DISPLAY CALCULATION ONLY.
   *
   * IMPORTANT:
   * This is NOT the final booking fare.
   *
   * The real fare will later be calculated
   * server-side using Firebase/Admin settings.
   */

  const baseFare = 30;

  const perKm = 10;

  const estimatedFare =
    Math.max(
      baseFare,
      baseFare +
      distanceKm * perKm
    );


  const fareElement =
    document.querySelector(
      "#farePreview strong"
    );


  if (fareElement) {

    fareElement.textContent =
      `₹${Math.round(estimatedFare)}`;

  }


  updateBookButton();


  drawRoutePreview();

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

  const dLat =
    toRadians(lat2 - lat1);

  const dLon =
    toRadians(lon2 - lon1);


  const a =
    Math.sin(dLat / 2) *
    Math.sin(dLat / 2) +

    Math.cos(
      toRadians(lat1)
    ) *

    Math.cos(
      toRadians(lat2)
    ) *

    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);


  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );


  return earthRadius * c;

}


function toRadians(degrees) {

  return degrees *
    Math.PI /
    180;

}


/* =========================================================
   ROUTE PREVIEW
   ========================================================= */

async function drawRoutePreview() {

  if (
    !pickupLocation ||
    !dropLocation ||
    !customerMap
  ) {
    return;
  }


  try {

    const coordinates =
      `${pickupLocation.longitude},${pickupLocation.latitude};` +
      `${dropLocation.longitude},${dropLocation.latitude}`;


    const url =
      `https://router.project-osrm.org/route/v1/driving/${coordinates}` +
      `?overview=full&geometries=geojson`;


    const response =
      await fetch(url);


    if (!response.ok) {
      throw new Error(
        "Routing service unavailable."
      );
    }


    const data =
      await response.json();


    if (
      data.code !== "Ok" ||
      !data.routes ||
      !data.routes.length
    ) {

      return;

    }


    const route =
      data.routes[0];


    const routeCoordinates =
      route.geometry.coordinates.map(
        (point) => [
          point[1],
          point[0]
        ]
      );


    if (routeLine) {

      routeLine.remove();

    }


    routeLine =
      L.polyline(
        routeCoordinates,
        {
          color: "#FFD600",
          weight: 5,
          opacity: 0.85
        }
      ).addTo(customerMap);


    customerMap.fitBounds(
      routeLine.getBounds(),
      {
        padding: [40, 40]
      }
    );


    /*
     * Show route distance from routing service.
     */

    const routeDistanceKm =
      route.distance / 1000;


    const fareElement =
      document.querySelector(
        "#farePreview strong"
      );


    if (fareElement) {

      const fare =
        Math.max(
          30,
          30 +
          routeDistanceKm * 10
        );

      fareElement.textContent =
        `₹${Math.round(fare)}`;

    }


  } catch (error) {

    console.warn(
      "[GO BIKE] Route calculation failed:",
      error
    );

  }

}


/* =========================================================
   BOOKING BUTTON
   ========================================================= */

function updateBookButton() {

  const button =
    document.getElementById(
      "bookRideButton"
    );


  if (!button) {
    return;
  }


  if (
    pickupLocation &&
    dropLocation
  ) {

    button.disabled = false;

    button.textContent =
      "CONTINUE BOOKING";

  } else {

    button.disabled = true;

    button.textContent =
      "SELECT PICKUP & DROP";

  }

}


function updateButtonText() {

  const button =
    document.getElementById(
      "bookRideButton"
    );


  if (
    pickupLocation &&
    dropLocation
  ) {

    updateBookButton();

    return;

  }


  if (mapSelectionMode === "pickup") {

    if (button) {

      button.textContent =
        "SELECT PICKUP";

    }

  } else {

    if (button) {

      button.textContent =
        "SELECT DROP";

    }

  }

}


/* =========================================================
   BOOKING CLICK
   ========================================================= */

function handleBookingClick() {

  if (
    !pickupLocation ||
    !dropLocation
  ) {

    return;

  }


  /*
   * Save only temporary booking information.
   *
   * The real ride document will be created
   * after Firebase authentication and secure
   * server-side fare calculation are connected.
   */

  const bookingData = {

    serviceType: "bike",

    pickup: pickupLocation,

    drop: dropLocation,

    createdAt:
      new Date().toISOString()

  };


  sessionStorage.setItem(
    "goBikeBooking",
    JSON.stringify(
      bookingData
    )
  );


  /*
   * Next screen will be the booking confirmation
   * page.
   */

  window.location.href =
    "booking.html";

}


/* =========================================================
   HELPERS
   ========================================================= */

function setInputValue(
  inputId,
  value
) {

  const input =
    document.getElementById(inputId);

  if (input) {

    input.value = value;

  }

}


function formatCoordinates(
  latitude,
  longitude
) {

  return (
    `${latitude.toFixed(5)}, ` +
    `${longitude.toFixed(5)}`
  );

    }
