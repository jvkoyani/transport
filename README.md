# Transport Khata — Smart Transport ERP

A simple, focused web app to record transport trips with **route (From → To)**,
**truck details**, and **product details**. Built for transport companies to
track consignments quickly.

## Features

- **Create a trip** with:
  - **Route** — From (origin), To (destination), dispatch date
  - **Truck details** — truck number, type (Open Body / Container / Trailer /
    Tanker / Tipper / Refrigerated), capacity, driver name & phone, freight
  - **Product details** — add multiple products, each with name, quantity,
    unit and weight
- **Trip dashboard** — totals for trips, in-transit, delivered and freight
- **Status tracking** — mark each trip Scheduled → In Transit → Delivered
- **Search** trips by route, truck, driver or product
- **Auto-saved** — data is stored locally in your browser (localStorage)

## Tech stack

- React 18 + Vite
- No backend required — data persists in the browser

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

To build for production:

```bash
npm run build
npm run preview
```

## Project structure

```
index.html
src/
  main.jsx        # React entry
  App.jsx         # Dashboard, stats, search
  TripForm.jsx    # Create-trip form (route, truck, products)
  TripList.jsx    # Trip cards with product tables & status
  storage.js      # localStorage persistence
  styles.css      # Styling (Transport Khata theme)
public/
  truck.svg       # App icon
```

## Roadmap ideas

- Backend + database for multi-user access
- OTP login (as shown in the product mockup)
- POD (proof of delivery) uploads, customer ledgers, payments
- Export trips to PDF / Excel
