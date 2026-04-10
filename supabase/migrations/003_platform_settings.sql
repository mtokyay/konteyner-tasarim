-- Platform Settings tablosu
-- PayTR API bilgileri ve genel platform ayarları için

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: sadece super admin erişebilir
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can read settings"
  ON platform_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Super admin can manage settings"
  ON platform_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Varsayılan ayarlar
INSERT INTO platform_settings (key, value) VALUES
  ('paytr_merchant_id', ''),
  ('paytr_merchant_key', ''),
  ('paytr_merchant_salt', ''),
  ('paytr_test_mode', 'true'),
  ('paytr_debug_mode', 'false'),
  ('site_url', ''),
  ('support_email', 'destek@konteynertasarim.com.tr'),
  ('company_name', 'Tokyay Kereste'),
  ('trial_days', '14')
ON CONFLICT (key) DO NOTHING;

-- Plans tablosuna price_yearly kolonu ekle (yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'price_yearly'
  ) THEN
    ALTER TABLE plans ADD COLUMN price_yearly INTEGER DEFAULT 0;
  END IF;
END $$;

-- Yıllık fiyatları güncelle (%10 indirimli, yuvarlak sayılar)
UPDATE plans SET price_yearly = 5390 WHERE slug = 'starter';
UPDATE plans SET price_yearly = 10790 WHERE slug = 'pro';
UPDATE plans SET price_yearly = 21590 WHERE slug = 'enterprise';
UPDATE plans SET price_yearly = 0 WHERE slug = 'free';
