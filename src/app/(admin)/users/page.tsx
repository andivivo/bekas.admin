import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { UserTable } from "@/components/users/user-table";
import { Profile } from "@/lib/types";

export const revalidate = 0;

export default async function UsersManagementPage() {
  const supabase = createClient();

  let users: Profile[] = [];

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      users = data as Profile[];
    }
  } catch {
    users = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Manajemen Pengguna & Pemblokiran Akun
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Kelola hak akses pengguna bekasAja, tindak tegas akun yang terindikasi penipuan atau melanggar aturan marketplace.
        </p>
      </div>

      <UserTable initialUsers={users} />
    </div>
  );
}
