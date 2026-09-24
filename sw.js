const CACHE_NAME = "my-money-v3";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./my-qr.png"
];


/* ===============================
   INSTALL
   =============================== */

self.addEventListener(
  "install",
  function (event) {

    event.waitUntil(

      caches
        .open(CACHE_NAME)
        .then(function (cache) {

          return cache.addAll(
            APP_FILES
          );

        })

    );

    self.skipWaiting();

  }
);


/* ===============================
   ACTIVATE
   =============================== */

self.addEventListener(
  "activate",
  function (event) {

    event.waitUntil(

      caches.keys()
        .then(function (cacheNames) {

          return Promise.all(

            cacheNames
              .filter(function (cacheName) {

                return (
                  cacheName !==
                  CACHE_NAME
                );

              })
              .map(function (cacheName) {

                return caches.delete(
                  cacheName
                );

              })

          );

        })

    );

    self.clients.claim();

  }
);


/* ===============================
   FETCH
   =============================== */

self.addEventListener(
  "fetch",
  function (event) {

    if (
      event.request.method !==
      "GET"
    ) {

      return;

    }


    event.respondWith(

      caches.match(
        event.request
      )
      .then(function (cachedResponse) {

        if (cachedResponse) {

          return cachedResponse;

        }


        return fetch(
          event.request
        )
        .then(function (networkResponse) {

          /*
             Save only successful
             same-origin responses.
          */

          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type ===
              "basic"
          ) {

            const responseClone =
              networkResponse.clone();


            caches.open(
              CACHE_NAME
            )
            .then(function (cache) {

              cache.put(
                event.request,
                responseClone
              );

            });

          }


          return networkResponse;

        })
        .catch(function () {

          return caches.match(
            "./index.html"
          );

        });

      })

    );

  }
);
