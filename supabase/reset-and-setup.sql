-- ============================================================================
-- Tokyay Kereste - TEMIZ KURULUM
-- Onceki hatalari temizler ve bastan kurar
-- Supabase SQL Editor'de calistirin
-- ============================================================================

-- ============================================================================
-- ADIM 1: MEVCUT NESNELERI TEMIZLE
-- ============================================================================

-- Trigger'lari kaldir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS profiles_updated_at_trigger ON profiles;
DROP TRIGGER IF EXISTS customers_updated_at_trigger ON customers;
DROP TRIGGER IF EXISTS designs_updated_at_trigger ON designs;
DROP TRIGGER IF EXISTS contracts_updated_at_trigger ON contracts;
DROP TRIGGER IF EXISTS production_orders_updated_at_trigger ON production_orders;
DROP TRIGGER IF EXISTS production_steps_updated_at_trigger ON production_steps;
DROP TRIGGER IF EXISTS contracts_generate_number_trigger ON contracts;

-- Fonksiyonlari kaldir
DROP FUNCTION IF EXISTS create_profile_on_signup() CASCADE;
DROP FUNCTION IF EXISTS update_profiles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS generate_contract_number() CASCADE;

-- View'lari kaldir
DROP VIEW IF EXISTS customer_summary CASCADE;
DROP VIEW IF EXISTS design_details CASCADE;
DROP VIEW IF EXISTS production_progress CASCADE;

-- Tablolari kaldir (sirali - foreign key'ler yuzunden)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
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

-- Enum'lari kaldir
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
-- ADIM 2: ENUM TURLERI
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

CREATE TYPE payment_type AS ENUM ('pesinat', 'taksit', 'kalan');
CREATE TYPE payment_method AS ENUM ('nakit', 'havale', 'kredi_karti');
CREATE TYPE payment_status AS ENUM ('bekliyor', 'odendi', 'gecikti', 'iptal');
CREATE TYPE notification_status AS ENUM ('bekliyor', 'onaylandi', 'reddedildi');

CREATE TYPE production_status AS ENUM (
  'bekliyor', 'basladi', 'devam_ediyor', 'tamamlandi',
  'kalite_kontrol', 'onaylandi', 'sevke_hazir', 'sevk_edildi'
);

CREATE TYPE production_step_enum AS ENUM (
  'malzeme_alindi', 'sase_yapildi', 'panel_yapildi', 'cati_yapildi',
  'kapi_pencere_takildi', 'elektrik_yapildi', 'boya_yapildi', 'ic_duzenleme', 'tamamlandi'
);

CREATE TYPE customer_source AS ENUM (
  'referans', 'instagram', 'web', 'telefon', 'etkinlik', 'diger'
);

-- ============================================================================
-- ADIM 3: TABLOLAR
-- ============================================================================

-- Profiller
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  role user_role NOT NULL DEFAULT 'musteri',
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Firma bilgileri
CREATE TABLE company_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  tax_office TEXT,
  tax_number TEXT,
  iban TEXT,
  website TEXT,
  logo_url TEXT,
  contract_terms TEXT[] DEFAULT ARRAY[]::TEXT[],
  quality_checklist TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Musteriler
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source customer_source,
  address TEXT,
  city TEXT,
  notes TEXT,
  assigned_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasarimlar
CREATE TABLE designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  design_data JSONB DEFAULT '{}'::JSONB,
  status design_status DEFAULT 'taslak',
  total_price DECIMAL(12, 2),
  discount DECIMAL(12, 2) DEFAULT 0,
  final_price DECIMAL(12, 2),
  delivery_date DATE,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sozlesmeler
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL UNIQUE DEFAULT '',
  contract_date DATE DEFAULT CURRENT_DATE,
  terms TEXT[] DEFAULT ARRAY[]::TEXT[],
  signed_pdf_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  total_amount DECIMAL(12, 2),
  status contract_status DEFAULT 'hazirlandi',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Odemeler
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  payment_type payment_type NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  due_date DATE,
  paid_date DATE,
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  payment_method payment_method,
  receipt_url TEXT,
  notes TEXT,
  status payment_status DEFAULT 'bekliyor',
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Odeme Bildirimleri
CREATE TABLE payment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  message TEXT,
  amount DECIMAL(12, 2),
  receipt_url TEXT,
  status notification_status DEFAULT 'bekliyor',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uretim Siparisleri
CREATE TABLE production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_worker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 1,
  delivery_date DATE,
  status production_status DEFAULT 'bekliyor',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uretim Adimlari
CREATE TABLE production_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  step_name production_step_enum NOT NULL,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kalite Kontrol
CREATE TABLE quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  checker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  checklist_items JSONB DEFAULT '[]'::JSONB,
  overall_status notification_status DEFAULT 'bekliyor',
  notes TEXT,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mesajlar
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  production_order_id UUID REFERENCES production_orders(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bildirimler
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  reference_id UUID,
  reference_type TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ADIM 4: INDEKSLER
-- ============================================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_designs_customer_id ON designs(customer_id);
CREATE INDEX idx_designs_status ON designs(status);
CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_payments_contract_id ON payments(contract_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_production_orders_customer_id ON production_orders(customer_id);
CREATE INDEX idx_production_orders_status ON production_orders(status);
CREATE INDEX idx_production_steps_order_id ON production_steps(production_order_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_messages_from ON messages(from_user_id);
CREATE INDEX idx_messages_to ON messages(to_user_id);

-- ============================================================================
-- ADIM 5: TRIGGER FONKSIYONLARI
-- ============================================================================

-- Yeni kullanici kayit olunca otomatik profil olustur
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'musteri'::user_role),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_on_signup();

-- updated_at otomatik guncelleme
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
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
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
BEGIN
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COUNT(*) + 1 INTO seq_num FROM contracts WHERE contract_number LIKE year_str || '-%';
  NEW.contract_number := year_str || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contracts_auto_number
BEFORE INSERT ON contracts
FOR EACH ROW
WHEN (NEW.contract_number IS NULL OR NEW.contract_number = '')
EXECUTE FUNCTION generate_contract_number();

-- ============================================================================
-- ADIM 6: ROW LEVEL SECURITY (RLS)
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
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- PROFILLER: Herkes kendi profilini gorebilir, patron herkesi gorebilir
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_patron" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron')
);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_patron" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron')
);

-- FIRMA BILGILERI: Herkes okuyabilir, patron duzenleyebilir
CREATE POLICY "company_select_all" ON company_info FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "company_insert_patron" ON company_info FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron')
);
CREATE POLICY "company_update_patron" ON company_info FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron')
);

-- MUSTERILER: Patron ve tasarimci gorebilir/ekleyebilir
CREATE POLICY "customers_select_auth" ON customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "customers_insert_auth" ON customers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "customers_update_auth" ON customers FOR UPDATE USING (auth.role() = 'authenticated');

-- TASARIMLAR: Giris yapmis herkes gorebilir
CREATE POLICY "designs_select_auth" ON designs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "designs_insert_auth" ON designs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "designs_update_auth" ON designs FOR UPDATE USING (auth.role() = 'authenticated');

-- SOZLESMELER: Giris yapmis herkes gorebilir
CREATE POLICY "contracts_select_auth" ON contracts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "contracts_insert_auth" ON contracts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "contracts_update_auth" ON contracts FOR UPDATE USING (auth.role() = 'authenticated');

-- ODEMELER: Giris yapmis herkes gorebilir
CREATE POLICY "payments_select_auth" ON payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "payments_insert_auth" ON payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "payments_update_auth" ON payments FOR UPDATE USING (auth.role() = 'authenticated');

-- ODEME BILDIRIMLERI
CREATE POLICY "pay_notif_select_auth" ON payment_notifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "pay_notif_insert_auth" ON payment_notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "pay_notif_update_auth" ON payment_notifications FOR UPDATE USING (auth.role() = 'authenticated');

-- URETIM SIPARISLERI
CREATE POLICY "prod_orders_select_auth" ON production_orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "prod_orders_insert_auth" ON production_orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "prod_orders_update_auth" ON production_orders FOR UPDATE USING (auth.role() = 'authenticated');

-- URETIM ADIMLARI
CREATE POLICY "prod_steps_select_auth" ON production_steps FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "prod_steps_insert_auth" ON production_steps FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "prod_steps_update_auth" ON production_steps FOR UPDATE USING (auth.role() = 'authenticated');

-- KALITE KONTROL
CREATE POLICY "quality_select_auth" ON quality_checks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "quality_insert_auth" ON quality_checks FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- MESAJLAR
CREATE POLICY "messages_select_auth" ON messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "messages_insert_auth" ON messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- BILDIRIMLER
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_insert_auth" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- ADIM 7: TEMEL IZINLER
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- TAMAMLANDI!
-- Simdi Authentication > Users'dan kullanici olusturabilirsiniz.
-- ============================================================================
