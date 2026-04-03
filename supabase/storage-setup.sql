-- ============================================================================
-- Tokyay Kereste - Storage Bucket Olusturma
-- schema.sql SONRASINDA calistirilmalidir
-- ============================================================================

-- Storage bucket'lari olustur
INSERT INTO storage.buckets (id, name, public) VALUES
  ('designs', 'designs', true),
  ('contracts', 'contracts', false),
  ('payment_receipts', 'payment_receipts', false),
  ('production_photos', 'production_photos', true),
  ('company', 'company', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Storage Politikalari
-- ============================================================================

-- Tasarim gorselleri (herkese acik okuma)
CREATE POLICY "Public design images" ON storage.objects
  FOR SELECT USING (bucket_id = 'designs');

CREATE POLICY "Auth users upload designs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'designs' AND auth.role() = 'authenticated');

CREATE POLICY "Auth users delete designs" ON storage.objects
  FOR DELETE USING (bucket_id = 'designs' AND auth.role() = 'authenticated');

-- Sozlesme dosyalari (sadece giris yapmis kullanicilar)
CREATE POLICY "Auth users read contracts" ON storage.objects
  FOR SELECT USING (bucket_id = 'contracts' AND auth.role() = 'authenticated');

CREATE POLICY "Auth users upload contracts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'contracts' AND auth.role() = 'authenticated');

-- Dekontlar (sadece giris yapmis kullanicilar)
CREATE POLICY "Auth users read receipts" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment_receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Auth users upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment_receipts' AND auth.role() = 'authenticated');

-- Uretim fotograflari (herkese acik okuma)
CREATE POLICY "Public production photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'production_photos');

CREATE POLICY "Auth users upload production photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'production_photos' AND auth.role() = 'authenticated');

-- Firma gorselleri (herkese acik okuma)
CREATE POLICY "Public company assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'company');

CREATE POLICY "Auth users upload company assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'company' AND auth.role() = 'authenticated');
