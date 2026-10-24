"use client";

import * as React from "react";
import { Banner, getCategoryName } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { BannerFormDialog } from "./banner-form-dialog";
import { useToast } from "@/components/ui/toast";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Megaphone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Play,
  Pause,
  Layers,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface BannerTableProps {
  initialBanners: Banner[];
}

export function BannerTable({ initialBanners }: BannerTableProps) {
  const [banners, setBanners] = React.useState<Banner[]>(
    [...initialBanners].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  );

  const [selectedBanner, setSelectedBanner] = React.useState<Banner | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [deleteBannerId, setDeleteBannerId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [isMarqueePaused, setIsMarqueePaused] = React.useState(false);

  const supabase = createClient();
  const { toast } = useToast();

  const activeBanners = React.useMemo(
    () => banners.filter((b) => b.is_active),
    [banners]
  );

  const handleSaved = (savedBanner: Banner) => {
    setBanners((prev) => {
      const exists = prev.some((b) => b.id === savedBanner.id);
      if (exists) {
        return prev
          .map((b) => (b.id === savedBanner.id ? savedBanner : b))
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      }
      return [...prev, savedBanner].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      );
    });
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;

      setBanners((prev) => prev.filter((b) => b.id !== id));
      toast("Banner Marquee berhasil dihapus.", "success");
      setDeleteBannerId(null);
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : "Gagal menghapus banner.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    const nextStatus = !banner.is_active;
    try {
      const { error } = await supabase
        .from("banners")
        .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", banner.id);

      if (error) throw error;

      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: nextStatus } : b))
      );
      toast(
        `Banner "${banner.title}" sekarang ${nextStatus ? "aktif di Marquee" : "disembunyikan"}.`,
        "info"
      );
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Gagal mengubah status.", "error");
    }
  };

  // Move banner order up/down
  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const currentBanner = banners[index];
    const targetBanner = banners[targetIndex];

    const currentOrder = currentBanner.sort_order ?? index;
    const targetOrder = targetBanner.sort_order ?? targetIndex;

    const newCurrentOrder = targetOrder;
    const newTargetOrder =
      currentOrder === targetOrder
        ? currentOrder + (direction === "up" ? 1 : -1)
        : currentOrder;

    try {
      await Promise.all([
        supabase
          .from("banners")
          .update({ sort_order: newCurrentOrder })
          .eq("id", currentBanner.id),
        supabase
          .from("banners")
          .update({ sort_order: newTargetOrder })
          .eq("id", targetBanner.id),
      ]);

      setBanners((prev) => {
        const next = [...prev];
        next[index] = { ...currentBanner, sort_order: newCurrentOrder };
        next[targetIndex] = { ...targetBanner, sort_order: newTargetOrder };
        return next.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      });

      toast("Urutan Marquee berhasil diperbarui.", "success");
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : "Gagal mengubah urutan.",
        "error"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Megaphone className="h-4 w-4" />
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white">
              Daftar Banner Marquee Aplikasi
            </h3>
            <Badge variant="outline" className="text-xs">
              {activeBanners.length} Aktif / {banners.length} Total
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Format resmi: Lebar 280px × Tinggi 88px, background foto asli, overlay 50%, amber button.
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedBanner(null);
            setIsFormOpen(true);
          }}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Banner Marquee</span>
        </Button>
      </div>

      {/* LIVE MARQUEE CONTINUOUS TICKER PREVIEW (Identical to Flutter App) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-900 to-slate-950 p-5 text-white shadow-lg dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold tracking-wide uppercase text-slate-300">
              Live Preview: Marquee Berjalan Aplikasi (Running Text Pita Berita)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMarqueePaused((prev) => !prev)}
              className="flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              {isMarqueePaused ? (
                <>
                  <Play className="h-3 w-3 text-emerald-400 fill-emerald-400" />
                  <span>Jalankan</span>
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <span>Jeda Gerakan</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-400">
              {activeBanners.length < 5
                ? `(Disarankan min. 5 banner, saat ini ada ${activeBanners.length})`
                : "Kecepatan: ~30s per putaran"}
            </span>
          </div>
        </div>

        {/* Ticker Container with edge gradient fade */}
        <div
          className="relative mt-4 overflow-hidden py-1"
          onMouseEnter={() => setIsMarqueePaused(true)}
          onMouseLeave={() => setIsMarqueePaused(false)}
        >
          {/* Left & Right Edge Fade */}
          <div className="pointer-events-none absolute left-0 top-0 z-20 h-full w-12 bg-gradient-to-r from-slate-950 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-20 h-full w-12 bg-gradient-to-l from-slate-950 to-transparent" />

          {activeBanners.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Belum ada banner aktif. Aktifkan banner di bawah atau tambahkan banner baru.
            </div>
          ) : (
            <div
              className={`flex gap-3 select-none ${
                isMarqueePaused ? "" : "animate-[marquee_35s_linear_infinite]"
              }`}
              style={{
                width: "max-content",
                animationPlayState: isMarqueePaused ? "paused" : "running",
              }}
            >
              {/* Duplicate array 2x for seamless continuous loop */}
              {[...activeBanners, ...activeBanners].map((banner, idx) => (
                <div
                  key={`${banner.id}-${idx}`}
                  className="group/card relative shrink-0 overflow-hidden shadow-md cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{
                    width: "280px",
                    height: "88px",
                    borderRadius: "16px",
                    backgroundColor: "#1e293b",
                  }}
                  onClick={() => {
                    if (banner.action_url) {
                      window.open(banner.action_url, "_blank", "noopener,noreferrer");
                    }
                  }}
                  title={banner.action_url ? `Buka: ${banner.action_url}` : banner.title}
                >
                  {/* Photo Background */}
                  {banner.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${banner.gradient_start || "#00c853"}, ${banner.gradient_end || "#009624"})`,
                      }}
                    />
                  )}

                  {/* 50% Dark Overlay */}
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                  />

                  {/* Card Content */}
                  <div className="relative z-10 flex h-full w-full items-center justify-between p-[12px] text-white">
                    <div className="flex flex-col justify-center min-w-0 pr-2">
                      <p
                        className="text-[15px] font-bold text-white leading-tight truncate drop-shadow-sm"
                        style={{ letterSpacing: "-0.2px" }}
                      >
                        {banner.title}
                      </p>
                      <p className="text-[12px] text-white/85 line-clamp-2 leading-[1.25] mt-1 drop-shadow-xs">
                        {banner.subtitle}
                      </p>
                    </div>

                    <div className="shrink-0 self-end">
                      <div
                        className="flex items-center gap-1 rounded-[10px] px-2.5 py-1 text-[11px] font-bold shadow-sm"
                        style={{
                          backgroundColor: "#FFB020",
                          color: "#000000",
                        }}
                      >
                        <span>{banner.button_text || "Lihat Promo"}</span>
                        <ArrowRight className="h-3 w-3 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Banner Cards List */}
      {banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Megaphone className="h-6 w-6" />
          </div>
          <h4 className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-200">
            Belum Ada Banner Promo
          </h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Buat banner pertama untuk beranda aplikasi dengan format Marquee foto asli 280×88px.
          </p>
          <Button
            onClick={() => {
              setSelectedBanner(null);
              setIsFormOpen(true);
            }}
            className="mt-4 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Banner Baru</span>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {banners.map((b, idx) => (
            <div
              key={b.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Visual Preview + Reorder */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                  {/* Reorder Buttons */}
                  <div className="flex sm:flex-col items-center gap-1 text-slate-400 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, "up")}
                      className="rounded p-1 hover:bg-slate-100 disabled:opacity-25 dark:hover:bg-slate-800"
                      title="Naikkan Urutan"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 px-1">
                      #{b.sort_order ?? idx}
                    </span>
                    <button
                      type="button"
                      disabled={idx === banners.length - 1}
                      onClick={() => handleMoveOrder(idx, "down")}
                      className="rounded p-1 hover:bg-slate-100 disabled:opacity-25 dark:hover:bg-slate-800"
                      title="Turunkan Urutan"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Marquee Card Shape: Exact 280x88px representation */}
                  <div
                    className="relative shrink-0 overflow-hidden shadow-sm"
                    style={{
                      width: "280px",
                      height: "88px",
                      borderRadius: "16px",
                      backgroundColor: "#1e293b",
                    }}
                  >
                    {b.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.image_url}
                        alt={b.title}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(135deg, ${b.gradient_start || "#00c853"}, ${b.gradient_end || "#009624"})`,
                        }}
                      />
                    )}

                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                    />

                    <div className="relative z-10 flex h-full w-full items-center justify-between p-[12px] text-white">
                      <div className="flex flex-col justify-center min-w-0 pr-2">
                        <p className="text-[15px] font-bold text-white leading-tight truncate">
                          {b.title}
                        </p>
                        <p className="text-[12px] text-white/85 line-clamp-2 leading-[1.25] mt-1">
                          {b.subtitle}
                        </p>
                      </div>

                      <div className="shrink-0 self-end">
                        <div
                          className="flex items-center gap-1 rounded-[10px] px-2 py-0.5 text-[10px] font-bold shadow-xs"
                          style={{
                            backgroundColor: "#FFB020",
                            color: "#000000",
                          }}
                        >
                          <span>{b.button_text || "Lihat Promo"}</span>
                          <ArrowRight className="h-2.5 w-2.5 stroke-[2.5]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Banner Information & Meta */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {b.title}
                      </h4>
                      <Badge
                        variant={b.is_active ? "success" : "secondary"}
                        className="text-[10px]"
                      >
                        {b.is_active ? "Aktif di Marquee" : "Non-Aktif"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        Kategori: {getCategoryName(b.target_category)}
                      </Badge>
                      <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
                        Tag: {b.tag}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {b.subtitle}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      {b.action_url && (
                        <a
                          href={b.action_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span className="max-w-[200px] truncate">{b.action_url}</span>
                        </a>
                      )}
                      <span>•</span>
                      <span>Tombol: <strong>{b.button_text || "Lihat Promo"}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0 shrink-0">
                  <Button
                    type="button"
                    variant={b.is_active ? "outline" : "secondary"}
                    size="sm"
                    onClick={() => handleToggleActive(b)}
                    className="text-xs gap-1"
                  >
                    {b.is_active ? (
                      <>
                        <XCircle className="h-3.5 w-3.5 text-slate-500" />
                        <span>Nonaktifkan</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Aktifkan</span>
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedBanner(b);
                      setIsFormOpen(true);
                    }}
                    className="text-xs gap-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Pencil className="h-3.5 w-3.5 text-blue-500" />
                    <span>Edit</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteBannerId(b.id)}
                    className="text-xs gap-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteBannerId)}
        onOpenChange={(open) => !open && setDeleteBannerId(null)}
      >
        <DialogContent maxWidth="max-w-md" onClose={() => setDeleteBannerId(null)}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Hapus Banner Marquee?</DialogTitle>
            </div>
            <DialogDescription>
              Banner ini akan dihapus secara permanen dari Supabase dan tidak akan tampil lagi di aplikasi.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setDeleteBannerId(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              isLoading={loading}
              onClick={() => deleteBannerId && handleDelete(deleteBannerId)}
            >
              Ya, Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Dialog for Add / Edit */}
      <BannerFormDialog
        banner={selectedBanner}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleSaved}
      />
    </div>
  );
}
