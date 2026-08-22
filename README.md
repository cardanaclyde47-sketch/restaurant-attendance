# Restaurant Attendance Demo

A responsive, front-end attendance prototype built for a student developer portfolio.

[View the GitHub Pages demo](https://cardanaclyde47-sketch.github.io/restaurant-attendance/)

## Safety-first demo

This repository is intentionally a **browser-only demo**:

- It does not connect to Firebase or another online database.
- It does not use real authentication or collect shared employee data.
- Demo employees, QR tokens, and attendance records stay in the current browser's `localStorage`.
- Visitors can reset their own demo data at any time.
- Do not enter real employee or personal information.

The included `FIREBASE_DISABLED_RULES.txt` file contains deny-all Firestore rules for any Firebase project that was previously used while testing.

## Features

- Admin and employee demo roles with no public passwords
- Add, deactivate, reactivate, and delete local demo employees
- Desktop table and mobile attendance-card views
- Time In and Time Out workflow
- Rotating, expiring QR kiosk
- Camera scanner with manual-link fallback
- Responsive layout for desktop and Android browsers
- Accessible labels, focus states, status messages, and confirmations

## Try the demo

1. Open the demo and choose **Open Admin Demo** or **Open Employee Demo**.
2. To test attendance, open the kiosk, choose Time In or Time Out from the employee demo, then scan or paste the current QR link.

Because there is no shared backend, data created in one browser does not appear in another browser or device.

## Run locally

From the project folder:

```bash
cd restaurant_attendance_github_pages_v8
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Camera access normally requires HTTPS or localhost.

## Project structure

```text
restaurant_attendance_github_pages_v8/
├── assets/
│   ├── app.js
│   ├── config.js
│   ├── data.js
│   └── styles.css
├── admin.html
├── employee.html
├── index.html
├── kiosk-login.html
├── kiosk.html
├── login.html
└── scan.html
```

## Production roadmap

A real restaurant deployment should replace the demo role buttons and browser storage with:

- Firebase Authentication or another trusted identity provider
- Server-enforced administrator and employee roles
- Deny-by-default database security rules
- Auditing, privacy controls, backups, and proper account recovery
- End-to-end tests for attendance and kiosk workflows

Do not turn this static demo into a production employee system by pasting database configuration into the client.
