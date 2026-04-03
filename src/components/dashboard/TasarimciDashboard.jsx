import React, { useState, useEffect } from 'react';
import { PenTool, Clock, CheckCircle, Plus, TrendingUp } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

export default function TasarimciDashboard() {
  const [stats, setStats] = useState({
    assignedDesigns: 0,
    pendingReviews: 0,
    completedDesigns: 0,
  });
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const supabase = getSupabase();

      // Fetch assigned designs
      const { count: assignedCount } = await supabase
        .from('designs')
        .select('*', { count: 'exact', head: true });

      // Fetch pending reviews (uretimde = in production)
      const { count: pendingCount } = await supabase
        .from('designs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'uretimde');

      // Fetch completed designs
      const { count: completedCount } = await supabase
        .from('designs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'tamamlandi');

      // Fetch recent designs with full details
      const { data: recentDesigns } = await supabase
        .from('designs')
        .select('id, ad, status, toplam_fiyat, created_at, customer_id')
        .order('created_at', { ascending: false })
        .limit(8);

      setStats({
        assignedDesigns: assignedCount || 0,
        pendingReviews: pendingCount || 0,
        completedDesigns: completedCount || 0,
      });

      setDesigns(recentDesigns || []);
      setLoading(false);
    } catch (error) {
      console.error('Dashboard veri yükleme hatası:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className={`bg-white rounded-lg shadow-md p-5 border-t-4 ${color}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color.replace('border', 'bg').replace('500', '100')}`}>
          <Icon className={`w-8 h-8 ${color.replace('border', 'text')}`} />
        </div>
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'taslak':
        return { badge: 'bg-gray-100 text-gray-800', icon: 'text-gray-500' };
      case 'teklif':
        return { badge: 'bg-blue-100 text-blue-800', icon: 'text-blue-500' };
      case 'onaylandi':
        return { badge: 'bg-amber-100 text-amber-800', icon: 'text-amber-500' };
      case 'uretimde':
        return { badge: 'bg-orange-100 text-orange-800', icon: 'text-orange-500' };
      case 'tamamlandi':
        return { badge: 'bg-green-100 text-green-800', icon: 'text-green-500' };
      case 'teslim_edildi':
        return { badge: 'bg-emerald-100 text-emerald-800', icon: 'text-emerald-500' };
      case 'iptal':
        return { badge: 'bg-red-100 text-red-800', icon: 'text-red-500' };
      default:
        return { badge: 'bg-gray-100 text-gray-800', icon: 'text-gray-500' };
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      taslak: 'Taslak',
      teklif: 'Teklif',
      onaylandi: 'Onaylandı',
      uretimde: 'Üretimde',
      tamamlandi: 'Tamamlandı',
      teslim_edildi: 'Teslim Edildi',
      iptal: 'İptal',
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'taslak':
        return <PenTool className="w-4 h-4" />;
      case 'uretimde':
        return <Clock className="w-4 h-4" />;
      case 'tamamlandi':
      case 'teslim_edildi':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <PenTool className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Tasarımcı Paneli</h1>
        <p className="text-gray-600 mt-2">Tokyay Kereste - Tasarım Yönetimi</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Atanan Tasarımlar"
          value={stats.assignedDesigns}
          icon={PenTool}
          color="border-blue-500"
        />
        <StatCard
          title="İncelemede"
          value={stats.pendingReviews}
          icon={Clock}
          color="border-orange-500"
        />
        <StatCard
          title="Tamamlanan"
          value={stats.completedDesigns}
          icon={CheckCircle}
          color="border-green-500"
        />
      </div>

      {/* Designs Grid */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Son Tasarımlar</h2>
          <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition">
            <Plus className="w-5 h-5" />
            Yeni Tasarım
          </button>
        </div>

        {designs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {designs.map((design) => {
              const statusColors = getStatusColor(design.status);
              return (
                <div
                  key={design.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800 flex-1 truncate">
                      {design.ad}
                    </h3>
                    <div className={`p-2 rounded-lg ${statusColors.icon}`}>
                      {getStatusIcon(design.status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors.badge}`}
                    >
                      {getStatusIcon(design.status)}
                      {getStatusLabel(design.status)}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {new Date(design.created_at).toLocaleDateString('tr-TR')}
                      </span>
                      {design.toplam_fiyat && (
                        <span className="text-sm font-semibold text-blue-600">
                          ₺{design.toplam_fiyat.toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <PenTool className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Herhangi bir tasarım bulunamadı</p>
          </div>
        )}
      </div>

      {/* Performance Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Performans</h2>
          <TrendingUp className="w-6 h-6 text-green-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-600 text-sm mb-1">Ortalama Tamamlanma Hızı</p>
            <p className="text-3xl font-bold text-blue-600">85%</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-gray-600 text-sm mb-1">Bu Ay Tamamlanan</p>
            <p className="text-3xl font-bold text-green-600">
              {stats.completedDesigns}
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-gray-600 text-sm mb-1">Hızlı Başlama</p>
            <p className="text-3xl font-bold text-orange-600">92%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
