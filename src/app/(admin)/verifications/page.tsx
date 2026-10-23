import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { VerificationTable } from "@/components/verifications/verification-table";
import { Profile } from "@/lib/types";

export const revalidate = 0;

export default async function VerificationsPage() {
  const supabase = createClient();

  let users: any[] = [];
  let totalCount = 0;

  try {
    // Query LEFT JOIN dari profiles ke verifications sesuai instruksi
    const { data: joinedData, count: joinedCount, error: joinError } = await supabase
      .from("profiles")
      .select(`
        id, full_name, name, email, phone, city, avatar_url, role,
        verification_status, is_verified, id_card_url, selfie_url, created_at,
        verifications (ktp_url, selfie_url, status)
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    if (!joinError && joinedData && joinedData.length > 0) {
      users = joinedData;
      totalCount = joinedCount ?? joinedData.length;
    } else {
      // Fallback: tabel profiles menyimpan id_card_url, selfie_url, verification_status langsung
      const { data: directData, count: directCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      users = directData || [];
      totalCount = directCount ?? users.length;
    }
  } catch {
    const { data: directData, count: directCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    users = directData || [];
    totalCount = directCount ?? users.length;
  }

  // Normalisasi data agar konsisten dengan schema DB (baik kolom profil langsung maupun relasi verifications)
  const normalizedUsers: Profile[] = users.map((u) => {
    const verif = Array.isArray(u.verifications)
      ? u.verifications[0]
      : u.verifications;

    const ktpUrl = verif?.ktp_url || u.id_card_url || null;
    const selfieUrl = verif?.selfie_url || u.selfie_url || null;
    const rawStatus = verif?.status || u.verification_status;
    const isVerified = u.is_verified === true || rawStatus === "verified";
    const status = rawStatus || (isVerified ? "verified" : (ktpUrl ? "pending" : "unverified"));

    return {
      id: u.id,
      name: u.name,
      full_name: u.full_name || u.name,
      email: u.email,
      phone: u.phone,
      city: u.city,
      avatar_url: u.avatar_url,
      role: u.role || "user",
      verification_status: status,
      is_verified: isVerified,
      id_card_url: ktpUrl,
      selfie_url: selfieUrl,
      created_at: u.created_at || new Date().toISOString(),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Verifikasi Identitas Pengguna (KYC)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tinjau dokumen KTP dan foto selfie pengguna sebelum memberikan lencana penjual terpercaya. Total {totalCount || normalizedUsers.length} pengguna terdaftar.
        </p>
      </div>

      <VerificationTable initialUsers={normalizedUsers} />
    </div>
  );
}
