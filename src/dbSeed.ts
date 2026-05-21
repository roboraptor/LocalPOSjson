import db from './db';

export function seedDb() {
  const seedData = {
    general: {
      organization_name: "Organizace",
      organization_owner: "Člověk Human",
      organization_id: "12345678",
      organization_vat_id: "CZ12345678",
      bank_iban: "",
      currency: "CZK",
      trx_msg: "",
      trx_vs_enabled: 0,
      trx_ks: "" ,
      receipt_title: "Obchod",
      receipt_header: "",
      receipt_header_enabled: 0,
      receipt_footer: "Děkujeme za návštěvu",
      receipt_footer_enabled: 1
    },
    categories: [
      { name: "Nápoje", color: "#22c55e", icon: "FaBeerMugEmpty", position: 1 },
      { name: "Jídlo", color: "#22c55e", icon: "FaBurger", position: 2 },
      { name: "Ostatní", color: "#22c55e", icon: "FaCubes", position: 3 }
    ],
    items: [
      { name: "Kofola", price: 40, category: "Nápoje", icon: "FaBeerMugEmpty", position: 4 },
      { name: "Espresso", price: 40, category: "Nápoje", icon: "FaMugSaucer", position: 1 },
      { name: "Dort", price: 80, category: "Jídlo", icon: "FaCheese", position: 9 },
      { name: "Klobása", price: 80, category: "Jídlo", icon: "FaHotdog", position: 13 },
      { name: "Pivo", price: 45, category: "Nápoje", icon: "FaBeerMugEmpty", position: 5 },
      { name: "Frisco", price: 40, category: "Nápoje", icon: "FaBottleWater", position: 8 },
      { name: "Birell", price: 40, category: "Nápoje", icon: "FaBottleWater", position: 6 },
      { name: "Cappuccino", price: 50, category: "Nápoje", icon: "FaMugSaucer", position: 2 },
      { name: "Tričko", price: 400, category: "Ostatní", icon: "FaShirt", position: 15 },
      { name: "Náramek", price: 70, category: "Ostatní", icon: "FaRing", position: 16 },
      { name: "HotDog", price: 80, category: "Jídlo", icon: "FaDog", position: 12 },
      { name: "Burger", price: 120, category: "Jídlo", icon: "FaBurger", position: 11 },
    ]
  };

  const runSeed = db.transaction(() => {
    // Seed general settings
    const updateGeneral = db.prepare(`
      UPDATE general SET 
        organization_name = ?, organization_owner = ?, organization_id = ?, 
        organization_vat_id = ?, bank_iban = ?, trx_msg = ?, 
        trx_vs_enabled = ?, trx_ks = ?, receipt_title = ?, 
        receipt_header = ?, receipt_header_enabled = ?, 
        receipt_footer = ?, receipt_footer_enabled = ?
      WHERE id = 1
    `);
    
    updateGeneral.run(
      seedData.general.organization_name, seedData.general.organization_owner, seedData.general.organization_id,
      seedData.general.organization_vat_id, seedData.general.bank_iban, seedData.general.trx_msg,
      seedData.general.trx_vs_enabled, seedData.general.trx_ks, seedData.general.receipt_title,
      seedData.general.receipt_header, seedData.general.receipt_header_enabled,
      seedData.general.receipt_footer, seedData.general.receipt_footer_enabled
    );

    // Seed categories
    const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, color, icon, position) VALUES (@name, @color, @icon, @position)');
    for (const cat of seedData.categories) {
      insertCategory.run(cat);
    }

    // Seed items
    const insertItem = db.prepare('INSERT OR IGNORE INTO items (name, price, category, icon, position) VALUES (@name, @price, @category, @icon, @position)');
    for (const item of seedData.items) {
      insertItem.run(item);
    }
  });

  runSeed();
  console.log('Database seeded with existing data successfully.');
}

