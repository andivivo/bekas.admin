"use client";

import * as React from "react";
import { Order, OrderStatus } from "@/lib/types";
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
  Search,
  ExternalLink,
  Receipt,
  Package,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface OrderTableProps {
  initialOrders: Order[];
}

export function OrderTable({ initialOrders }: OrderTableProps) {
  const [orders] = React.useState<Order[]>(initialOrders);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  const filteredOrders = React.useMemo(() => {
    return orders.filter((o) => {
      const prodTitle = o.products?.title?.toLowerCase() || "";
      const orderId = o.id.toLowerCase();
      const buyerName = (o.buyer?.full_name || o.buyer?.name || "").toLowerCase();
      const sellerName = (o.seller?.full_name || o.seller?.name || "").toLowerCase();

      const matchSearch =
        searchQuery === "" ||
        orderId.includes(searchQuery.toLowerCase()) ||
        prodTitle.includes(searchQuery.toLowerCase()) ||
        buyerName.includes(searchQuery.toLowerCase()) ||
        sellerName.includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "waiting"
          ? ["waiting_payment", "pending", "waiting_cod", "paid"].includes(o.status)
          : o.status === statusFilter);

      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">Menunggu Konfirmasi</Badge>;
      case "waiting_payment":
        return <Badge variant="warning">Menunggu Bayar</Badge>;
      case "waiting_cod":
        return (
          <Badge variant="info" className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
            COD (Janjian Ketemu)
          </Badge>
        );
      case "paid":
      case "paid_in_escrow":
        return (
          <Badge variant="info" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Dana Diamankan Escrow
          </Badge>
        );
      case "shipping":
        return <Badge variant="purple">Dalam Pengiriman</Badge>;
      case "completed":
        return <Badge variant="success">Selesai</Badge>;
      case "cancelled":
        return (
          <Badge
            variant="destructive"
            className="gap-1 bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            <XCircle className="h-3 w-3" />
            <span>Dibatalkan</span>
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEscrowBadge = (escrowStatus?: string | null) => {
    if (!escrowStatus) {
      return (
        <span className="text-xs text-slate-400 italic">Belum dibuat</span>
      );
    }
    const s = escrowStatus.toLowerCase();
    if (s === "settled" || s === "success" || s === "paid") {
      return (
        <Badge variant="success" className="gap-1">
          <ShieldCheck className="h-3 w-3" />
          <span>Dana Diamankan (Xendit)</span>
        </Badge>
      );
    }
    if (s === "pending") {
      return (
        <Badge variant="warning" className="gap-1">
          <Clock className="h-3 w-3" />
          <span>Menunggu Xendit</span>
        </Badge>
      );
    }
    return <Badge variant="secondary">{escrowStatus}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Search & Status Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {[
            { label: "Semua", value: "all" },
            { label: "Menunggu", value: "waiting" },
            { label: "Dibatalkan", value: "cancelled" },
            { label: "Dalam Pengiriman", value: "shipping" },
            { label: "Selesai", value: "completed" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === tab.value
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari ID, barang, pembeli/penjual..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID & Produk</TableHead>
              <TableHead>Pihak Transaksi</TableHead>
              <TableHead>Total & Kurir</TableHead>
              <TableHead>Status Order</TableHead>
              <TableHead>Status Rekber (Escrow)</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead className="text-right">Link Xendit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                  Tidak ada transaksi order ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((o) => {
                const prod = o.products;
                const firstImg =
                  prod?.image_urls && prod.image_urls.length > 0
                    ? prod.image_urls[0]
                    : null;

                // Escrow record can be object or array
                const escrow = Array.isArray(o.escrow_transactions)
                  ? o.escrow_transactions[0]
                  : o.escrow_transactions;

                return (
                  <TableRow key={o.id}>
                    {/* Order ID & Product */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                          {firstImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={firstImg}
                              alt={prod?.title || "Product"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                            {prod?.title || "Produk dihapus"}
                          </p>
                          <p className="font-mono text-[11px] text-slate-400">
                            #{o.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Buyer & Seller */}
                    <TableCell className="text-xs">
                      <div className="space-y-1">
                        <div>
                          <span className="text-slate-400">Pembeli: </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {o.buyer?.full_name || o.buyer?.name || o.buyer_id.substring(0, 8)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Penjual: </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {o.seller?.full_name || o.seller?.name || o.seller_id.substring(0, 8)}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Total & Courier */}
                    <TableCell>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatRupiah(o.total_amount)}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Truck className="h-3 w-3" />
                        <span>{o.courier_name || "COD / Standar"}</span>
                      </p>
                    </TableCell>

                    {/* Order Status */}
                    <TableCell>
                      <div className="space-y-1.5 min-w-[170px]">
                        {getOrderStatusBadge(o.status)}
                        {o.status === "cancelled" && (
                          <div className="rounded-lg border border-rose-200 bg-rose-50/80 p-2 text-[11px] text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                            <p className="font-semibold text-rose-700 dark:text-rose-300 leading-tight">
                              {o.cancellation_reason || "Tanpa alasan"}
                            </p>
                            <p className="text-[10px] text-rose-600/90 dark:text-rose-400/80 mt-1">
                              Dibatalkan oleh:{" "}
                              <span className="font-medium">
                                {o.cancelled_by === o.buyer_id
                                  ? `Pembeli (${o.buyer?.full_name || o.buyer?.name || "User"})`
                                  : o.cancelled_by === o.seller_id
                                  ? `Penjual (${o.seller?.full_name || o.seller?.name || "User"})`
                                  : o.cancelled_by
                                  ? "Admin / Sistem"
                                  : "Pengguna"}
                              </span>
                            </p>
                            {o.cancelled_at && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Pada: {formatDate(o.cancelled_at)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Escrow Status */}
                    <TableCell>{getEscrowBadge(escrow?.status)}</TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(o.created_at)}
                    </TableCell>

                    {/* Link Xendit */}
                    <TableCell className="text-right">
                      {escrow?.xendit_payment_url ? (
                        <a
                          href={escrow.xendit_payment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                        >
                          <span>Invoice Xendit</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
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
              {filteredOrders.length > 0
                ? (currentPage - 1) * itemsPerPage + 1
                : 0}
            </strong>{" "}
            -{" "}
            <strong>
              {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
            </strong>{" "}
            dari <strong>{filteredOrders.length}</strong> transaksi
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
    </div>
  );
}
