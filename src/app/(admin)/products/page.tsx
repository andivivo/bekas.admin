import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { ProductTable } from "@/components/products/product-table";
import { Product } from "@/lib/types";

export const revalidate = 0;

interface ProductsPageProps {
  searchParams?: { status?: string };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const supabase = createClient();

  let products: Product[] = [];

  // Query dengan disambiguasi foreign key karena ada 2 relasi FK ke profiles
  const { data, error } = await supabase
    .from("products")
    .select("*, profiles!fk_products_seller_profile(*)")
    .order("created_at", { ascending: false });

  if (error) {
    // Coba relasi FK kedua
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("products")
      .select("*, profiles!products_seller_id_fkey(*)")
      .order("created_at", { ascending: false });

    if (fallbackError) {
      // Fallback tanpa join profiles
      const { data: simpleData } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      products = (simpleData as Product[]) || [];
    } else {
      products = (fallbackData as Product[]) || [];
    }
  } else {
    products = (data as Product[]) || [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Manajemen Produk & Moderasi
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Kelola iklan, setujui barang pending, tolak iklan bermasalah, dan hapus konten yang melanggar ketentuan.
        </p>
      </div>

      <ProductTable
        initialProducts={products}
        initialStatusFilter={searchParams?.status || "all"}
      />
    </div>
  );
}
