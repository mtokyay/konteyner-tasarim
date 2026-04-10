import React, { useState, useEffect } from 'react';
import { FileText, CreditCard, CheckCircle, AlertCircle, Eye, Loader2, LogOut, Calendar, Home, User, ArrowRight } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PortalDashboard() {
  const { user, logout, profile } = useAuth();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = getSupabase();

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      setLoading(true);
      if (!supabase || !user) return;

      // Find customer record linked to this user's email
      const userEmail = profile?.email || user.email;

      // Get customer records matching user email across all tenants
      const { data: customerData, error: cErr } = await supabase
        .from('customers')
        .select('id, ad, soyad, tenant_id, tenants:tenant_id(name)')
        .eq('eposta', userEmail);

      if (cErr) throw cErr;

      if (!customerData || customerData.length === 0) {
        setLoading(false);
        return;
      }

      const customerIds = customerData.map(c => c.id);

      // Get contracts for these customers
      const { data: contractData } = await supabase
        .from('contracts')
        .select('id, sozlesme_no, tarih, toplam_tutar, durum, customers:customer_id(ad, soyad), designs:design_id(ad, ref_no, genislik, uzunluk, yukseklik), tenant_id, tenants:tenant_id(name)')
        .in('customer_id', customerIds)
        .order('tarih', { ascending: false });

      setContracts(contractData || []);

      // Get payments for these contracts
      if (contractData && contractData.length > 0) {
        const contractIds = contractData.map(c => c.id);
        const { data: paymentData } = await supabase
          .from('payments')
          .select('id, tutar, odenen_tutar, vade, durum, tur, sozlesme_id')
          .in('sozlesme_id', contractIds)
          .order('vade', { ascending: false });

        setPayments(paymentData || []);
      }

      // Get designs linked to these customers
      const { data: designData } = await supabase
        .from('designs')
        .select('id, ad, ref_no, genislik, uzunluk, yukseklik, alan, durum, created_at')
        .in('musteri_id', customerIds)
        .order('created_at', { ascending: false });

      setDesigns(designData || []);
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

  const totalContractAmount = contracts.reduce((sum, c) => sum + (c.toplam_tutar || 0), 0);
  const totalPaid = payments.filter(p => p.durum === 'odendi').reduce((sum, p) => sum + (p.odenen_tutar || 0), 0);
  const upcomingPayments = payments.filter(p => p.durum === 'bekliyor' && new Date(p.vade) > new Date());

  const getStatusBadge = (durum) => {
    const map = {
      taslak: { label: 'Taslak', cls: 'bg-gray-100 text-gray-600' },
      aktif: { label: 'Aktif', cls: 'bg-green-100 text-green-700' },
      tamamlandi: { label: 'Tamamlandı', cls: 'bg-blue-100 text-blue-700' },
      iptal: { label: 'İptal', cls: 'bg-red-100 text-red-700' },
    };
    const badge = map[durum] || { label: durum || '-', cls: 'bg-gray-100 text-gray-600' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>{badge.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold">Hoş Geldiniz, {profile?.full_name || 'Müşteri'}!</h2>
          <p className="text-amber-100 mt-1 text-sm">Sözleşmelerinizi ve ödemelerinizi buradan takip edebilirsiniz.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-amber-500">
            <p className="text-gray-500 text-sm">Aktif Sözleşmeler</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{contracts.filter(c => c.durum === 'aktif').length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Toplam Ödenen</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Yaklaşan Ödemeler</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{upcomingPayments.length}</p>
          </div>
        </div>

        {contracts.length === 0 && designs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Henüz sözleşmeniz bulunmuyor</h3>
            <p className="text-gray-500 text-sm">Sözleşmeniz oluşturulduğunda burada görüntülenecektir.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contracts */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-amber-50 px-5 py-3 border-b border-amber-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  Sözleşmelerim ({contracts.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {contracts.map((c) => (
                  <div key={c.id} className="p-4 hover:bg-amber-50 transition cursor-pointer group" onClick={() => navigate(`/portal/contracts/${c.id}`)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm group-hover:text-amber-700">{c.sozlesme_no}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {c.designs?.ad} ({c.designs?.genislik}x{c.designs?.uzunluk}x{c.designs?.yukseklik}m)
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{c.tenants?.name} • {formatDate(c.tarih)}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="font-bold text-gray-900 text-sm">{formatCurrency(c.toplam_tutar)}</p>
                        {getStatusBadge(c.durum)}
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-amber-500 mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payments */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-amber-50 px-5 py-3 border-b border-amber-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  Ödemelerim ({payments.length})
                </h3>
                {payments.length > 0 && (
                  <button onClick={() => navigate('/portal/payments')} className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
                    Tümünü Gör <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {payments.map((p) => (
                  <div key={p.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {p.tur === 'pesinat' ? 'Peşinat' : 'Taksit'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Vade: {formatDate(p.vade)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-sm">{formatCurrency(p.tutar)}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.durum === 'odendi' ? 'bg-green-100 text-green-700' :
                          p.durum === 'gecikli' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {p.durum === 'odendi' ? 'Ödendi' : p.durum === 'gecikli' ? 'Gecikli' : 'Bekliyor'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-sm">Ödeme kaydı yok</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Designs */}
        {designs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-amber-50 px-5 py-3 border-b border-amber-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Home className="w-4 h-4 text-amber-600" />
                Tasarımlarım ({designs.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {designs.map((d) => (
                <div key={d.id} className="border border-gray-200 rounded-lg p-4 hover:border-amber-300 transition">
                  <h4 className="font-medium text-gray-900 text-sm">{d.ad}</h4>
                  <p className="text-xs text-gray-500 mt-1">Ref: {d.ref_no}</p>
                  <p className="text-xs text-gray-500">{d.genislik}x{d.uzunluk}x{d.yukseklik}m • {d.alan}m²</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    d.durum === 'tamamlandi' ? 'bg-green-100 text-green-700' :
                    d.durum === 'uretimde' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {d.durum === 'tamamlandi' ? 'Tamamlandı' :
                     d.durum === 'uretimde' ? 'Üretimde' :
                     d.durum === 'tasarim' ? 'Tasarım' : d.durum || 'Taslak'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
