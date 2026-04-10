-- ============================================================
-- MIGRATION: Plan Yapısı Güncelleme v2
-- Tarih: 2026-04-10
-- Açıklama: Yeni plan fiyatları, yeni özellikler (version_tracking,
--           worker_tracking, quality_control), revizyon limiti,
--           ve feature key düzeltmesi (pdf_export → export_pdf)
-- ============================================================
-- Supabase Dashboard > SQL Editor'e yapıştırın ve çalıştırın.
-- ============================================================

-- ============================================================
-- 1. Ücretsiz Plan Güncelle
-- ============================================================
UPDATE plans SET
  name = 'Ücretsiz',
  description = 'Başlangıç için temel özellikler — 5 müşteri, 5 tasarım, kaydetme',
  price_monthly = 0,
  price_yearly = 0,
  features = '{
    "save_design": true,
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
  limits = '{
    "max_customers": 5,
    "max_designs": 5,
    "max_active_designs": 5,
    "max_revisions": 1,
    "max_contracts": 0,
    "max_members": 1,
    "max_storage_mb": 100
  }'::jsonb,
  sort_order = 0
WHERE slug = 'free';

-- ============================================================
-- 2. Başlangıç Planı Güncelle
-- ============================================================
UPDATE plans SET
  name = 'Başlangıç',
  description = 'Küçük işletmeler için — 50 müşteri, PDF çıktı',
  price_monthly = 499,
  price_yearly = 4990,
  features = '{
    "save_design": true,
    "export_pdf": true,
    "contracts": false,
    "payments": false,
    "customer_portal": false,
    "team_management": false,
    "version_tracking": false,
    "worker_tracking": false,
    "quality_control": false,
    "api_access": false
  }'::jsonb,
  limits = '{
    "max_customers": 50,
    "max_designs": 25,
    "max_active_designs": 25,
    "max_revisions": 5,
    "max_contracts": 0,
    "max_members": 1,
    "max_storage_mb": 1000
  }'::jsonb,
  sort_order = 1
WHERE slug = 'starter';

-- ============================================================
-- 3. Profesyonel Planı Güncelle
-- ============================================================
UPDATE plans SET
  name = 'Profesyonel',
  description = 'Büyüyen işletmeler için — 200 müşteri, sözleşme ve ödeme takibi, 5 çalışan',
  price_monthly = 999,
  price_yearly = 9990,
  features = '{
    "save_design": true,
    "export_pdf": true,
    "contracts": true,
    "payments": true,
    "customer_portal": false,
    "team_management": true,
    "version_tracking": false,
    "worker_tracking": false,
    "quality_control": false,
    "api_access": false
  }'::jsonb,
  limits = '{
    "max_customers": 200,
    "max_designs": 100,
    "max_active_designs": 100,
    "max_revisions": 20,
    "max_contracts": 999999,
    "max_members": 5,
    "max_storage_mb": 5000
  }'::jsonb,
  sort_order = 2
WHERE slug = 'pro';

-- ============================================================
-- 4. Kurumsal Planı Güncelle
-- ============================================================
UPDATE plans SET
  name = 'Kurumsal',
  description = 'Büyük firmalar için tam paket — sınırsız, usta izleme, kalite kontrol, API',
  price_monthly = 1999,
  price_yearly = 19990,
  features = '{
    "save_design": true,
    "export_pdf": true,
    "contracts": true,
    "payments": true,
    "customer_portal": true,
    "team_management": true,
    "version_tracking": true,
    "worker_tracking": true,
    "quality_control": true,
    "api_access": true
  }'::jsonb,
  limits = '{
    "max_customers": 999999,
    "max_designs": 999999,
    "max_active_designs": 999999,
    "max_revisions": 999999,
    "max_contracts": 999999,
    "max_members": 20,
    "max_storage_mb": 50000
  }'::jsonb,
  sort_order = 3
WHERE slug = 'enterprise';

-- ============================================================
-- 5. Tablo default değerlerini güncelle (yeni planlar için)
-- ============================================================
ALTER TABLE plans
  ALTER COLUMN limits SET DEFAULT '{
    "max_customers": 5,
    "max_designs": 5,
    "max_active_designs": 5,
    "max_revisions": 1,
    "max_contracts": 0,
    "max_members": 1,
    "max_storage_mb": 100
  }'::jsonb;

ALTER TABLE plans
  ALTER COLUMN features SET DEFAULT '{
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
  }'::jsonb;

-- ============================================================
-- DOĞRULAMA: Güncellemeyi kontrol et
-- ============================================================
-- SELECT slug, name, price_monthly, features, limits FROM plans ORDER BY sort_order;
