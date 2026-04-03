-- ============================================================================
-- Tokyay Kereste - Konteyner Ev Tasarım ve Yönetim Portalı
-- PostgreSQL Şema
-- ============================================================================

-- ============================================================================
-- 1. ENUM TÜRLERİ (Enumerations)
-- ============================================================================

-- Kullanıcı rolleri
CREATE TYPE user_role AS ENUM (
  'patron',           -- İşletme sahibi
  'tasarimci',        -- Tasarımcı
  'muhasebeci',       -- Mali işler sorumlusu
  'kalite_kontrolcu', -- Kalite kontrol uzmanı
  'usta',             -- Üretim ustası
  'musteri'           -- Müşteri
);

-- Tasarım durumları
CREATE TYPE design_status AS ENUM (
  'taslak',         -- Taslak aşama
  'teklif',         -- Teklife dönüştürüldü
  'onaylandi',      -- Müşteri tarafından onaylandı
  'uretimde',       -- Üretim başladı
  'tamamlandi',     -- Üretim tamamlandı
  'teslim_edildi',  -- Müşteriye teslim edildi
  'iptal'           -- İptal edildi
);

-- Sözleşme durumları
CREATE TYPE contract_status AS ENUM (
  'hazirlandi',  -- Hazırlandı
  'imzalandi',   -- İmzalandı
  'aktif',       -- Aktif
  'tamamlandi',  -- Tamamlandı
  'iptal'        -- İptal edildi
);

-- Ödeme türleri
CREATE TYPE payment_type AS ENUM (
  'pesinat',     -- Ön ödeme
  'taksit',      -- Taksit
  'kalan'        -- Kalan ödeme
);

-- Ödeme yöntemleri
CREATE TYPE payment_method AS ENUM (
  'nakit',       -- Nakit
  'havale',      -- Banka transferi
  'kredi_karti'  -- Kredi kartı
);

-- Ödeme durumları
CREATE TYPE payment_status AS ENUM (
  'bekliyor',    -- Bekleniyor
  'odendi',      -- Ödendi
  'gecikti',     -- Gecikmeli
  'iptal'        -- İptal edildi
);

-- Ödeme bildirimi durumları
CREATE TYPE notification_status AS ENUM (
  'bekliyor',    -- Bekleniyor
  'onaylandi',   -- Onaylandı
  'reddedildi'   -- Reddedildi
);

-- Üretim siparişi durumları
CREATE TYPE production_status AS ENUM (
  'bekliyor',        -- Bekleniyor
  'basladi',         -- Başladı
  'devam_ediyor',    -- Devam ediyor
  'tamamlandi',      -- Tamamlandı
  'kalite_kontrol',  -- Kalite kontrol aşamasında
  'onaylandi',       -- Kalite kontrol onaylandı
  'sevke_hazir',     -- Sevke hazır
  'sevk_edildi'      -- Sevk edildi
);

-- Üretim adımları
CREATE TYPE production_step_enum AS ENUM (
  'malzeme_alindi',       -- Malzeme alındı
  'sase_yapildi',         -- Şase yapıldı
  'panel_yapildi',        -- Panel yapıldı
  'cati_yapildi',         -- Çatı yapıldı
  'kapi_pencere_takildi',  -- Kapı ve pencere takıldı
  'elektrik_yapildi',     -- Elektrik yapıldı
  'boya_yapildi',         -- Boya yapıldı
  'ic_duzenleme',         -- İç düzenleme
  'tamamlandi'            -- Tamamlandı
);

-- Müşteri kaynakları
CREATE TYPE customer_source AS ENUM (
  'referans',      -- Referans
  'instagram',     -- Instagram
  'web',           -- Web sitesi
  'telefon',       -- Telefonla arama
  'etkinlik',      -- Fuarlar/etkinlikler
  'diger'          -- Diğer
);

-- ============================================================================
-- 2. TEMEL TABLOLAR
-- ============================================================================

-- Kullanıcı profilleri (auth.users genişletmesi)
-- Supabase auth.users ile ilişkili olan tablo
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'musteri',
  avatar_url TEXT,
  bio TEXT,
  company_id UUID,  -- Atanacak şirketle ilişki
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Şirket/İşletme bilgileri
CREATE TABLE company_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  tax_office TEXT,
  tax_number TEXT UNIQUE,
  iban TEXT,
  logo_url TEXT,
  -- Sözleşme maddeleri (kurumsal şablonlar)
  contract_terms TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Kalite kontrol maddeleri
  quality_checklist TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Banka bilgileri
  bank_name TEXT,
  bank_branch TEXT,
  bank_iban TEXT,
  bank_account_no TEXT,
  -- Proforma fatura alt notu
  proforma_footer_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Müşteri bilgileri
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source customer_source,
  address TEXT,
  notes TEXT,
  -- Müşteri bir user account'a sahip olabilir
  assigned_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. TASARIM TABLOLARI
-- ============================================================================

-- Tasarımlar
CREATE TABLE designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  -- JSON formatında tasarım verileri (konteyner, mobilyalar, bölümler vb.)
  design_data JSONB DEFAULT '{}'::JSONB,
  status design_status DEFAULT 'taslak',
  total_price DECIMAL(12, 2),
  discount DECIMAL(12, 2) DEFAULT 0,
  final_price DECIMAL(12, 2),
  delivery_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. SÖZLEŞME TABLOLARI
-- ============================================================================

-- Sözleşmeler
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  -- Otomatik oluşturulmuş sözleşme numarası (YYYY-MM-XXXXX formatında)
  contract_number TEXT NOT NULL UNIQUE,
  contract_date DATE DEFAULT CURRENT_DATE,
  -- Sözleşme maddeleri
  terms TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- İmzalı PDF URL'leri
  signed_pdf_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  status contract_status DEFAULT 'hazirlandi',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. ÖDEME TABLOLARI
-- ============================================================================

-- Ödemeler
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  payment_type payment_type NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  due_date DATE,
  paid_date DATE,
  paid_amount DECIMAL(12, 2),
  payment_method payment_method,
  receipt_url TEXT,
  notes TEXT,
  status payment_status DEFAULT 'bekliyor',
  recorded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ödeme Bildirimleri
CREATE TABLE payment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  receipt_url TEXT,
  status notification_status DEFAULT 'bekliyor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. ÜRETİM TABLOLARI
-- ============================================================================

-- Üretim Siparişleri
CREATE TABLE production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  -- Atanan usta (role = 'usta' olan profil)
  assigned_worker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 1, -- 1 (En yüksek) - 10 (En düşük)
  delivery_date DATE,
  status production_status DEFAULT 'bekliyor',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Üretim Adımları
CREATE TABLE production_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  step_name production_step_enum NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Adım sırasında çekilen fotoğraflar
  photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. KALİTE KONTROL TABLOLARI
-- ============================================================================

-- Kalite Kontroller
CREATE TABLE quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  checker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  -- Kontrol listesi öğeleri: {item: string, checked: boolean, photo_url?: string, note?: string}[]
  checklist_items JSONB DEFAULT '[]'::JSONB,
  overall_status notification_status DEFAULT 'bekliyor',
  notes TEXT,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. İLETİŞİM TABLOLARI
-- ============================================================================

-- Mesajlar (Usta-Müşteri Kommunikasyonu)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  production_order_id UUID REFERENCES production_orders(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bildirimler (Genel Sistem Bildirimleri)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT, -- 'payment', 'production', 'message', 'quality_check', vb.
  reference_id UUID, -- İlgili kaydın ID'si
  reference_type TEXT, -- 'payment', 'production_order', 'contract', vb.
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. İNDEKSLER
-- ============================================================================

-- Profil indeksleri
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);

-- Müşteri indeksleri
CREATE INDEX idx_customers_created_by ON customers(created_by);
CREATE INDEX idx_customers_assigned_user_id ON customers(assigned_user_id);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- Tasarım indeksleri
CREATE INDEX idx_designs_customer_id ON designs(customer_id);
CREATE INDEX idx_designs_status ON designs(status);
CREATE INDEX idx_designs_created_by ON designs(created_by);
CREATE INDEX idx_designs_created_at ON designs(created_at);

-- Sözleşme indeksleri
CREATE INDEX idx_contracts_design_id ON contracts(design_id);
CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_contract_number ON contracts(contract_number);

-- Ödeme indeksleri
CREATE INDEX idx_payments_contract_id ON payments(contract_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Ödeme bildirimi indeksleri
CREATE INDEX idx_payment_notifications_payment_id ON payment_notifications(payment_id);
CREATE INDEX idx_payment_notifications_customer_id ON payment_notifications(customer_id);
CREATE INDEX idx_payment_notifications_status ON payment_notifications(status);

-- Üretim siparişi indeksleri
CREATE INDEX idx_production_orders_design_id ON production_orders(design_id);
CREATE INDEX idx_production_orders_customer_id ON production_orders(customer_id);
CREATE INDEX idx_production_orders_assigned_worker_id ON production_orders(assigned_worker_id);
CREATE INDEX idx_production_orders_status ON production_orders(status);
CREATE INDEX idx_production_orders_priority ON production_orders(priority);

-- Üretim adımı indeksleri
CREATE INDEX idx_production_steps_production_order_id ON production_steps(production_order_id);
CREATE INDEX idx_production_steps_step_name ON production_steps(step_name);
CREATE INDEX idx_production_steps_completed_by ON production_steps(completed_by);

-- Kalite kontrol indeksleri
CREATE INDEX idx_quality_checks_production_order_id ON quality_checks(production_order_id);
CREATE INDEX idx_quality_checks_checker_id ON quality_checks(checker_id);
CREATE INDEX idx_quality_checks_overall_status ON quality_checks(overall_status);

-- Mesaj indeksleri
CREATE INDEX idx_messages_from_user_id ON messages(from_user_id);
CREATE INDEX idx_messages_to_user_id ON messages(to_user_id);
CREATE INDEX idx_messages_production_order_id ON messages(production_order_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Bildirim indeksleri
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- 10. TRİGGERLER
-- ============================================================================

-- Trigger: Yeni kullanıcı kaydolduğunda otomatik profil oluştur
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'musteri'::user_role,
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

-- Trigger: Profil güncellendiğinde updated_at'ı güncelle
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();

-- Trigger: Müşteri güncellendiğinde updated_at'ı güncelle
CREATE TRIGGER customers_updated_at_trigger
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();

-- Trigger: Tasarım güncellendiğinde updated_at'ı güncelle
CREATE TRIGGER designs_updated_at_trigger
BEFORE UPDATE ON designs
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();

-- Trigger: Sözleşme güncellendiğinde updated_at'ı güncelle
CREATE TRIGGER contracts_updated_at_trigger
BEFORE UPDATE ON contracts
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();

-- Trigger: Üretim siparişi güncellendiğinde updated_at'ı güncelle
CREATE TRIGGER production_orders_updated_at_trigger
BEFORE UPDATE ON production_orders
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();

-- Trigger: Üretim adımı güncellendiğinde updated_at'ı güncelle
CREATE TRIGGER production_steps_updated_at_trigger
BEFORE UPDATE ON production_steps
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();

-- Trigger: Sözleşme numarası otomatik oluştur
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
  new_contract_number TEXT;
BEGIN
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Bu yıl için son sıra numarasını bul
  SELECT COUNT(*) + 1 INTO seq_num
  FROM contracts
  WHERE contract_number LIKE year_str || '-%';

  new_contract_number := year_str || '-' || LPAD(seq_num::TEXT, 5, '0');
  NEW.contract_number := new_contract_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contracts_generate_number_trigger
BEFORE INSERT ON contracts
FOR EACH ROW
WHEN (NEW.contract_number IS NULL OR NEW.contract_number = '')
EXECUTE FUNCTION generate_contract_number();

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLİCİLERİ
-- ============================================================================

-- RLS'yi etkinleştir
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

-- ========== PROFILES POLİCİLERİ ==========
-- Kullanıcılar kendi profillerini görebilir ve güncelleyebilir
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Patron tüm profilleri görebilir
CREATE POLICY "Patron can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron'::user_role
  )
);

-- Kullanıcılar kendi profillerini güncelleyebilir
-- Not: role ve company_id koruması uygulama katmanında yapılır
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Patron başka profilini güncelleyebilir
CREATE POLICY "Patron can update profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron'::user_role
  )
);

-- ========== CUSTOMERS POLİCİLERİ ==========
-- Müşterileri oluşturan kişi görebilir
CREATE POLICY "Users can view customers they created"
ON customers FOR SELECT
USING (created_by = auth.uid());

-- Patron tüm müşterileri görebilir
CREATE POLICY "Patron can view all customers"
ON customers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron'::user_role
  )
);

-- Tasarımcılar atandıkları müşterileri görebilir
CREATE POLICY "Designer can view assigned customer"
ON customers FOR SELECT
USING (assigned_user_id = auth.uid());

-- Müşteriler kendi bilgilerini görebilir
CREATE POLICY "Customer can view own profile"
ON customers FOR SELECT
USING (assigned_user_id = auth.uid());

-- Patron müşteri ekleyebilir
CREATE POLICY "Patron can insert customer"
ON customers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron'::user_role
  )
);

-- ========== DESIGNS POLİCİLERİ ==========
-- Tasarımı oluşturan kişi görebilir
CREATE POLICY "Users can view own designs"
ON designs FOR SELECT
USING (created_by = auth.uid());

-- Müşteri kendi tasarımlarını görebilir
CREATE POLICY "Customer can view own design"
ON designs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = designs.customer_id
    AND c.assigned_user_id = auth.uid()
  )
);

-- Patron tüm tasarımları görebilir
CREATE POLICY "Patron can view all designs"
ON designs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron'::user_role
  )
);

-- Tasarımcı tasarım ekleyebilir
CREATE POLICY "Designer can insert design"
ON designs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tasarimci'::user_role
  )
);

-- Tasarımcı kendi tasarımlarını güncelleyebilir
CREATE POLICY "Designer can update own design"
ON designs FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- ========== CONTRACTS POLİCİLERİ ==========
-- Sözleşmeyi oluşturan görebilir
CREATE POLICY "Users can view contracts they created"
ON contracts FOR SELECT
USING (created_by = auth.uid());

-- Müşteri kendi sözleşmelerini görebilir
CREATE POLICY "Customer can view own contract"
ON contracts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = contracts.customer_id
    AND c.assigned_user_id = auth.uid()
  )
);

-- Patron tüm sözleşmeleri görebilir
CREATE POLICY "Patron can view all contracts"
ON contracts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron'::user_role
  )
);

-- Muhasebeci sözleşmeleri görebilir ve güncelleyebilir
CREATE POLICY "Accountant can view and manage contracts"
ON contracts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'muhasebeci'::user_role
  )
);

-- ========== PAYMENTS POLİCİLERİ ==========
-- Ödemeyi kaydeden görebilir
CREATE POLICY "Users can view payments they recorded"
ON payments FOR SELECT
USING (recorded_by = auth.uid());

-- Müşteri kendi ödemelerini görebilir
CREATE POLICY "Customer can view own payments"
ON payments FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM customers WHERE assigned_user_id = auth.uid()
  )
);

-- Muhasebeci tüm ödemeleri görebilir
CREATE POLICY "Accountant can view all payments"
ON payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'muhasebeci'::user_role
  )
);

-- Patron tüm ödemeleri görebilir
CREATE POLICY "Patron can view all payments"
ON payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron'::user_role
  )
);

-- Muhasebeci ödeme ekleyebilir
CREATE POLICY "Accountant can insert payment"
ON payments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'muhasebeci'::user_role
  )
);

-- ========== PRODUCTION_ORDERS POLİCİLERİ ==========
-- Usta atandığı siparişleri görebilir
CREATE POLICY "Worker can view assigned orders"
ON production_orders FOR SELECT
USING (assigned_worker_id = auth.uid());

-- Tasarımcı kendi tasarımlarından gelen siparişleri görebilir
CREATE POLICY "Designer can view production orders from own designs"
ON production_orders FOR SELECT
USING (
  design_id IN (
    SELECT id FROM designs WHERE created_by = auth.uid()
  )
);

-- Patron tüm siparişleri görebilir
CREATE POLICY "Patron can view all orders"
ON production_orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron'::user_role
  )
);

-- Müşteri kendi siparişlerini görebilir
CREATE POLICY "Customer can view own orders"
ON production_orders FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM customers WHERE assigned_user_id = auth.uid()
  )
);

-- ========== PRODUCTION_STEPS POLİCİLERİ ==========
-- Adımı tamamlayan görebilir
CREATE POLICY "Users can view steps they completed"
ON production_steps FOR SELECT
USING (completed_by = auth.uid());

-- Usta kendi siparişlerinin adımlarını görebilir ve güncelleyebilir
CREATE POLICY "Worker can view steps of assigned order"
ON production_steps FOR SELECT
USING (
  production_order_id IN (
    SELECT id FROM production_orders WHERE assigned_worker_id = auth.uid()
  )
);

-- Patron tüm adımları görebilir
CREATE POLICY "Patron can view all steps"
ON production_steps FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron'::user_role
  )
);

-- Usta kendi siparişlerinin adımlarını ekleyebilir
CREATE POLICY "Worker can insert production step"
ON production_steps FOR INSERT
WITH CHECK (
  production_order_id IN (
    SELECT id FROM production_orders WHERE assigned_worker_id = auth.uid()
  )
);

-- ========== QUALITY_CHECKS POLİCİLERİ ==========
-- Kontrol yapan görebilir
CREATE POLICY "Checker can view their checks"
ON quality_checks FOR SELECT
USING (checker_id = auth.uid());

-- Patron tüm kontrolleri görebilir
CREATE POLICY "Patron can view all checks"
ON quality_checks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron'::user_role
  )
);

-- Kalite kontrol uzmanı kontrol ekleyebilir
CREATE POLICY "Quality checker can insert check"
ON quality_checks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'kalite_kontrolcu'::user_role
  )
);

-- ========== MESSAGES POLİCİLERİ ==========
-- Gönderen ve alan mesajları görebilir
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (
  from_user_id = auth.uid() OR to_user_id = auth.uid()
);

-- Patron tüm mesajları görebilir
CREATE POLICY "Patron can view all messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron'::user_role
  )
);

-- Kullanıcılar mesaj gönderebilir
CREATE POLICY "Users can insert message"
ON messages FOR INSERT
WITH CHECK (from_user_id = auth.uid());

-- ========== NOTIFICATIONS POLİCİLERİ ==========
-- Kullanıcılar kendi bildirimlerini görebilir
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- Patron tüm bildirimleri görebilir
CREATE POLICY "Patron can view all notifications"
ON notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron'::user_role
  )
);

-- ============================================================================
-- 12. SUPABASE STORAGE BUCKET POLİCİLERİ
-- ============================================================================

-- Storage bucket'ları konfigüre etmek için aşağıdaki komutları Supabase dashboard'dan çalıştırın:

/*
-- 1. Fotoğraflar bucket'ı
INSERT INTO storage.buckets (id, name, public)
VALUES ('production-photos', 'production-photos', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Sözleşmeler bucket'ı
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Belgeler bucket'ı
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Şirket logosu bucket'ı
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', false)
ON CONFLICT (id) DO NOTHING;

-- 5. Avatar bucket'ı
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

-- Production Photos Bucket Policies
-- Usta kendi fotoğraflarını yükleyebilir
CREATE POLICY "Workers can upload production photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'production-photos' AND
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'usta'::user_role
  )
);

-- Patron tüm fotoğrafları görebilir
CREATE POLICY "Patron can view all photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'production-photos' AND
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'patron'::user_role
  )
);

-- Contracts Bucket Policies
-- Muhasebeci sözleşmeleri yükleyebilir
CREATE POLICY "Accountant can upload contracts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'contracts' AND
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'muhasebeci'::user_role
  )
);

-- Avatars Bucket Policies
-- Kullanıcılar kendi avatarlarını yükleyebilir
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
*/

-- ============================================================================
-- 13. VİEW'LAR (İstatistikler ve Raporlamalar için)
-- ============================================================================

-- Müşteri Özeti View
CREATE OR REPLACE VIEW customer_summary AS
SELECT
  c.id,
  c.first_name || ' ' || c.last_name AS full_name,
  c.phone,
  c.email,
  c.source,
  COUNT(DISTINCT d.id) AS design_count,
  COUNT(DISTINCT co.id) AS contract_count,
  SUM(COALESCE(p.amount, 0)) FILTER (WHERE p.status = 'odendi') AS total_paid,
  SUM(COALESCE(p.amount, 0)) FILTER (WHERE p.status = 'bekliyor') AS total_pending,
  c.created_at
FROM customers c
LEFT JOIN designs d ON c.id = d.customer_id
LEFT JOIN contracts co ON c.id = co.customer_id
LEFT JOIN payments p ON co.id = p.contract_id
GROUP BY c.id, c.first_name, c.last_name, c.phone, c.email, c.source, c.created_at;

-- Tasarım Detayları View
CREATE OR REPLACE VIEW design_details AS
SELECT
  d.id,
  d.title,
  c.first_name || ' ' || c.last_name AS customer_name,
  d.status,
  d.total_price,
  d.discount,
  d.final_price,
  d.delivery_date,
  COUNT(DISTINCT p.id) AS payment_count,
  SUM(COALESCE(p.amount, 0)) FILTER (WHERE p.status = 'odendi') AS paid_amount,
  d.created_at
FROM designs d
LEFT JOIN customers c ON d.customer_id = c.id
LEFT JOIN contracts co ON d.id = co.design_id
LEFT JOIN payments p ON co.id = p.contract_id
GROUP BY d.id, d.title, c.first_name, c.last_name, d.status, d.total_price, d.discount, d.final_price, d.delivery_date, d.created_at;

-- Üretim İlerleme View
CREATE OR REPLACE VIEW production_progress AS
SELECT
  po.id,
  d.title AS design_title,
  c.first_name || ' ' || c.last_name AS customer_name,
  p.full_name AS worker_name,
  po.status,
  COUNT(DISTINCT ps.id) FILTER (WHERE ps.completed_at IS NOT NULL) AS completed_steps,
  COUNT(DISTINCT ps.id) AS total_steps,
  po.delivery_date,
  po.created_at
FROM production_orders po
LEFT JOIN designs d ON po.design_id = d.id
LEFT JOIN customers c ON po.customer_id = c.id
LEFT JOIN profiles p ON po.assigned_worker_id = p.id
LEFT JOIN production_steps ps ON po.id = ps.production_order_id
GROUP BY po.id, d.title, c.first_name, c.last_name, p.full_name, po.status, po.delivery_date, po.created_at;

-- ============================================================================
-- GRANT'LAR (Temel İzinler)
-- ============================================================================

-- Tüm authenticated kullanıcılara temel izinler
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;
GRANT INSERT ON messages TO authenticated;
GRANT INSERT ON notifications TO authenticated;

-- ============================================================================
-- AÇIKLAMALAR
-- ============================================================================

COMMENT ON SCHEMA public IS 'Tokyay Kereste - Konteyner Ev Tasarım ve Yönetim Portalı';

COMMENT ON TABLE profiles IS 'Kullanıcı profilleri - auth.users ile ilişkili';
COMMENT ON TABLE company_info IS 'Şirket/İşletme bilgileri ve kurumsal şablonlar';
COMMENT ON TABLE customers IS 'Müşteri kayıtları';
COMMENT ON TABLE designs IS 'Konteyner ev tasarımları';
COMMENT ON TABLE contracts IS 'Müşteri sözleşmeleri';
COMMENT ON TABLE payments IS 'Ödeme kayıtları';
COMMENT ON TABLE payment_notifications IS 'Ödeme bildirimleri';
COMMENT ON TABLE production_orders IS 'Üretim siparişleri';
COMMENT ON TABLE production_steps IS 'Üretim adımları ve ilerleme';
COMMENT ON TABLE quality_checks IS 'Kalite kontrol raporları';
COMMENT ON TABLE messages IS 'Usta-müşteri iletişimi';
COMMENT ON TABLE notifications IS 'Sistem bildirimleri';

-- ============================================================================
-- ÖNEMLİ NOTLAR
-- ============================================================================

/*
1. RLS POLİSİLERİ:
   - Tüm tablolarda Row Level Security aktif
   - Her rol için özel erişim kontrolleri
   - Müşteri, tasarımcı, usta, muhasebeci ve kalite kontrol uzmanı ayrı izinler

2. SUPABASE KURULUMU:
   - auth.users ile otomatik profil senkronizasyonu
   - Yeni kullanıcı kaydolduğunda otomatik profil oluşturma
   - Storage bucket'larının manüel olarak oluşturulması gerekir

3. İNDEKSLER:
   - Sık sorgulanılan alanlar üzerinde indeksler tanımlandı
   - Performans optimizasyonu için B-Tree indeksleri kullanıldı

4. TRİGGERLER:
   - Otomatik updated_at güncelleme
   - Sözleşme numarası otomatik oluşturma (YYYY-XXXXX formatı)
   - Yeni kullanıcı kaydı için otomatik profil oluşturma

5. ENUM TÜRLERİ:
   - Tüm durum alanları için güvenli enum türleri tanımlandı
   - Veri tutarlılığı ve veri tabanı performansı için optimize edildi

6. VIEWS:
   - İstatistikler ve raporlar için önceden tanımlanmış view'lar
   - Özetleyen view'lar ile hızlı sorgu imkanı

7. ÇOKLU PARA BİRİMİ İÇİN:
   - Tüm fiyat alanları DECIMAL(12, 2) olarak tanımlandı
   - Finansal işlemler için yeterli hassasiyet

8. ÜRÜN SÜRÜMLERİ:
   - Tüm kayıtlar için created_at ve updated_at alanları
   - Veri değişikliklerin takibi için timestamp'ler
*/

-- End of schema definition
