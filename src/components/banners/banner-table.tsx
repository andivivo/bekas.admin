"use client";

import * as React from "react";
import { Banner } from "@/lib/types";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface BannerTableProps {
  initialBanners: Banner[];
}

function hexToRgba(hex: string, alpha = 0.75): string {
  let clean = (hex || "").replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (clean.length === 6) {
    const num = parseInt(clean, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

export function BannerTable({ initialBanners }: BannerTableProps) {
  const [banners, setBanners] = React.useState<Banner[]>(
    [...initialBanners].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  );

  const [selectedBanner, setSelectedBanner] = React.useState<Banner | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [deleteBannerId, setDeleteBannerId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const supabase = createClient();
  const { toast } = useToast();

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
      toast("Banner berhasil dihapus.", "success");
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
        .update({ is_active: nextStatus })
        .eq("id", banner.id);

      if (error) throw error;

      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: nextStatus } : b))
      );
      toast(
        `Banner sekarang ${nextStatus ? "aktif" : "non-aktif"}.`,
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
    const newTargetOrder = currentOrder === targetOrder ? currentOrder + (direction === "up" ? 1 : -1) : currentOrder;

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

      const updated = [...banners];
      updated[index] = { ...currentBanner, sort_order: newCurrentOrder };
      updated[targetIndex] = { ...targetBanner, sort_order: newTargetOrder };
      updated.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      setBanners(updated);
      toast("Urutan banner berhasil diperbarui!", "success");
    } catch (err: unknown) {
      toast("Gagal mengubah urutan.", "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">
            Total {banners.length} banner promo terdaftar
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedBanner(null);
            setIsFormOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Banner Baru</span>
        </Button>
      </div>

      {/* Banner Cards Grid */}
      {banners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
            <Megaphone className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Belum ada banner promo
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Buat banner promo pertama untuk menarik minat pembeli di beranda aplikasi.
          </p>
          <Button
            onClick={() => {
              setSelectedBanner(null);
              setIsFormOpen(true);
            }}
            size="sm"
            className="mt-4 bg-emerald-600 hover:bg-emerald-700"
          >
            Buat Banner Sekarang
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {banners.map((b, idx) => (
            <div
              key={b.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Banner Visual Preview Strip */}
                <div className="flex items-center gap-4 flex-1">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 text-slate-400">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, "up")}
                      className="rounded p-1 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                      title="Naikkan Urutan"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[10px] text-center font-bold text-slate-500">
                      {b.sort_order ?? idx}
                    </span>
                    <button
                      type="button"
                      disabled={idx === banners.length - 1}
                      onClick={() => handleMoveOrder(idx, "down")}
                      className="rounded p-1 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                      title="Turunkan Urutan"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Banner Card Preview - Full Cover Background */}
                  <div
                    className="relative flex h-24 w-44 shrink-0 overflow-hidden rounded-xl p-3 text-white shadow-inner"
                    style={
                      !b.image_url
                        ? {
                            background: `linear-gradient(135deg, ${b.gradient_start || "#00c853"}, ${b.gradient_end || "#009624"})`,
                          }
                        : undefined
                    }
                  >
                    {b.image_url && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={b.image_url}
                          alt={b.title}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        {/* Overlay gradient 0.75 opacity */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(135deg, ${hexToRgba(b.gradient_start || "#00c853", 0.75)}, ${hexToRgba(b.gradient_end || "#009624", 0.75)})`,
                          }}
                        />
                      </>
                    )}

                    <div className="relative z-10 flex flex-col justify-between w-full h-full">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs px-1.5 py-0.5 rounded w-fit border border-white/20 shadow-xs">
                        {b.tag}
                      </span>
                      <p className="text-xs font-bold line-clamp-2 leading-snug drop-shadow-sm">
                        {b.title}
                      </p>
                    </div>
                  </div>

                  {/* Banner Info */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {b.title}
                      </h4>
                      <Badge
                        variant={b.is_active ? "success" : "secondary"}
                        className="text-[10px]"
                      >
                        {b.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        Target: {b.target_category || "Semua"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {b.subtitle}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>Tombol: <strong>{b.button_text || "Lihat Promo"}</strong></span>
                      <span>•</span>
                      <span>
                        Warna:{" "}
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          {b.gradient_start} → {b.gradient_end}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <Button
                    size="sm"
                    variant={b.is_active ? "outline" : "secondary"}
                    className="text-xs h-8"
                    onClick={() => handleToggleActive(b)}
                  >
                    {b.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    title="Edit Banner"
                    className="h-8 w-8 text-slate-600 hover:text-slate-900"
                    onClick={() => {
                      setSelectedBanner(b);
                      setIsFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    title="Hapus Banner"
                    className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => setDeleteBannerId(b.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <BannerFormDialog
        banner={selectedBanner}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleSaved}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteBannerId !== null}
        onOpenChange={(open) => !open && setDeleteBannerId(null)}
      >
        <DialogContent onClose={() => setDeleteBannerId(null)}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Hapus Banner Promosi?</DialogTitle>
            </div>
            <DialogDescription>
              Banner ini akan dihapus secara permanen dan tidak lagi tampil di aplikasi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteBannerId(null)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              isLoading={loading}
              onClick={() => deleteBannerId && handleDelete(deleteBannerId)}
            >
              Hapus Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
