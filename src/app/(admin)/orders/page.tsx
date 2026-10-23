import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { OrderTable } from "@/components/orders/order-table";
import { Order } from "@/lib/types";

export const revalidate = 0;

export default async function OrdersPage() {
  const supabase = createClient();

  // Ambil transaksi pesanan beserta relasi produk dan escrow
  let orders: Order[] = [];

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, products(*), escrow_transactions(*), buyer:buyer_id(*), seller:seller_id(*)")
      .order("created_at", { ascending: false });

    if (error) {
      // Fallback tanpa alias relasi ganda jika PostgREST butuh query terpisah
      const { data: fallbackData } = await supabase
        .from("orders")
        .select("*, products(*), escrow_transactions(*)")
        .order("created_at", { ascending: false });
      orders = (fallbackData as unknown as Order[]) || [];
    } else {
      orders = (data as unknown as Order[]) || [];
    }
  } catch {
    orders = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Transaksi Pesanan & Rekber Escrow
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Pantau seluruh pesanan marketplace, status rekening bersama Xendit, dan tautan invoice pembayaran.
        </p>
      </div>

      <OrderTable initialOrders={orders} />
    </div>
  );
}
