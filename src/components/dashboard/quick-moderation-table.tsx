"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { ProductDetailDialog } from "@/components/products/product-detail-dialog";
import { RejectDialog } from "@/components/products/reject-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Eye,
  Package,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface QuickModerationTableProps {
  initialPendingProducts: Product[];
  totalPendingCount: number;
}

export function QuickModerationTable({
  initialPendingProducts,
  totalPendingCount,
}: QuickModerationTableProps) {
  const [products, setProducts] = React.useState<Product[]>(initialPendingProducts);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isRejectOpen, setIsRejectOpen] = React.useState(false);
  const [confirmApproveId, setConfirmApproveId] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  React.useEffect(() => {
    setProducts(initialPendingProducts);
  }, [initialPendingProducts]);

  const handleApprove = async (productId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          status: "active",
          rejection_reason: null,
        })
        .eq("id", productId);

      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast("Iklan berhasil disetujui dan aktif tayang!", "success");
      setConfirmApproveId(null);
      setIsDetailOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : "Gagal menyetujui iklan.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (productId: string, reason: string) => {
    const { error } = await supabase
      .from("products")
      .update({
        status: "rejected",
        rejection_reason: reason,
      })
      .eq("id", productId);

    if (error) throw error;

    setProducts((prev) => prev.filter((p) => p.id !== productId));
    toast("Iklan telah ditolak dengan catatan untuk penjual.", "info");
    setIsRejectOpen(false);
    setIsDetailOpen(false);
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Iklan Menunggu Moderasi</span>
            {products.length > 0 && (
              <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 text-xs px-2 py-0.5 font-semibold">
                {products.length}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400">
            Periksa kelayakan barang sebelum tayang di beranda bekasAja
          </p>
        </div>
        <Link href="/products?status=pending">
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <span>Kelola Semua Produk ({totalPendingCount})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        {products.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="font-medium text-slate-700 dark:text-slate-300">
              Semua iklan sudah dimoderasi!
            </p>
            <p className="text-xs text-slate-400">
              Tidak ada produk berstatus pending saat ini.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 text-xs text-slate-500 uppercase tracking-wider dark:bg-slate-800/50">
              <tr>
                <th className="p-4 font-semibold">Produk</th>
                <th className="p-4 font-semibold">Kategori</th>
                <th className="p-4 font-semibold">Harga</th>
                <th className="p-4 font-semibold">Waktu Masuk</th>
                <th className="p-4 font-semibold text-right">Aksi Moderasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((prod) => {
                const firstImg =
                  prod.image_urls && prod.image_urls.length > 0
                    ? prod.image_urls[0]
                    : null;

                return (
                  <tr
                    key={prod.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                          {firstImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={firstImg}
                              alt={prod.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">
                            {prod.title}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            ID: {prod.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className="capitalize">
                        {prod.category}
                      </Badge>
                    </td>
                    <td className="p-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(prod.price)}
                    </td>
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(prod.created_at)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Review / Detail Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 gap-1 px-2.5 font-medium"
                          title="Lihat Detail Produk"
                          onClick={() => {
                            setSelectedProduct(prod);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Review</span>
                        </Button>

                        {/* Approve Quick Button */}
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 gap-1 px-2.5 font-semibold shadow-sm"
                          title="Setujui Iklan (Approve)"
                          onClick={() => setConfirmApproveId(prod.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </Button>

                        {/* Reject Quick Button */}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs h-7 gap-1 px-2.5 font-semibold shadow-sm"
                          title="Tolak Iklan (Reject)"
                          onClick={() => {
                            setSelectedProduct(prod);
                            setIsRejectOpen(true);
                          }}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onApprove={(id) => handleApprove(id)}
        onReject={(prod) => {
          setSelectedProduct(prod);
          setIsRejectOpen(true);
        }}
      />

      {/* Reject Dialog */}
      <RejectDialog
        product={selectedProduct}
        open={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        onConfirm={handleRejectConfirm}
      />

      {/* Approve Confirmation Dialog */}
      <Dialog
        open={confirmApproveId !== null}
        onOpenChange={(open) => !open && setConfirmApproveId(null)}
      >
        <DialogContent onClose={() => setConfirmApproveId(null)}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-5 w-5" />
              <DialogTitle>Konfirmasi Persetujuan Iklan</DialogTitle>
            </div>
            <DialogDescription>
              Apakah Anda yakin ingin menyetujui iklan ini? Iklan akan berstatus{" "}
              <strong>Aktif</strong> dan langsung tampil di halaman depan aplikasi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmApproveId(null)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              isLoading={actionLoading}
              onClick={() => confirmApproveId && handleApprove(confirmApproveId)}
            >
              Ya, Setujui Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
