# 📱 Prayer Times & Qibla Finder App — User Flow (No Auth, No Backend)

## 🌟 Overview

A minimal app that displays prayer times based on the user's location and provides a Qibla direction finder. No user login or backend required. All data is fetched from a public API using the device’s location.

---

## 🚀 App Entry Flow

### 1️⃣ App Launch

- [ ] Splash screen displayed briefly while loading assets and checking permissions.
- [ ] Navigate to the Home Screen.

---

## 🗺️ Location Permission Flow

### 2️⃣ Request Location Permission

- [ ] Prompt user with a system dialog to allow location access.
  - If permission **granted**, proceed to fetch user’s current latitude and longitude.
  - If permission **denied**, show an error screen or modal explaining that location is needed for accurate prayer times and Qibla direction.
- [ ] Save the permission status locally (e.g., using AsyncStorage).

---

## 🏠 Home Screen (Prayer Times)

### 3️⃣ Display Daily Prayer Times

- [ ] Fetch prayer times from a public API (e.g., Aladhan) using the user's coordinates.
- [ ] Display today’s prayer times in a list:
  - Fajr
  - Sunrise
  - Dhuhr
  - Asr
  - Maghrib
  - Isha
- [ ] Show Hijri date (optional).
- [ ] Allow manual refresh of times (pull-to-refresh).

---

## 🧭 Qibla Finder Screen

### 4️⃣ Display Qibla Direction

- [ ] Access the device compass and orientation data using `react-native-sensors`.
- [ ] Calculate Qibla direction based on latitude/longitude.
- [ ] Display a dynamic compass pointing towards the Kaaba.
- [ ] Optional: show degrees offset.

---

## ⚙️ Settings Screen (Optional)

### 5️⃣ User Preferences

- [ ] Calculation Method (e.g., MWL, ISNA)
- [ ] Time Format (12h/24h)
- [ ] Notifications toggle (future expansion)
- [ ] Language selection (future expansion)

---

## 📱 Navigation Flow

- Splash Screen → Home Screen (Prayer Times)
- Home Screen → Qibla Finder (Tab or Button)
- Home Screen → Settings (Tab or Button)

---

## 📝 Notes

- No backend or user authentication needed.
- Location is only used on the device for fetching prayer times and calculating Qibla.
- All preferences are stored locally (AsyncStorage).
- Focus on simplicity, speed, and offline-friendly features.

---

## 🎯 MVP Scope

✅ Prayer times based on location  
✅ Qibla compass  
✅ Local storage for preferences  
✅ Smooth and minimal UI

---

Let me know if you'd like me to expand this flow into wireframes or technical tasks! 🚀
