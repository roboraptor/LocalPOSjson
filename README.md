# 🧾 Local POS V2

[![Node.js CI Build](https://github.com/roboraptor/LocalPOSqlite/actions/workflows/node.js.yml/badge.svg)](https://github.com/roboraptor/LocalPOSqlite/actions/workflows/node.js.yml)

A complete, locally-hosted Point of Sale (POS) and cash register web application built with **Next.js 15 (App Router)** + **React 19**, using **SQLite** (`better-sqlite3`) for reliable data storage.
The project is designed for small businesses, cafes, pubs, or as an experimental local POS system.

---

## ✨ Features

### Point of Sale Interface
- Clean, intuitive, and responsive POS interface.
- Automatic grouping of items by categories.
- Easy addition of custom items on the fly (e.g., outside the main menu).
- **Tabs & Tables management**: Ability to park/save an open receipt to a specific customer's "Tab" (Na účet) or "Table" (Na stůl).
- **QR Code Payments**: Instantly generate SPAYD QR codes for seamless bank transfers directly in the POS view.

### Data & Management
- **Local SQLite Database**: All data (items, categories, receipts, settings) is stored locally. The database path is configured in `src/data/dbposition.json` (defaults to `data/pos.db`).
- **Dynamic Database Reconnection**: Change the database path in the UI, and the app seamlessly switches to the new DB without needing a restart.
- **Items & Categories Editor**: Manage your menu, assign React icons (with search and favorites), and organize items into custom categories using drag-and-drop.
- **Receipts History**: Overview of all closed receipts with filtering.
- **Exporting**: Generate exports of receipts and export items/receipts to CSV.

### System Settings & Configuration
- **Organization Settings**: Configure business name, address, VAT ID (IČO/DIČ).
- **Payment Settings**: Setup your bank IBAN, Constant Symbol, and default messages for QR payments.
- **Receipt Customization**: Configure custom headers and footers for printed/exported receipts.
- **EET**: Preparations for EET (Electronic Registration of Sales) configuration.
- **Database Management**: Integrated tools to verify, create, seed, or wipe the local database directly from the UI.

---

## 💻 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, custom CSS modules, React Icons (`react-icons/fa6`)
- **Database**: `better-sqlite3` (SQLite)
- **Utilities**: `qrcode.react` (SPAYD QR Generation), `pdfkit` (PDF generation)

---

## 📂 Project Structure

```
/data/               # Default SQLite database location
/scripts/            # Migration scripts (JSON -> SQLite)
/src/
  ├── app/           # Next.js 15 App Router (Pages & API Routes)
  ├── components/    # Reusable React components (Modals, Settings Panels)
  ├── data/          # Configuration files (dbposition.json, icons)
  ├── lib/           # Utilities (e.g., SPAYD generator)
  ├── types/         # TypeScript definitions
  ├── db.ts          # better-sqlite3 connection and schema definition
  └── dbSeed.ts      # Default data seeding logic
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or newer recommended)
- **npm** (or yarn/pnpm)

### Installation & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   The application requires an `ADMIN_SECRET` for settings access. On first run, a `.env` file will be automatically created from `.env.example` with the default password `posadmin123`. You can change this anytime in the `.env` file.

3. **(Optional) Migrate legacy JSON data:**
   If you have old `data/items.json` or `data/receipts.json` and want to migrate them into the SQLite database:
   ```bash
   node scripts/migrate.js
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ✅ Development Status / Roadmap

### Completed (V2 transition)
- [x] Migrated from Next.js Pages router to App Router.
- [x] Migrated from JSON file storage to SQLite (`better-sqlite3`).
- [x] Centralized database path configuration in `src/data/dbposition.json`.
- [x] Advanced DB Management (Verify, Create Structure, Seed Data, Wipe).
- [x] Secured settings with admin password (managed via `.env`).
- [x] Implemented "Open Tabs" and "Tables" functionality (Odložit na účet / na stůl).
- [x] Custom items can now be added seamlessly.
- [x] Dynamic Settings (Organization, Categories, Icons, Receipts layout).
- [x] Refactored IconPicker with search, aliases, and favorite icons.
- [x] CSV Exports for Receipts and Items.
- [x] QR code payment integration (SPAYD format generation).
- [x] Success modals for actions replacing browser `alert()`.
- [x] Hot-swappable database via ES6 Proxy (no restart needed on path change).
- [x] Full removal of legacy files (obsolete Pages router and JSON DB logic).

### Planned / TODOs
- [ ] Log and distinguish payment methods in DB (cash, card, QR).
- [ ] Direct thermal printer integration (e.g., ESC/POS).
- [ ] Advanced dashboard analytics / daily summaries.
- [ ] Restrict the "Price" fields strictly to numeric inputs / virtual numpad for touchscreens.

---

## 📜 License

This project is licensed under the **ISC** license.

---

👨‍💻 **Author:** roboraptor66

