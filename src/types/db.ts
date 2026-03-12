// c:\projects\LocalPOSjson\src\types\db.ts (Nový soubor)

export interface Item {
  id: number;
  name: string;
  price: number;
  category: string;
  position: number;
  icon: string | null;
}

export interface Category {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
  position: number;
}

export interface Tab {
  id: number;
  name: string;
  is_permanent: number;
  is_table: number;
  is_staff: number;
  created_at: string;
  updated_at: string;
  items: string; // JSON string
}

export interface Receipt {
  id: number;
  created_at: string;
  issued_to: string | null;
  items: string; // JSON string
}
