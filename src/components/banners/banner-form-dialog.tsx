"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Banner,
  APP_CATEGORIES,
  MARQUEE_BANNER_PRESETS,
  MarqueePreset,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import {
  Upload,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Info,
} from "lucide-react";

interface BannerFormDialogProps {
  banner: Banner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (savedBanner: Banner) => void;
}

export function BannerFormDialog({
  banner,
  open,
  onOpenChange,
  onSuccess,
}: BannerFormDialogProps) {
  const isEditing = Boolean(banner);
  const [tag, setTag] = React.useState("PROMO SPESIAL");
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [buttonText, setButtonText] = React.useState("Lihat Promo");
  const [targetCategory, setTargetCategory] = React.useState("all");
  const [actionUrl, setActionUrl] = React.useState("");
  const [gradientStart, setGradientStart] = React.useState("#00C853");
  const [gradientEnd, setGradientEnd] = React.useState("#009624");
  const [imageUrl, setImageUrl] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [sortOrder, setSortOrder] = React.useState(0);

  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const supabase = createClient();
  const { toast } = useToast();

  React.useEffect(() => {
    if (banner) {
      setTag(banner.tag || "PROMO SPESIAL");
      setTitle(banner.title || "");
      setSubtitle(banner.subtitle || "");
      setButtonText(banner.button_text || "Lihat Promo");
      setTargetCategory(banner.target_category || "all");
      setActionUrl(banner.action_url || "");
      setGradientStart(banner.gradient_start || "#00C853");
      setGradientEnd(banner.gradient_end || "#009624");
      setImageUrl(banner.image_url || "");
      setIsActive(banner.is_active ?? true);
      setSortOrder(banner.sort_order ?? 0);
    } else {
      setTag("PROMO GADGET");
      setTitle("");
      setSubtitle("");
      setButtonText("Cek Promo");
      setTargetCategory("all");
      setActionUrl("");
      setGradientStart("#00C853");
      setGradientEnd("#009624");
      setImageUrl("");
      setIsActive(true);
      setSortOrder(0);
    }
    setError(null);
  }, [banner, open]);

  // Apply one of the 5 official Marquee presets from the app
  const applyPreset = (preset: MarqueePreset) => {
    setTag(preset.tag);
    setTitle(preset.title);
    setSubtitle(preset.subtitle);
    setButtonText(preset.btn);
    setActionUrl(preset.url);
    setImageUrl(preset.image);
    setTargetCategory(preset.targetCategory);
    toast(`Preset "${preset.label}" berhasil diterapkan!`, "info");
  };

  // Handle Supabase Storage upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      // Buckets to try in order
      const bucketsToTry = ["banners", "product-images", "avatars"];
      let uploadSuccess = false;
      let usedBucket = "banners";
      let uploadPath = filePath;

      for (const bucket of bucketsToTry) {
        const res = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { upsert: true });

        if (!res.error && res.data) {
          uploadSuccess = true;
          usedBucket = bucket;
          uploadPath = res.data.path;
          break;
        }
      }

      if (!uploadSuccess) {
        throw new Error(
          "Bucket storage belum tersedia. Pastikan bucket 'banners' atau 'product-images' sudah dibuat di Supabase, atau masukkan tautan URL foto langsung."
        );
      }

      const { data: urlData } = supabase.storage
        .from(usedBucket)
        .getPublicUrl(uploadPath);

      setImageUrl(urlData.publicUrl);
      toast(`Foto banner berhasil diunggah ke storage '${usedBucket}'!`, "success");
    } catch (err: unknown) {
      setError(
        `Upload gagal: ${
          err instanceof Error ? err.message : "Coba masukkan tautan URL gambar secara manual."
        }`
      );
    } finally {
      setUploading(false);
    }
  };

  const handleTestLink = () => {
    if (!actionUrl.trim()) {
      toast("Masukkan tautan URL terlebih dahulu.", "info");
      return;
    }
    try {
      window.open(actionUrl.trim(), "_blank", "noopener,noreferrer");
    } catch {
      toast("Format URL tidak valid.", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subtitle.trim()) {
      setError("Judul dan Subtitle banner wajib diisi.");
      return;
    }

    if (!imageUrl.trim()) {
      setError("Foto latar banner (Image URL) wajib diisi sesuai format Marquee aplikasi.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        tag: tag.trim() || "PROMO",
        title: title.trim(),
        subtitle: subtitle.trim(),
        button_text: buttonText.trim() || "Lihat Promo",
        target_category: targetCategory.trim() || "all",
        action_url: actionUrl.trim() || null,
        gradient_start: gradientStart,
        gradient_end: gradientEnd,
        image_url: imageUrl.trim() || null,
        is_active: isActive,
        sort_order: Number(sortOrder) || 0,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && banner) {
        const { data, error: updateError } = await supabase
          .from("banners")
          .update(payload)
          .eq("id", banner.id)
          .select()
          .single();

        if (updateError) throw updateError;
        toast("Banner Marquee berhasil diperbarui!", "success");
        onSuccess(data as Banner);
      } else {
        const { data, error: insertError } = await supabase
          .from("banners")
          .insert(payload)
          .select()
          .single();

        if (insertError) throw insertError;
        toast("Banner Marquee baru berhasil ditambahkan!", "success");
        onSuccess(data as Banner);
      }
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan banner.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-3xl" onClose={() => onOpenChange(false)}>
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Sliders className="h-4 w-4" />
              </span>
              <div>
                <DialogTitle>
                  {isEditing ? "Edit Banner Marquee Aplikasi" : "Tambah Banner Marquee Baru"}
                </DialogTitle>
                <DialogDescription>
                  Format banner kontinu 280×88px dengan background foto asli dan overlay gelap 50%.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {error && (
            <div className="my-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Quick Presets Bar */}
          <div className="my-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Pilih Preset Cepat (Format Resmi Aplikasi):
              </span>
              <span className="text-[11px] text-slate-400">1-Klik Langsung Isi Form</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MARQUEE_BANNER_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* LIVE PREVIEW BANNER MARQUEE (Exact 280x88px Ratio & Styling) */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pratinjau Akurat Marquee Berjalan (280px × 88px)
              </label>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Identik dengan Tampilan di Aplikasi Flutter
              </span>
            </div>

            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              {/* Exact Card Preview */}
              <div
                className="relative overflow-hidden shadow-md select-none transition-all"
                style={{
                  width: "280px",
                  height: "88px",
                  borderRadius: "16px",
                  backgroundColor: "#1e293b",
                }}
              >
                {/* 1. Background Photo */}
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={title || "Banner Preview"}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400"
                    style={{
                      background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                    }}
                  >
                    <span>Masukkan URL Foto Latar</span>
                  </div>
                )}

                {/* 2. Dark Overlay 50% */}
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                />

                {/* 3. Content: Left Text + Right Amber Button */}
                <div className="relative z-10 flex h-full w-full items-center justify-between p-[12px] text-white">
                  {/* Left Column: Title & Subtitle */}
                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <p
                      className="text-[15px] font-bold text-white leading-tight truncate drop-shadow-sm"
                      style={{ letterSpacing: "-0.2px" }}
                    >
                      {title || "Judul Banner Marquee"}
                    </p>
                    <p
                      className="text-[12px] text-white/85 line-clamp-2 leading-[1.25] mt-1 drop-shadow-xs"
                    >
                      {subtitle || "Kondisi mulus 99%, siap pakai & negosiasi aman."}
                    </p>
                  </div>

                  {/* Right Button: Amber #FFB020, black text, arrow icon */}
                  <div className="shrink-0 self-end">
                    <div
                      className="flex items-center gap-1 rounded-[10px] px-2.5 py-1 text-[11px] font-bold shadow-sm"
                      style={{
                        backgroundColor: "#FFB020",
                        color: "#000000",
                      }}
                    >
                      <span>{buttonText || "Lihat Promo"}</span>
                      <ArrowRight className="h-3 w-3 stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Scrollable Fields */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Tag & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tag / Label Banner
                </label>
                <Input
                  required
                  placeholder="Contoh: PROMO GADGET, BUTUH UANG"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Kategori Aplikasi <span className="text-emerald-500 font-normal">(8 Kategori Resmi)</span>
                </label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                >
                  {APP_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Judul Banner (Tebal, 15px, 1 Baris) <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                maxLength={45}
                placeholder="Contoh: Gadget & iPhone Bekas Mulus"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Sub Judul (12px, Maksimal 2 Baris) <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                maxLength={90}
                placeholder="Contoh: Kondisi mulus 99%, baterai awet & siap pakai langsung"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            {/* Button text & Sort order */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Teks Tombol Amber (Kanan Bawah)
                </label>
                <Input
                  required
                  placeholder="Cek Promo"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Urutan Marquee (Sort Order)
                </label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            {/* Action / Link URL */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tautan Aksi / Link URL (Membuka via Browser di Aplikasi)
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  placeholder="https://bekasaja.id/promo/gadget"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  className="text-xs flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestLink}
                  className="gap-1 text-xs shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Uji Tautan</span>
                </Button>
              </div>
            </div>

            {/* Mandatory Background Image URL */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Foto Latar Banner (Wajib Foto Asli) <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-slate-400 font-normal">Mendukung Unsplash & Supabase Storage</span>
              </label>
              <div className="flex items-center gap-2">
                <Input
                  required
                  placeholder="https://images.unsplash.com/... atau klik tombol Unggah"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="text-xs flex-1"
                />
                <label className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs whitespace-nowrap"
                    isLoading={uploading}
                    onClick={() => document.getElementById("banner-file-input")?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Unggah File</span>
                  </Button>
                  <input
                    id="banner-file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>

            {/* Active Toggle & Specifications Notice */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-start gap-2.5">
                <Info className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Status Tayang di Marquee Berjalan
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Banner aktif akan otomatis masuk ke pita bergerak infinite di beranda aplikasi Flutter.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              isLoading={submitting}
            >
              {isEditing ? "Simpan Perubahan Banner" : "Tambahkan ke Marquee Aplikasi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
