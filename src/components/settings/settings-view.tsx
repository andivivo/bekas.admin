"use client";

import * as React from "react";
import { APP_CATEGORIES, MARQUEE_BANNER_PRESETS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import {
  Sliders,
  Database,
  Smartphone,
  ShieldCheck,
  CreditCard,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  Clock,
  Key,
  FolderArchive,
  Info,
  Server,
  Activity,
  Lock,
} from "lucide-react";

export function SettingsView() {
  const [activeTab, setActiveTab] = React.useState<
    "marquee" | "categories" | "transactions" | "kyc" | "database"
  >("marquee");

  const [testingConnection, setTestingConnection] = React.useState(false);
  const [latencyMs, setLatencyMs] = React.useState<number | null>(null);
  const [dbStatus, setDbStatus] = React.useState<"connected" | "error" | "testing">("connected");
  const [marqueeSpeed, setMarqueeSpeed] = React.useState<"normal" | "slow" | "fast">("normal");

  const supabase = createClient();
  const { toast } = useToast();

  const handleTestDatabase = async () => {
    setTestingConnection(true);
    setDbStatus("testing");
    const startTime = performance.now();

    try {
      const { data, error } = await supabase
        .from("banners")
        .select("id")
        .limit(1);

      const endTime = performance.now();
      const elapsed = Math.round(endTime - startTime);

      if (error) throw error;

      setLatencyMs(elapsed);
      setDbStatus("connected");
      toast(`Koneksi Supabase aktif! Latensi: ${elapsed}ms`, "success");
    } catch (err: unknown) {
      setDbStatus("error");
      toast(
        err instanceof Error ? err.message : "Gagal menghubungi database Supabase.",
        "error"
      );
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Status Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-md dark:border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs border-white/20 text-xs">
                Sinkronisasi Terpadu
              </Badge>
              <span className="flex items-center gap-1.5 text-xs text-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                Aplikasi & Admin Panel Selaras
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Pengaturan Sistem & Aplikasi bekasAja
            </h2>
            <p className="text-xs text-emerald-50 max-w-2xl leading-relaxed">
              Konfigurasi parameter teknis untuk banner marquee berjalan, 8 kategori produk resmi, transaksi COD & Rekber Escrow, serta sinkronisasi Supabase.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleTestDatabase}
            isLoading={testingConnection}
            className="gap-2 bg-white text-emerald-800 hover:bg-emerald-50 font-semibold shadow-xs shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Uji Latensi Supabase</span>
          </Button>
        </div>

        {/* Status Metrics Strip */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/15 text-xs">
          <div>
            <span className="text-emerald-200 block text-[11px]">Database Host</span>
            <span className="font-mono font-semibold truncate block">
              qvbvljuiabzcbhnqjfdv.supabase.co
            </span>
          </div>
          <div>
            <span className="text-emerald-200 block text-[11px]">Status Klien Flutter</span>
            <span className="font-semibold text-white">v1.0.0+1 (bekas_app)</span>
          </div>
          <div>
            <span className="text-emerald-200 block text-[11px]">Format Banner</span>
            <span className="font-semibold text-white">Marquee 280×88px</span>
          </div>
          <div>
            <span className="text-emerald-200 block text-[11px]">Kategori Terdaftar</span>
            <span className="font-semibold text-white">8 Kategori Resmi</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          {
            id: "marquee",
            label: "Banner Marquee Berjalan",
            icon: Sparkles,
          },
          {
            id: "categories",
            label: "8 Kategori Resmi",
            icon: Layers,
          },
          {
            id: "transactions",
            label: "Transaksi COD & Rekber",
            icon: CreditCard,
          },
          {
            id: "kyc",
            label: "Verifikasi KYC & Lencana",
            icon: ShieldCheck,
          },
          {
            id: "database",
            label: "Koneksi & Storage Supabase",
            icon: Database,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: BANNER MARQUEE SETTINGS */}
      {activeTab === "marquee" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Spesifikasi Teknis Banner Marquee Aplikasi
                </h3>
                <p className="text-xs text-slate-500">
                  Parameter ini selaras 100% dengan widget marquee di beranda Flutter (bekas_app).
                </p>
              </div>
              <Badge variant="success">Standar Resmi Aktif</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mt-5">
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Dimensi & Tampilan Visual
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-center justify-between">
                    <span>Dimensi Banner:</span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                      280px × 88px
                    </strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Radius Sudut (Border Radius):</span>
                    <strong className="font-mono">16px (rounded-2xl)</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Latar Belakang:</span>
                    <strong className="text-rose-600 dark:text-rose-400">
                      Wajib Foto Asli (image_url)
                    </strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Lapisan Redup (Dark Overlay):</span>
                    <strong className="font-mono">25% Hitam (rgba(0,0,0,0.25))</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Tombol Aksi Kanan:</span>
                    <span className="flex items-center gap-1 font-semibold text-amber-600">
                      Amber #FFB020 + Ikon Panah
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Alur Gerakan & Logika Ticker
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-center justify-between">
                    <span>Mode Gerakan:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      Continuous Loop (Tanpa Loncat)
                    </strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Kecepatan Standar:</span>
                    <strong className="font-mono">0.5px tiap 30ms (~88s / siklus)</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Batas Minimal Banner:</span>
                    <strong className="text-amber-600 font-semibold">
                      Min. 5 Banner Aktif
                    </strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Interaksi User:</span>
                    <span>Otomatis Jeda saat Sentuh / Hover</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Efek Tepi Wadah:</span>
                    <span>Gradien Transparan (Rotary Fade)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Presets Reference */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                5 Preset Resmi Bawaan Aplikasi
              </h4>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {MARQUEE_BANNER_PRESETS.map((preset, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preset.image}
                        alt={preset.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {preset.title}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{preset.subtitle}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold text-amber-600">
                        Tombol: &quot;{preset.btn}&quot;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 8 OFFICIAL APP CATEGORIES */}
      {activeTab === "categories" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  8 Kategori Resmi Marketplace bekasAja
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar kategori resmi yang digunakan di aplikasi Flutter (lib/models/category.dart).
                </p>
              </div>
              <Badge variant="outline">Kategori Tetap</Badge>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 mt-5">
              {APP_CATEGORIES.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="group rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-emerald-500 hover:bg-emerald-50/30 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-emerald-500"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      #{idx + 1}
                    </span>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      id: {cat.id}
                    </Badge>
                  </div>
                  <h4 className="mt-3 font-bold text-sm text-slate-900 dark:text-white">
                    {cat.name}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {cat.description || "Barang bekas kategori resmi aplikasi."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTIONS & ESCROW */}
      {activeTab === "transactions" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Metode Transaksi: COD & Rekber Escrow Xendit
              </h3>
              <p className="text-xs text-slate-500">
                Pilihan metode transaksi yang dapat digunakan oleh pembeli dan penjual di aplikasi.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mt-5">
              <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      COD (Cash on Delivery)
                    </h4>
                    <span className="text-[11px] text-slate-400">Janjian Ketemu Langsung</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Penjual dan pembeli menyepakati titik pertemuan untuk memeriksa kondisi barang bekas secara langsung sebelum melakukan pembayaran tunai.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-slate-500">Status Alur:</span>{" "}
                  <strong className="font-mono text-blue-600">waiting_cod → completed</strong>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Rekber Escrow (Xendit Payment Gateway)
                    </h4>
                    <span className="text-[11px] text-slate-400">Rekening Bersama Aman</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Dana pembeli ditampung terlebih dahulu di rekening bersama Xendit hingga barang diterima sesuai deskripsi tanpa cacat tersembunyi.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-slate-500">Status Alur:</span>{" "}
                  <strong className="font-mono text-emerald-600">waiting_payment → paid_in_escrow → completed</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KYC VERIFICATION */}
      {activeTab === "kyc" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Verifikasi Identitas & Kebijakan Centang Biru
              </h3>
              <p className="text-xs text-slate-500">
                Pengguna terverifikasi mendapatkan lencana centang biru di profil untuk meningkatkan reputasi penjualan.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mt-5">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                  1. Foto KTP Asli
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Foto kartu identitas (KTP/SIM/Paspor) harus terlihat jelas tanpa pantulan cahaya dan NIK terbaca.
                </p>
                <span className="inline-block mt-3 text-[11px] font-mono text-slate-400">
                  Bucket: id-cards
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                  2. Foto Selfie Wajah
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Foto selfie wajah langsung menghadap kamera untuk mencocokkan wajah dengan foto di dokumen identitas.
                </p>
                <span className="inline-block mt-3 text-[11px] font-mono text-slate-400">
                  Bucket: avatars / id-cards
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                  3. Lencana Centang Biru
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Jika disetujui, kolom <code className="text-emerald-600">is_verified = true</code> dan lencana tampil di seluruh iklan.
                </p>
                <span className="inline-block mt-3 text-[11px] font-bold text-blue-600">
                  Status: Verified Badge
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DATABASE & STORAGE CONFIGURATION */}
      {activeTab === "database" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Koneksi Database Supabase & Storage Buckets
                </h3>
                <p className="text-xs text-slate-500">
                  Informasi konfigurasi environment variables yang digunakan oleh Next.js dan Flutter app.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleTestDatabase}
                isLoading={testingConnection}
                className="gap-1.5 text-xs"
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Tes Ping Realtime</span>
              </Button>
            </div>

            <div className="space-y-4 mt-5">
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5 text-emerald-500" />
                    Supabase Project URL
                  </span>
                  <Badge variant="success">Online</Badge>
                </div>
                <Input
                  readOnly
                  value="https://qvbvljuiabzcbhnqjfdv.supabase.co"
                  className="font-mono text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <FolderArchive className="h-3.5 w-3.5 text-emerald-500" />
                    Storage Buckets Publik (Untuk Foto & Dokumen)
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
                    <span className="font-mono font-semibold">banners</span>
                    <span className="text-emerald-600 font-semibold">Foto Banner Marquee</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
                    <span className="font-mono font-semibold">product-images</span>
                    <span className="text-emerald-600 font-semibold">Galeri Foto Iklan</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
                    <span className="font-mono font-semibold">avatars</span>
                    <span className="text-emerald-600 font-semibold">Foto Profil Pengguna</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
                    <span className="font-mono font-semibold">id-cards</span>
                    <span className="text-emerald-600 font-semibold">Dokumen Verifikasi KYC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
