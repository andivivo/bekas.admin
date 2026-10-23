-- ==============================================================================
-- MIGRATION: FITUR PEMBATALAN PESANAN (ORDER CANCELLATION) - bekasAja
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Tambah kolom pembatalan ke tabel orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;

-- Index untuk filter dan dashboard order cancelled
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_at ON public.orders(cancelled_at);

-- 2. Function & Trigger untuk mengembalikan ketersediaan/stok produk saat order dibatalkan
CREATE OR REPLACE FUNCTION public.handle_cancel_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
    -- Kembalikan status barang menjadi belum terjual agar kembali muncul di listing
    UPDATE public.products
    SET is_sold = false
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_handle_cancel_order ON public.orders;
CREATE TRIGGER trg_handle_cancel_order
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (NEW.status = 'cancelled')
EXECUTE FUNCTION public.handle_cancel_order();

-- 3. Row Level Security (RLS):
-- Hanya pembeli yang buat order, penjual yang punya order, dan admin/super_admin yang boleh update
DROP POLICY IF EXISTS "Participants can update orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Order participants or admin can update" ON public.orders;

CREATE POLICY "Order participants or admin can update"
ON public.orders FOR UPDATE
USING (
  auth.uid() = buyer_id 
  OR auth.uid() = seller_id 
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
)
WITH CHECK (
  auth.uid() = buyer_id 
  OR auth.uid() = seller_id 
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);
