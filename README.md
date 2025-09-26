# 🧾 Local POS

A simple cash register application built with **Next.js** + **React**, storing receipts in a **JSON file** (planned migration to SQLite).\
The project is aimed at easy use in small businesses or as an experimental local POS system.

---

## ✨ Features

- Clean and intuitive POS interface for adding items to a receipt
- Option to add custom items (e.g., outside the main menu)
- Item management (editor + categories)
- Receipts stored in `receipts.json`
- Page with a list of saved receipts
- Ability to assign a receipt to a name or mark it as **Staff**

---

## 📂 Project structure

- `/pages/index.js` – main POS page
- `/pages/items.js` – item management
- `/pages/receipts.js` – receipts overview
- `/pages/api/*` – API for saving/managing data
- `/data/items.json` – item definitions
- `/data/example_items.json` – sample items
- `/data/receipts.json` – saved receipts (created after the first receipt is stored)
- `/components/Header.js` – navigation
- `/styles/globals.css` – global styles

---

## 🚀 Running the project

- If you want to have preloaded items in the POS, rename `data/example_items.json` to `data/items.json`.
- Install dependencies and start the app:

```bash
npm install
npm run dev
```

The app will run at [http://localhost:3000](http://localhost:3000).

---

## ✅ TODO / Planned development

- Ability to create open tabs (pay later)
- Log payment method (cash, QR, card)
- Separate receipts into paid vs. open
- Fix adding custom items so they can also be discounts (negative value)
- Restrict the “Price” field to numbers and minus sign only
- Add support for custom categories
- Heartbeat in the header to check if the server is alive

### ✅ Done

- Replace `alert("receipt saved")` with a modal window (auto close after 5s + “Skip” button)
- Update the receipts page:
  - Sort newest first
  - Add filtering (Receipts V2)

---

## 📜 License

This project is licensed under the **ISC** license.

---

👨‍💻 Author: roboraptor66

