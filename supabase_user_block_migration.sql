-- ==============================================================================
-- MIGRATION: FITUR PEMBLOKIRAN USER (USER BLOCK & BAN SYSTEM) - bekasAja
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Tambah kolom pemblokiran pada tabel profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS block_reason text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_by uuid REFERENCES auth.users(id);

-- 2. Index untuk performa query filter status blokir
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON public.profiles(is_blocked);

-- 3. Trigger otomatis: saat user diblokir oleh admin, otomatis turunkan/batalkan
-- seluruh iklan produk aktif & pending miliknya agar tidak ada pembeli tertipu
CREATE OR REPLACE FUNCTION public.handle_block_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_blocked = true AND (OLD.is_blocked IS NULL OR OLD.is_blocked = false) THEN
    -- Nonaktifkan iklan produk yang sedang tayang
    UPDATE public.products
    SET status = 'rejected',
        rejection_reason = 'Iklan diturunkan: Akun penjual telah diblokir oleh administrator (' || COALESCE(NEW.block_reason, 'Pelanggaran aturan marketplace') || ')'
    WHERE seller_id = NEW.id AND status IN ('active', 'approved', 'pending');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_handle_block_user ON public.profiles;
CREATE TRIGGER trg_handle_block_user
AFTER UPDATE OF is_blocked ON public.profiles
FOR EACH ROW
WHEN (NEW.is_blocked = true)
EXECUTE FUNCTION public.handle_block_user();

-- 4. RLS Policy: Pastikan admin dapat mengupdate kolom pemblokiran akun
DROP POLICY IF EXISTS "Admin dapat mengupdate status blokir user" ON public.profiles;
CREATE POLICY "Admin dapat mengupdate status blokir user"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);
