import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CreditCard, Calendar, CheckCircle, Clock, AlertCircle, Loader2, Home, LogOut, Download } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function PortalContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout, profile } = useAuth();
  const [contract, setContract] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = getSupabase();

  useEffect(() => {
    loadContractData();
  }, [id]);

  const loadContractData = async () => {
    try {
      setLoading(true);
      if (!supabase || !user) return;

      // Load contract with related data
      const { data: contractData, error: cErr } = await supabase
        .from('contracts')
        .select(`
          *,
          customers:customer_id(ad, soyad, telefon, eposta),
          designs:design_id(ad, ref_no, genislik, uzunluk, yukseklik, alan, ozellikler, durum),
          tenants:tenant_id(name)
        `)
        .eq('id', id)
        .single();

      if (cErr) throw cErr;

      // Verify this contract belongs to the logged-in customer
      const userEmail = profile?.email || user.email;
      if (contractData.customers?.eposta !== userEmail) {
        setError('Bu sözleşmeye erişim yetkiniz yok.');
        setLoading(false);
        return;
      }

      setContract(contractData);

      // Load payments for this contract
      const { data: paymentData } = await supabase
        .from('payments')
        .select('*')
        .eq('sozlesme_id', id)
        .order('vade', { ascending: true });

      setPayments(paymentData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/giris');
  };

  const formatCurrency = (v) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(v || 0);
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

  const getStatusBadge = (durum) => {
    const map = {
      hazirlandi: { label: 'Hazırlandı', cls: 'bg-gray-100 text-gray-700', icon: Clock },
      imzalandi: { label: 'İmzalandı', cls: 'bg-blue-100 text-blue-700', icon: FileText },
      aktif: { label: 'Aktif', cls: 'bg-green-100 text-green-700', icon: CheckCircle },
      tamamlandi: { label: 'Tamamlandı', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
      iptal: { label: 'İptal', cls: 'bg-red-100 text-red-700', icon: AlertCircle },
    };
    const badge = map[durum] || { label: durum || '-', cls: 'bg-gray-100 text-gray-600', icon: Clock };
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${badge.cls}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (durum) => {
    const map = {
      odendi: { label: 'Ödendi', cls: 'bg-green-100 text-green-700' },
      bekliyor: { label: 'Bekliyor', cls: 'bg-yellow-100 text-yellow-700' },
      gecikli: { label: 'Gecikli', cls: 'bg-red-100 text-red-700' },
      kismen_odendi: { label: 'Kısmen Ödendi', cls: 'bg-orange-100 text-orange-700' },
      iptal: { label: 'İptal', cls: 'bg-gray-100 text-gray-600' },
    };
    const badge = map[durum] || { label: durum || '-', cls: 'bg-gray-100 text-gray-600' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>{badge.label}</span>;
  };

  const getPaymentTypeLabel = (tur) => {
    const map = { pesinat: 'Peşinat', taksit: 'Taksit', kalan: 'Kalan Ödeme' };
    return map[tur] || tur || '-';
  };

  // Calculations
  const totalPaid = payments.filter(p => p.durum === 'odendi').reduce((sum, p) => sum + (p.odenen_tutar || 0), 0);
  const totalAmount = contract?.toplam_tutar || 0;
  const remaining = totalAmount - totalPaid;
  const progressPercent = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Hata</h2>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button onClick={() => navigate('/portal')} className="text-amber-600 hover:text-amber-700 text-sm font-medium">
            Portala Dön
          </button>
        </div>
      </div>
    );
  }

  if (!contract) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Home className="w-6 h-6 text-amber-600" />
            <div>
              <h1 className="font-bold text-gray-900">Müşteri Portalı</h1>
              <p className="text-xs text-gray-500">{profile?.full_name || user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition text-sm">
            <LogOut className="w-4 h-4" />
            Çıkış
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Back button */}
        <button onClick={() => navigate('/portal')} className="flex items-center gap-2 text-gray-500 hover:text-amber-600 transition text-sm">
          <ArrowLeft className="w-4 h-4" />
          Portala Dön
        </button>

        {/* Contract Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <h2 className="text-xl font-bold text-gray-900">Sözleşme {contract.sozlesme_no}</h2>
              </div>
              <p className="text-sm text-gray-500">{contract.tenants?.name}</p>
              <p className="text-sm text-gray-500 mt-1">Tarih: {formatDate(contract.tarih)}</p>
            </div>
            <div className="text-right">
              {getStatusBadge(contract.durum)}
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>

        {/* Design Info */}
        {contract.designs && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Home className="w-4 h-4 text-amber-600" />
              Tasarım Bilgileri
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Tasarım Adı</p>
                <p className="font-medium text-gray-900 text-sm mt-0.5">{contract.designs.ad}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Referans No</p>
                <p className="font-medium text-gray-900 text-sm mt-0.5">{contract.designs.ref_no}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Boyutlar</p>
                <p className="font-medium text-gray-900 text-sm mt-0.5">{contract.designs.genislik}x{contract.designs.uzunluk}x{contract.designs.yukseklik}m</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Alan</p>
                <p className="font-medium text-gray-900 text-sm mt-0.5">{contract.designs.alan} m²</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-amber-600" />
            Ödeme Durumu
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <p className="text-xs text-green-600 font-medium">Ödenen</p>
              <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
              <p className="text-xs text-amber-600 font-medium">Kalan</p>
              <p className="text-xl font-bold text-amber-700 mt-1">{formatCurrency(remaining)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium">İlerleme</p>
              <p className="text-xl font-bold text-blue-700 mt-1">%{progressPercent}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <div
              className="bg-gradient-to-r from-amber-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>

          {/* Payment Table */}
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tür</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tutar</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ödenen</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vade</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ödeme Tarihi</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p, idx) => (
                    <tr key={p.id} className={`hover:bg-gray-50 transition ${p.durum === 'gecikli' ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{getPaymentTypeLabel(p.tur)}</td>
                      <td className="px-4 py-3 text-gray-900">{formatCurrency(p.tutar)}</td>
                      <td className="px-4 py-3 text-green-700 font-medium">{p.odenen_tutar ? formatCurrency(p.odenen_tutar) : '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(p.vade)}</td>
                      <td className="px-4 py-3 text-gray-600">{p.odeme_tarihi ? formatDate(p.odeme_tarihi) : '-'}</td>
                      <td className="px-4 py-3">{getPaymentStatusBadge(p.durum)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">Henüz ödeme planı oluşturulmamış</div>
          )}
        </div>

        {/* Contract Terms */}
        {contract.terms && contract.terms.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Sözleşme Koşulları</h3>
            <ul className="space-y-2">
              {contract.terms.map((term, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {term}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
