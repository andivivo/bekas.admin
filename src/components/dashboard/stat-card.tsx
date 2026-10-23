import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  variant?: "default" | "success" | "warning" | "info" | "purple" | "danger";
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = "default",
}: StatCardProps) {
  const iconBgStyles = {
    default: "bg-slate-200/80 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
    success: "bg-emerald-500 text-white shadow-md shadow-emerald-500/20",
    warning: "bg-amber-500 text-white shadow-md shadow-amber-500/20",
    info: "bg-sky-500 text-white shadow-md shadow-sky-500/20",
    purple: "bg-purple-500 text-white shadow-md shadow-purple-500/20",
    danger: "bg-rose-500 text-white shadow-md shadow-rose-500/20",
  };

  const renderValue = (val: string | number) => {
    const str = String(val).trim();

    // Deteksi jika format Rupiah (dimulai dengan Rp atau Rp.)
    const rpMatch = str.match(/^(Rp\.?\s*)(.*)$/i);
    if (rpMatch) {
      const prefix = "Rp";
      const amount = rpMatch[2];
      const isLongAmount = amount.length > 8; // contoh: "125.018.500"
      const isMediumAmount = amount.length > 5; // contoh: "50.000"

      return (
        <div
          className="flex items-baseline tracking-tight text-slate-900 dark:text-white min-w-0"
          title={str}
        >
          {/* Font Rp dibuat lebih kecil agar proporsional dan tidak melewati batas grid */}
          <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mr-1 shrink-0 select-none">
            {prefix}
          </span>
          <span
            className={cn(
              "font-bold truncate",
              isLongAmount
                ? "text-lg xl:text-base 2xl:text-lg"
                : isMediumAmount
                ? "text-xl xl:text-lg 2xl:text-xl"
                : "text-2xl"
            )}
          >
            {amount}
          </span>
        </div>
      );
    }

    // Angka biasa (misal jumlah pengguna, order, produk)
    return (
      <div
        className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate min-w-0"
        title={str}
      >
        {str}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border border-slate-200/80 shadow-sm transition-all hover:shadow-md dark:border-slate-800">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {title}
          </p>
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              iconBgStyles[variant]
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        <div className="mt-2.5 min-w-0">
          {renderValue(value)}
          {(description || trend) && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
              {trend && (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                  {trend}
                </span>
              )}
              <span className="truncate">{description}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
