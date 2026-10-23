"use client";

import * as React from "react";
import { Product, ProductStatus } from "@/lib/types";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { RejectDialog } from "./reject-dialog";
import { ProductDetailDialog } from "./product-detail-dialog";
import {
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Package,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ProductTableProps {
  initialProducts: Product[];
  initialStatusFilter?: string;
}

export function ProductTable({
  initialProducts,
  initialStatusFilter = "all",
}: ProductTableProps) {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>(initialStatusFilter);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  // Sync state when props change (e.g. from page navigation)
  React.useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  React.useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  // Dialog states
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isRejectOpen, setIsRejectOpen] = React.useState(false);

  // Confirmation dialogs
  const [confirmApproveId, setConfirmApproveId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  const { toast } = useToast();
  const supabase = createClient();

  // Filter products
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        searchQuery === "" ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active"
          ? p.status === "active" || p.status === "approved"
          : p.status === statusFilter);

      return matchSearch && matchStatus;
    });
  }, [products, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Actions
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

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, status: "active", rejection_reason: null } : p
        )
      );
      toast("Iklan berhasil disetujui dan aktif tayang!", "success");
      setConfirmApproveId(null);
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

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, status: "rejected", rejection_reason: reason }
          : p
      )
    );
    toast("Iklan telah ditolak dengan catatan untuk penjual.", "info");
  };

  const handleDelete = async (productId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast("Produk berhasil dihapus permanen.", "success");
      setConfirmDeleteId(null);
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : "Gagal menghapus produk.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const statusTabs: { label: string; value: string; count: number }[] = [
    { label: "Semua", value: "all", count: products.length },
    {
      label: "Pending",
      value: "pending",
      count: products.filter((p) => p.status === "pending").length,
    },
    {
      label: "Aktif",
      value: "active",
      count: products.filter(
        (p) => p.status === "active" || p.status === "approved"
      ).length,
    },
    {
      label: "Ditolak",
      value: "rejected",
      count: products.filter((p) => p.status === "rejected").length,
    },
    {
      label: "Terjual",
      value: "sold",
      count: products.filter((p) => p.status === "sold").length,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Status Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === tab.value
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  statusFilter === tab.value
                    ? "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari judul, kategori, kota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Kategori & Kondisi</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                  Tidak ada produk ditemukan sesuai filter.
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((p) => {
                const firstImg =
                  p.image_urls && p.image_urls.length > 0 ? p.image_urls[0] : null;

                return (
                  <TableRow key={p.id}>
                    {/* Product Info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                          {firstImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={firstImg}
                              alt={p.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <Package className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="truncate font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {p.title}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {p.location || "Indonesia"}
                          </p>
                          {p.is_nego_allowed && (
                            <span className="inline-block rounded bg-sky-50 px-1.5 py-0.2 text-[10px] font-medium text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                              Bisa Nego
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Category & Condition */}
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="secondary" className="capitalize text-xs">
                          {p.category}
                        </Badge>
                        <span className="text-[11px] text-slate-500">
                          Kondisi: {p.condition}
                        </span>
                      </div>
                    </TableCell>

                    {/* Price */}
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(p.price)}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <Badge
                        variant={
                          p.status === "active" || p.status === "approved"
                            ? "success"
                            : p.status === "pending"
                            ? "warning"
                            : p.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                        className="capitalize text-xs"
                      >
                        {p.status}
                      </Badge>
                      {p.rejection_reason && (
                        <p className="mt-1 max-w-[160px] truncate text-[10px] text-rose-500" title={p.rejection_reason}>
                          Alasan: {p.rejection_reason}
                        </p>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(p.created_at)}
                    </TableCell>

                    {/* Action Buttons */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Detail / View */}
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Lihat Rincian"
                          onClick={() => {
                            setSelectedProduct(p);
                            setIsDetailOpen(true);
                          }}
                          className="h-8 w-8 text-slate-500 hover:text-slate-900"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Approve Button (if pending) */}
                        {p.status === "pending" && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 gap-1 px-2.5 font-semibold shadow-sm"
                            title="Setujui Iklan (Approve)"
                            onClick={() => setConfirmApproveId(p.id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </Button>
                        )}

                        {/* Reject Button (if pending) */}
                        {p.status === "pending" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs h-7 gap-1 px-2.5 font-semibold shadow-sm"
                            title="Tolak Iklan (Reject)"
                            onClick={() => {
                              setSelectedProduct(p);
                              setIsRejectOpen(true);
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </Button>
                        )}

                        {/* Reject Button (if active) */}
                        {p.status === "active" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Tolak Iklan"
                            onClick={() => {
                              setSelectedProduct(p);
                              setIsRejectOpen(true);
                            }}
                            className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Delete Button */}
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Hapus Produk"
                          onClick={() => setConfirmDeleteId(p.id)}
                          className="h-8 w-8 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan{" "}
            <strong>
              {filteredProducts.length > 0
                ? (currentPage - 1) * itemsPerPage + 1
                : 0}
            </strong>{" "}
            -{" "}
            <strong>
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
            </strong>{" "}
            dari <strong>{filteredProducts.length}</strong> produk
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <DialogContent onClose={() => setConfirmDeleteId(null)}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Hapus Produk Secara Permanen?</DialogTitle>
            </div>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data iklan produk dan riwayatnya
              akan dihapus dari database Supabase.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteId(null)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              isLoading={actionLoading}
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
