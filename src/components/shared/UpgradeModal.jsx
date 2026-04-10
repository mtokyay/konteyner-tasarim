import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Zap, Check } from 'lucide-react';

const UpgradeModal = ({ isOpen, onClose, message, requiredPlan }) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const planFeatures = {
    starter: [
      '50 müşteri',
      '25 aktif tasarım',
      'Tasarım başına 5 revizyon',
      'PDF çıktı / teklif',
      'Tasarım kaydetme',
    ],
    pro: [
      '200 müşteri',
      '100 aktif tasarım',
      'Tasarım başına 20 revizyon',
      'PDF çıktı / teklif',
      'Sözleşme oluşturma ve takibi',
      'Ödeme takibi',
      '5 çalışana kadar',
    ],
    enterprise: [
      'Sınırsız müşteri ve tasarım',
      'Sınırsız revizyon',
      'Müşteri portalı',
      'Versiyon takibi',
      'Usta / ekip izleme',
      'Kalite kontrol modülü',
      'API erişimi',
      '20 çalışana kadar',
      'Öncelikli destek',
    ],
  };

  const planPrices = {
    starter: '₺499',
    pro: '₺999',
    enterprise: '₺1.999',
  };

  const planNames = {
    starter: 'Başlangıç',
    pro: 'Profesyonel',
    enterprise: 'Kurumsal',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Plan Yükseltme Gerekli</h2>
          <p className="text-gray-600">{message || 'Bu özelliği kullanmak için planınızı yükseltin.'}</p>
        </div>

        {requiredPlan && planFeatures[requiredPlan] && (
          <div className="px-6 pb-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-amber-800">{planNames[requiredPlan]} Plan</p>
                <p className="font-bold text-amber-700">{planPrices[requiredPlan]}/ay</p>
              </div>
              <ul className="space-y-1.5">
                {planFeatures[requiredPlan].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-amber-700">
                    <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="p-6 pt-2 flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition">
            Şimdi Değil
          </button>
          <button onClick={() => { onClose(); navigate('/panel/subscription'); }}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold transition shadow-md">
            Planları Gör
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
