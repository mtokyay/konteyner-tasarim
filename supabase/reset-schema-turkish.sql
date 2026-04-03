-- ============================================================================
-- Tokyay Kereste - TURKCE SUTUN ADLARI ILE YENI SEMA
-- Supabase SQL Editor'de calistirin
-- DIKKAT: Mevcut tablolari silip yeniden olusturur!
-- ============================================================================

-- Mevcut trigger'lari kaldir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS profiles_updated_at_trigger ON profiles;
DROP TRIGGER IF EXISTS customers_updated_at_trigger ON customers;
DROP TRIGGER IF EXISTS designs_updated_at_trigger ON designs;
DROP TRIGGER IF EXISTS contracts_updated_at_trigger ON contracts;
DROP TRIGGER IF EXISTS production_orders_updated_at_trigger ON production_orders;
DROP TRIGGER IF EXISTS production_steps_updated_at_trigger ON production_steps;
DROP TRIGGER IF EXISTS contracts_generate_number_trigger ON contracts;

-- Mevcut fonksiyonlari kaldir
DROP FUNCTION IF EXISTS create_profile_on_signup() CASCADE;
DROP FUNCTION IF EXISTS update_profiles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS generate_contract_number() CASCADE;

-- Mevcut tablolari kaldir (siralama onemli - foreign key bagimliliklari)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS work_photos CASCADE;
DROP TABLE IF EXISTS order_messages CASCADE;
DROP TABLE IF EXISTS quality_checks CASCADE;
DROP TABLE IF EXISTS production_steps CASCADE;
DROP TABLE IF EXISTS production_orders CASCADE;
DROP TABLE IF EXISTS payment_notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS designs CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS company_info CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Mevcut enum turlerini kaldir
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS design_status CASCADE;
DROP TYPE IF EXISTS contract_status CASCADE;
DROP TYPE IF EXISTS payment_type CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS notification_status CASCADE;
DROP TYPE IF EXISTS production_status CASCADE;
DROP TYPE IF EXISTS production_step_enum CASCADE;
DROP TYPE IF EXISTS customer_source CASCADE;

-- ============================================================================
-- 1. ENUM TURLERI
-- ============================================================================

CREATE TYPE user_role AS ENUM (
  'patron', 'tasarimci', 'muhasebeci', 'kalite_kontrolcu', 'usta', 'musteri'
);

CREATE TYPE design_status AS ENUM (
  'taslak', 'teklif', 'onaylandi', 'uretimde', 'tamamlandi', 'teslim_edildi', 'iptal'
);

CREATE TYPE contract_status AS ENUM (
  'hazirlandi', 'imzalandi', 'aktif', 'tamamlandi', 'iptal'
);

CREATE TYPE payment_type AS ENUM (
  'pesinat', 'taksit', 'kalan'
);

CREATE TYPE payment_method AS ENUM (
  'nakit', 'havale', 'kredi_karti'
);

CREATE TYPE payment_status AS ENUM (
  'bekliyor', 'odendi', 'gecikti', 'iptal'
);

CREATE TYPE notification_status AS ENUM (
  'bekliyor', 'onaylandi', 'reddedildi'
);

CREATE TYPE production_status AS ENUM (
  'bekliyor', 'basladi', 'devam_ediyor', 'tamamlandi',
  'kalite_kontrol', 'onaylandi', 'sevke_hazir', 'sevk_edildi'
);

CREATE TYPE production_step_enum AS ENUM (
  'malzeme_alindi', 'sase_yapildi', 'panel_yapildi', 'cati_yapildi',
  'kapi_pencere_takildi', 'elektrik_yapildi', 'boya_yapildi',
  'ic_duzenleme', 'tamamlandi'
);

CREATE TYPE customer_source AS ENUM (
  'referans', 'instagram', 'facebook', 'web_sitesi', 'ilan', 'arama', 'diger'
);

-- ============================================================================
-- 2. TEMEL TABLOLAR
-- ============================================================================

-- Kullanici profilleri
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'musteri',
  avatar_url TEXT,
  bio TEXT,
  company_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sirket/Isletme bilgileri
CREATE TABLE company_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  tax_office TEXT,
  tax_number TEXT,
  iban TEXT,
  logo_url TEXT,
  contract_terms TEXT[] DEFAULT ARRAY[]::TEXT[],
  quality_checklist TEXT[] DEFAULT ARRAY[]::TEXT[],
  qc_items TEXT[] DEFAULT ARRAY[]::TEXT[],
  bank_name TEXT,
  bank_branch TEXT,
  bank_iban TEXT,
  bank_account_no TEXT,
  proforma_footer_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Musteri bilgileri (TURKCE SUTUN ADLARI)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad TEXT NOT NULL,
  soyad TEXT NOT NULL,
  telefon TEXT,
  eposta TEXT,
  nereden_geldi customer_source,
  adres TEXT,
  notlar TEXT,
  assigned_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. TASARIM TABLOLARI
-- ============================================================================

CREATE TABLE designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  ref_no TEXT,
  ad TEXT NOT NULL,
  aciklama TEXT,
  genislik DECIMAL(10, 2),
  yukseklik DECIMAL(10, 2),
  uzunluk DECIMAL(10, 2),
  alan DECIMAL(10, 2),
  ozellikler JSONB DEFAULT '{}'::JSONB,
  design_data JSONB DEFAULT '{}'::JSONB,
  status design_status DEFAULT 'taslak',
  toplam_fiyat DECIMAL(12, 2),
  indirim DECIMAL(12, 2) DEFAULT 0,
  net_fiyat DECIMAL(12, 2),
  teslim_tarihi DATE,
  notlar TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. SOZLESME TABLOLARI
-- ============================================================================

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sozlesme_no TEXT NOT NULL UNIQUE,
  tarih DATE DEFAULT CURRENT_DATE,
  toplam_tutar DECIMAL(12, 2),
  terms TEXT[] DEFAULT ARRAY[]::TEXT[],
  signed_pdf_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  status contract_status DEFAULT 'hazirlandi',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. ODEME TABLOLARI
-- ============================================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sozlesme_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  musteri_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tur payment_type NOT NULL,
  tutar DECIMAL(12, 2) NOT NULL,
  odenen_tutar DECIMAL(12, 2),
  vade DATE,
  odeme_tarihi DATE,
  odeme_yontemi payment_method,
  dekont_url TEXT,
  notlar TEXT,
  durum payment_status DEFAULT 'bekliyor',
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Odeme Bildirimleri
CREATE TABLE payment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  musteri_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  dekont_url TEXT,
  status notification_status DEFAULT 'bekliyor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. URETIM TABLOLARI
-- ============================================================================

CREATE TABLE production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  musteri_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_worker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 1,
  teslim_tarihi DATE,
  durum production_status DEFAULT 'bekliyor',
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE production_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siparis_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  step_name production_step_enum NOT NULL,
  sira INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. KALITE KONTROL TABLOLARI
-- ============================================================================

CREATE TABLE quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  checker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  checklist_items JSONB DEFAULT '[]'::JSONB,
  overall_status notification_status DEFAULT 'bekliyor',
  notlar TEXT,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. ILETISIM TABLOLARI
-- ============================================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  production_order_id UUID REFERENCES production_orders(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Siparis mesajlari (musteri portal icin)
CREATE TABLE order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siparis_id UUID REFERENCES production_orders(id) ON DELETE CASCADE,
  musteri_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  sender TEXT DEFAULT 'musteri',
  message TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Is fotograflari
CREATE TABLE work_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siparis_id UUID REFERENCES production_orders(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  aciklama TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  reference_id UUID,
  reference_type TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. INDEXLER
-- ============================================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_designs_customer_id ON designs(customer_id);
CREATE INDEX idx_designs_status ON designs(status);
CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_payments_musteri_id ON payments(musteri_id);
CREATE INDEX idx_payments_sozlesme_id ON payments(sozlesme_id);
CREATE INDEX idx_payments_durum ON payments(durum);
CREATE INDEX idx_payments_vade ON payments(vade);
CREATE INDEX idx_production_orders_musteri_id ON production_orders(musteri_id);
CREATE INDEX idx_production_orders_durum ON production_orders(durum);
CREATE INDEX idx_production_steps_siparis_id ON production_steps(siparis_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- ============================================================================
-- 10. TRIGGERLER
-- ============================================================================

-- Yeni kullanici kaydolunca profil olustur
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Kullanici'), 'musteri');
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Profile creation error: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_on_signup();

-- updated_at otomatik guncelle
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER designs_updated_at BEFORE UPDATE ON designs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER production_orders_updated_at BEFORE UPDATE ON production_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER production_steps_updated_at BEFORE UPDATE ON production_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Sozlesme numarasi otomatik olustur
CREATE OR REPLACE FUNCTION generate_sozlesme_no()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
BEGIN
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COUNT(*) + 1 INTO seq_num FROM contracts WHERE sozlesme_no LIKE year_str || '-%';
  NEW.sozlesme_no := year_str || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contracts_generate_no
BEFORE INSERT ON contracts
FOR EACH ROW
WHEN (NEW.sozlesme_no IS NULL OR NEW.sozlesme_no = '')
EXECUTE FUNCTION generate_sozlesme_no();

-- ============================================================================
-- 11. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Basit RLS: Giris yapmis herkes erisebilir (baslangic icin)
-- Ilerde rol bazli kisitlamalar eklenebilir

CREATE POLICY "auth_select" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "auth_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "auth_all" ON company_info FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth_select" ON customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON customers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON customers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON customers FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "auth_select" ON designs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON designs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON designs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON designs FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "auth_select" ON contracts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON contracts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON contracts FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "auth_select" ON payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON payments FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "auth_select" ON payment_notifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON payment_notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON payment_notifications FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "auth_select" ON production_orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON production_orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON production_orders FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "auth_select" ON production_steps FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON production_steps FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON production_steps FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "auth_select" ON quality_checks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON quality_checks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON quality_checks FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "auth_select" ON messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_select" ON order_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON order_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_select" ON work_photos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON work_photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_select" ON notifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON notifications FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================================
-- 12. GRANT YETKILER
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- 13. MEHMET'IN ROLUNU PATRON YAP
-- ============================================================================

UPDATE profiles
SET role = 'patron', full_name = 'Mehmet Tokyay'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mehmet@tokyay.com.tr');

-- Dogrulama
SELECT id, full_name, role FROM profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'mehmet@tokyay.com.tr');
