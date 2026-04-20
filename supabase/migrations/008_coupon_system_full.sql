-- ============================================
-- 008: Kupon Sistemi — TEMİZ KURULUM
-- Önce temizle, sonra oluştur
-- ============================================

-- 1) Fonksiyonları sil
DROP FUNCTION IF EXISTS redeem_coupon(TEXT, UUID);
DROP FUNCTION IF EXISTS validate_coupon(TEXT);

-- 2) Tabloları sil (varsa)
DROP TABLE IF EXISTS coupon_redemptions;
DROP TABLE IF EXISTS coupons;

-- 3) Tenants tablosuna trial_ends_at ekle (yoksa)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- 4) Kupon tablosu
CREATE TABLE coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  plan_slug TEXT NOT NULL DEFAULT 'starter',
  duration_days INTEGER NOT NULL DEFAULT 30,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  campaign TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 5) Kupon kullanım kayıtları
CREATE TABLE coupon_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES coupons(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan_slug TEXT NOT NULL,
  trial_starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_ends_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6) Index
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_campaign ON coupons(campaign);
CREATE INDEX idx_coupon_redemptions_tenant ON coupon_redemptions(tenant_id);
CREATE INDEX idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);

-- 7) RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_read_all" ON coupons
  FOR SELECT USING (true);

CREATE POLICY "coupons_insert_admin" ON coupons
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

CREATE POLICY "coupons_update_admin" ON coupons
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

CREATE POLICY "redemptions_read_own" ON coupon_redemptions
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  );

CREATE POLICY "redemptions_insert_auth" ON coupon_redemptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 8) Kupon doğrulama fonksiyonu
CREATE OR REPLACE FUNCTION validate_coupon(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Gecersiz kupon kodu');
  END IF;

  IF v_coupon.starts_at > now() THEN
    RETURN json_build_object('valid', false, 'error', 'Bu kupon henuz aktif degil');
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RETURN json_build_object('valid', false, 'error', 'Bu kuponun suresi dolmus');
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RETURN json_build_object('valid', false, 'error', 'Bu kupon kullanim limitine ulasmis');
  END IF;

  RETURN json_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'plan_slug', v_coupon.plan_slug,
    'duration_days', v_coupon.duration_days,
    'description', v_coupon.description,
    'campaign', v_coupon.campaign
  );
END;
$$;

-- 9) Kupon uygulama fonksiyonu
CREATE OR REPLACE FUNCTION redeem_coupon(p_code TEXT, p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_validation JSON;
  v_coupon_id UUID;
  v_plan_slug TEXT;
  v_duration INTEGER;
  v_user_id UUID;
  v_trial_end TIMESTAMPTZ;
  v_existing RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Oturum gerekli');
  END IF;

  v_validation := validate_coupon(p_code);
  IF NOT (v_validation->>'valid')::boolean THEN
    RETURN json_build_object('success', false, 'error', v_validation->>'error');
  END IF;

  v_coupon_id := (v_validation->>'coupon_id')::UUID;
  v_plan_slug := v_validation->>'plan_slug';
  v_duration := (v_validation->>'duration_days')::INTEGER;
  v_trial_end := now() + (v_duration || ' days')::INTERVAL;

  SELECT * INTO v_existing
  FROM coupon_redemptions
  WHERE coupon_id = v_coupon_id AND tenant_id = p_tenant_id;

  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Bu kupon zaten kullanilmis');
  END IF;

  INSERT INTO coupon_redemptions (coupon_id, tenant_id, user_id, plan_slug, trial_starts_at, trial_ends_at)
  VALUES (v_coupon_id, p_tenant_id, v_user_id, v_plan_slug, now(), v_trial_end);

  UPDATE coupons SET used_count = used_count + 1 WHERE id = v_coupon_id;

  UPDATE tenants
  SET plan_id = COALESCE(
        (SELECT id FROM plans WHERE slug = v_plan_slug LIMIT 1),
        plan_id
      ),
      subscription_status = 'trialing',
      trial_ends_at = v_trial_end
  WHERE id = p_tenant_id;

  RETURN json_build_object(
    'success', true,
    'plan_slug', v_plan_slug,
    'trial_ends_at', v_trial_end,
    'message', v_duration || ' gun ucretsiz ' || v_plan_slug || ' plani aktif edildi'
  );
END;
$$;

-- 10) Varsayılan TUYAP2026 kuponu
INSERT INTO coupons (code, description, plan_slug, duration_days, campaign, expires_at)
VALUES (
  'TUYAP2026',
  'Tuyap Fuari 2026 - 30 gun ucretsiz Baslangic Plani',
  'starter',
  30,
  'tuyap2026',
  '2026-12-31 23:59:59+03'
) ON CONFLICT (code) DO NOTHING;
