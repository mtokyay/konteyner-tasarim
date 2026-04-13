import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const { user, isAuthenticated, isSuperAdmin, loading: authLoading } = useAuth();
  const [tenant, setTenant] = useState(null);       // tenants row
  const [membership, setMembership] = useState(null); // tenant_members row
  const [plan, setPlan] = useState(null);            // plans row
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  useEffect(() => {
    // Auth henüz yükleniyorsa bekle — erken false döndürme
    if (authLoading) return;

    if (!isAuthenticated || !supabase) {
      setTenant(null);
      setMembership(null);
      setPlan(null);
      setLoading(false);
      return;
    }
    loadTenantData();
  }, [authLoading, isAuthenticated, user?.id]);

  const loadTenantData = async () => {
    try {
      setLoading(true);

      // Get user's tenant membership
      const { data: memberData, error: memberErr } = await supabase
        .from('tenant_members')
        .select('*, tenants(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (memberErr || !memberData) {
        // No tenant — might be new user or super admin without tenant
        setTenant(null);
        setMembership(null);
        setPlan(null);
        setLoading(false);
        return;
      }

      setMembership(memberData);
      setTenant(memberData.tenants);

      // Load plan details
      if (memberData.tenants?.plan_id) {
        const { data: planData } = await supabase
          .from('plans')
          .select('*')
          .eq('id', memberData.tenants.plan_id)
          .single();
        setPlan(planData);
      }
    } catch (err) {
      console.error('Tenant yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new tenant (registration flow)
  const createTenant = async (tenantName, slug) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.id) {
      throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
    }

    const { data: freePlan, error: planErr } = await supabase
      .from('plans')
      .select('id')
      .eq('slug', 'free')
      .maybeSingle();

    if (planErr) throw new Error('Plan yüklenemedi: ' + planErr.message);
    if (!freePlan?.id) throw new Error('Ücretsiz plan bulunamadı. Lütfen yönetici ile iletişime geçin.');

    const { data: newTenant, error: tenantErr } = await supabase
      .from('tenants')
      .insert({
        name: tenantName,
        slug: slug,
        owner_id: authUser.id,
        plan_id: freePlan.id,
        subscription_status: 'trialing',
      })
      .select()
      .single();

    if (tenantErr) throw tenantErr;
    if (!newTenant?.id) throw new Error('Firma oluşturulamadı');

    const { error: memberErr } = await supabase
      .from('tenant_members')
      .insert({
        tenant_id: newTenant.id,
        user_id: authUser.id,
        role: 'owner',
      });

    if (memberErr) throw memberErr;

    // Reload
    await loadTenantData();
    return newTenant;
  };

  // Check feature availability
  const hasFeature = (featureName) => {
    if (isSuperAdmin) return true;
    return plan?.features?.[featureName] === true;
  };

  // Check limit
  const getLimit = (limitName) => {
    if (isSuperAdmin) return 999999;
    return plan?.limits?.[limitName] ?? 0;
  };

  // Check if subscription is active (trial or paid)
  const isSubscriptionActive = () => {
    if (isSuperAdmin) return true;
    if (!tenant) return false;
    const status = tenant.subscription_status;
    if (status === 'active') return true;
    if (status === 'trialing') {
      const trialEnd = new Date(tenant.trial_ends_at);
      return trialEnd > new Date();
    }
    return false;
  };

  const value = {
    tenant,
    membership,
    plan,
    loading,
    role: membership?.role || null,
    tenantId: tenant?.id || null,
    createTenant,
    hasFeature,
    getLimit,
    isSubscriptionActive,
    reloadTenant: loadTenantData,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be inside TenantProvider');
  return ctx;
}
