"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Product, getCategoryName } from "@/lib/types";
import { MapPin, Tag, ShieldCheck, Check, AlertTriangle, Layers, Info, Handshake } from "lucide-react";

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (productId: string) => void;
  onReject?: (product: Product) => void;
}

export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: ProductDetailDialogProps) {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (product && product.image_urls && product.image_urls.length > 0) {
      setSelectedImage(product.image_urls[0]);
    } else {
      setSelectedImage(null);
    }
  }, [product]);

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-3xl" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-xl">{product.title}</DialogTitle>
            <Badge
              variant={
                product.status === "active" || product.status === "approved"
                  ? "success"
                  : product.status === "pending"
                  ? "warning"
                  : product.status === "rejected"
                  ? "destructive"
                  : "secondary"
              }
              className="capitalize text-xs"
            >
              Status: {product.status}
            </Badge>
          </div>
          <DialogDescription className="flex items-center gap-3 text-xs">
            <span>Kategori: <strong>{getCategoryName(product.category)}</strong></span>
            <span>•</span>
            <span>Dibuat: {formatDate(product.created_at)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2 mt-2 max-h-[70vh] overflow-y-auto pr-1">
          {/* Left: Image gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
              {selectedImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedImage}
                  alt={product.title}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  Tidak ada foto
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.image_urls && product.image_urls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.image_urls.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === img
                        ? "border-emerald-500 ring-2 ring-emerald-500/30"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Thumb ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Specifications & Details */}
          <div className="space-y-4 text-sm">
            {/* Price Box */}
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-semibold">
                Harga Jual
              </span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatRupiah(product.price)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={product.is_nego_allowed ? "info" : "outline"}>
                  {product.is_nego_allowed ? "Bisa Nego" : "Harga Pas"}
                </Badge>
                {product.condition && (
                  <Badge variant="secondary">Kondisi: {product.condition}</Badge>
                )}
              </div>
            </div>

            {/* Key Specs */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>Lokasi: <strong>{product.location || "Indonesia"}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Layers className="h-4 w-4 text-slate-400" />
                <span>Kelengkapan: <strong>{product.completeness || "Unit saja"}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Info className="h-4 w-4 text-slate-400" />
                <span>Minus: <strong>{product.minus_info || "Tidak ada minus"}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Handshake className="h-4 w-4 text-slate-400" />
                <span>
                  Metode Transaksi:{" "}
                  <strong>
                    {product.transaction_method === "cod"
                      ? "COD Janjian Saja"
                      : product.transaction_method === "escrow"
                      ? "Rekber Escrow Xendit Saja"
                      : "Bisa COD & Rekber Escrow"}
                  </strong>
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Deskripsi Barang
              </h4>
              <p className="whitespace-pre-line text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                {product.description || "Tidak ada deskripsi rinci."}
              </p>
            </div>

            {/* Rejection Reason if any */}
            {product.rejection_reason && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
                <strong className="block mb-0.5">Catatan Penolakan Admin:</strong>
                {product.rejection_reason}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          {product.status === "pending" && onReject && (
            <Button
              variant="destructive"
              onClick={() => {
                onOpenChange(false);
                onReject(product);
              }}
            >
              Tolak Iklan
            </Button>
          )}
          {product.status === "pending" && onApprove && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
              onClick={() => {
                onOpenChange(false);
                onApprove(product.id);
              }}
            >
              <Check className="h-4 w-4" />
              Setujui (Approve)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
