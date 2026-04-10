-- ============================================================
-- KONTEYNER TASARIM PORTALI — SAAS MULTI-TENANT SCHEMA
-- Supabase SQL — Sifirdan Kurulum
-- ============================================================
-- Supabase Dashboard > SQL Editor'e yapistirin ve calistirin.
-- ============================================================

-- Temizlik
DROP TABLE IF EXISTS payment_notifications CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS designs CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS company_info CASCADE;
DROP TABLE IF EXISTS subscription_payments CASCADE;
DROP TABLE IF EXISTS tenant_members CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS get_user_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS is_tenant_member(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_tenant_owner(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_owned_tenant_ids() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_tenant() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- ============================================================
-- 1. PROFILES (Kullanici Profilleri — Platform Seviyesi)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. PLANS (Abonelik Planlari)
-- ============================================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly INTEGER DEFAULT 0,
  price_yearly INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'TRY',
  limits JSONB NOT NULL DEFAULT '{
    "max_customers": 5,
    "max_designs": 5,
    "max_active_designs": 5,
    "max_revisions": 1,
    "max_contracts": 0,
    "max_members": 1,
    "max_storage_mb": 100
  }'::jsonb,
  features JSONB NOT NULL DEFAULT '{
    "save_design": false,
    "export_pdf": false,
    "contracts": false,
    "payments": false,
    "customer_portal": false,
    "team_management": false,
    "version_tracking": false,
    "worker_tracking": false,
    "quality_control": false,
    "api_access": false
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Varsayilan planlar
INSERT INTO plans (name, slug, description, price_monthly, price_yearly, limits, features, sort_order) VALUES
(
  'Ücretsiz', 'free', 'Başlangıç için temel özellikler — 5 müşteri, 5 tasarım, kaydetme',
  0, 0,
  '{"max_customers": 5, "max_designs": 5, "max_active_designs": 5, "max_revisions": 1, "max_contracts": 0, "max_members": 1, "max_storage_mb": 100}'::jsonb,
  '{"save_design": true, "export_pdf": false, "contracts": false, "payments": false, "customer_portal": false, "team_management": false, "version_tracking": false, "worker_tracking": false, "quality_control": false, "api_access": false}'::jsonb,
  0
),
(
  'Başlangıç', 'starter', 'Küçük işletmeler için — 50 müşteri, PDF çıktı',
  499, 5390,
  '{"max_customers": 50, "max_designs": 25, "max_active_designs": 25, "max_revisions": 5, "max_contracts": 0, "max_members": 1, "max_storage_mb": 1000}'::jsonb,
  '{"save_design": true, "export_pdf": true, "contracts": false, "payments": false, "customer_portal": false, "team_management": false, "version_tracking": false, "worker_tracking": false, "quality_control": false, "api_access": false}'::jsonb,
  1
),
(
  'Profesyonel', 'pro', 'Büyüyen işletmeler için — 200 müşteri, sözleşme ve ödeme takibi, 5 çalışan',
  999, 10790,
  '{"max_customers": 200, "max_designs": 100, "max_active_designs": 100, "max_revisions": 20, "max_contracts": 999999, "max_members": 5, "max_storage_mb": 5000}'::jsonb,
  '{"save_design": true, "export_pdf": true, "contracts": true, "payments": true, "customer_portal": false, "team_management": true, "version_tracking": false, "worker_tracking": false, "quality_control": false, "api_access": false}'::jsonb,
  2
),
(
  'Kurumsal', 'enterprise', 'Büyük firmalar için tam paket — sınırsız, usta izleme, kalite kontrol, API',
  1999, 21590,
  '{"max_customers": 999999, "max_designs": 999999, "max_active_designs": 999999, "max_revisions": 999999, "max_contracts": 999999, "max_members": 20, "max_storage_mb": 50000}'::jsonb,
  '{"save_design": true, "export_pdf": true, "contracts": true, "payments": true, "customer_portal": true, "team_management": true, "version_tracking": true, "worker_tracking": true, "quality_control": true, "api_access": true}'::jsonb,
  3
);

-- ============================================================
-- 3. TENANTS (Firmalar)
-- ============================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN (
    'trialing', 'active', 'past_due', 'canceled', 'expired'
  )),
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. TENANT_MEMBERS (Firma Uyeleri)
-- ============================================================
CREATE TABLE tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN (
    'owner', 'admin', 'designer', 'production', 'accounting', 'customer'
  )),
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- ============================================================
-- 5. COMPANY_INFO (Firma Detaylari — her tenant icin 1 kayit)
-- ============================================================
CREATE TABLE company_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  tax_office TEXT,
  tax_number TEXT,
  iban TEXT,
  logo_url TEXT,
  contract_terms TEXT[] DEFAULT '{}',
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
-- 6. CUSTOMERS (Musteriler — tenant bazli)
-- ============================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ad TEXT NOT NULL,
  soyad TEXT NOT NULL,
  telefon TEXT,
  eposta TEXT,
  nereden_geldi TEXT,
  adres TEXT,
  notlar TEXT,
  portal_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. DESIGNS (Tasarimlar — tenant bazli)
-- ============================================================
CREATE TABLE designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  ref_no TEXT,
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
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, ref_no)
);

-- ============================================================
-- 8. CONTRACTS (Sozlesmeler — tenant bazli)
-- ============================================================
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sozlesme_no TEXT,
  tarih DATE DEFAULT CURRENT_DATE,
  toplam_tutar NUMERIC DEFAULT 0,
  terms TEXT[] DEFAULT '{}',
  signed_pdf_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'hazirlandi' CHECK (status IN (
    'hazirlandi', 'imzalandi', 'aktif', 'tamamlandi', 'iptal'
  )),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, sozlesme_no)
);

-- ============================================================
-- 9. PAYMENTS (Odemeler — tenant bazli)
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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
-- 10. SUBSCRIPTION_PAYMENTS (Platform Abonelik Odemeleri)
-- ============================================================
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'TRY',
  payment_method TEXT,
  paytr_merchant_oid TEXT,
  paytr_token TEXT,
  paytr_status TEXT,
  paytr_response JSONB,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'completed', 'failed', 'refunded'
  )),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 11. NOTIFICATIONS (Bildirimler — tenant bazli)
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  baslik TEXT NOT NULL,
  mesaj TEXT,
  tur TEXT DEFAULT 'bilgi',
  okundu BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 12. PAYMENT_NOTIFICATIONS (Odeme Bildirimleri)
-- ============================================================
CREATE TABLE payment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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
-- HELPER FUNCTIONS
-- ============================================================

-- Kullanicinin aktif tenant_id'sini dondur
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM tenant_members
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Kullanicinin rolunu dondur
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM tenant_members
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Kullanici super admin mi?
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Kullanici bu tenant'in uyesi mi? (RLS bypass — dongu onlemi)
CREATE OR REPLACE FUNCTION is_tenant_member(t_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_members
    WHERE tenant_id = t_id
      AND user_id = auth.uid()
      AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Kullanici bu tenant'in sahibi mi? (RLS bypass — dongu onlemi)
CREATE OR REPLACE FUNCTION is_tenant_owner(t_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenants
    WHERE id = t_id
      AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Kullanicinin sahip oldugu tenant ID'leri (RLS bypass)
CREATE OR REPLACE FUNCTION get_owned_tenant_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM tenants WHERE owner_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- updated_at otomatik guncelleme
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenants
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
-- TRIGGER: Yeni kullanici kayit olunca profil olustur
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TRIGGER: Yeni tenant olusunca company_info otomatik ekle
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_tenant()
RETURNS trigger AS $$
BEGIN
  INSERT INTO company_info (tenant_id, name)
  VALUES (NEW.id, NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_tenant_created
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION handle_new_tenant();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_eposta ON customers(tenant_id, eposta);
CREATE INDEX idx_designs_tenant ON designs(tenant_id);
CREATE INDEX idx_designs_customer ON designs(customer_id);
CREATE INDEX idx_designs_status ON designs(tenant_id, status);
CREATE INDEX idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX idx_contracts_customer ON contracts(customer_id);
CREATE INDEX idx_contracts_design ON contracts(design_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_sozlesme ON payments(sozlesme_id);
CREATE INDEX idx_payments_musteri ON payments(musteri_id);
CREATE INDEX idx_payments_durum ON payments(tenant_id, durum);
CREATE INDEX idx_payments_vade ON payments(vade);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_sub_payments_tenant ON subscription_payments(tenant_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- PROFILES: Kendi profilini gor/duzenle, super admin hepsini gorur
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_super_admin());
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "System insert profile" ON profiles
  FOR INSERT WITH CHECK (true);

-- PLANS: Herkes gorebilir (public pricing)
CREATE POLICY "Anyone can read plans" ON plans
  FOR SELECT USING (true);
CREATE POLICY "Super admin manages plans" ON plans
  FOR ALL USING (is_super_admin());

-- TENANTS: Uye oldugu tenant'i gorur, super admin hepsini gorur
-- NOT: is_tenant_member() SECURITY DEFINER fonksiyonu kullanilir,
--      boylece tenants<->tenant_members arasi dongu olusmaz.
CREATE POLICY "Members see own tenant" ON tenants
  FOR SELECT USING (
    is_tenant_member(id)
    OR owner_id = auth.uid()
    OR is_super_admin()
  );
CREATE POLICY "Owner updates tenant" ON tenants
  FOR UPDATE USING (
    owner_id = auth.uid() OR is_super_admin()
  );
CREATE POLICY "Authenticated create tenant" ON tenants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Super admin delete tenant" ON tenants
  FOR DELETE USING (is_super_admin());

-- TENANT_MEMBERS: Ayni tenant uyeleri birbirini gorur
-- NOT: is_tenant_owner() SECURITY DEFINER fonksiyonu kullanilir,
--      boylece tenant_members<->tenants arasi dongu olusmaz.
CREATE POLICY "Members see co-members" ON tenant_members
  FOR SELECT USING (
    tenant_id = get_user_tenant_id()
    OR is_super_admin()
  );
CREATE POLICY "Owner manages members" ON tenant_members
  FOR UPDATE USING (
    is_tenant_owner(tenant_id)
    OR is_super_admin()
  );
CREATE POLICY "Owner deletes members" ON tenant_members
  FOR DELETE USING (
    is_tenant_owner(tenant_id)
    OR is_super_admin()
  );
CREATE POLICY "Authenticated insert member" ON tenant_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- COMPANY_INFO: Tenant izolasyonu
CREATE POLICY "Tenant isolation" ON company_info
  FOR ALL USING (tenant_id = get_user_tenant_id() OR is_super_admin());

-- CUSTOMERS: Tenant izolasyonu
CREATE POLICY "Tenant isolation" ON customers
  FOR ALL USING (tenant_id = get_user_tenant_id() OR is_super_admin());

-- DESIGNS: Tenant izolasyonu
CREATE POLICY "Tenant isolation" ON designs
  FOR ALL USING (tenant_id = get_user_tenant_id() OR is_super_admin());

-- CONTRACTS: Tenant izolasyonu
CREATE POLICY "Tenant isolation" ON contracts
  FOR ALL USING (tenant_id = get_user_tenant_id() OR is_super_admin());

-- PAYMENTS: Tenant izolasyonu
CREATE POLICY "Tenant isolation" ON payments
  FOR ALL USING (tenant_id = get_user_tenant_id() OR is_super_admin());

-- NOTIFICATIONS: Kendi bildirimlerini gorur
CREATE POLICY "User sees own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid() OR is_super_admin());

-- PAYMENT_NOTIFICATIONS: Tenant izolasyonu
CREATE POLICY "Tenant isolation" ON payment_notifications
  FOR ALL USING (tenant_id = get_user_tenant_id() OR is_super_admin());

-- SUBSCRIPTION_PAYMENTS: Owner ve super admin gorur
CREATE POLICY "Owner sees sub payments" ON subscription_payments
  FOR SELECT USING (
    tenant_id IN (SELECT get_owned_tenant_ids())
    OR tenant_id = get_user_tenant_id()
    OR is_super_admin()
  );
CREATE POLICY "System insert sub payment" ON subscription_payments
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Super admin update sub payments" ON subscription_payments
  FOR UPDATE USING (is_super_admin());
CREATE POLICY "Super admin delete sub payments" ON subscription_payments
  FOR DELETE USING (is_super_admin());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('company', 'company', true),
  ('payment_receipts', 'payment_receipts', false),
  ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage: Giris yapmis kullanicilar upload yapabilir
DO $$
BEGIN
  -- Company bucket
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth upload company' AND tablename = 'objects') THEN
    CREATE POLICY "Auth upload company" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'company' AND auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read company' AND tablename = 'objects') THEN
    CREATE POLICY "Public read company" ON storage.objects
      FOR SELECT USING (bucket_id = 'company');
  END IF;

  -- Receipts bucket
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth upload receipts' AND tablename = 'objects') THEN
    CREATE POLICY "Auth upload receipts" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'payment_receipts' AND auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth read receipts' AND tablename = 'objects') THEN
    CREATE POLICY "Auth read receipts" ON storage.objects
      FOR SELECT USING (bucket_id = 'payment_receipts' AND auth.uid() IS NOT NULL);
  END IF;

  -- Contracts bucket
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth upload contracts' AND tablename = 'objects') THEN
    CREATE POLICY "Auth upload contracts" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'contracts' AND auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth read contracts' AND tablename = 'objects') THEN
    CREATE POLICY "Auth read contracts" ON storage.objects
      FOR SELECT USING (bucket_id = 'contracts' AND auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================================
-- BITTI!
-- ============================================================
-- Tablolar: profiles, plans, tenants, tenant_members,
--           company_info, customers, designs, contracts,
--           payments, subscription_payments,
--           notifications, payment_notifications
--
-- Helper fonksiyonlar: get_user_tenant_id(), get_user_role(),
--                      is_super_admin()
--
-- Otomatik triggerlar:
--   - Yeni user → profiles kaydi
--   - Yeni tenant → company_info kaydi
--   - updated_at otomatik guncelleme
--
-- Sonraki adim: Supabase Auth'da ilk kullanici olusturun,
-- sonra SQL ile super admin yapin:
--   UPDATE profiles SET is_super_admin = true WHERE id = 'USER_UUID';
-- ============================================================
