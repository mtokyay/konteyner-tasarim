import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const TasarimciDashboard = () => {
  const navigate = useNavigate();

  // Placeholder data for design counts
  const designStats = [
    {
      label: 'Taslak',
      count: '3',
      color: 'bg-gray-100 text-gray-700',
      icon: Clock,
    },
    {
      label: 'Teklif',
      count: '5',
      color: 'bg-yellow-100 text-yellow-700',
      icon: AlertCircle,
    },
    {
      label: 'Onaylı',
      count: '8',
      color: 'bg-green-100 text-green-700',
      icon: CheckCircle,
    },
  ];

  const recentDesigns = [
    {
      id: 1,
      customer: 'Ahmet Yılmaz',
      title: 'Asker Evi Tasarımı',
      status: 'taslak',
      date: 'Bugün',
    },
    {
      id: 2,
      customer: 'İbrahim Demir',
      title: 'Modern Villa Projesi',
      status: 'teklif',
      date: 'Dün',
    },
    {
      id: 3,
      customer: 'Fatma Kaya',
      title: 'Bahçe Evi Tasarımı',
      status: 'onaylı',
      date: '2 gün önce',
    },
    {
      id: 4,
      customer: 'Murat Ağıl',
      title: 'Ticari Yapı',
      status: 'onaylı',
      date: '3 gün önce',
    },
    {
      id: 5,
      customer: 'Zeynep Çetinkaya',
      title: 'Oturma Odası Tasarımı',
      status: 'teklif',
      date: '4 gün önce',
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'taslak':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock size={12} />
            Taslak
          </span>
        );
      case 'teklif':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle size={12} />
            Teklif
          </span>
        );
      case 'onaylı':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} />
            Onaylı
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Hoş Geldiniz, Tasarımcı</h2>
        <p className="text-gray-600 mt-2">Tasarım yönetim paneli</p>
      </div>

      {/* Design Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {designStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{stat.count}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg shadow-md p-8 border border-amber-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Yeni Tasarım Oluştur</h3>
            <p className="text-gray-600 mt-2">
              Yeni bir müşteri için tasarım projesi başlatın
            </p>
          </div>
          <button
            onClick={() => navigate('/designs/new')}
            className="flex items-center gap-2 bg-amber-700 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors font-semibold whitespace-nowrap"
          >
            <Plus size={20} />
            Yeni Tasarım
          </button>
        </div>
      </div>

      {/* Recent Designs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Son Tasarımlar</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Müşteri
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Tasarım
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Tarih
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentDesigns.map((design) => (
                <tr
                  key={design.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/designs/${design.id}`)}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {design.customer}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{design.title}</td>
                  <td className="px-6 py-4 text-sm">{getStatusBadge(design.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{design.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/designs')}
            className="text-amber-700 hover:text-amber-800 font-semibold text-sm"
          >
            Tüm Tasarımları Gör →
          </button>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2">İpucu</h4>
        <p className="text-sm text-blue-700">
          Tasarımları düzenli olarak güncelleyin ve müşterileri bilgilendirin. Bu iş memnuniyetini
          artırır ve proje akışını hızlandırır.
        </p>
      </div>
    </div>
  );
};

export default TasarimciDashboard;
