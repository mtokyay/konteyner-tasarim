-- ============================================================
-- TOKYAY KERESTE - KONTEYNER TASARIM PORTALI
-- Supabase SQL Schema - Tam Veritabani Yapisi
-- ============================================================
-- Bu dosyayi Supabase Dashboard > SQL Editor'e yapistirin.
-- DIKKAT: Mevcut tablolari siler ve yeniden olusturur!
-- ============================================================

-- Once mevcut tablolari temizle (varsa)
DROP TABLE IF EXISTS payment_notifications CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS designs CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS company_info CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================
-- 1. PROFILES (Kullanici Profilleri)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'patron' CHECK (role IN ('patron', 'tasarimci', 'uretici', 'musteri')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Yeni kullanici olusturuldiginda otomatik profil olustur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patron')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. COMPANY_INFO (Firma Bilgileri)
-- ============================================================
CREATE TABLE company_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Tokyay Kereste',
  address TEXT,
  phone TEXT,
  email TEXT,
  tax_office TEXT,
  tax_number TEXT,
  iban TEXT,
  logo_url TEXT,
  contract_terms TEXT[] DEFAULT ARRAY[
    'Taraflar sozlesmeyi tamamen kabul edip anlamis sayilirlar.',
    'Odeme plani tabloda belirtildigi sekilde yapilacaktir.',
    'Is baslangici on odemenin tamamlanmasindan sonra baslayacaktir.',
    'Tasima ve kurulum musterinin sorumlulugundasir.',
    'Garanti suresi teslimat tarihinden itibaren 1 yildir.',
    'Her iki taraf da yazili bildiri ile sozlesmeyi feshedebilir.'
  ],
  quality_checklist TEXT[] DEFAULT '{}',
  qc_items TEXT[] DEFAULT '{}',
  bank_name TEXT,
  bank_branch TEXT,
  bank_iban TEXT,
  bank_account_no TEXT,
  proforma_footer_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. CUSTOMERS (Musteriler)
-- ============================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad TEXT NOT NULL,
  soyad TEXT NOT NULL,
  telefon TEXT,
  eposta TEXT,
  nereden_geldi TEXT,
  adres TEXT,
  notlar TEXT,
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. DESIGNS (Tasarimlar)
-- ============================================================
CREATE TABLE designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  ref_no TEXT UNIQUE,
  ad TEXT NOT NULL DEFAULT 'Yeni Tasarim',
  aciklama TEXT,
  genislik NUMERIC,
  yukseklik NUMERIC,
  uzunluk NUMERIC,
  alan NUMERIC,
  ozellikler JSONB DEFAULT '{}'::jsonb,
  design_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'taslak' CHECK (status IN (
    'taslak', 'teklif', 'onaylandi', 'uretimde', 'tamamlandi', 'teslim_edildi', 'iptal'
  )),
  toplam_fiyat NUMERIC DEFAULT 0,
  indirim NUMERIC DEFAULT 0,
  net_fiyat NUMERIC DEFAULT 0,
  teslim_tarihi DATE,
  notlar TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. CONTRACTS (Sozlesmeler)
-- ============================================================
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sozlesme_no TEXT UNIQUE,
  tarih DATE DEFAULT CURRENT_DATE,
  toplam_tutar NUMERIC DEFAULT 0,
  terms TEXT[] DEFAULT '{}',
  signed_pdf_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'hazirlandi' CHECK (status IN (
    'hazirlandi', 'imzalandi', 'aktif', 'tamamlandi', 'iptal'
  )),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. PAYMENTS (Odemeler)
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sozlesme_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  musteri_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tur TEXT DEFAULT 'taksit' CHECK (tur IN ('pesinat', 'taksit', 'kalan')),
  tutar NUMERIC NOT NULL DEFAULT 0,
  odenen_tutar NUMERIC DEFAULT 0,
  vade DATE,
  odeme_tarihi DATE,
  odeme_yontemi TEXT CHECK (odeme_yontemi IN ('nakit', 'havale', 'kredi_karti', NULL)),
  dekont_url TEXT,
  notlar TEXT,
  durum TEXT DEFAULT 'bekliyor' CHECK (durum IN (
    'bekliyor', 'kismen_odendi', 'odendi', 'gecikli', 'iptal'
  )),
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. NOTIFICATIONS (Bildirimler)
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  baslik TEXT NOT NULL,
  mesaj TEXT,
  tur TEXT DEFAULT 'bilgi',
  okundu BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. PAYMENT_NOTIFICATIONS (Odeme Bildirimleri)
-- ============================================================
CREATE TABLE payment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  mesaj TEXT,
  tur TEXT DEFAULT 'hatirlatma',
  gonderildi BOOLEAN DEFAULT false,
  gonderim_tarihi TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES (Performans icin)
-- ============================================================
CREATE INDEX idx_customers_eposta ON customers(eposta);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX idx_designs_customer_id ON designs(customer_id);
CREATE INDEX idx_designs_status ON designs(status);
CREATE INDEX idx_designs_created_at ON designs(created_at DESC);
CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX idx_contracts_design_id ON contracts(design_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_payments_sozlesme_id ON payments(sozlesme_id);
CREATE INDEX idx_payments_musteri_id ON payments(musteri_id);
CREATE INDEX idx_payments_durum ON payments(durum);
CREATE INDEX idx_payments_vade ON payments(vade);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_payment_notifications_payment_id ON payment_notifications(payment_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;

-- Basit RLS: Giris yapmis kullanicilar her seyi gorebilir/yapabilir
-- (Daha sonra role-based olarak daraltilabilir)

CREATE POLICY "Authenticated users full access" ON profiles
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users full access" ON company_info
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users full access" ON customers
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users full access" ON designs
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users full access" ON contracts
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users full access" ON payments
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users full access" ON notifications
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users full access" ON payment_notifications
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Bu kismi Supabase Dashboard > Storage'dan da yapabilirsiniz
-- veya SQL ile:

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('company', 'company', true),
  ('payment_receipts', 'payment_receipts', false),
  ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Authenticated upload company" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'company' AND auth.uid() IS NOT NULL);
CREATE POLICY "Public read company" ON storage.objects
  FOR SELECT USING (bucket_id = 'company');

CREATE POLICY "Authenticated upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment_receipts' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated read receipts" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment_receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated upload contracts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'contracts' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated read contracts" ON storage.objects
  FOR SELECT USING (bucket_id = 'contracts' AND auth.uid() IS NOT NULL);

-- ============================================================
-- UPDATED_AT TRIGGER (Otomatik guncelleme tarihi)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON company_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON designs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON payment_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ORNEK FIRMA VERISI
-- ============================================================
-- Ilk firma kaydini olustur (owner_id sonra guncellenebilir)
INSERT INTO company_info (name, address, phone, email, tax_office, tax_number, bank_name, contract_terms)
VALUES (
  'Tokyay Kereste',
  'Organize Sanayi Bolgesi, Duzce',
  '+90 380 XXX XX XX',
  'info@tokyay.com.tr',
  'Duzce Vergi Dairesi',
  '1234567890',
  'Ziraat Bankasi',
  ARRAY[
    'Taraflar sozlesmeyi tamamen kabul edip anlamis sayilirlar.',
    'Odeme plani tabloda belirtildigi sekilde yapilacaktir.',
    'Is baslangici on odemenin tamamlanmasindan sonra baslayacaktir.',
    'Tasima ve kurulum musterinin sorumlulugundasir.',
    'Garanti suresi teslimat tarihinden itibaren 1 yildir.',
    'Her iki taraf da yazili bildiri ile sozlesmeyi feshedebilir.'
  ]
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- BITTI!
-- Tablolar: profiles, company_info, customers, designs,
--           contracts, payments, notifications, payment_notifications
-- Storage:  company, payment_receipts, contracts
-- ============================================================
