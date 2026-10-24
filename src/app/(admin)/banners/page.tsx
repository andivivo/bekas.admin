import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { BannerTable } from "@/components/banners/banner-table";
import { Banner } from "@/lib/types";

export const revalidate = 0;

export default async function BannersPage() {
  const supabase = createClient();

  const { data: banners } = await supabase
    .from("banners")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Manajemen Banner Marquee Aplikasi
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Kelola banner promosi bergerak (Marquee 280×88px dengan background foto asli dan overlay 75%) untuk beranda aplikasi bekasAja.
        </p>
      </div>

      <BannerTable initialBanners={(banners as Banner[]) || []} />
    </div>
  );
}
