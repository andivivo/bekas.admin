"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(
          error.message === "Invalid login credentials"
            ? "Email atau kata sandi tidak cocok."
            : error.message
        );
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Cek apakah akun ini role admin / super_admin
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role, name, full_name")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profileErr) {
          console.error("Error fetching profile:", profileErr);
        }

        if (!profile) {
          await supabase.auth.signOut();
          setErrorMessage(
            `Akun Auth terdaftar (${data.user.email}), tetapi baris profil di tabel 'public.profiles' belum dibuat. Silakan jalankan query SQL sinkronisasi profil.`
          );
          setLoading(false);
          return;
        }

        const isAllowed =
          profile.role === "admin" || profile.role === "super_admin";

        if (!isAllowed) {
          await supabase.auth.signOut();
          setErrorMessage(
            `Akses ditolak: Status role akun Anda saat ini masih '${profile.role}'. Diperlukan role 'super_admin' atau 'admin' untuk masuk.`
          );
          setLoading(false);
          return;
        }

        router.push(redirectUrl);
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan saat masuk."
      );
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-lg shadow-emerald-500/20 mb-4">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          bekas<span className="text-emerald-400">Aja</span> Admin
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Masuk ke panel kontrol & verifikasi marketplace
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300 animate-in fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span className="flex-1 leading-relaxed">{errorMessage}</span>
        </div>
      )}

      <form
        action="javascript:void(0);"
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin(e);
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Email Administrator
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="email"
              required
              placeholder="admin@bekasaja.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Kata Sandi
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-10 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20 h-10"
          isLoading={loading}
        >
          Masuk ke Admin Panel
        </Button>
      </form>

      <div className="mt-8 border-t border-slate-800/80 pt-4 text-center">
        <p className="text-xs text-slate-500">
          Hanya untuk pengguna dengan hak akses Administrator.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4">
      {/* Decorative background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-600/5 rounded-full blur-2xl" />
      </div>

      <React.Suspense fallback={<div className="text-white text-sm">Memuat form login...</div>}>
        <LoginForm />
      </React.Suspense>
    </div>
  );
}
