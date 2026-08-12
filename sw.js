/* =========================================================
   GO BIKE — SERVICE WORKER
   ========================================================= */

"use strict";

const CACHE_NAME = "go-bike-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./css/responsive.css",
  "./js/app.js"
];


/* =========================================================
   INSTALL
   ========================================================= */

self.addEventListener("install", (event) => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then((cache) => {

        return cache.addAll(APP_SHELL);

      })
      .catch((error) => {

        console.warn(
          "[GO BIKE] Cache installation failed:",
          error
        );

      })

  );

  self.skipWaiting();

});


/* =========================================================
   ACTIVATE
   ========================================================= */

self.addEventListener("activate", (event) => {

  event.waitUntil(

    caches.keys()
      .then((cacheNames) => {

        return Promise.all(

          cacheNames
            .filter(
              (name) =>
                name !== CACHE_NAME
            )
            .map(
              (name) =>
                caches.delete(name)
            )

        );

      })

  );

  self.clients.claim();

});


/* =========================================================
   FETCH
   ========================================================= */

self.addEventListener("fetch", (event) => {

  const request = event.request;

  /*
   * Only handle GET requests.
   * POST/PUT/PATCH/DELETE requests must go
   * directly to Firebase/backend.
   */

  if (request.method !== "GET") {
    return;
  }

  /*
   * Do not cache Firebase/API requests.
   * Sensitive realtime data must always come
   * from the network.
   */

  const url = new URL(request.url);

  if (
    url.hostname.includes("firebase") ||
    url.hostname.includes("googleapis")
  ) {
    return;
  }


  event.respondWith(

    fetch(request)

      .then((response) => {

        /*
         * Cache successful static responses.
         */

        if (
          response &&
          response.status === 200 &&
          response.type === "basic"
        ) {

          const responseClone =
            response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {

              cache.put(
                request,
                responseClone
              );

            });

        }

        return response;

      })

      .catch(() => {

        /*
         * Network unavailable.
         * Try cached version.
         */

        return caches.match(request)
          .then((cachedResponse) => {

            if (cachedResponse) {
              return cachedResponse;
            }

            /*
             * If no cached page exists,
             * return cached home page.
             */

            return caches.match(
              "./index.html"
            );

          });

      })

  );

});
