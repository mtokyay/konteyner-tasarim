import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, PenTool, DollarSign, Factory, Plus, FileText, CreditCard } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

export default function PatronDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeDesigns: 0,
    pendingPayments: 0,
    productionOrders: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const supabase = getSupabase();

      // Fetch total customers
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Fetch active designs
      const { count: designsCount } = await supabase
        .from('designs')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'completed');

      // Fetch pending payments
      const { count: paymentsCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('durum', 'bekliyor');

      // Fetch production orders
      const { count: ordersCount } = await supabase
        .from('production_orders')
        .select('*', { count: 'exact', head: true });

      // Fetch recent activities (designs)
      const { data: recentDesigns } = await supabase
        .from('designs')
        .select('id, ad, status, created_at, customer_id')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalCustomers: customersCount || 0,
        activeDesigns: designsCount || 0,
        pendingPayments: paymentsCount || 0,
        productionOrders: ordersCount || 0,
      });

      setRecentActivities(recentDesigns || []);
      setLoading(false);
    } catch (error) {
      console.error('Dashboard veri yükleme hatası:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <Icon className="w-12 h-12 text-gray-400 opacity-50" />
      </div>
    </div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Taslak',
      in_progress: 'İşlemde',
      completed: 'Tamamlandı',
      archived: 'Arşivlendi',
    };
    return labels[status] || status;
  };

  return (
    <div className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Yönetici Paneli</h1>
        <p className="text-gray-600 mt-2">Tokyay Kereste - Konteyner Ev Yönetimi</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Toplam Müşteri"
          value={stats.totalCustomers}
          icon={Users}
          color="border-amber-500"
        />
        <StatCard
          title="Aktif Tasarımlar"
          value={stats.activeDesigns}
          icon={PenTool}
          color="border-orange-500"
        />
        <StatCard
          title="Beklemede Ödemeler"
          value={stats.pendingPayments}
          icon={DollarSign}
          color="border-red-500"
        />
        <StatCard
          title="Üretim Siparişleri"
          value={stats.productionOrders}
          icon={Factory}
          color="border-blue-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Son Tasarımlar</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Tasarım Adı
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Durum
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Tarih
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                        {activity.ad}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            activity.status
                          )}`}
                        >
                          {getStatusLabel(activity.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(activity.created_at).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-center text-gray-500">
                      Son tasarım bulunamadı
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Hızlı İşlemler</h2>
          <div className="space-y-3">
            <button onClick={() => navigate('/customers/new')} className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg transition">
              <Plus className="w-5 h-5" />
              Yeni Müşteri
            </button>
            <button onClick={() => navigate('/designs/new')} className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition">
              <PenTool className="w-5 h-5" />
              Yeni Tasarım
            </button>
            <button onClick={() => navigate('/payments')} className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition">
              <CreditCard className="w-5 h-5" />
              Ödemeler
            </button>
            <button onClick={() => navigate('/production')} className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition">
              <Factory className="w-5 h-5" />
              Üretim Siparişleri
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
