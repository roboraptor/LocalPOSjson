# 🧾 Lokální Pokladna (Local POS)

Jednoduchá pokladní aplikace postavená na **Next.js** + **React**, která ukládá účtenky do **JSON souboru** (plánovaně do SQLite). Projekt je zaměřený na jednoduché použití v malých provozech nebo jako experimentální lokální pokladna.

---

## ✨ Funkce

- Přehledná pokladna pro klikání položek do účtenky
- Možnost přidání vlastní položky (např. mimo nabídku)
- Správa položek (editor + kategorie)
- Ukládání účtenek do `receipts.json`
- Stránka s uloženými účtenkami
- Možnost přiřazení účtenky na jméno nebo označení jako **Staff**

---

## 📂 Struktura projektu

- `/pages/index.js` – hlavní stránka pokladny
- `/pages/items.js` – správa položek
- `/pages/receipts.js` – přehled účtenek (vygeneruje se po uložení první účtenky)
- `/pages/api/*` – API pro ukládání/správu dat
- `/data/items.json` – definice položek
- `/data/example_items.json` - Vzorové položky
- `/data/receipts.json` – uložené účtenky
- `/components/Header.js` – navigace
- `/styles/globals.css` – globální styly

---

## 🚀 Spuštění projektu

- Pokud chceš mít v pokladně předpřipravené položky, přejmenuj soubor `data/example_items.json` na `data/items.json`.
- Nainstaluj závislosti a spusť:
```bash
npm install
npm run dev
```

Aplikace poběží na [http://localhost:3000](http://localhost:3000).

---

## ✅ TODO / Plánovaný vývoj

- Možnost zakládat otevřené účty (platba později)
- Logovat způsob platby (hotově, QR, kartou)
- Upravit stránku účtenek:
  - Seřadit od nejnovější nahoře
  - Přidat filtrování
- Rozdělení účtenek na zaplacené vs. otevřené
- Opravit přidání vlastní položky, aby mohla být i sleva (negativní hodnota)
- V poli „Cena“ zakázat zadávání jiných znaků než číslo a mínus
- Doplnit možnost vlastních kategorií
- Heartbeat do headeru jestli je server alive

### ✅ Done

- Nahradit alert("účtenka uložena") za modal okno s timeoutem 5s a tlačítkem „Přeskočit“

---

## 📜 Licence

Projekt je pod licencí **ISC**.

---

👨‍💻 Autor: roboraptor66

