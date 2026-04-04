-- ============================================================
-- RLS INFINITE RECURSION FIX
-- ============================================================
-- Problem: tenants SELECT policy → tenant_members sorgusu
--          tenant_members "Owner manages members" policy → tenants sorgusu
--          Bu iki policy birbirini cagirarak sonsuz dongu yaratiyordu.
--
-- Cozum: SECURITY DEFINER fonksiyonlar RLS'i bypass ederek
--         donguyu kirar.
-- ============================================================

-- 1. Yeni helper fonksiyonlar (SECURITY DEFINER = RLS bypass)

-- Kullanici bu tenant'in uyesi mi?
CREATE OR REPLACE FUNCTION is_tenant_member(t_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_members
    WHERE tenant_id = t_id
      AND user_id = auth.uid()
      AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Kullanici bu tenant'in sahibi mi?
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

-- ============================================================
-- 2. TENANTS tablosu policy'lerini yeniden olustur
-- ============================================================
DROP POLICY IF EXISTS "Members see own tenant" ON tenants;
DROP POLICY IF EXISTS "Owner updates tenant" ON tenants;
DROP POLICY IF EXISTS "Authenticated create tenant" ON tenants;
DROP POLICY IF EXISTS "Super admin delete tenant" ON tenants;

-- SELECT: Uye oldugu tenant'i gorur (helper fonksiyon ile, dongu yok)
CREATE POLICY "Members see own tenant" ON tenants
  FOR SELECT USING (
    is_tenant_member(id)
    OR owner_id = auth.uid()
    OR is_super_admin()
  );

-- UPDATE: Sadece owner veya super admin
CREATE POLICY "Owner updates tenant" ON tenants
  FOR UPDATE USING (
    owner_id = auth.uid() OR is_super_admin()
  );

-- INSERT: Giris yapmis kullanici tenant olusturabilir
CREATE POLICY "Authenticated create tenant" ON tenants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- DELETE: Sadece super admin
CREATE POLICY "Super admin delete tenant" ON tenants
  FOR DELETE USING (is_super_admin());

-- ============================================================
-- 3. TENANT_MEMBERS tablosu policy'lerini yeniden olustur
-- ============================================================
DROP POLICY IF EXISTS "Members see co-members" ON tenant_members;
DROP POLICY IF EXISTS "Owner manages members" ON tenant_members;
DROP POLICY IF EXISTS "System insert member" ON tenant_members;

-- SELECT: Ayni tenant uyeleri birbirini gorur (helper fonksiyon ile)
CREATE POLICY "Members see co-members" ON tenant_members
  FOR SELECT USING (
    tenant_id = get_user_tenant_id()
    OR is_super_admin()
  );

-- UPDATE/DELETE: Tenant sahibi uyelerini yonetir (helper fonksiyon ile, dongu yok)
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

-- INSERT: Giris yapmis kullanici uye ekleyebilir (tenant olusturma akisi icin)
CREATE POLICY "Authenticated insert member" ON tenant_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 4. SUBSCRIPTION_PAYMENTS policy duzelt (ayni recursion riski)
-- ============================================================
DROP POLICY IF EXISTS "Owner sees sub payments" ON subscription_payments;
DROP POLICY IF EXISTS "System insert sub payment" ON subscription_payments;
DROP POLICY IF EXISTS "Super admin manage sub payments" ON subscription_payments;

CREATE POLICY "Owner sees sub payments" ON subscription_payments
  FOR SELECT USING (
    tenant_id IN (SELECT get_owned_tenant_ids())
    OR tenant_id = get_user_tenant_id()
    OR is_super_admin()
  );

CREATE POLICY "System insert sub payment" ON subscription_payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Super admin manage sub payments" ON subscription_payments
  FOR UPDATE USING (is_super_admin());

CREATE POLICY "Super admin delete sub payments" ON subscription_payments
  FOR DELETE USING (is_super_admin());

-- ============================================================
-- 5. COMPANY_INFO policy'sini de guncelle (guvenlik icin)
--    handle_new_tenant trigger'i SECURITY DEFINER oldugu icin
--    trigger INSERT'te sorun yok, ama SELECT/UPDATE icin
--    get_user_tenant_id() kullaniliyor, bu zaten SECURITY DEFINER.
-- ============================================================
-- (company_info policy'si get_user_tenant_id() kullaniyor,
--  bu fonksiyon zaten SECURITY DEFINER, dongu riski yok.)

-- ============================================================
-- BITTI! Bu SQL'i Supabase SQL Editor'de calistirin.
-- ============================================================
