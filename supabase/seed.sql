-- ============================================================================
-- Tokyay Kereste - Ornek Veri (Seed Data)
-- schema.sql ve storage-setup.sql SONRASINDA calistirilmalidir
-- ============================================================================

-- Firma bilgileri
INSERT INTO company_info (
  id, name, tax_number, tax_office, address, phone, email, website, logo_url
) VALUES (
  gen_random_uuid(),
  'Tokyay Kereste',
  '1234567890',
  'Kadiköy V.D.',
  'Organize Sanayi Bolgesi, No: 42, Trabzon',
  '0462 123 45 67',
  'info@tokyaykereste.com',
  'www.tokyaykereste.com',
  NULL
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- ORNEK KULLANICI OLUSTURMA NOTU:
-- ============================================================================
/*
Supabase Dashboard > Authentication > Users bolumunden kullanici olusturun:

1. patron@tokyaykereste.com     -> role: patron
2. tasarimci@tokyaykereste.com  -> role: tasarimci
3. muhasebe@tokyaykereste.com   -> role: muhasebeci
4. kalite@tokyaykereste.com     -> role: kalite_kontrolcu
5. usta@tokyaykereste.com       -> role: usta

Kullanici olusturduktan sonra profiles tablosunu guncelleyin:

UPDATE profiles SET role = 'patron', full_name = 'Mehmet Tokyay'
WHERE email = 'patron@tokyaykereste.com';

UPDATE profiles SET role = 'tasarimci', full_name = 'Ahmet Yilmaz'
WHERE email = 'tasarimci@tokyaykereste.com';

UPDATE profiles SET role = 'muhasebeci', full_name = 'Fatma Kaya'
WHERE email = 'muhasebe@tokyaykereste.com';

UPDATE profiles SET role = 'kalite_kontrolcu', full_name = 'Ali Demir'
WHERE email = 'kalite@tokyaykereste.com';

UPDATE profiles SET role = 'usta', full_name = 'Veli Ozturk'
WHERE email = 'usta@tokyaykereste.com';
*/

-- Ornek musteri
INSERT INTO customers (id, first_name, last_name, phone, email, address, city, source, notes)
VALUES
  (gen_random_uuid(), 'Ibrahim', 'Sahin', '0532 111 22 33', 'ibrahim@email.com', 'Ataturk Cad. No:15', 'Trabzon', 'referans', 'Ilk musteri, 2 konteynerlık ev istedi'),
  (gen_random_uuid(), 'Zeynep', 'Arslan', '0543 444 55 66', 'zeynep@email.com', 'Cumhuriyet Mah. 5. Sok. No:8', 'Rize', 'instagram', 'Instagram reklamından geldi'),
  (gen_random_uuid(), 'Hasan', 'Yildiz', '0555 777 88 99', 'hasan@email.com', 'Sanayi Sitesi Karsisi', 'Artvin', 'telefon', 'Yazlik icin soruyor');
