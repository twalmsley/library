# Library Opening Times

A single-page web app that shows the library’s weekly opening hours, current open/closed status, and a countdown until the next open or close. It runs entirely in the browser (no server required).

## Features

- **Weekly schedule** – Opening hours for each day (local time).
- **Live status** – “Open” or “Closed” based on current time.
- **Countdown** – Time until the library next opens or closes, updating every minute.
- **Light / dark mode** – Follows system preference by default, with a manual toggle that is saved in `localStorage`.
- **Responsive** – Works on phones, tablets, and desktops.

## Opening hours (local time)

| Day       | Hours              |
|----------|--------------------|
| Monday   | 2:00pm – 6:00pm    |
| Tuesday  | Closed             |
| Wednesday| 10:00am – 2:00pm   |
| Thursday | Closed             |
| Friday   | 1:00pm – 5:00pm    |
| Saturday | 10:00am – 2:00pm   |
| Sunday   | 11:00am – 3:00pm   |

## How to run

1. **Option A – Open the file**  
   Open `index.html` in a modern browser (double-click or drag into the browser).

2. **Option B – Local server (recommended)**  
   From the project root:
   ```bash
   npx serve .
   ```
   Then open the URL shown (e.g. `http://localhost:3000`).

No build step or Node.js app code is required; the app is static HTML, CSS, and JavaScript.

## Project structure

- `index.html` – Page structure and script/style entry points.
- `styles.css` – Layout, typography, light/dark theme, responsive rules.
- `app.js` – Opening hours data, open/close logic, countdown, theme toggle.

## Browser support

Uses widely supported features: `Date`, CSS custom properties, `localStorage`, and `prefers-color-scheme`. Best experienced in a modern browser (e.g. recent Chrome, Firefox, Safari, Edge).
