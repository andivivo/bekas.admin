"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banner } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Upload, Sparkles, Image as ImageIcon } from "lucide-react";

interface BannerFormDialogProps {
  banner: Banner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (savedBanner: Banner) => void;
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
      setTag("PROMO SPESIAL");
      setTitle("");
      setSubtitle("");
      setButtonText("Lihat Promo");
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

      // Coba upload ke bucket 'banners', jika belum ada fallback ke 'product-images'
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
          "Bucket storage ('banners' atau 'product-images') belum dibuat di Supabase Storage. Buat bucket 'banners' di Supabase atau masukkan URL gambar secara manual."
        );
      }

      const { data: urlData } = supabase.storage
        .from(usedBucket)
        .getPublicUrl(uploadPath);

      setImageUrl(urlData.publicUrl);
      toast(`Gambar banner berhasil diunggah ke storage '${usedBucket}'!`, "success");
    } catch (err: unknown) {
      setError(
        `Upload gagal: ${
          err instanceof Error ? err.message : "Coba masukkan URL gambar secara manual."
        }`
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subtitle.trim() || !tag.trim()) {
      setError("Judul, Subtitle, dan Tag banner wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        tag: tag.trim(),
        title: title.trim(),
        subtitle: subtitle.trim(),
        button_text: buttonText.trim(),
        target_category: targetCategory.trim(),
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
        toast("Banner promo berhasil diperbarui!", "success");
        onSuccess(data as Banner);
      } else {
        const { data, error: insertError } = await supabase
          .from("banners")
          .insert(payload)
          .select()
          .single();

        if (insertError) throw insertError;
        toast("Banner promo baru berhasil ditambahkan!", "success");
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
      <DialogContent maxWidth="max-w-2xl" onClose={() => onOpenChange(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Banner Promo" : "Tambah Banner Promo Baru"}
            </DialogTitle>
            <DialogDescription>
              Atur tampilan kartu promosi yang tampil di slider beranda aplikasi.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Live Preview Card */}
          <div className="my-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Pratinjau Tampilan (Live Preview)
            </label>
            <div
              className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg transition-all min-h-[140px]"
              style={
                !imageUrl
                  ? {
                      background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                    }
                  : undefined
              }
            >
              {imageUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Banner Preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  {/* Overlay gradient 0.75 opacity */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${hexToRgba(gradientStart || "#00c853", 0.75)}, ${hexToRgba(gradientEnd || "#009624", 0.75)})`,
                    }}
                  />
                </>
              )}

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="space-y-1.5 max-w-sm">
                  <span className="inline-block rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase backdrop-blur-sm border border-white/20">
                    {tag || "PROMO SPESIAL"}
                  </span>
                  <h4 className="text-xl font-bold tracking-tight drop-shadow-sm">
                    {title || "Judul Banner Promosi"}
                  </h4>
                  <p className="text-xs text-white/95 leading-relaxed drop-shadow-xs">
                    {subtitle || "Dapatkan potongan harga dan penawaran terbaik untuk gadget pilihanmu."}
                  </p>
                  <div className="pt-2">
                    <span className="inline-block rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-slate-900 shadow-sm">
                      {buttonText || "Lihat Promo"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {/* Tag & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tag Banner <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Contoh: CASHBACK 50%, TERLARIS"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Kategori
                </label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value="all">Semua Kategori (all)</option>
                  <option value="smartphone">Smartphone</option>
                  <option value="laptop">Laptop & Komputer</option>
                  <option value="kamera">Kamera & Fotografi</option>
                  <option value="audio">Audio & Speaker</option>
                  <option value="aksesoris">Aksesoris</option>
                </select>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Judul Utama <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="Contoh: Upgrade Gadget Impianmu Hari Ini"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Sub Judul / Keterangan <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="Contoh: Garansi resmi, siap kirim dengan escrow terjamin."
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            {/* Button text & Action URL */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Teks Tombol
                </label>
                <Input
                  placeholder="Lihat Promo"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Urutan Tampil (Sort Order)
                </label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            {/* Color Pickers for Gradient */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Warna Awal (Gradient Start)
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={gradientStart}
                    onChange={(e) => setGradientStart(e.target.value)}
                    className="h-8 w-12 rounded cursor-pointer border border-slate-300 bg-transparent"
                  />
                  <Input
                    value={gradientStart}
                    onChange={(e) => setGradientStart(e.target.value)}
                    className="text-xs font-mono uppercase h-8"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Warna Akhir (Gradient End)
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={gradientEnd}
                    onChange={(e) => setGradientEnd(e.target.value)}
                    className="h-8 w-12 rounded cursor-pointer border border-slate-300 bg-transparent"
                  />
                  <Input
                    value={gradientEnd}
                    onChange={(e) => setGradientEnd(e.target.value)}
                    className="text-xs font-mono uppercase h-8"
                  />
                </div>
              </div>
            </div>

            {/* Image Upload / URL */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Gambar Banner (Unggah / URL)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="https://... atau klik tombol unggah"
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
                    <span>Upload Foto</span>
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

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Status Banner Aktif
                </p>
                <p className="text-[11px] text-slate-400">
                  Jika aktif, banner akan tampil di carousel aplikasi
                </p>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
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
              {isEditing ? "Simpan Perubahan" : "Tambah Banner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
