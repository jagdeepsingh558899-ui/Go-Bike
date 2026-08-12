# GO BIKE — DATABASE ARCHITECTURE

## 1. PURPOSE

This document defines the canonical database architecture for the
Go Bike ride-hailing platform.

The database architecture must support:

- Customers
- Drivers
- Admins
- Authentication
- Driver approval
- Driver availability
- Live driver locations
- Ride requests
- Active rides
- Ride state transitions
- OTP verification
- Fare calculation
- Commission
- Payments
- Wallets
- Transactions
- Ratings
- Notifications
- Chat
- Support
- Coupons
- Offers
- System settings

The architecture is designed for production use and must prioritize:

- Security
- Consistency
- Realtime synchronization
- Atomic operations
- Data ownership
- Auditability
- Scalability
- Minimal unnecessary writes

---

# 2. DATABASE SERVICES

Go Bike uses the following Firebase services:

```text
Firebase Authentication
Cloud Firestore
Firebase Realtime Database
Firebase Storage
Cloud Functions
Firebase Cloud Messaging
