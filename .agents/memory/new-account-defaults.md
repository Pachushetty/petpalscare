---
name: New account defaults
description: Product expectation for empty state and avatar behavior on new PetPals customer accounts.
---

New customer accounts should start with no demo bookings, profile photo, phone, or location unless the user provides them. Users must be able to update provided details and remove optional details or photos. Keep sample records limited to the dedicated demo account, and preserve the existing customer-portal design when fixing these defaults.

**Why:** the user asked that new accounts not show prefilled bookings or automatically assigned profile details/photos, and that changes persist when updated or removed.

**How to apply:** when changing registration, profile persistence, bookings, or profile rendering, ensure optional data stays empty until supplied and can be cleared, while demo-account examples continue to work.
