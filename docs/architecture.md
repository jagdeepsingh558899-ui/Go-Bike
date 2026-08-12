# GO BIKE — SYSTEM ARCHITECTURE

## 1. DOCUMENT PURPOSE

This document defines the canonical technical architecture of the
Go Bike ride-hailing platform.

Go Bike is designed as one connected system consisting of:

- Customer application
- Driver application
- Admin application
- Firebase authentication
- Firestore
- Realtime Database
- Firebase Storage
- Cloud Functions
- Leaflet/OpenStreetMap mapping
- PWA frontend

The architecture is designed to prevent disconnected pages,
duplicate implementations, insecure client-side logic and
inconsistent ride states.

This document is the technical source of truth for system
architecture.

---

# 2. HIGH-LEVEL ARCHITECTURE

```text
                         GO BIKE
                            |
             +--------------+--------------+
             |              |              |
          CUSTOMER        DRIVER         ADMIN
             |              |              |
             +--------------+--------------+
                            |
                     AUTHENTICATION
                            |
                    Firebase Auth
                            |
             +--------------+--------------+
             |                             |
        Firestore                    Realtime Database
             |                             |
     Persistent Data               Live Realtime Data
             |                             |
             +--------------+--------------+
                            |
                     Cloud Functions
                            |
             +--------------+--------------+
             |              |              |
           Rides          Payments       Security
             |
       Fare / Commission
             |
      Notifications / OTP
