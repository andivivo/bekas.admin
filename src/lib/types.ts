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
  created_at: string;
  // Joined seller profile
  profiles?: Profile | null;
}

export type OrderStatus =
  | "waiting_payment"
  | "paid"
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
