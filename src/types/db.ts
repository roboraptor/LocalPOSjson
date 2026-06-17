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
  items: any; // JSON string parsed to Item[]
}

export interface Receipt {
  id: number;
  created_at: string;
  issued_to: string | null;
  items: string; // JSON string
  payment_method: string | null;
  eet_fik: string | null;
  eet_bkp: string | null;
  eet_pkp: string | null;
}

export interface GeneralSettings {
  organization_name: string;
  organization_address: string;
  organization_owner: string;
  currency: string;
  organization_id: string;
  bank_iban: string | null;
  trx_msg: string | null;
  trx_vs_enabled: number;
  trx_ks: number | null;
  eet_enable: number;
  tax_rate: number;
  organization_vat_id: string;
  tax_enabled: number;
  receipt_title: string | null;
  receipt_header: string | null;
  receipt_header_enabled: number;
  receipt_footer: string | null;
  receipt_footer_enabled: number;
  use_external_qr_api: number;
}
