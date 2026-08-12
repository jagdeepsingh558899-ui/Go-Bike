/* ============================================================
   GO BIKE
   FIREBASE CONFIGURATION
   File: firebase/firebase-config.js

   SINGLE SOURCE OF TRUTH

   Services:
   - Firebase Authentication
   - Cloud Firestore
   - Realtime Database
   - Firebase Storage

   IMPORTANT:
   1. Do NOT initialize Firebase anywhere else.
   2. Do NOT put Firebase config inside individual pages.
   3. js/auth.js will use window.GoBikeFirebase.
   4. Replace ONLY the configuration values below with the
      configuration from your Firebase project.
============================================================ */

(function () {

    "use strict";


    /* =========================================================
       PREVENT DOUBLE INITIALIZATION
    ========================================================= */

    if (window.GoBikeFirebase) {
        return;
    }


    /* =========================================================
       FIREBASE CONFIG
    ========================================================= */

    const firebaseConfig = {

        apiKey:
            "REPLACE_WITH_FIREBASE_API_KEY",

        authDomain:
            "REPLACE_WITH_FIREBASE_AUTH_DOMAIN",

        projectId:
            "REPLACE_WITH_FIREBASE_PROJECT_ID",

        storageBucket:
            "REPLACE_WITH_FIREBASE_STORAGE_BUCKET",

        messagingSenderId:
            "REPLACE_WITH_FIREBASE_MESSAGING_SENDER_ID",

        appId:
            "REPLACE_WITH_FIREBASE_APP_ID",

        databaseURL:
            "REPLACE_WITH_FIREBASE_DATABASE_URL"

    };


    /* =========================================================
       CONFIG VALIDATION
    ========================================================= */

    const requiredKeys = [
        "apiKey",
        "authDomain",
        "projectId",
        "storageBucket",
        "messagingSenderId",
        "appId"
    ];


    const missingKeys =
        requiredKeys.filter(function (key) {

            const value =
                firebaseConfig[key];

            return (
                !value ||
                value.indexOf(
                    "REPLACE_WITH_"
                ) === 0
            );

        });


    if (missingKeys.length > 0) {

        console.error(
            "[GoBike Firebase] Missing configuration:",
            missingKeys
        );


        window.GoBikeFirebase = {

            ready: false,

            configured: false,

            app: null,

            auth: null,

            db: null,

            realtimeDb: null,

            storage: null,

            config: firebaseConfig,

            error:
                "Firebase configuration is incomplete."

        };

        return;
    }


    /* =========================================================
       FIREBASE SDK CHECK
    ========================================================= */

    if (
        typeof firebase === "undefined"
    ) {

        console.error(
            "[GoBike Firebase] Firebase SDK not loaded."
        );


        window.GoBikeFirebase = {

            ready: false,

            configured: true,

            app: null,

            auth: null,

            db: null,

            realtimeDb: null,

            storage: null,

            config: firebaseConfig,

            error:
                "Firebase SDK is not available."

        };

        return;
    }


    /* =========================================================
       INITIALIZE
    ========================================================= */

    let app = null;

    let auth = null;

    let db = null;

    let realtimeDb = null;

    let storage = null;


    try {

        /*
         * Reuse an existing Go Bike Firebase app
         * if another compatible loader has already
         * initialized it.
         */

        if (
            firebase.apps &&
            firebase.apps.length > 0
        ) {

            app =
                firebase.apps[0];

        } else {

            app =
                firebase.initializeApp(
                    firebaseConfig
                );

        }


        /* =====================================================
           AUTHENTICATION
        ===================================================== */

        if (
            firebase.auth
        ) {

            auth =
                firebase.auth();

        }


        /* =====================================================
           CLOUD FIRESTORE
        ===================================================== */

        if (
            firebase.firestore
        ) {

            db =
                firebase.firestore();

        }


        /* =====================================================
           REALTIME DATABASE
        ===================================================== */

        if (
            firebase.database
        ) {

            realtimeDb =
                firebase.database();

        }


        /* =====================================================
           STORAGE
        ===================================================== */

        if (
            firebase.storage
        ) {

            storage =
                firebase.storage();

        }


        /* =====================================================
           GLOBAL GO BIKE FIREBASE OBJECT
        ===================================================== */

        window.GoBikeFirebase = {

            ready: true,

            configured: true,

            app: app,

            auth: auth,

            db: db,

            realtimeDb: realtimeDb,

            storage: storage,

            config: firebaseConfig,

            timestamp:
                Date.now(),

            version:
                "1.0.0"

        };


        console.log(
            "[GoBike Firebase] Initialized successfully."
        );


    } catch (error) {

        console.error(
            "[GoBike Firebase] Initialization failed:",
            error
        );


        window.GoBikeFirebase = {

            ready: false,

            configured: true,

            app: null,

            auth: null,

            db: null,

            realtimeDb: null,

            storage: null,

            config: firebaseConfig,

            error:
                error && error.message
                    ? error.message
                    : "Firebase initialization failed."

        };

    }


})();
