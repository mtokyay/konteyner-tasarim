-- ============================================
-- 009: Performans Indexleri
-- Dashboard ve liste sorgularini hizlandirma
-- ============================================

-- Designs: tenant bazli siralama ve filtreleme
CREATE INDEX IF NOT EXISTS idx_designs_tenant_created ON designs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designs_tenant_status ON designs(tenant_id, status);

-- Customers: tenant bazli
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);

-- Contracts: tenant bazli
CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON contracts(tenant_id);

-- Payments: tenant + durum (dashboard toplam hesaplama icin)
CREATE INDEX IF NOT EXISTS idx_payments_tenant_durum ON payments(tenant_id, durum);

-- Tenant members: tenant + aktiflik
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_active ON tenant_members(tenant_id, is_active);

-- Tenant members: user lookup (login sirasinda)
CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id, is_active);

-- Profiles: super admin lookup
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin ON profiles(id) WHERE is_super_admin = true;
