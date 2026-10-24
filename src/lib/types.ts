export type UserRole = "user" | "admin" | "super_admin";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface Profile {
  id: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  bio?: string | null;
  role: UserRole;
  verification_status: VerificationStatus;
  id_card_url?: string | null;
  selfie_url?: string | null;
  rating?: number | null;
  total_sales?: number | null;
  is_verified?: boolean;
  is_blocked?: boolean;
  blocked_at?: string | null;
  block_reason?: string | null;
  blocked_by?: string | null;
  created_at: string;
}

export type ProductStatus = "pending" | "active" | "approved" | "rejected" | "sold";

export interface CategoryInfo {
  id: string;
  name: string;
  description?: string;
}

export const APP_CATEGORIES: CategoryInfo[] = [
  { id: "all", name: "Semua Kategori", description: "Seluruh barang bekas pilihan" },
  { id: "gadget", name: "HP & Gadget", description: "Smartphone, tablet, smartwatch" },
  { id: "elektronik", name: "Elektronik", description: "Laptop, PC, TV, audio" },
  { id: "kendaraan", name: "Kendaraan", description: "Motor, mobil, aksesoris otomotif" },
  { id: "fashion", name: "Fashion & Thrift", description: "Pakaian preloved, sneakers, tas" },
  { id: "kamera", name: "Fotografi & Kamera", description: "DSLR, mirrorless, lensa, drone" },
  { id: "hobi", name: "Hobi & Game", description: "Konsol, mainan koleksi, alat musik" },
  { id: "perabot", name: "Perabot Rumah", description: "Meja, kursi, perabot & peralatan" },
];

export function getCategoryName(categoryId?: string | null): string {
  if (!categoryId) return "Semua";
  const found = APP_CATEGORIES.find(
    (c) => c.id.toLowerCase() === categoryId.toLowerCase()
  );
  return found ? found.name : categoryId;
}

export interface MarqueePreset {
  label: string;
  tag: string;
  title: string;
  subtitle: string;
  btn: string;
  url: string;
  image: string;
  targetCategory: string;
}

export const MARQUEE_BANNER_PRESETS: MarqueePreset[] = [
  {
    label: "📱 Gadget & HP",
    tag: "PROMO GADGET",
    title: "Gadget & iPhone Bekas",
    subtitle: "Kondisi mulus 99%, baterai awet & siap pakai",
    btn: "Cek HP",
    url: "https://bekasaja.id/promo/gadget",
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80",
    targetCategory: "gadget",
  },
  {
    label: "💻 Laptop & Unit",
    tag: "ELEKTRONIK",
    title: "Laptop & Kamera Mulus",
    subtitle: "Garansi personal aman, nego langsung deal",
    btn: "Lihat Unit",
    url: "https://bekasaja.id/promo/elektronik",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
    targetCategory: "elektronik",
  },
  {
    label: "👟 Sneakers / Thrift",
    tag: "PRELOVED THRIFT",
    title: "Sneakers & Jaket Thrift",
    subtitle: "Koleksi original langka, hemat sampai 70%",
    btn: "Thrift Now",
    url: "https://bekasaja.id/promo/fashion",
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80",
    targetCategory: "fashion",
  },
  {
    label: "🛡️ Transaksi COD",
    tag: "PANDUAN COD",
    title: "Transaksi COD Aman",
    subtitle: "Periksa fisik barang sebelum transfer dana",
    btn: "Tips COD",
    url: "https://bekasaja.id/panduan-cod",
    image: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&q=80",
    targetCategory: "all",
  },
  {
    label: "⚡ Diskon BU",
    tag: "BUTUH UANG",
    title: "Diskon Butuh Uang (BU)",
    subtitle: "Barang bagus harga miring dari penjual terpercaya",
    btn: "Serbu Promo",
    url: "https://bekasaja.id/promo/diskon-bu",
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80",
    targetCategory: "all",
  },
];

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  price: number;
  original_price?: number | null;
  category: string;
  condition: string;
  completeness?: string | null;
  minus_info?: string | null;
  location?: string | null;
  status: ProductStatus;
  image_urls: string[];
  rejection_reason?: string | null;
  is_quick_sale_bu?: boolean;
  is_nego_allowed?: boolean;
  transaction_method?: "cod" | "escrow" | "both" | null;
  created_at: string;
  // Joined seller profile
  profiles?: Profile | null;
}

export type OrderStatus =
  | "pending"
  | "waiting_payment"
  | "waiting_cod"
  | "paid"
  | "paid_in_escrow"
  | "shipping"
  | "completed"
  | "cancelled";

export interface EscrowTransaction {
  order_id: string;
  amount: number;
  status: string;
  xendit_invoice_id?: string | null;
  xendit_external_id?: string | null;
  xendit_payment_url?: string | null;
  created_at?: string;
}

export interface Address {
  id: string;
  user_id?: string;
  recipient_name?: string | null;
  phone_number?: string | null;
  full_address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  is_primary?: boolean;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  address_id?: string | null;
  payment_method?: string | null;
  courier_name?: string | null;
  shipping_cost?: number;
  total_amount: number;
  status: OrderStatus;
  notes?: string | null;
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  // Joined relations
  products?: Product | null;
  buyer?: Profile | null;
  seller?: Profile | null;
  escrow_transactions?: EscrowTransaction[] | EscrowTransaction | null;
  addresses?: Address | null;
}

export interface Banner {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  button_text?: string;
  target_category?: string;
  action_url?: string | null;
  gradient_start: string;
  gradient_end: string;
  image_url?: string | null;
  is_active: boolean;
  sort_order: number;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalProductsPending: number;
  totalProductsActive: number;
  totalOrdersThisMonth: number;
  totalEscrowRevenue: number;
}

export interface ChartDataPoint {
  date: string;
  count: number;
}
