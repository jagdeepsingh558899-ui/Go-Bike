/* ============================================================
   GO BIKE
   AUTHENTICATION ENGINE
   File: js/auth.js

   RESPONSIBILITIES
   ------------------------------------------------------------
   - Email registration
   - Email login
   - Google authentication
   - Phone OTP
   - Firestore user profiles
   - Customer / Driver roles
   - Driver approval state
   - Auth state listener
   - Session handling
   - Logout
   - Password reset
   - Profile updates
   - Route redirects
   - Compatibility API for login/register pages

   FIREBASE SOURCE
   ------------------------------------------------------------
   firebase/firebase-config.js

   IMPORTANT
   ------------------------------------------------------------
   This file does NOT initialize Firebase.
   It uses window.GoBikeFirebase only.
============================================================ */

(function () {

    "use strict";


    /* =========================================================
       GLOBAL NAMESPACE
    ========================================================= */

    const GoBikeAuth = {};


    /* =========================================================
       CONSTANTS
    ========================================================= */

    const STORAGE_KEYS = {

        ROLE:
            "goBikeRole",

        USER:
            "goBikeUser",

        AUTH_STATE:
            "goBikeAuthState"

    };


    const ROLES = {

        CUSTOMER:
            "customer",

        DRIVER:
            "driver",

        ADMIN:
            "admin"

    };


    const DRIVER_STATUS = {

        PENDING:
            "pending",

        APPROVED:
            "approved",

        REJECTED:
            "rejected",

        SUSPENDED:
            "suspended"

    };


    /* =========================================================
       FIREBASE GETTERS
    ========================================================= */

    function getFirebase() {

        if (
            !window.GoBikeFirebase ||
            !window.GoBikeFirebase.ready
        ) {

            throw new Error(
                "Go Bike Firebase is not ready."
            );

        }

        return window.GoBikeFirebase;

    }


    function getAuth() {

        const firebaseInstance =
            getFirebase();

        if (
            !firebaseInstance.auth
        ) {

            throw new Error(
                "Firebase Authentication is unavailable."
            );

        }

        return firebaseInstance.auth;

    }


    function getDb() {

        const firebaseInstance =
            getFirebase();

        if (
            !firebaseInstance.db
        ) {

            throw new Error(
                "Cloud Firestore is unavailable."
            );

        }

        return firebaseInstance.db;

    }


    function getStorage() {

        const firebaseInstance =
            getFirebase();

        if (
            !firebaseInstance.storage
        ) {

            throw new Error(
                "Firebase Storage is unavailable."
            );

        }

        return firebaseInstance.storage;

    }


    /* =========================================================
       LOCAL STORAGE HELPERS
    ========================================================= */

    function safeSet(
        key,
        value
    ) {

        try {

            localStorage.setItem(
                key,
                typeof value === "string"
                    ? value
                    : JSON.stringify(value)
            );

        } catch (error) {

            console.warn(
                "[GoBikeAuth] localStorage write failed.",
                error
            );

        }

    }


    function safeGet(
        key
    ) {

        try {

            return localStorage.getItem(
                key
            );

        } catch (error) {

            return null;

        }

    }


    function safeRemove(
        key
    ) {

        try {

            localStorage.removeItem(
                key
            );

        } catch (error) {

            // Ignore storage failures.

        }

    }


    function cacheRole(
        role
    ) {

        if (
            role
        ) {

            safeSet(
                STORAGE_KEYS.ROLE,
                role
            );

        }

    }


    function getCachedRole() {

        return safeGet(
            STORAGE_KEYS.ROLE
        );

    }


    /* =========================================================
       ERROR NORMALIZATION
    ========================================================= */

    function normalizeError(
        error
    ) {

        if (!error) {

            return {
                code:
                    "unknown",
                message:
                    "Something went wrong."
            };

        }


        const code =
            error.code ||
            "unknown";


        const firebaseMessages = {

            "auth/email-already-in-use":
                "This email is already registered.",

            "auth/invalid-email":
                "Please enter a valid email address.",

            "auth/weak-password":
                "Password is too weak.",

            "auth/user-not-found":
                "No account was found with these details.",

            "auth/wrong-password":
                "Incorrect email or password.",

            "auth/invalid-credential":
                "Incorrect email or password.",

            "auth/user-disabled":
                "This account has been disabled.",

            "auth/too-many-requests":
                "Too many attempts. Please try again later.",

            "auth/network-request-failed":
                "Network error. Please check your internet connection.",

            "auth/popup-closed-by-user":
                "Google sign-in was cancelled.",

            "auth/cancelled-popup-request":
                "The sign-in request was cancelled.",

            "auth/popup-blocked":
                "Your browser blocked the Google sign-in window.",

            "auth/operation-not-allowed":
                "This sign-in method is not enabled in Firebase.",

            "auth/invalid-verification-code":
                "The OTP you entered is incorrect.",

            "auth/code-expired":
                "The OTP has expired. Please request a new OTP.",

            "auth/invalid-phone-number":
                "Please enter a valid mobile number.",

            "auth/quota-exceeded":
                "OTP service limit has been reached. Please try again later."

        };


        return {

            code:
                code,

            message:
                firebaseMessages[code] ||
                error.message ||
                "Authentication failed."

        };

    }


    /* =========================================================
       VALIDATION
    ========================================================= */

    function normalizeRole(
        role
    ) {

        role =
            String(
                role || ""
            )
            .trim()
            .toLowerCase();


        if (
            role === ROLES.DRIVER
        ) {

            return ROLES.DRIVER;

        }


        if (
            role === ROLES.ADMIN
        ) {

            return ROLES.ADMIN;

        }


        return ROLES.CUSTOMER;

    }


    function normalizePhone(
        phone
    ) {

        let value =
            String(
                phone || ""
            )
            .trim();


        value =
            value.replace(
                /[\s()-]/g,
                ""
            );


        if (
            /^\d{10}$/.test(value)
        ) {

            return "+91" + value;

        }


        if (
            /^91\d{10}$/.test(value)
        ) {

            return "+" + value;

        }


        if (
            /^\+91\d{10}$/.test(value)
        ) {

            return value;

        }


        return value;

    }


    function cleanText(
        value,
        fallback = ""
    ) {

        const text =
            String(
                value || ""
            )
            .trim();


        return text || fallback;

    }


    /* =========================================================
       PROFILE HELPERS
    ========================================================= */

    function getProfileRef(
        uid
    ) {

        return getDb()
            .collection("users")
            .doc(uid);

    }


    function getDriverRef(
        uid
    ) {

        return getDb()
            .collection("drivers")
            .doc(uid);

    }


    function getCustomerRef(
        uid
    ) {

        return getDb()
            .collection("customers")
            .doc(uid);

    }


    function buildBaseProfile(
        firebaseUser,
        data
    ) {

        const role =
            normalizeRole(
                data &&
                data.role
            );


        const firstName =
            cleanText(
                data &&
                data.firstName
            );


        const lastName =
            cleanText(
                data &&
                data.lastName
            );


        const displayName =
            cleanText(
                data &&
                data.displayName,
                (
                    firstName +
                    " " +
                    lastName
                ).trim() ||
                firebaseUser.displayName ||
                "Go Bike User"
            );


        return {

            uid:
                firebaseUser.uid,

            email:
                firebaseUser.email ||
                cleanText(
                    data &&
                    data.email
                ),

            phone:
                firebaseUser.phoneNumber ||
                cleanText(
                    data &&
                    data.phone
                ),

            firstName:
                firstName,

            lastName:
                lastName,

            displayName:
                displayName,

            photoURL:
                firebaseUser.photoURL ||
                null,

            role:
                role,

            status:
                role === ROLES.DRIVER
                    ? DRIVER_STATUS.PENDING
                    : "active",

            driverApproval:
                role === ROLES.DRIVER
                    ? DRIVER_STATUS.PENDING
                    : null,

            online:
                false,

            available:
                false,

            createdAt:
                firebase.firestore.FieldValue.serverTimestamp(),

            updatedAt:
                firebase.firestore.FieldValue.serverTimestamp(),

            lastLoginAt:
                firebase.firestore.FieldValue.serverTimestamp()

        };

    }


    /* =========================================================
       CREATE / UPDATE PROFILE
    ========================================================= */

    async function createOrUpdateProfile(
        firebaseUser,
        data = {},
        options = {}
    ) {

        if (
            !firebaseUser ||
            !firebaseUser.uid
        ) {

            throw new Error(
                "Invalid Firebase user."
            );

        }


        const db =
            getDb();


        const userRef =
            getProfileRef(
                firebaseUser.uid
            );


        const snapshot =
            await userRef.get();


        let existing =
            snapshot.exists
                ? snapshot.data()
                : null;


        let role =
            normalizeRole(
                data.role ||
                (
                    existing &&
                    existing.role
                ) ||
                getCachedRole() ||
                ROLES.CUSTOMER
            );


        /*
         * Never silently turn an existing driver into
         * a customer or vice versa.
         */

        if (
            existing &&
            existing.role
        ) {

            role =
                normalizeRole(
                    existing.role
                );

        }


        const base =
            buildBaseProfile(
                firebaseUser,
                {
                    ...data,
                    role
                }
            );


        const updateData = {

            ...base,

            role:
                role,

            updatedAt:
                firebase.firestore.FieldValue.serverTimestamp(),

            lastLoginAt:
                firebase.firestore.FieldValue.serverTimestamp()

        };


        /*
         * Preserve existing protected values.
         */

        if (
            existing
        ) {

            updateData.createdAt =
                existing.createdAt ||
                updateData.createdAt;


            updateData.status =
                existing.status ||
                updateData.status;


            updateData.driverApproval =
                existing.driverApproval ||
                updateData.driverApproval;


            updateData.online =
                Boolean(
                    existing.online
                );


            updateData.available =
                Boolean(
                    existing.available
                );

        }


        /*
         * For brand-new drivers, explicitly create
         * pending verification status.
         */

        if (
            role === ROLES.DRIVER &&
            !existing
        ) {

            updateData.status =
                DRIVER_STATUS.PENDING;

            updateData.driverApproval =
                DRIVER_STATUS.PENDING;

            updateData.online =
                false;

            updateData.available =
                false;

        }


        await userRef.set(
            updateData,
            {
                merge: true
            }
        );


        /*
         * Create role-specific profile.
         */

        if (
            role === ROLES.CUSTOMER
        ) {

            await getCustomerRef(
                firebaseUser.uid
            )
            .set(
                {
                    uid:
                        firebaseUser.uid,

                    email:
                        firebaseUser.email ||
                        updateData.email ||
                        "",

                    phone:
                        firebaseUser.phoneNumber ||
                        updateData.phone ||
                        "",

                    displayName:
                        updateData.displayName,

                    updatedAt:
                        firebase.firestore.FieldValue.serverTimestamp()

                },
                {
                    merge: true
                }
            );

        }


        if (
            role === ROLES.DRIVER
        ) {

            const driverData =
                data.driver ||
                {};


            const driverUpdate = {

                uid:
                    firebaseUser.uid,

                email:
                    firebaseUser.email ||
                    updateData.email ||
                    "",

                phone:
                    firebaseUser.phoneNumber ||
                    updateData.phone ||
                    "",

                displayName:
                    updateData.displayName,

                vehicleType:
                    driverData.vehicleType ||
                    existing &&
                    existing.vehicleType ||
                    null,

                vehicleNumber:
                    driverData.vehicleNumber ||
                    existing &&
                    existing.vehicleNumber ||
                    null,

                vehicleModel:
                    driverData.vehicleModel ||
                    existing &&
                    existing.vehicleModel ||
                    null,

                licenseNumber:
                    driverData.licenseNumber ||
                    existing &&
                    existing.licenseNumber ||
                    null,

                approvalStatus:
                    existing &&
                    existing.driverApproval
                        ? existing.driverApproval
                        : DRIVER_STATUS.PENDING,

                online:
                    false,

                available:
                    false,

                updatedAt:
                    firebase.firestore.FieldValue.serverTimestamp()

            };


            await getDriverRef(
                firebaseUser.uid
            )
            .set(
                driverUpdate,
                {
                    merge: true
                }
            );

        }


        cacheRole(
            role
        );


        const freshSnapshot =
            await userRef.get();


        return {

            ...freshSnapshot.data(),

            uid:
                firebaseUser.uid

        };

    }


    /* =========================================================
       EMAIL REGISTRATION
    ========================================================= */

    GoBikeAuth.register =
        async function (data = {}) {

            try {

                const auth =
                    getAuth();


                const email =
                    cleanText(
                        data.email
                    )
                    .toLowerCase();


                const password =
                    String(
                        data.password || ""
                    );


                if (
                    !email
                ) {

                    throw new Error(
                        "Email is required."
                    );

                }


                if (
                    password.length < 8
                ) {

                    throw new Error(
                        "Password must contain at least 8 characters."
                    );

                }


                const credential =
                    await auth
                        .createUserWithEmailAndPassword(
                            email,
                            password
                        );


                const firebaseUser =
                    credential.user;


                if (!firebaseUser) {

                    throw new Error(
                        "Account creation failed."
                    );

                }


                /*
                 * Update Firebase Auth display name.
                 */

                const displayName =
                    cleanText(
                        data.displayName,
                        (
                            cleanText(
                                data.firstName
                            ) +
                            " " +
                            cleanText(
                                data.lastName
                            )
                        ).trim()
                    );


                if (
                    displayName &&
                    firebaseUser.updateProfile
                ) {

                    await firebaseUser
                        .updateProfile({
                            displayName:
                                displayName
                        });

                }


                /*
                 * Create Firestore profile.
                 */

                const profile =
                    await createOrUpdateProfile(
                        firebaseUser,
                        data
                    );


                safeSet(
                    STORAGE_KEYS.USER,
                    {
                        uid:
                            firebaseUser.uid,

                        email:
                            firebaseUser.email,

                        displayName:
                            profile.displayName,

                        role:
                            profile.role

                    }
                );


                return {

                    success:
                        true,

                    user:
                        profile,

                    redirect:
                        getHomeRoute(
                            profile
                        )

                };

            } catch (error) {

                const normalized =
                    normalizeError(
                        error
                    );


                return {

                    success:
                        false,

                    code:
                        normalized.code,

                    message:
                        normalized.message

                };

            }

        };


    /* =========================================================
       EMAIL LOGIN
    ========================================================= */

    GoBikeAuth.login =
        async function (data = {}) {

            try {

                const auth =
                    getAuth();


                const email =
                    cleanText(
                        data.email
                    )
                    .toLowerCase();


                const password =
                    String(
                        data.password || ""
                    );


                if (
                    !email ||
                    !password
                ) {

                    throw new Error(
                        "Email and password are required."
                    );

                }


                const credential =
                    await auth
                        .signInWithEmailAndPassword(
                            email,
                            password
                        );


                const firebaseUser =
                    credential.user;


                if (!firebaseUser) {

                    throw new Error(
                        "Unable to sign in."
                    );

                }


                const profile =
                    await loadUserProfile(
                        firebaseUser
                    );


                if (!profile) {

                    /*
                     * Existing Firebase users from
                     * an older database can still be
                     * given a profile.
                     */

                    const created =
                        await createOrUpdateProfile(
                            firebaseUser,
                            {
                                role:
                                    data.role ||
                                    getCachedRole() ||
                                    ROLES.CUSTOMER
                            }
                        );


                    cacheRole(
                        created.role
                    );


                    return {

                        success:
                            true,

                        user:
                            created,

                        redirect:
                            getHomeRoute(
                                created
                            )

                    };

                }


                /*
                 * Respect the database role.
                 */

                cacheRole(
                    profile.role
                );


                return {

                    success:
                        true,

                    user:
                        profile,

                    redirect:
                        getHomeRoute(
                            profile
                        )

                };

            } catch (error) {

                const normalized =
                    normalizeError(
                        error
                    );


                return {

                    success:
                        false,

                    code:
                        normalized.code,

                    message:
                        normalized.message

                };

            }

        };


    /* =========================================================
       GOOGLE LOGIN / REGISTRATION
    ========================================================= */

    GoBikeAuth.loginWithGoogle =
        async function (options = {}) {

            try {

                const auth =
                    getAuth();


                const provider =
                    new firebase.auth.GoogleAuthProvider();


                provider.setCustomParameters({
                    prompt:
                        "select_account"
                });


                let credential;


                /*
                 * Popup first.
                 * Redirect fallback is used when
                 * popup is blocked.
                 */

                try {

                    credential =
                        await auth.signInWithPopup(
                            provider
                        );

                } catch (popupError) {

                    if (
                        popupError.code ===
                        "auth/popup-blocked"
                    ) {

                        await auth.signInWithRedirect(
                            provider
                        );


                        return {

                            success:
                                false,

                            pendingRedirect:
                                true,

                            message:
                                "Google sign-in is continuing."

                        };

                    }


                    throw popupError;

                }


                const firebaseUser =
                    credential.user;


                if (!firebaseUser) {

                    throw new Error(
                        "Google authentication failed."
                    );

                }


                const requestedRole =
                    normalizeRole(
                        options.role ||
                        getCachedRole() ||
                        ROLES.CUSTOMER
                    );


                const existing =
                    await loadUserProfile(
                        firebaseUser
                    );


                /*
                 * Existing account role wins.
                 */

                const role =
                    existing &&
                    existing.role
                        ? normalizeRole(
                            existing.role
                        )
                        : requestedRole;


                const profile =
                    await createOrUpdateProfile(
                        firebaseUser,
                        {
                            role:
                                role,

                            displayName:
                                firebaseUser.displayName ||
                                "",

                            email:
                                firebaseUser.email ||
                                "",

                            phone:
                                firebaseUser.phoneNumber ||
                                ""
                        }
                    );


                safeSet(
                    STORAGE_KEYS.USER,
                    {
                        uid:
                            profile.uid,

                        email:
                            profile.email,

                        displayName:
                            profile.displayName,

                        role:
                            profile.role

                    }
                );


                return {

                    success:
                        true,

                    user:
                        profile,

                    redirect:
                        getHomeRoute(
                            profile
                        )

                };

            } catch (error) {

                const normalized =
                    normalizeError(
                        error
                    );


                return {

                    success:
                        false,

                    code:
                        normalized.code,

                   
