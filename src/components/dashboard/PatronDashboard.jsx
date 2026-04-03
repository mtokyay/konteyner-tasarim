import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Palette,
  DollarSign,
  Factory,
  Plus,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

const PatronDashboard = () => {
  const navigate = useNavigate();

  // Placeholder data
  const summaryCards = [
    {
      title: 'Toplam Müşteri',
      value: '24',
      icon: Users,
      color: 'bg-blue-500',
      change: '+2 bu ay',
    },
    {
      title: 'Aktif Tasarım',
      value: '12',
      icon: Palette,
      color: 'bg-purple-500',
      change: '+3 yeni',
    },
    {
      title: 'Bekleyen Ödeme',
      value: '₺45.000',
      icon: DollarSign,
      color: 'bg-orange-500',
      change: '3 sözleşmeden',
    },
    {
      title: 'Üretimdeki İş',
      value: '8',
      icon: Factory,
      color: 'bg-green-500',
      change: '7 devam ediyor',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'tasarim',
      title: 'Ahmet Yılmaz için yeni tasarım başlatıldı',
      date: 'Bugün, 10:30',
      icon: Palette,
    },
    {
      id: 2,
      type: 'odeme',
      title: 'İbrahim Demir ödemesini yaptı - ₺15.000',
      date: 'Dün, 14:20',
      icon: DollarSign,
    },
    {
      id: 3,
      type: 'uretim',
      title: 'Üretim başladı - Müşteri: Fatma Kaya',
      date: '2 gün önce, 09:15',
      icon: Factory,
    },
    {
      id: 4,
      type: 'tasarim',
      title: 'Tasarım onaylandı - Müşteri: Murat Ağıl',
      date: '3 gün önce, 16:45',
      icon: Palette,
    },
    {
      id: 5,
      type: 'musteri',
      title: 'Yeni müşteri eklendi - Zeynep Çetinkaya',
      date: '4 gün önce, 11:00',
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Hoş Geldiniz, Patron</h2>
        <p className="text-gray-600 mt-2">İşletme yönetim paneli</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-2">{card.change}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Hızlı İşlemler</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/designs/new')}
              className="w-full flex items-center gap-3 bg-amber-50 text-amber-700 px-4 py-3 rounded-lg hover:bg-amber-100 transition-colors font-medium"
            >
              <Plus size={20} />
              Yeni Tasarım
            </button>
            <button
              onClick={() => navigate('/customers/new')}
              className="w-full flex items-center gap-3 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg hover:bg-blue-100 transition-colors font-medium"
            >
              <Plus size={20} />
              Yeni Müşteri
            </button>
            <button
              onClick={() => navigate('/contracts')}
              className="w-full flex items-center gap-3 bg-green-50 text-green-700 px-4 py-3 rounded-lg hover:bg-green-100 transition-colors font-medium"
            >
              <TrendingUp size={20} />
              Sözleşmeleri Gör
            </button>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Son Aktiviteler</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const ActivityIcon = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="flex gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gray-100">
                      <ActivityIcon size={20} className="text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-4">
        <AlertCircle className="text-blue-600 flex-shrink-0" size={24} />
        <div>
          <h4 className="font-semibold text-blue-900">2 Sözleşme Dikkati Bekliyor</h4>
          <p className="text-sm text-blue-700 mt-1">
            Bazı sözleşmeler imza için beklemekte veya ödeme tamamlanmamıştır.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatronDashboard;
