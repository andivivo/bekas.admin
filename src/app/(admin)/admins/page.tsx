import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminTable } from "@/components/admins/admin-table";
import { Profile } from "@/lib/types";

export const revalidate = 0;

export default async function AdminsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Cek apakah user saat ini adalah super_admin
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (currentProfile?.role !== "super_admin") {
    redirect("/");
  }

  // Ambil seluruh akun admin & super_admin
  const { data: admins } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "super_admin"])
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Manajemen Administrator & Tim
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Khusus Super Admin: Angkat moderator baru, atur level hak akses, atau cabut kewenangan staf admin.
        </p>
      </div>

      <AdminTable
        initialAdmins={(admins as Profile[]) || []}
        currentUserId={user.id}
      />
    </div>
  );
}
