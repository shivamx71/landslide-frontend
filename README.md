# 🏔️ Warning and Landslide Monitoring System (WLMS)

A **frontend-only, GIS-based disaster monitoring and early-warning dashboard** for tracking landslide risk across hilly and disaster-prone regions. Built entirely with **HTML5, CSS3, and Vanilla JavaScript** — no backend, database, or server required.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Frontend Only](https://img.shields.io/badge/backend-none-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## 📖 Overview

WLMS simulates a real-world early-warning platform used by disaster management authorities. It monitors environmental risk indicators, visualizes hazard zones on an interactive GIS map, generates automated alerts, and supports field-level incident reporting — all running entirely in the browser using **LocalStorage** for data persistence.

---

## ✨ Features

- 🔐 **Login / Register** — demo authentication system
- 📊 **Command Dashboard** — animated risk gauge, live environmental stats, regional overview
- 🗺️ **GIS Risk Map** — interactive Leaflet.js + OpenStreetMap map with toggleable layers (risk zones, monitoring locations, historical landslides, field reports, roads, emergency centers)
- 🧮 **Risk Analysis Engine** — simulated scoring model (rainfall, soil moisture, slope, elevation, historical data → risk score, severity, confidence)
- 🚨 **Automated Alerts** — auto-generated warnings when risk crosses HIGH/CRITICAL thresholds
- 📝 **Field Reporting** — geolocation capture, photo upload/preview, instant map integration
- 🛣️ **Road Monitoring** — real-time-style connectivity status (Open / At Risk / Blocked)
- 🚑 **Emergency Priority** — locations ranked by combined risk, road status, and alert volume
- 📈 **Historical Landslides** — year-wise, severity-wise, and location-wise trend charts
- ☁️ **Weather** — simulated environmental readouts
- 🛡️ **Safety Information** — guidance content and emergency contacts
- ⚙️ **Settings** — theme, language, and notification preferences

---

# 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 |
| Logic | Vanilla JavaScript (ES6+) |
| Mapping | Leaflet.js + OpenStreetMap |
| Data Storage | Browser LocalStorage |

> No frameworks, no backend, no database — 100% frontend.

---

## 📂 Project Structure
