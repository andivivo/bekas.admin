"use client";

import * as React from "react";
import { Profile, UserRole } from "@/lib/types";
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
import { useToast } from "@/components/ui/toast";
import {
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Search,
  UserCheck,
  AlertTriangle,
  Crown,
  UserX,
  Mail,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AdminTableProps {
  initialAdmins: Profile[];
  currentUserId: string;
}

export function AdminTable({ initialAdmins, currentUserId }: AdminTableProps) {
  const [admins, setAdmins] = React.useState<Profile[]>(initialAdmins);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Add / Promote Admin Modal
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState("");
  const [newRole, setNewRole] = React.useState<"admin" | "super_admin">("admin");
  const [addLoading, setAddLoading] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);

  // Edit Role Modal
  const [editAdmin, setEditAdmin] = React.useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<UserRole>("admin");
  const [editLoading, setEditLoading] = React.useState(false);

  // Revoke Access Modal
  const [revokeAdmin, setRevokeAdmin] = React.useState<Profile | null>(null);
  const [revokeLoading, setRevokeLoading] = React.useState(false);

  const supabase = createClient();
  const { toast } = useToast();

  const filteredAdmins = React.useMemo(() => {
    return admins.filter((a) => {
      const name = (a.full_name || a.name || "").toLowerCase();
      const email = (a.email || "").toLowerCase();
      return (
        searchQuery === "" ||
        name.includes(searchQuery.toLowerCase()) ||
        email.includes(searchQuery.toLowerCase())
      );
    });
  }, [admins, searchQuery]);

  // Handle Promote / Add Admin
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setAddError("Email pengguna wajib diisi.");
      return;
    }

    setAddLoading(true);
    setAddError(null);

    try {
      // 1. Cari user berdasarkan email
      const { data: userProfile, error: searchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", newEmail.trim().toLowerCase())
        .maybeSingle();

      if (searchError) throw searchError;

      if (!userProfile) {
        setAddError(
          "Pengguna dengan email ini tidak ditemukan di database. Pastikan pengguna sudah pernah mendaftar di aplikasi bekasAja."
        );
        setAddLoading(false);
        return;
      }

      // 2. Update role ke admin / super_admin
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", userProfile.id);

      if (updateError) throw updateError;

      const updatedUser: Profile = {
        ...userProfile,
        role: newRole,
      };

      setAdmins((prev) => {
        const exists = prev.some((a) => a.id === updatedUser.id);
        if (exists) {
          return prev.map((a) => (a.id === updatedUser.id ? updatedUser : a));
        }
        return [updatedUser, ...prev];
      });

      toast(
        `Berhasil mengangkat ${userProfile.full_name || userProfile.name} sebagai ${
          newRole === "super_admin" ? "Super Admin" : "Admin"
        }!`,
        "success"
      );
      setIsAddOpen(false);
      setNewEmail("");
    } catch (err: unknown) {
      setAddError(
        err instanceof Error ? err.message : "Gagal menambahkan admin."
      );
    } finally {
      setAddLoading(false);
    }
  };

  // Handle Edit Role
  const handleEditRole = async () => {
    if (!editAdmin) return;
    setEditLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: selectedRole, updated_at: new Date().toISOString() })
        .eq("id", editAdmin.id);

      if (error) throw error;

      setAdmins((prev) =>
        prev.map((a) =>
          a.id === editAdmin.id ? { ...a, role: selectedRole } : a
        )
      );

      toast("Role berhasil diperbarui!", "success");
      setEditAdmin(null);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Gagal mengubah role.", "error");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Revoke Access (Demote back to regular user)
  const handleRevokeAccess = async () => {
    if (!revokeAdmin) return;
    if (revokeAdmin.id === currentUserId) {
      toast("Anda tidak dapat mencabut hak akses akun Anda sendiri.", "error");
      return;
    }

    setRevokeLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "user", updated_at: new Date().toISOString() })
        .eq("id", revokeAdmin.id);

      if (error) throw error;

      setAdmins((prev) => prev.filter((a) => a.id !== revokeAdmin.id));
      toast(
        `Hak akses admin ${revokeAdmin.full_name || revokeAdmin.name} telah dicabut.`,
        "info"
      );
      setRevokeAdmin(null);
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : "Gagal mencabut akses admin.",
        "error"
      );
    } finally {
      setRevokeLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari admin berdasarkan nama/email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <Button
          onClick={() => {
            setAddError(null);
            setNewEmail("");
            setNewRole("admin");
            setIsAddOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1.5 shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tambah / Angkat Admin Baru</span>
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Administrator</TableHead>
              <TableHead>Email Akun</TableHead>
              <TableHead>Tingkat Role</TableHead>
              <TableHead>Bergabung</TableHead>
              <TableHead className="text-right">Aksi Kelola</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                  Tidak ada administrator ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredAdmins.map((a) => {
                const displayName = a.full_name || a.name || "Admin bekasAja";
                const isCurrent = a.id === currentUserId;
                const isSuper = a.role === "super_admin";

                return (
                  <TableRow key={a.id}>
                    {/* Admin Name & Avatar */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                          {a.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={a.avatar_url}
                              alt={displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            displayName[0]?.toUpperCase() || "A"
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                              {displayName}
                            </p>
                            {isCurrent && (
                              <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-semibold text-slate-500">
                                Anda
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-[11px] text-slate-400">
                            ID: {a.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      {a.email || "-"}
                    </TableCell>

                    {/* Role Badge */}
                    <TableCell>
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          <Crown className="h-3 w-3 text-purple-600" />
                          <span>Super Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          <span>Admin</span>
                        </span>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(a.created_at)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8"
                          onClick={() => {
                            setEditAdmin(a);
                            setSelectedRole(a.role);
                          }}
                        >
                          Ubah Role
                        </Button>

                        {!isCurrent && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs h-8 gap-1"
                            onClick={() => setRevokeAdmin(a)}
                          >
                            <UserX className="h-3.5 w-3.5" />
                            <span>Cabut Akses</span>
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
      </div>

      {/* Add / Promote Admin Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent onClose={() => setIsAddOpen(false)}>
          <form onSubmit={handleAddAdmin}>
            <DialogHeader>
              <div className="flex items-center gap-2 text-emerald-600">
                <UserPlus className="h-5 w-5" />
                <DialogTitle>Angkat Administrator Baru</DialogTitle>
              </div>
              <DialogDescription>
                Masukkan email pengguna yang sudah terdaftar di bekasAja untuk
                diberikan hak akses Admin atau Super Admin.
              </DialogDescription>
            </DialogHeader>

            {addError && (
              <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {addError}
              </div>
            )}

            <div className="space-y-4 my-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Akun Pengguna <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    placeholder="nama@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pilih Tingkat Akses
                </label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setNewRole("admin")}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      newRole === "admin"
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Admin</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Moderasi produk, verifikasi KTP, kelola banner & order.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole("super_admin")}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      newRole === "super_admin"
                        ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-500/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-purple-700 dark:text-purple-400">
                      <Crown className="h-4 w-4" />
                      <span>Super Admin</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Hak penuh termasuk menambah & mencabut akses admin lain.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={addLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                isLoading={addLoading}
              >
                Berikan Hak Akses
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog
        open={editAdmin !== null}
        onOpenChange={(open) => !open && setEditAdmin(null)}
      >
        <DialogContent onClose={() => setEditAdmin(null)}>
          <DialogHeader>
            <DialogTitle>
              Ubah Tingkat Akses: {editAdmin?.full_name || editAdmin?.name}
            </DialogTitle>
            <DialogDescription>
              Tentukan apakah akun ini berperan sebagai Admin biasa atau Super Admin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4">
            <button
              type="button"
              onClick={() => setSelectedRole("admin")}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                selectedRole === "admin"
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Admin
                </p>
                <p className="text-[11px] text-slate-500">
                  Moderasi konten, verifikasi KYC, banner promo, dan pesanan.
                </p>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("super_admin")}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                selectedRole === "super_admin"
                  ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-500/20"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div>
                <p className="text-xs font-bold text-purple-700 dark:text-purple-400">
                  Super Admin
                </p>
                <p className="text-[11px] text-slate-500">
                  Semua akses Admin + mengelola seluruh anggota tim administrator.
                </p>
              </div>
              <Crown className="h-5 w-5 text-purple-600" />
            </button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditAdmin(null)}
              disabled={editLoading}
            >
              Batal
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              isLoading={editLoading}
              onClick={handleEditRole}
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Access Confirmation Dialog */}
      <Dialog
        open={revokeAdmin !== null}
        onOpenChange={(open) => !open && setRevokeAdmin(null)}
      >
        <DialogContent onClose={() => setRevokeAdmin(null)}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Cabut Hak Akses Administrator?</DialogTitle>
            </div>
            <DialogDescription>
              Akun <strong>{revokeAdmin?.full_name || revokeAdmin?.name}</strong>{" "}
              ({revokeAdmin?.email}) akan diturunkan menjadi pengguna biasa dan
              tidak dapat lagi masuk ke Admin Panel bekasAja.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeAdmin(null)}
              disabled={revokeLoading}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              isLoading={revokeLoading}
              onClick={handleRevokeAccess}
            >
              Cabut Hak Akses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
