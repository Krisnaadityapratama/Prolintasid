export const STAGES = [
  { value: "baru", label: "Baru" },
  { value: "hubungi", label: "Dihubungi" },
  { value: "kualifikasi", label: "Kualifikasi" },
  { value: "penawaran", label: "Penawaran" },
  { value: "nego", label: "Negosiasi" },
  { value: "won", label: "Deal" },
  { value: "lost", label: "Gagal" },
] as const;

export const OPTION_GROUPS = [
  {
    key: "industries",
    label: "Industri",
    items: [
      "Manufaktur", "Garmen & Tekstil", "Makanan & Minuman", "Elektronik",
      "Otomotif & Sparepart", "Kimia & Plastik", "FMCG / Retail", "E-commerce",
      "Pertambangan & Energi", "Pertanian & Komoditas", "Furnitur", "Lainnya",
    ],
  },
  { key: "modes", label: "Moda angkutan", items: ["Sea FCL", "Sea LCL", "Air Freight", "Trucking", "Multimoda"] },
  {
    key: "services",
    label: "Layanan",
    items: ["Ekspor", "Impor", "Domestik", "Customs Clearance", "Gudang & Distribusi", "Project Cargo"],
  },
  {
    key: "sources",
    label: "Sumber lead",
    items: ["Referral", "Cold call / kunjungan", "Pameran / event", "Media sosial & website", "Partner agen luar negeri", "Tender / RFQ", "Pelanggan lama"],
  },
  { key: "units", label: "Satuan volume", items: ["TEU", "CBM", "Kg", "Ton", "Shipment"] },
  { key: "incoterms", label: "Incoterm", items: ["EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"] },
  {
    key: "frequencies",
    label: "Frekuensi pengiriman",
    items: ["Spot (sekali kirim)", "Rutin mingguan", "Rutin bulanan", "Kontrak / tender tahunan"],
  },
  { key: "temperatures", label: "Prospek", items: ["Panas", "Hangat", "Dingin"] },
  {
    key: "lost_reasons",
    label: "Alasan lead gagal",
    items: ["Harga lebih tinggi", "Pakai kompetitor", "Tidak ada kebutuhan", "Tidak responsif", "Lainnya"],
  },
] as const;

export type OptionCategory = (typeof OPTION_GROUPS)[number]["key"];
export type LeadOptions = Record<OptionCategory, string[]>;
export type LeadOption = {
  id: string;
  category: OptionCategory;
  label: string;
  sort_order: number;
};

export type Role = "owner" | "admin" | "sales";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
};

export type Lead = {
  id: string;
  company: string;
  pic: string | null;
  job_title: string | null;
  phone: string | null;
  email: string | null;
  industry: string | null;
  commodity: string | null;
  modes: string[];
  services: string[];
  origin: string | null;
  destination: string | null;
  volume: number | null;
  unit: string | null;
  incoterm: string | null;
  frequency: string | null;
  estimated_value: number;
  source: string | null;
  stage: (typeof STAGES)[number]["value"];
  temperature: string | null;
  follow_up: string | null;
  notes: string | null;
  lost_reason: string | null;
  closed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: Pick<Profile, "id" | "full_name" | "email"> | null;
};

export function isActive(stage: string) {
  return ["baru", "hubungi", "kualifikasi", "penawaran", "nego"].includes(stage);
}

export function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function stageLabel(value: string) {
  return STAGES.find((stage) => stage.value === value)?.label ?? value;
}

export function roleLabel(value: Role) {
  return value === "owner" ? "Admin Utama" : value === "admin" ? "Admin" : "Sales";
}
