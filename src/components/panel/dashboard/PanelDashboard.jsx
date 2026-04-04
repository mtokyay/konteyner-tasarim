import React, { useState, useEffect } from 'react';
import { Users, FileText, PenTool, TrendingUp, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useTenant } from '../../../contexts/TenantContext';
import { getSupabase } from '../../../lib/supabase';
import { Link } from 'react-router-dom';

export default function PanelDashboard() {
  const { tenant, plan, tenantId, getLimit, hasFeature, isSubscriptionActive } = useTenant();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  useEffect(() => {
    if (tenantId) loadStats();
  }, [tenantId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      if (!supabase || !tenantId) return;

      const [customersRes, designsRes, contractsRes, membersRes, paymentsRes] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('designs').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('tenant_members').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_active', true),
        supabase.from('payments').select('odenen_tutar').eq('tenant_id', tenantId).eq('durum', 'odendi'),
      ]);

      const totalPaid = (paymentsRes.data || []).reduce((s, p) => s + (p.odenen_tutar || 0), 0);

      setStats({
        customers: customersRes.count || 0,
        designs: designsRes.count || 0,
        contracts: contractsRes.count || 0,
        members: membersRes.count || 0,
        totalPaid,
      });
    } catch (err) {
      console.error('Dashboard yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const maxCustomers = getLimit('max_customers');
  const maxDesigns = getLimit('max_designs');
  const maxMembers = getLimit('max_members');

  const formatCurrency = (v) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(v || 0);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Müşteriler', value: stats.customers, icon: Users, color: 'amber', path: '/panel/customers' },
    { label: 'Tasarımlar', value: stats.designs, icon: PenTool, color: 'blue', path: '/panel/designs' },
    { label: 'Sözleşmeler', value: stats.contracts, icon: FileText, color: 'green', path: '/panel/contracts' },
    { label: 'Ekip Üyeleri', value: stats.members, icon: Users, color: 'purple', path: '/panel/team' },
  ];

  const colorMap = {
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-500', bar: 'bg-amber-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500', bar: 'bg-blue-500' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-500', bar: 'bg-green-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-500', bar: 'bg-purple-500' },
  };

  const usageLimits = [
    { name: 'Müşteriler', used: stats.customers, limit: maxCustomers, color: 'amber' },
    { name: 'Tasarımlar', used: stats.designs, limit: maxDesigns, color: 'blue' },
    { name: 'Ekip Üyeleri', used: stats.members, limit: maxMembers, color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-sm p-6 text-white">
        <h1 className="text-2xl font-bold">Hoş Geldiniz, {tenant?.name}!</h1>
        <p className="text-amber-100 mt-1 text-sm">
          <span className="font-semibold">{plan?.name || 'Free'}</span> planındasınız
          {!isSubscriptionActive() && (
            <span className="ml-2 px-2 py-0.5 bg-red-500/30 text-red-100 rounded-full text-xs font-medium">Abonelik pasif</span>
          )}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          const c = colorMap[stat.color];
          return (
            <Link key={i} to={stat.path} className={`${c.bg} rounded-xl shadow-sm p-5 border-l-4 ${c.border} hover:shadow-md transition`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-medium">{stat.label}</p>
                  <p className={`${c.text} text-2xl font-bold mt-1`}>{stat.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${c.text} opacity-20`} />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Usage */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-amber-600" />
            Plan Kullanımı
          </h2>

          <div className="space-y-5">
            {usageLimits.map((item, i) => {
              const c = colorMap[item.color];
              const isUnlimited = item.limit === -1 || item.limit >= 999999;
              const pct = isUnlimited ? 0 : item.limit > 0 ? Math.round((item.used / item.limit) * 100) : 0;

              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.used} / {isUnlimited ? '∞' : item.limit}
                    </p>
                  </div>
                  {isUnlimited ? (
                    <div className="flex items-center gap-1.5 text-amber-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <p className="text-xs">Sınırsız</p>
                    </div>
                  ) : (
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className={`${c.bar} h-full transition-all duration-300`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {stats.totalPaid > 0 && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Toplam Ödenen</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalPaid)}</p>
                </div>
                <Link to="/panel/finance" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
                  Finans Detayı →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Hızlı İşlemler
          </h2>

          <div className="space-y-2.5">
            <Link to="/panel/contracts/new" className="block w-full bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium py-2.5 px-4 rounded-lg transition text-sm">
              + Yeni Sözleşme
            </Link>
            <Link to="/panel/customers/new" className="block w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2.5 px-4 rounded-lg transition text-sm">
              + Yeni Müşteri
            </Link>
            <Link to="/panel/designs/new" className="block w-full bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2.5 px-4 rounded-lg transition text-sm">
              + Yeni Tasarım
            </Link>
            {hasFeature('team_management') && (
              <Link to="/panel/team" className="block w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-2.5 px-4 rounded-lg transition text-sm">
                + Ekip Yönetimi
              </Link>
            )}
          </div>

          <div className="mt-5 pt-5 border-t border-gray-100">
            <Link to="/panel/subscription" className="block text-center bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 rounded-lg transition text-sm">
              Plan & Abonelik
            </Link>
          </div>
        </div>
      </div>

      {/* Plan Upgrade Hint */}
      {plan?.slug === 'free' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 text-sm mb-1">Planınızı Yükseltin</h3>
              <p className="text-xs text-amber-800">
                Ücretsiz plandaki limitlerinize yaklaşıyorsanız, daha fazla müşteri, tasarım ve ekip üyesi için planınızı yükseltmeyi düşünebilirsiniz.
              </p>
              <Link to="/panel/subscription" className="text-amber-700 font-medium text-xs hover:text-amber-800 mt-2 inline-block">
                Planları İncele →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
