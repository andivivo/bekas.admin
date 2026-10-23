"use client";

import * as React from "react";
import { Profile } from "@/lib/types";
import { formatDate } from "@/lib/utils";
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
import { ImagePreviewDialog } from "./image-preview-dialog";
import { useToast } from "@/components/ui/toast";
import {
  CheckCircle,
  XCircle,
  Eye,
  Search,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface VerificationTableProps {
  initialUsers: Profile[];
}

export function VerificationTable({ initialUsers }: VerificationTableProps) {
  const [users, setUsers] = React.useState<Profile[]>(initialUsers);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Default filter ke 'pending' jika ada yang menunggu, atau 'all' (Semua) agar langsung menampilkan seluruh 5 user
  const [statusFilter, setStatusFilter] = React.useState<string>(() => {
    return initialUsers.some((u) => u.verification_status === "pending")
      ? "pending"
      : "all";
  });

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  React.useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // Preview dialog state
  const [previewImage, setPreviewImage] = React.useState<{
    url: string;
    title: string;
    userName: string;
  } | null>(null);

  // Confirmation dialogs
  const [confirmApproveUser, setConfirmApproveUser] = React.useState<Profile | null>(null);
  const [confirmRejectUser, setConfirmRejectUser] = React.useState<Profile | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  const { toast } = useToast();
  const supabase = createClient();

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const name = (u.full_name || u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = (u.phone || "").toLowerCase();
      const matchSearch =
        searchQuery === "" ||
        name.includes(searchQuery.toLowerCase()) ||
        email.includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery.toLowerCase());

      let matchStatus = true;
      if (statusFilter === "pending") {
        matchStatus = u.verification_status === "pending";
      } else if (statusFilter === "unverified") {
        matchStatus =
          u.verification_status === "unverified" ||
          (!u.id_card_url && !u.is_verified);
      } else if (statusFilter === "verified") {
        matchStatus =
          u.is_verified === true || u.verification_status === "verified";
      } else if (statusFilter === "rejected") {
        matchStatus = u.verification_status === "rejected";
      } else if (statusFilter === "all") {
        matchStatus = true;
      }

      return matchSearch && matchStatus;
    });
  }, [users, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const handleApprove = async (user: Profile) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          verification_status: "verified",
          is_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update state secara lokal agar tetap ada di tab 'Semua' dan 'Terverifikasi'
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, verification_status: "verified", is_verified: true }
            : u
        )
      );

      // Coba update juga ke tabel verifications jika ada di schema
      try {
        await supabase
          .from("verifications")
          .update({ status: "verified", updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } catch {
        // Abaikan jika tabel verifications tidak ada
      }

      toast(
        `Pengguna ${user.full_name || user.name} berhasil disetujui! Lencana 'Terverifikasi' telah aktif.`,
        "success"
      );
      setConfirmApproveUser(null);
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : "Gagal memverifikasi pengguna.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (user: Profile) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          verification_status: "rejected",
          is_verified: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, verification_status: "rejected", is_verified: false }
            : u
        )
      );

      try {
        await supabase
          .from("verifications")
          .update({ status: "rejected", updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } catch {
        // Abaikan jika tabel verifications tidak ada
      }

      toast(
        `Permohonan verifikasi ${user.full_name || user.name} ditolak.`,
        "info"
      );
      setConfirmRejectUser(null);
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : "Gagal menolak verifikasi.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = users.filter((u) => u.verification_status === "pending").length;
  const unverifiedCount = users.filter(
    (u) =>
      u.verification_status === "unverified" ||
      (!u.id_card_url && !u.is_verified)
  ).length;
  const verifiedCount = users.filter(
    (u) => u.is_verified === true || u.verification_status === "verified"
  ).length;
  const rejectedCount = users.filter((u) => u.verification_status === "rejected").length;

  return (
    <div className="space-y-4">
      {/* Filters & Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setStatusFilter("all")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <span>Semua</span>
            <span className="rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-1.5 text-[10px]">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("pending")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "pending"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <span>Menunggu (Pending)</span>
            <span className="rounded-full bg-amber-500 text-white px-1.5 text-[10px]">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("unverified")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "unverified"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <span>Belum Upload (Unverified)</span>
            <span className="rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-1.5 text-[10px]">
              {unverifiedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("verified")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "verified"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <span>Terverifikasi</span>
            <span className="rounded-full bg-emerald-500 text-white px-1.5 text-[10px]">
              {verifiedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("rejected")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "rejected"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <span>Ditolak</span>
            <span className="rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-1.5 text-[10px]">
              {rejectedCount}
            </span>
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama, email, nomor HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pengguna</TableHead>
              <TableHead>Foto KTP (ID Card)</TableHead>
              <TableHead>Foto Selfie</TableHead>
              <TableHead>Status KYC</TableHead>
              <TableHead>Tanggal Daftar</TableHead>
              <TableHead className="text-right">Aksi Verifikasi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                  Tidak ada permohonan verifikasi sesuai filter.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((u) => {
                const displayName = u.full_name || u.name || "Pengguna bekasAja";

                return (
                  <TableRow key={u.id}>
                    {/* User profile */}
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
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                              {displayName}
                            </p>
                            {(u.is_verified || u.verification_status === "verified") && (
                              <span title="Terverifikasi">
                                <ShieldCheck className="h-4 w-4 text-emerald-500 inline" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {u.email || u.phone || "Tidak ada email"}
                          </p>
                          {u.city && (
                            <p className="text-[11px] text-slate-500">
                              Kota: {u.city}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* ID Card preview */}
                    <TableCell>
                      {u.id_card_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage({
                              url: u.id_card_url!,
                              title: "Foto KTP / Kartu Identitas",
                              userName: displayName,
                            })
                          }
                          className="group relative flex h-14 w-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 transition-all hover:ring-2 hover:ring-emerald-500"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={u.id_card_url}
                            alt="KTP"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-4 w-4 text-white" />
                          </div>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Belum upload
                        </span>
                      )}
                    </TableCell>

                    {/* Selfie preview */}
                    <TableCell>
                      {u.selfie_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage({
                              url: u.selfie_url!,
                              title: "Foto Selfie dengan KTP",
                              userName: displayName,
                            })
                          }
                          className="group relative flex h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 transition-all hover:ring-2 hover:ring-emerald-500"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={u.selfie_url}
                            alt="Selfie"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-4 w-4 text-white" />
                          </div>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Belum upload
                        </span>
                      )}
                    </TableCell>

                    {/* Status KYC */}
                    <TableCell>
                      {u.is_verified || u.verification_status === "verified" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          Terverifikasi
                        </span>
                      ) : u.verification_status === "pending" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Menunggu
                        </span>
                      ) : u.verification_status === "unverified" || !u.id_card_url ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300">
                          Belum Upload
                        </span>
                      ) : u.verification_status === "rejected" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-300">
                          Ditolak
                        </span>
                      ) : (
                        <Badge variant="outline" className="capitalize text-xs">
                          {u.verification_status}
                        </Badge>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(u.created_at)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!u.is_verified && u.verification_status !== "verified" ? (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-sm"
                            title="Setujui Verifikasi Identitas"
                            onClick={() => setConfirmApproveUser(u)}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Setujui</span>
                          </Button>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mr-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Aktif
                          </span>
                        )}

                        {u.verification_status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs gap-1.5 h-8 font-semibold shadow-sm"
                            title="Tolak Verifikasi"
                            onClick={() => setConfirmRejectUser(u)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Tolak</span>
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

        {/* Pagination Footer */}
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

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewDialog
          open={!!previewImage}
          onOpenChange={(open) => !open && setPreviewImage(null)}
          imageUrl={previewImage.url}
          title={previewImage.title}
          userName={previewImage.userName}
        />
      )}

      {/* Approve Confirmation Dialog */}
      <Dialog
        open={!!confirmApproveUser}
        onOpenChange={(open) => !open && setConfirmApproveUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Verifikasi Identitas?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menyetujui verifikasi untuk pengguna{" "}
              <strong>
                {confirmApproveUser?.full_name || confirmApproveUser?.name}
              </strong>
              ? Pengguna akan mendapatkan lencana centang biru (Verified) dan hak menjual produk.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmApproveUser(null)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={() => confirmApproveUser && handleApprove(confirmApproveUser)}
              disabled={actionLoading}
            >
              {actionLoading ? "Memproses..." : "Ya, Setujui"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog
        open={!!confirmRejectUser}
        onOpenChange={(open) => !open && setConfirmRejectUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Verifikasi Identitas?</DialogTitle>
            <DialogDescription>
              Permohonan verifikasi untuk{" "}
              <strong>
                {confirmRejectUser?.full_name || confirmRejectUser?.name}
              </strong>{" "}
              akan ditandai sebagai ditolak. Pengguna perlu mengunggah ulang dokumen identitas valid.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmRejectUser(null)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmRejectUser && handleReject(confirmRejectUser)}
              disabled={actionLoading}
            >
              {actionLoading ? "Menolak..." : "Ya, Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
