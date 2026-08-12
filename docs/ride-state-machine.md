# GO BIKE — RIDE STATE MACHINE

## 1. PURPOSE

This document defines the canonical ride lifecycle for Go Bike.

The ride state machine controls:

- Customer booking
- Driver search
- Driver acceptance
- Driver arrival
- OTP verification
- Ride start
- Live ride
- Ride completion
- Customer cancellation
- Driver cancellation
- Ride expiration
- Backend synchronization
- Race-condition protection
- Customer/driver UI synchronization

This document is the authoritative reference for all ride-related
frontend, backend, Firestore, Realtime Database and Cloud Function
implementations.

---

# 2. CORE PRINCIPLE

Go Bike is one connected ride-hailing system.

Customer and driver must NEVER maintain independent authoritative
ride states.

There is exactly one canonical persistent ride state:

```text
rides/{rideId}.status
