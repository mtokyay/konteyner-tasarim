-- ============================================
-- 008: Kupon / Promosyon Kodu Sistemi
-- ============================================

-- Kupon tanımlama tablosu (admin tarafından oluşturulur)
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Ne hediye ediliyor?
  plan_slug TEXT NOT NULL DEFAULT 'starter',        -- hangi plan hediye
  duration_days INTEGER NOT NULL DEFAULT 30,         -- kaç gün ücretsiz

  -- Kısıtlamalar
  max_uses INTEGER,                                  -- toplam kullanım limiti (NULL = sınırsız)
  used_count INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,                            -- NULL = süresiz

  -- Kampanya bilgisi
  campaign TEXT,                                     -- ör: 'tuyap2026'

  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Kupon kullanım kayıtları
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES coupons(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Uygulanan plan bilgisi
  plan_slug TEXT NOT NULL,
  trial_starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_ends_at TIMESTAMPTZ NOT NULL,

  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_campaign ON coupons(campaign);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_tenant ON coupon_redemptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);

-- RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Kuponları herkes okuyabilir (validate için)
CREATE POLICY "coupons_read_all" ON coupons
  FOR SELECT USING (true);

-- Kupon oluşturma sadece super admin
CREATE POLICY "coupons_insert_admin" ON coupons
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Kupon güncelleme sadece super admin
CREATE POLICY "coupons_update_admin" ON coupons
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Redemption kayıtlarını kendi tenant'ı görebilir
CREATE POLICY "redemptions_read_own" ON coupon_redemptions
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

-- Redemption ekleme authenticated kullanıcılar
CREATE POLICY "redemptions_insert_auth" ON coupon_redemptions
  FOR INSERT WITH CHECK (user_id = auth.uid());


-- ============================================
-- Kupon doğrulama ve uygulama fonksiyonu
-- ============================================
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
    RETURN json_build_object('valid', false, 'error', 'Geçersiz kupon kodu');
  END IF;

  -- Süre kontrolü
  IF v_coupon.starts_at > now() THEN
    RETURN json_build_object('valid', false, 'error', 'Bu kupon henüz aktif değil');
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RETURN json_build_object('valid', false, 'error', 'Bu kuponun süresi dolmuş');
  END IF;

  -- Kullanım limiti
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RETURN json_build_object('valid', false, 'error', 'Bu kupon kullanım limitine ulaşmış');
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


-- ============================================
-- Kuponu tenant'a uygulama fonksiyonu
-- ============================================
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

  -- Kupon doğrula
  v_validation := validate_coupon(p_code);
  IF NOT (v_validation->>'valid')::boolean THEN
    RETURN json_build_object('success', false, 'error', v_validation->>'error');
  END IF;

  v_coupon_id := (v_validation->>'coupon_id')::UUID;
  v_plan_slug := v_validation->>'plan_slug';
  v_duration := (v_validation->>'duration_days')::INTEGER;
  v_trial_end := now() + (v_duration || ' days')::INTERVAL;

  -- Bu tenant bu kuponu zaten kullanmış mı?
  SELECT * INTO v_existing
  FROM coupon_redemptions
  WHERE coupon_id = v_coupon_id AND tenant_id = p_tenant_id;

  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Bu kupon zaten kullanılmış');
  END IF;

  -- Redemption kaydı oluştur
  INSERT INTO coupon_redemptions (coupon_id, tenant_id, user_id, plan_slug, trial_starts_at, trial_ends_at)
  VALUES (v_coupon_id, p_tenant_id, v_user_id, v_plan_slug, now(), v_trial_end);

  -- Kupon kullanım sayısını artır
  UPDATE coupons SET used_count = used_count + 1 WHERE id = v_coupon_id;

  -- Tenant'ın planını güncelle
  UPDATE tenants
  SET current_plan = v_plan_slug,
      trial_ends_at = v_trial_end
  WHERE id = p_tenant_id;

  RETURN json_build_object(
    'success', true,
    'plan_slug', v_plan_slug,
    'trial_ends_at', v_trial_end,
    'message', v_duration || ' gün ücretsiz ' || v_plan_slug || ' planı aktif edildi'
  );
END;
$$;


-- ============================================
-- Varsayılan Tüyap 2026 kuponu
-- ============================================
INSERT INTO coupons (code, description, plan_slug, duration_days, campaign, expires_at)
VALUES (
  'TUYAP2026',
  'Tüyap Fuarı 2026 — 30 gün ücretsiz Başlangıç Planı',
  'starter',
  30,
  'tuyap2026',
  '2026-12-31 23:59:59+03'
) ON CONFLICT (code) DO NOTHING;
