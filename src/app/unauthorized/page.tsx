"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
      }
    }
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/80 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-6">
          <ShieldAlert className="h-9 w-9" />
        </div>

        <h1 className="text-2xl font-bold text-white">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-slate-400">
          Akun Anda {userEmail ? <span className="text-slate-200 font-medium font-mono">({userEmail})</span> : ""} tidak terdaftar sebagai Administrator sistem bekasAja.
        </p>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-left text-xs text-slate-400 space-y-2">
          <p className="font-semibold text-slate-300">Ingin akses administrator?</p>
          <p>
            Jalankan perintah SQL berikut di Supabase SQL Editor untuk memberikan hak admin ke akun ini:
          </p>
          <code className="block rounded bg-black/60 p-2 font-mono text-emerald-400 select-all overflow-x-auto">
            {`UPDATE profiles SET role = 'admin' WHERE email = '${userEmail ?? "email_anda"}';`}
          </code>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full gap-2"
          >
            <LogOut className="h-4 w-4" />
            Keluar & Ganti Akun
          </Button>

          <Button
            onClick={() => router.push("/login")}
            variant="outline"
            className="w-full gap-2 border-slate-800 text-slate-300 hover:bg-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Halaman Login
          </Button>
        </div>
      </div>
    </div>
  );
}
