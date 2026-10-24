# bekasAja Admin Panel Web

Modern, responsive backoffice and admin control panel for the **bekasAja** second-hand electronics marketplace. Built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, and **Supabase**.

---

## 🚀 Fitur Utama

1. **Autentikasi & Keamanan Ketat**:
   - Login Email & Kata Sandi Supabase.
   - Middleware guard: Hanya pengguna dengan `profiles.role = 'admin'` yang diizinkan mengakses panel. Pengguna biasa otomatis dialihkan ke `/unauthorized`.
2. **Dashboard Interaktif (`/`)**:
   - 5 Metrik Ringkasan: Total Pengguna, Produk Pending, Produk Aktif, Order Bulan Ini, dan Total Dana Escrow.
   - Grafik interaktif Recharts: Tren penambahan produk 7 hari terakhir.
   - Task cepat moderasi iklan dan permohonan verifikasi identitas (KYC).
3. **Manajemen & Moderasi Produk (`/products`)**:
   - Tabel responsif dengan pagination dan pencarian instan (judul, kategori, lokasi).
   - Filter status tab: `Semua`, `Pending`, `Aktif`, `Ditolak`, `Terjual`.
   - Aksi **Setujui (Approve)** dengan modal konfirmasi.
   - Aksi **Tolak (Reject)** dengan dialog alasan penolakan wajib (disertai tombol saran cepat).
   - Aksi **Hapus Produk** permanen.
   - Modal inspeksi detail (galeri foto lengkap, spesifikasi minus & kelengkapan).
4. **Verifikasi Identitas Pengguna (`/verifications`)**:
   - Daftar permohonan KYC pengguna baru.
   - Modal pratinjau gambar zoom untuk KTP (`id_card_url`) dan foto selfie (`selfie_url`).
   - Aksi **Verifikasi (Approve)** → mengubah status menjadi `verified` dan `is_verified = true`.
   - Aksi **Tolak (Reject)**.
5. **Manajemen Banner Marquee Aplikasi (`/banners`)**:
   - Selaras 100% dengan spesifikasi **Banner Marquee Kontinu Berjalan** di Flutter `bekas_app` (280px × 88px, background foto asli, dark overlay 50%, teks putih, tombol amber `#FFB020` dengan ikon panah).
   - **Live Ticker Continuous Running Preview**: Pratinjau animasi bergerak langsung di web dengan tombol play/pause dan jeda saat hover.
   - **5 Preset Cepat Bawaan Aplikasi**: Tombol 1-klik untuk menerapkan promo Gadget, Laptop, Thrift Sneakers, COD Aman, dan Diskon BU.
   - Input tautan eksternal (`action_url`) disertai tombol **Uji Tautan**.
   - Pengunggahan gambar ke Supabase Storage (`banners` / `product-images`) atau URL langsung.
   - Kontrol naik/turun urutan (`sort_order`) dan saklar status aktif.
6. **Transaksi & Escrow Rekening Bersama (`/orders`)**:
   - Tabel gabungan `orders` + `escrow_transactions` + `products` + pembeli/penjual.
   - Status terpadu: `waiting_payment`, `waiting_cod`, `paid_in_escrow`, `shipping`, `completed`, `cancelled`.
   - Status pembayaran Xendit dan link tautan langsung ke invoice pembayaran (`xendit_payment_url`).
7. **Pengaturan Sistem & Sinkronisasi Aplikasi (`/settings`)**:
   - Pusat kontrol integrasi antara panel web dan aplikasi mobile Flutter.
   - Verifikasi parameter Marquee, 8 Kategori resmi marketplace, alur transaksi COD/Rekber, dan uji latensi realtime Supabase.

---

## 🛠️ Menjalankan Proyek Secara Lokal

### Prasyarat
- Node.js versi 18 ke atas (direkomendasikan Node.js 20+ atau LTS)
- Akun Supabase dengan database bekasAja

### Langkah Instalasi
```bash
# 1. Masuk ke direktori admin
cd bekas_admin

# 2. Salin environment variables jika belum ada
cp .env.example .env.local

# 3. Jalankan server pengembang (port 3000)
npm run dev
```

Buka peramban di `http://localhost:3000`.

---

## 🔑 Cara Mengaktifkan Super Admin & Menjadikan Akun Sebagai Super Admin

### 1. Update Constraint di Supabase SQL Editor
Jalankan query ini agar kolom `profiles.role` dapat menerima nilai `'super_admin'`:

```sql
-- Lepas constraint lama dan aktifkan 'super_admin'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['user'::text, 'admin'::text, 'super_admin'::text]));
```

### 2. Jadikan Akun Utama Anda Sebagai Super Admin
```sql
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'email_anda@gmail.com';
```

Setelah itu, akun Super Admin Anda akan memiliki menu eksklusif **Manajemen Admin (`/admins`)** di web untuk:
- Mengangkat pengguna lain menjadi **Admin** atau **Super Admin** langsung dari web tanpa perlu membuka Supabase lagi.
- Mengubah level kewenangan akun admin lain.
- Mencabut hak akses admin (*demote* kembali ke user biasa).

---

## 🛡️ Kebijakan Keamanan Supabase (Row Level Security / RLS)

Berikut adalah RLS Policies yang direkomendasikan untuk dijalankan di Supabase SQL Editor agar hak akses admin panel dan aplikasi aman:

```sql
-- 1. Helper function untuk memeriksa apakah pengguna saat ini adalah admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Kebijakan tabel PROFILES (Admin dapat melihat dan memperbarui status verifikasi)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin dapat melihat semua profil"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin() OR auth.uid() = id);

CREATE POLICY "Admin dapat mengupdate profil user (verifikasi KYC & role)"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin() OR auth.uid() = id)
WITH CHECK (public.is_admin() OR auth.uid() = id);

-- 3. Kebijakan tabel PRODUCTS (Admin dapat memoderasi semua produk)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Siapapun dapat melihat produk aktif, Admin dapat melihat semua produk"
ON public.products FOR SELECT
TO public
USING (status = 'active' OR auth.uid() = seller_id OR public.is_admin());

CREATE POLICY "Admin dapat mengupdate status moderasi produk"
ON public.products FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id OR public.is_admin())
WITH CHECK (auth.uid() = seller_id OR public.is_admin());

CREATE POLICY "Admin dapat menghapus produk yang melanggar aturan"
ON public.products FOR DELETE
TO authenticated
USING (auth.uid() = seller_id OR public.is_admin());

-- 4. Kebijakan tabel BANNERS (Publik hanya bisa membaca, Admin CRUD penuh)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semua orang dapat membaca banner aktif"
ON public.banners FOR SELECT
TO public
USING (true);

CREATE POLICY "Hanya Admin yang dapat menambah/edit/hapus banner"
ON public.banners FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Kebijakan tabel ORDERS & ESCROW_TRANSACTIONS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin dapat melihat semua order dan transaksi escrow"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.is_admin());

CREATE POLICY "Admin dapat melihat seluruh status escrow Xendit"
ON public.escrow_transactions FOR SELECT
TO authenticated
USING (true);

-- 6. Storage Bucket (Pastikan bucket 'banners' atau 'products' dibuat dengan akses publik)
-- Buka Supabase Dashboard -> Storage -> Create Bucket 'banners' (Public Bucket: ON)
```

---

## ☁️ Siap Deploy ke Vercel

Proyek ini telah dikonfigurasi menggunakan standar resmi Next.js 14 App Router tanpa server eksternal, sehingga siap di-deploy langsung ke Vercel:

1. Push repository ini ke GitHub / GitLab / Bitbucket.
2. Buka [Vercel Dashboard](https://vercel.com) → **Add New Project**.
3. Pilih repository `bekas_admin`.
4. Masukkan **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL project Supabase Anda
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon key Supabase Anda
5. Klik **Deploy**. Selesai! 🎉
