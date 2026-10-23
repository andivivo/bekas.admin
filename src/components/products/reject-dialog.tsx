"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { Product } from "@/lib/types";

interface RejectDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (productId: string, reason: string) => Promise<void>;
}

export function RejectDialog({
  product,
  open,
  onOpenChange,
  onConfirm,
}: RejectDialogProps) {
  const [reason, setReason] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (!reason.trim()) {
      setError("Alasan penolakan wajib diisi untuk penjual.");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(product.id, reason.trim());
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menolak produk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
              <DialogTitle>Tolak Publikasi Iklan</DialogTitle>
            </div>
            <DialogDescription>
              Berikan alasan yang jelas mengapa iklan{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                &ldquo;{product?.title}&rdquo;
              </strong>{" "}
              ditolak. Alasan ini akan tampil di aplikasi penjual.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="space-y-2 mt-4">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Alasan Penolakan <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={4}
              required
              placeholder="Contoh: Foto produk buram/tidak asli, harga tidak wajar, atau barang melanggar ketentuan barang terlarang."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
            />
            {/* Quick reason suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                "Foto produk tidak jelas / buram",
                "Deskripsi kurang lengkap",
                "Harga tidak wajar",
                "Produk melanggar syarat & ketentuan",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setReason(suggestion)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="destructive"
              isLoading={loading}
              className="gap-2"
            >
              Tolak Iklan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
