# Restaurant Attendance - GitHub Pages Version v8

This version is made for GitHub Pages.

## Important

GitHub Pages can publish this app because it is HTML, CSS, and JavaScript only.
But GitHub Pages does not run PHP/Python or store a database by itself.

So the app has two modes:

1. Local Demo Mode
   - Works on one browser/device only.
   - Good for testing UI.
   - If you add an employee in Admin on one browser, that employee will not appear on another phone/browser.

2. Firebase Online Mode
   - Needed for real use.
   - Admin, restaurant laptop kiosk, and employee phones share the same online database.
   - Employee added by Admin can login from another phone.

## Default test accounts

Admin:
- Email: admin@restaurant.local
- Password: admin123

Employee:
- Email: juan@restaurant.local
- Password: employee123

Kiosk code:
- RESTO123

## Main pages

- index.html
- login.html
- admin.html
- employee.html
- kiosk-login.html
- kiosk.html

## How to publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload all files from this folder.
3. Go to repository Settings.
4. Go to Pages.
5. Under Build and deployment, choose Deploy from a branch.
6. Select branch: main.
7. Select folder: /root.
8. Save.
9. Wait 1 to 3 minutes.
10. Open the GitHub Pages link.

## To make it work across devices

Create a Firebase project, enable Firestore Database, then paste the Firebase Web App config into:

assets/config.js

Leave the HTML files as-is.

## Why new employee may show “Account not found”

If the app is still in Local Demo Mode, every browser has its own local database.
That means an employee added on the admin laptop will not exist on an Android phone.

To fix that, use Firebase Online Mode.
