import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  DollarSign,
  Factory,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

const MusteriDashboard = () => {
  const navigate = useNavigate();

  // Placeholder data
  const contractStatus = {
    status: 'İmzalandı',
    signedDate: '2025-11-15',
    completionEstimate: '2026-06-30',
    progress: 45,
  };

  const paymentSummary = {
    totalAmount: '₺125.000',
    paidAmount: '₺75.000',
    remainingAmount: '₺50.000',
    paymentPercentage: 60,
  };

  const productionSteps = [
    {
      id: 1,
      title: 'Tasarım',
      status: 'tamamlandı',
      completedDate: '2025-11-20',
    },
    {
      id: 2,
      title: 'Sözleşme & Ödeme',
      status: 'tamamlandı',
      completedDate: '2025-12-01',
    },
    {
      id: 3,
      title: 'Üretim Hazırlığı',
      status: 'devam_ediyor',
      startDate: '2025-12-10',
    },
    {
      id: 4,
      title: 'Ön Yapı',
      status: 'beklemede',
    },
    {
      id: 5,
      title: 'Montaj & Tamamlama',
      status: 'beklemede',
    },
    {
      id: 6,
      title: 'Teslimat',
      status: 'beklemede',
    },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'tamamlandı':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'devam_ediyor':
        return <Clock size={20} className="text-blue-600" />;
      case 'beklemede':
        return <AlertCircle size={20} className="text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'tamamlandı':
        return 'Tamamlandı';
      case 'devam_ediyor':
        return 'Devam Ediyor';
      case 'beklemede':
        return 'Beklemede';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Hoş Geldiniz</h2>
        <p className="text-gray-600 mt-2">Projenizin detaylarını ve ilerlemesini görebilirsiniz</p>
      </div>

      {/* Contract Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-gray-500 text-sm font-medium">Sözleşme Durumu</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{contractStatus.status}</p>
          </div>
          <FileText className="text-amber-700" size={32} />
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-semibold">İmza Tarihi:</span> 15 Kasım 2025
          </p>
          <p>
            <span className="font-semibold">Tahmini Tamamlanma:</span> 30 Haziran 2026
          </p>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500 text-sm font-medium mb-2">Toplam Tutar</p>
          <p className="text-3xl font-bold text-gray-900">{paymentSummary.totalAmount}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow-md p-6 border border-green-200">
          <p className="text-gray-500 text-sm font-medium mb-2">Ödenen</p>
          <p className="text-3xl font-bold text-green-700">{paymentSummary.paidAmount}</p>
        </div>
        <div className="bg-orange-50 rounded-lg shadow-md p-6 border border-orange-200">
          <p className="text-gray-500 text-sm font-medium mb-2">Kalan</p>
          <p className="text-3xl font-bold text-orange-700">{paymentSummary.remainingAmount}</p>
        </div>
      </div>

      {/* Payment Progress */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">Ödeme İlerlemesi</h3>
          <span className="text-sm font-semibold text-gray-600">
            {paymentSummary.paymentPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${paymentSummary.paymentPercentage}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-3">
          {paymentSummary.paidAmount} ödendi, {paymentSummary.remainingAmount} kaldı
        </p>
      </div>

      {/* Production Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Üretim Süreci</h3>
        <div className="space-y-4">
          {productionSteps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4">
              <div className="flex-shrink-0 pt-1">
                {getStatusIcon(step.status)}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <h4 className="font-semibold text-gray-900">{step.title}</h4>
                  <span
                    className={`text-xs font-medium ${
                      step.status === 'tamamlandı'
                        ? 'text-green-700'
                        : step.status === 'devam_ediyor'
                        ? 'text-blue-700'
                        : 'text-gray-500'
                    }`}
                  >
                    {getStatusText(step.status)}
                  </span>
                </div>
                {step.completedDate && (
                  <p className="text-sm text-gray-500 mt-1">Tamamlandı: {step.completedDate}</p>
                )}
                {step.startDate && (
                  <p className="text-sm text-gray-500 mt-1">Başlangıç: {step.startDate}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                {index < productionSteps.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-200 -my-4" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/my-contract')}
          className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center justify-between mb-3">
            <FileText className="text-blue-600" size={24} />
            <ArrowRight size={18} className="text-gray-400" />
          </div>
          <h4 className="font-semibold text-gray-900">Sözleşmemi Gör</h4>
          <p className="text-sm text-gray-500 mt-1">Detaylı bilgiye ulaş</p>
        </button>

        <button
          onClick={() => navigate('/my-payments')}
          className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="text-green-600" size={24} />
            <ArrowRight size={18} className="text-gray-400" />
          </div>
          <h4 className="font-semibold text-gray-900">Ödemelerim</h4>
          <p className="text-sm text-gray-500 mt-1">Ödeme geçmişi</p>
        </button>

        <button
          onClick={() => navigate('/my-status')}
          className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center justify-between mb-3">
            <Factory className="text-purple-600" size={24} />
            <ArrowRight size={18} className="text-gray-400" />
          </div>
          <h4 className="font-semibold text-gray-900">Detaylı Durum</h4>
          <p className="text-sm text-gray-500 mt-1">Tam bilgi paneli</p>
        </button>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <span className="font-semibold">Sorularınız mı var?</span> Pazartesi-Cuma, 09:00-17:00
          saatleri arasında iletişim merkezimizle temasa geçebilirsiniz.
        </p>
      </div>
    </div>
  );
};

export default MusteriDashboard;
