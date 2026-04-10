import { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';

export function usePlanLimits() {
  const { tenantId, plan, hasFeature, getLimit, isSubscriptionActive } = useTenant();
  const [counts, setCounts] = useState({
    customers: 0,
    designs: 0,
    activeDesigns: 0,
    contracts: 0,
    members: 0,
  });
  const supabase = getSupabase();

  useEffect(() => {
    if (!tenantId || !supabase) return;
    loadCounts();
  }, [tenantId]);

  const loadCounts = async () => {
    try {
      const [custRes, designRes, activeDesignRes, contractRes, memberRes] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('designs').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('designs').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).not('status', 'in', '("tamamlandi","iptal","teslim_edildi")'),
        supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('tenant_members').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_active', true),
      ]);

      setCounts({
        customers: custRes.count || 0,
        designs: designRes.count || 0,
        activeDesigns: activeDesignRes.count || 0,
        contracts: contractRes.count || 0,
        members: memberRes.count || 0,
      });
    } catch (err) {
      console.error('Limit sayıları yüklenemedi:', err);
    }
  };

  // Revizyon kontrolü: tasarıma ait mevcut versiyon sayısını kontrol eder
  const canReviseDesign = (design) => {
    const maxRevisions = getLimit('max_revisions');
    if (maxRevisions === -1 || maxRevisions >= 99999) return true;
    const currentVersions = design?.design_data?._versions?.length || 0;
    return currentVersions < maxRevisions;
  };

  return {
    // Feature checks
    canSaveDesign: hasFeature('save_design'),
    canExportPDF: hasFeature('export_pdf'),
    canCreateContract: hasFeature('contracts'),
    canTrackPayments: hasFeature('payments'),
    canUsePortal: hasFeature('customer_portal'),
    canManageTeam: hasFeature('team_management'),
    canTrackVersions: hasFeature('version_tracking'),
    canTrackWorkers: hasFeature('worker_tracking'),
    canUseQualityControl: hasFeature('quality_control'),
    canAccessAPI: hasFeature('api_access'),

    // Limit checks
    canAddCustomer: counts.customers < getLimit('max_customers'),
    canAddDesign: counts.activeDesigns < getLimit('max_designs'),
    canAddContract: counts.contracts < getLimit('max_contracts'),
    canAddMember: counts.members < getLimit('max_members'),
    canReviseDesign,

    // Current counts
    counts,
    limits: {
      maxCustomers: getLimit('max_customers'),
      maxDesigns: getLimit('max_designs'),
      maxRevisions: getLimit('max_revisions'),
      maxContracts: getLimit('max_contracts'),
      maxMembers: getLimit('max_members'),
    },

    // Plan info
    planName: plan?.name || 'Ücretsiz',
    planSlug: plan?.slug || 'free',
    isActive: isSubscriptionActive(),

    // Refresh
    reloadCounts: loadCounts,
  };
}
