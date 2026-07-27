# Transport Khata — Smart Transport ERP (Bilty Module)

A transport ERP modeled on the Pushpak Roadlines dashboard. It provides a full
**Bilty (transport receipt / lorry receipt)** workflow plus supporting master
data — parties, trucks and drivers.

## Features

### Bilty module (core)
- **Bilty list dashboard** — searchable table with Bilty Number, Date, Party
  Invoice, Lorry Hire, Vehicle, Route (From → To), Consignor, Consignee, Paid By
  and row actions (PDF / edit / delete). Month + type filters and a live count.
- **Create / Edit Bilty** — a three-section form matching the reference UI:
  - **Bilty Details** — bilty number (auto-incremented), date, From/To, truck
    (with quick +Add), shipment mode, vehicle size, driver (quick +Add), E-way
    bill no. & expiry, container no.
  - **Consignor & Consignee** — select or quick-add parties, plus "Paid By".
  - **Material Details** — add multiple items (material name, packing type,
    quantity, weight, invoice no./date, HSN code, value of goods, private mark),
    and insurance (Insured / Not Insured).
  - **Freight Details** — actual/charged weight, rate type, freight amount,
    CGST/SGST/IGST %, auto-computed tax, bilty amount, extra charges, auto
    **Final Bilty Payable**, payment type and GST paid-by. Hide toggle.

### Master data
- **Party** — consignor/consignee/paid-by directory (name, city, GSTIN, phone)
- **Truck** — vehicles (number, type, size, capacity, owner)
- **Driver** — drivers (name, phone, license)
- **Supplier** — supplier directory
- **Dashboard** — headline counts and total freight payable

Other modules (Tracking, Party Invoice, Lorry Hire, Finance, Account Manager,
Setup) are stubbed in the navigation as roadmap items.

Data is persisted in the browser (localStorage) and seeded with demo records on
first run, so all dropdowns and lists work immediately.

## Tech stack
- React 18 + Vite
- react-router-dom (hash routing)
- No backend required

## Getting started
```bash
npm install
npm run dev
```
Open the URL Vite prints (default http://localhost:5173).

Production build:
```bash
npm run build && npm run preview
```

## Project structure
```
src/
  main.jsx              # entry + router + seed
  App.jsx               # layout + routes
  db.js                 # localStorage data layer + demo seed
  components/
    Sidebar.jsx         # left navigation
    Modal.jsx           # reusable modal
    CrudPage.jsx        # generic master-data list + add/edit
  pages/
    Dashboard.jsx
    BiltyList.jsx       # bilty table
    BiltyForm.jsx       # 3-section create/edit bilty
    Parties.jsx  Trucks.jsx  Drivers.jsx  Suppliers.jsx
    Placeholder.jsx     # roadmap modules
```

## Roadmap
- PDF export of a bilty (LR print), real-time tracking
- Party Invoice & Lorry Hire billing, Finance ledgers
- Backend + database and OTP login for multi-user access
