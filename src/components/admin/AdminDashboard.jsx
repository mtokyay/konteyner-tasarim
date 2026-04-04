import React, { useState, useEffect } from 'react';
import { Users, CreditCard, TrendingUp, Activity, Building2, FileText, Palette, Loader2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentTenants, setRecentTenants] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = getSupabase();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (!supabase) {
        setError('Supabase bağlantısı bulunamadı');
        return;
      }

      // Parallel queries for dashboard stats
      const [
        tenantsRes,
        activeTenantsRes,
        plansRes,
        paymentsRes,
        recentTenantsRes,
        recentPaymentsRes,
        designsCountRes,
        contractsCountRes,
      ] = await Promise.all([
        // Total tenants
        supabase.from('tenants').select('id', { count: 'exact', head: true }),
        // Active subscriptions
        supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
        // Plans with tenant counts
        supabase.from('plans').select('id, name, slug, price_monthly'),
        // Total revenue from completed payments
        supabase.from('subscription_payments').select('amount').eq('status', 'completed'),
        // Recent tenants (last 5)
        supabase.from('tenants').select('id, name, slug, subscription_status, created_at, plans(name, slug)').order('created_at', { ascending: false }).limit(5),
        // Recent payments (last 5)
        supabase.from('subscription_payments').select('id, amount, status, created_at, tenants(name)').order('created_at', { ascending: false }).limit(5),
        // Total designs
        supabase.from('designs').select('id', { count: 'exact', head: true }),
        // Total contracts
        supabase.from('contracts').select('id', { count: 'exact', head: true }),
      ]);

      // Calculate total revenue
      const totalRevenue = (paymentsRes.data || []).reduce((sum, p) => sum + (p.amount || 0), 0);

      // Get plan distribution
      const planCounts = await Promise.all(
        (plansRes.data || []).map(async (p) => {
          const { count } = await supabase
            .from('tenants')
            .select('id', { count: 'exact', head: true })
            .eq('plan_id', p.id);
          return { ...p, tenant_count: count || 0 };
        })
      );

      setStats({
        totalTenants: tenantsRes.count || 0,
        activeSubscriptions: activeTenantsRes.count || 0,
        totalRevenue,
        totalPlans: (plansRes.data || []).length,
        totalDesigns: designsCountRes.count || 0,
        totalContracts: contractsCountRes.count || 0,
      });

      setPlanDistribution(planCounts);
      setRecentTenants(recentTenantsRes.data || []);
      setRecentPayments(recentPaymentsRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(val || 0);
  const formatDate = (d) => new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Toplam Firma', value: stats.totalTenants, icon: Building2, color: 'amber' },
    { label: 'Aktif Abonelik', value: stats.activeSubscriptions, icon: Activity, color: 'green' },
    { label: 'Toplam Gelir', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'blue' },
    { label: 'Toplam Tasarım', value: stats.totalDesigns, icon: Palette, color: 'purple' },
    { label: 'Toplam Sözleşme', value: stats.totalContracts, icon: FileText, color: 'rose' },
    { label: 'Plan Sayısı', value: stats.totalPlans, icon: CreditCard, color: 'indigo' },
  ];

  const colorMap = {
    amber: 'border-amber-500 text-amber-500',
    green: 'border-green-500 text-green-500',
    blue: 'border-blue-500 text-blue-500',
    purple: 'border-purple-500 text-purple-500',
    rose: 'border-rose-500 text-rose-500',
    indigo: 'border-indigo-500 text-indigo-500',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Platform istatistikleri ve genel bakış</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          const colors = colorMap[stat.color];
          return (
            <div key={i} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${colors.split(' ')[0]}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <Icon className={`w-10 h-10 ${colors.split(' ')[1]} opacity-30`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Distribution */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Plan Dağılımı</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {planDistribution.map((p) => (
            <div key={p.id} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{p.tenant_count}</p>
              <p className="text-sm text-gray-600 mt-1">{p.name}</p>
              <p className="text-xs text-gray-400">₺{p.price_monthly}/ay</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tenants */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Son Kayıt Olan Firmalar</h2>
            <Link to="/admin/tenants" className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1">
              Tümü <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentTenants.map((t) => (
              <Link key={t.id} to={`/admin/tenants/${t.id}`} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{formatDate(t.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {t.plans?.name || 'Free'}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${t.subscription_status === 'active' ? 'bg-green-500' : t.subscription_status === 'trialing' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                </div>
              </Link>
            ))}
            {recentTenants.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Henüz firma yok</p>}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Son Ödemeler</h2>
          </div>
          <div className="space-y-3">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{p.tenants?.name || '-'}</p>
                  <p className="text-xs text-gray-500">{formatDate(p.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-sm">{formatCurrency(p.amount)}</p>
                  <span className={`text-xs font-medium ${p.status === 'completed' ? 'text-green-600' : p.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {p.status === 'completed' ? 'Ödendi' : p.status === 'pending' ? 'Bekliyor' : 'Başarısız'}
                  </span>
                </div>
              </div>
            ))}
            {recentPayments.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Henüz ödeme yok</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
