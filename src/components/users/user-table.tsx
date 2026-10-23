"use client";

import * as React from "react";
import { Profile } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Search,
  UserX,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Users,
  ChevronLeft,
  ChevronRight,
  Info,
  RotateCcw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserTableProps {
  initialUsers: Profile[];
}

const BLOCK_REASON_PRESETS = [
  "Indikasi Penipuan Transaksi / Rekber Xendit",
  "Menjual Barang Palsu / Rekondisi Tanpa Keterangan",
  "Spam Iklan Berlebihan / Manipulasi Harga",
  "Pelecehan / Kata-kata Kasar di Fitur Chat",
  "Palsu / Rekayasa Dokumen KTP (Identitas Palsu)",
  "Menolak Pengiriman Barang Setelah Pembayaran",
  "Pelanggaran Ketentuan Komunitas Lainnya",
];

export function UserTable({ initialUsers }: UserTableProps) {
  const [users, setUsers] = React.useState<Profile[]>(initialUsers);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  // Block modal state
  const [targetBlockUser, setTargetBlockUser] = React.useState<Profile | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState(BLOCK_REASON_PRESETS[0]);
  const [customReason, setCustomReason] = React.useState("");

  // Unblock modal state
  const [targetUnblockUser, setTargetUnblockUser] = React.useState<Profile | null>(null);

  // Detail reason modal state
  const [detailUser, setDetailUser] = React.useState<Profile | null>(null);

  // Loading state
  const [actionLoading, setActionLoading] = React.useState(false);

  const { toast } = useToast();
  const supabase = createClient();

  React.useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // Statistik ringkasan
  const totalUsers = users.length;
  const blockedUsers = users.filter((u) => u.is_blocked === true);
  const activeUsers = users.filter((u) => !u.is_blocked);
  const verifiedUsers = users.filter((u) => u.is_verified === true || u.verification_status === "verified");

  // Filtering data
  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const name = (u.full_name || u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = (u.phone || u.phone_number || "").toLowerCase();
      const city = (u.city || "").toLowerCase();
      const id = u.id.toLowerCase();

      const matchSearch =
        searchQuery === "" ||
        name.includes(searchQuery.toLowerCase()) ||
        email.includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery.toLowerCase()) ||
        city.includes(searchQuery.toLowerCase()) ||
        id.includes(searchQuery.toLowerCase());

      let matchStatus = true;
      if (statusFilter === "active") {
        matchStatus = !u.is_blocked;
      } else if (statusFilter === "blocked") {
        matchStatus = u.is_blocked === true;
      } else if (statusFilter === "verified") {
        matchStatus = u.is_verified === true || u.verification_status === "verified";
      } else if (statusFilter === "unverified") {
        matchStatus = !u.is_verified && u.verification_status !== "verified";
      }

      return matchSearch && matchStatus;
    });
  }, [users, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Handler blokir user
  const handleConfirmBlock = async () => {
    if (!targetBlockUser) return;
    setActionLoading(true);

    const fullReason = customReason.trim()
      ? `${selectedCategory} - Catatan: ${customReason.trim()}`
      : selectedCategory;

    const nowIso = new Date().toISOString();

    try {
      const {
        data: { user: adminUser },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("profiles")
        .update({
          is_blocked: true,
          block_reason: fullReason,
          blocked_at: nowIso,
          blocked_by: adminUser?.id || null,
          updated_at: nowIso,
        })
        .eq("id", targetBlockUser.id);

      if (error) {
        // Cek jika error karena kolom belum ada
        if (error.message.includes("is_blocked")) {
          throw new Error(
            "Kolom 'is_blocked' belum dibuat di database Supabase. Silakan jalankan file SQL 'supabase_user_block_migration.sql' di SQL Editor Supabase terlebih dahulu."
          );
        }
        throw error;
      }

      // Otomatis tolak produk aktif milik user yang diblokir agar pembeli terlindungi
      try {
        await supabase
          .from("products")
          .update({
            status: "rejected",
            rejection_reason: `Akun penjual diblokir: ${fullReason}`,
          })
          .eq("seller_id", targetBlockUser.id)
          .in("status", ["active", "approved", "pending"]);
      } catch {
        // optional background product suppression
      }

      // Update state lokal
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetBlockUser.id
            ? {
                ...u,
                is_blocked: true,
                block_reason: fullReason,
                blocked_at: nowIso,
                blocked_by: adminUser?.id || null,
              }
            : u
        )
      );

      toast(
        `Pengguna ${targetBlockUser.full_name || targetBlockUser.name} berhasil diblokir. Akses dan produk pengguna telah dinonaktifkan.`,
        "success"
      );

      setTargetBlockUser(null);
      setCustomReason("");
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : "Gagal memblokir pengguna.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Handler buka blokir user
  const handleConfirmUnblock = async () => {
    if (!targetUnblockUser) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_blocked: false,
          block_reason: null,
          blocked_at: null,
          blocked_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetUnblockUser.id);

      if (error) throw error;

      // Update state lokal
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUnblockUser.id
            ? {
                ...u,
                is_blocked: false,
                block_reason: null,
                blocked_at: null,
                blocked_by: null,
              }
            : u
        )
      );

      toast(
        `Pemblokiran untuk ${targetUnblockUser.full_name || targetUnblockUser.name} telah dibuka. Akun kembali aktif.`,
        "success"
      );

      setTargetUnblockUser(null);
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : "Gagal membuka blokir pengguna.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards Ringkasan */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Pengguna
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {totalUsers}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Terdaftar di Supabase</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Akun Aktif
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeUsers.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Dapat bertransaksi & jual</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Terverifikasi KYC
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {verifiedUsers.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Memiliki badge centang biru</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Akun Diblokir
            </p>
            <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {blockedUsers.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Penipuan & pelanggaran</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
            <Ban className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Pencarian */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <span>Semua</span>
            <span className="rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-1.5 text-[10px]">
              {totalUsers}
            </span>
          </button>

          <button
            onClick={() => {
              setStatusFilter("active");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "active"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <span>Aktif</span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 text-[10px]">
              {activeUsers.length}
            </span>
          </button>

          <button
            onClick={() => {
              setStatusFilter("blocked");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "blocked"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <span>Diblokir</span>
            <span className="rounded-full bg-rose-500 text-white px-1.5 text-[10px]">
              {blockedUsers.length}
            </span>
          </button>

          <button
            onClick={() => {
              setStatusFilter("verified");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "verified"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <span>Terverifikasi KYC</span>
            <span className="rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-1.5 text-[10px]">
              {verifiedUsers.length}
            </span>
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama, email, HP, kota, User ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Tabel Pengguna */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profil Pengguna</TableHead>
              <TableHead>Status Akses</TableHead>
              <TableHead>Status KYC</TableHead>
              <TableHead>Keterangan / Alasan Blokir</TableHead>
              <TableHead>Terdaftar Sejak</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                  Tidak ada pengguna ditemukan sesuai filter atau kata kunci.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((u) => {
                const displayName = u.full_name || u.name || "Pengguna bekasAja";
                const isBlocked = u.is_blocked === true;
                const isVerified = u.is_verified === true || u.verification_status === "verified";

                return (
                  <TableRow key={u.id} className={isBlocked ? "bg-rose-50/40 dark:bg-rose-950/20" : ""}>
                    {/* Profil Pengguna */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                          {u.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={u.avatar_url}
                              alt={displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            displayName[0]?.toUpperCase() || "U"
                          )}
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                              {displayName}
                            </p>
                            {isVerified && (
                              <span title="Terverifikasi KYC">
                                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate">
                            {u.email || u.phone || u.phone_number || "Tidak ada email"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {u.city && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                {u.city}
                              </span>
                            )}
                            <span className="font-mono text-[10px] text-slate-400">
                              #{u.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status Akses Akun */}
                    <TableCell>
                      {isBlocked ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-300">
                          <Ban className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                          Diblokir
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          Aktif Normal
                        </span>
                      )}
                    </TableCell>

                    {/* Status KYC */}
                    <TableCell>
                      {isVerified ? (
                        <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 gap-1 text-[11px]">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : u.verification_status === "pending" ? (
                        <Badge variant="warning" className="text-[11px]">
                          Pending
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Belum KYC
                        </span>
                      )}
                    </TableCell>

                    {/* Keterangan / Alasan Blokir */}
                    <TableCell className="max-w-xs">
                      {isBlocked ? (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 line-clamp-1">
                            {u.block_reason || "Pelanggaran aturan"}
                          </p>
                          {u.blocked_at && (
                            <p className="text-[10px] text-slate-400">
                              Dibatasi: {formatDate(u.blocked_at)}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => setDetailUser(u)}
                            className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline inline-flex items-center gap-0.5"
                          >
                            <Info className="h-3 w-3" />
                            <span>Lihat detail alasan</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </TableCell>

                    {/* Tanggal Daftar */}
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(u.created_at)}
                    </TableCell>

                    {/* Aksi Blokir / Buka Blokir */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isBlocked ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTargetUnblockUser(u)}
                            className="h-8 text-xs font-semibold text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 gap-1.5"
                            title="Buka Pemblokiran Akun"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Buka Blokir</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setTargetBlockUser(u);
                              setCustomReason("");
                              setSelectedCategory(BLOCK_REASON_PRESETS[0]);
                            }}
                            className="h-8 text-xs font-semibold gap-1.5 shadow-sm"
                            title="Blokir User Melanggar"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            <span>Blokir Akun</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Footer Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan{" "}
            <strong>
              {filteredUsers.length > 0
                ? (currentPage - 1) * itemsPerPage + 1
                : 0}
            </strong>{" "}
            -{" "}
            <strong>
              {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
            </strong>{" "}
            dari <strong>{filteredUsers.length}</strong> pengguna
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

      {/* MODAL 1: BLOKIR PENGGUNA */}
      <Dialog
        open={!!targetBlockUser}
        onOpenChange={(open) => !open && setTargetBlockUser(null)}
      >
        <DialogContent maxWidth="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base text-rose-700 dark:text-rose-400">
                  Blokir Akun Pengguna
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Tindakan pembatasan akses untuk pengguna yang melanggar aturan
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {targetBlockUser && (
            <div className="space-y-4 my-2">
              {/* Info Pengguna yang akan diblokir */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pengguna Target:</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {targetBlockUser.full_name || targetBlockUser.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {targetBlockUser.email || targetBlockUser.phone || "Tidak ada email"}
                  </p>
                </div>
                <Badge variant="destructive">Status: Aktif &rarr; Diblokir</Badge>
              </div>

              {/* Warning note */}
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p>
                  Pengguna yang diblokir tidak akan dapat login, mengunggah iklan baru, atau melakukan transaksi. Iklan aktif yang sedang tayang akan otomatis diturunkan.
                </p>
              </div>

              {/* Pilihan Kategori Pelanggaran */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kategori Pelanggaran:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {BLOCK_REASON_PRESETS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Penjelasan Detail / Catatan Bukti */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan Tambahan / Detail Bukti:
                </label>
                <Textarea
                  placeholder="Misal: Laporan nomor rekening bodong dari pembeli order #xyz, bukti chat penipuan..."
                  rows={3}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setTargetBlockUser(null)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="gap-1.5 font-semibold"
              onClick={handleConfirmBlock}
              disabled={actionLoading}
            >
              <UserX className="h-4 w-4" />
              <span>{actionLoading ? "Memproses..." : "Ya, Blokir Pengguna"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: BUKA PEMBLOKIRAN */}
      <Dialog
        open={!!targetUnblockUser}
        onOpenChange={(open) => !open && setTargetUnblockUser(null)}
      >
        <DialogContent maxWidth="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base text-slate-900 dark:text-white">
                  Buka Pemblokiran Akun?
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Pulihkan akses aplikasi untuk pengguna ini
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {targetUnblockUser && (
            <div className="my-3 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Apakah Anda yakin ingin memulihkan akses pengguna{" "}
                <strong>
                  {targetUnblockUser.full_name || targetUnblockUser.name}
                </strong>
                ? Akun akan kembali berstatus aktif dan dapat mengakses layanan bekasAja.
              </p>
              {targetUnblockUser.block_reason && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-xs text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                  <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 mb-0.5">
                    Alasan blokir sebelumnya:
                  </p>
                  <p className="line-clamp-2">{targetUnblockUser.block_reason}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setTargetUnblockUser(null)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
              onClick={handleConfirmUnblock}
              disabled={actionLoading}
            >
              <RotateCcw className="h-4 w-4" />
              <span>{actionLoading ? "Memproses..." : "Ya, Buka Blokir"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: DETAIL ALASAN BLOKIR */}
      <Dialog
        open={!!detailUser}
        onOpenChange={(open) => !open && setDetailUser(null)}
      >
        <DialogContent maxWidth="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Ban className="h-4 w-4" />
              <span>Detail Riwayat Pemblokiran</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Informasi lengkap alasan pemblokiran pengguna
            </DialogDescription>
          </DialogHeader>

          {detailUser && (
            <div className="space-y-3 my-2 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Pengguna:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {detailUser.full_name || detailUser.name}
                </span>
                <span className="block text-slate-500">
                  {detailUser.email || detailUser.phone || "-"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Waktu Pemblokiran:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDate(detailUser.blocked_at)}
                </span>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 dark:border-rose-900/50 dark:bg-rose-950/40">
                <span className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">
                  Alasan Lengkap:
                </span>
                <p className="text-rose-800 dark:text-rose-200 whitespace-pre-wrap leading-relaxed">
                  {detailUser.block_reason || "Tidak ada catatan spesifik."}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDetailUser(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
