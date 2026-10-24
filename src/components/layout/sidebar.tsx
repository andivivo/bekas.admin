"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  UserCheck,
  Megaphone,
  Receipt,
  LogOut,
  ShieldCheck,
  UserCog,
  Crown,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [adminName, setAdminName] = React.useState("Administrator");
  const [adminEmail, setAdminEmail] = React.useState("");
  const [adminRole, setAdminRole] = React.useState<"admin" | "super_admin">("admin");
  const [adminAvatar, setAdminAvatar] = React.useState<string | null>(null);
  const [pendingProductsCount, setPendingProductsCount] = React.useState(0);
  const [pendingVerificationsCount, setPendingVerificationsCount] = React.useState(0);
  const [blockedUsersCount, setBlockedUsersCount] = React.useState(0);

  React.useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setAdminEmail(user.email ?? "");
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, full_name, avatar_url, role")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          setAdminName(profile.full_name || profile.name || "Administrator");
          setAdminAvatar(profile.avatar_url ?? null);
          setAdminRole(profile.role === "super_admin" ? "super_admin" : "admin");
        }
      }

      // Hitung produk pending
      const { count: prodCount } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingProductsCount(prodCount || 0);

      // Hitung verifikasi pending
      const { count: verifCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "pending");
      setPendingVerificationsCount(verifCount || 0);

      // Hitung user yang diblokir (jika kolom is_blocked tersedia)
      try {
        const { count: bCount } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("is_blocked", true);
        setBlockedUsersCount(bCount || 0);
      } catch {
        setBlockedUsersCount(0);
      }
    }

    loadData();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      title: "Manajemen Pengguna",
      href: "/users",
      icon: Users,
      badge: blockedUsersCount > 0 ? `${blockedUsersCount} Blokir` : null,
      badgeVariant: "destructive",
    },
    {
      title: "Manajemen Produk",
      href: "/products",
      icon: Package,
      badge: pendingProductsCount > 0 ? pendingProductsCount : null,
      badgeVariant: "warning",
    },
    {
      title: "Verifikasi User (KYC)",
      href: "/verifications",
      icon: UserCheck,
      badge: pendingVerificationsCount > 0 ? pendingVerificationsCount : null,
      badgeVariant: "destructive",
    },
    {
      title: "Manajemen Banner",
      href: "/banners",
      icon: Megaphone,
      badge: null,
    },
    {
      title: "Transaksi & Escrow",
      href: "/orders",
      icon: Receipt,
      badge: null,
    },
    {
      title: "Pengaturan Aplikasi",
      href: "/settings",
      icon: Settings,
      badge: "Sinkron",
      badgeVariant: "success",
    },
    ...(adminRole === "super_admin"
      ? [
          {
            title: "Manajemen Admin",
            href: "/admins",
            icon: UserCog,
            badge: null,
          },
        ]
      : []),
  ];

  return (
    <aside
      className={cn(
        "flex h-full w-72 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6 dark:border-slate-800/80">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-md shadow-emerald-500/20">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            bekas<span className="text-emerald-500">Aja</span>
          </span>
          <span
            className={cn(
              "ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
              adminRole === "super_admin"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
            )}
          >
            {adminRole === "super_admin" ? "Super Admin" : "Admin"}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Menu Utama
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : item.href === "/verifications"
                ? pathname.startsWith("/verifications") || pathname.startsWith("/kyc")
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-600 font-semibold dark:bg-emerald-500/15 dark:text-emerald-400"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                    )}
                  />
                  <span>{item.title}</span>
                </div>

                {item.badge != null && (
                  <span
                    className={cn(
                      "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                      item.badgeVariant === "destructive"
                        ? "bg-rose-500 text-white"
                        : "bg-amber-500 text-white"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Theme Toggle & User Section */}
      <div className="border-t border-slate-100 p-4 dark:border-slate-800/80 space-y-3">
        <ThemeToggle showLabel />
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-emerald-700 font-bold dark:bg-emerald-950 dark:text-emerald-300">
            {adminAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={adminAvatar}
                alt={adminName}
                className="h-full w-full object-cover"
              />
            ) : (
              adminName[0]?.toUpperCase() || "A"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                {adminName}
              </p>
              {adminRole === "super_admin" && (
                <Crown className="h-3 w-3 text-purple-600 shrink-0" />
              )}
            </div>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              {adminEmail || "admin@bekasaja.com"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-rose-600 dark:hover:bg-slate-700 dark:hover:text-rose-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
