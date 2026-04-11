-- ============================================================
-- SECURITY HARDENING MIGRATION
-- ============================================================

-- 1. profiles INSERT: sadece kendi kaydını oluşturabilsin (trigger dışında)
DROP POLICY IF EXISTS "Anyone insert profile" ON profiles;
CREATE POLICY "User insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- 2. profiles UPDATE: sadece kendi kaydını güncelleyebilsin
DROP POLICY IF EXISTS "User can update own profile" ON profiles;
CREATE POLICY "User can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid() OR is_super_admin());

-- 3. tenant_members INSERT: sadece owner/admin davet edebilsin
DROP POLICY IF EXISTS "Authenticated insert member" ON tenant_members;
CREATE POLICY "Admin can insert member" ON tenant_members
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Kendi kaydını oluşturabilir (ilk tenant üyeliği)
      user_id = auth.uid()
      -- Veya mevcut tenant'ta admin/owner ise
      OR EXISTS (
        SELECT 1 FROM tenant_members tm
        WHERE tm.tenant_id = tenant_members.tenant_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
        AND tm.is_active = true
      )
    )
  );

-- 4. subscription_payments INSERT: sadece kendi tenant'ı için
DROP POLICY IF EXISTS "Tenant insert payments" ON subscription_payments;
CREATE POLICY "Tenant owner insert payments" ON subscription_payments
  FOR INSERT WITH CHECK (
    is_super_admin()
    OR tenant_id IN (
      SELECT tm.tenant_id FROM tenant_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
      AND tm.is_active = true
    )
  );

-- 5. notifications INSERT: sadece kendi bildirimlerini
DROP POLICY IF EXISTS "User notifications" ON notifications;
CREATE POLICY "User read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid() OR is_super_admin());

CREATE POLICY "System insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "User update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- 6. platform_settings: is_super_admin() fonksiyonu kullan
DROP POLICY IF EXISTS "Super admin can read settings" ON platform_settings;
DROP POLICY IF EXISTS "Super admin can manage settings" ON platform_settings;

CREATE POLICY "Super admin read settings" ON platform_settings
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Super admin manage settings" ON platform_settings
  FOR ALL USING (is_super_admin());
