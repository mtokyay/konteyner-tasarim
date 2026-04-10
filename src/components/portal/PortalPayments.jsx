import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Calendar, CheckCircle, Clock, AlertCircle, Loader2, Home, LogOut, Filter } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function PortalPayments() {
  const navigate = useNavigate();
  const { user, logout, profile } = useAuth();
  const [payments, setPayments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const supabase = getSupabase();

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      if (!supabase || !user) return;

      const userEmail = profile?.email || user.email;

      // Find customer records
      const { data: customerData, error: cErr } = await supabase
        .from('customers')
        .select('id, ad, soyad, tenant_id')
        .eq('eposta', userEmail);

      if (cErr) throw cErr;
      if (!customerData || customerData.length === 0) {
        setLoading(false);
        return;
      }

      const customerIds = customerData.map(c => c.id);

      // Get contracts
      const { data: contractData } = await supabase
        .from('contracts')
        .select('id, sozlesme_no, toplam_tutar, durum, tenants:tenant_id(name)')
        .in('customer_id', customerIds)
        .order('tarih', { ascending: false });

      setContracts(contractData || []);

      // Get all payments
      if (contractData && contractData.length > 0) {
        const contractIds = contractData.map(c => c.id);
        const { data: paymentData } = await supabase
          .from('payments')
          .select('*, contracts:sozlesme_id(sozlesme_no, tenants:tenant_id(name))')
          .in('sozlesme_id', contractIds)
          .order('vade', { ascending: true });

        setPayments(paymentData || []);
      }
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

  const getPaymentStatusBadge = (durum) => {
    const map = {
      odendi: { label: 'Ödendi', cls: 'bg-green-100 text-green-700', icon: CheckCircle },
      bekliyor: { label: 'Bekliyor', cls: 'bg-yellow-100 text-yellow-700', icon: Clock },
      gecikli: { label: 'Gecikli', cls: 'bg-red-100 text-red-700', icon: AlertCircle },
      kismen_odendi: { label: 'Kısmen', cls: 'bg-orange-100 text-orange-700', icon: Clock },
      iptal: { label: 'İptal', cls: 'bg-gray-100 text-gray-600', icon: AlertCircle },
    };
    const badge = map[durum] || { label: durum || '-', cls: 'bg-gray-100 text-gray-600', icon: Clock };
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getPaymentTypeLabel = (tur) => {
    const map = { pesinat: 'Peşinat', taksit: 'Taksit', kalan: 'Kalan Ödeme' };
    return map[tur] || tur || '-';
  };

  // Filter
  const filteredPayments = filterStatus === 'all'
    ? payments
    : payments.filter(p => p.durum === filterStatus);

  // Summary stats
  const totalAmount = payments.reduce((sum, p) => sum + (p.tutar || 0), 0);
  const totalPaid = payments.filter(p => p.durum === 'odendi').reduce((sum, p) => sum + (p.odenen_tutar || 0), 0);
  const overduePayments = payments.filter(p => p.durum === 'gecikli' || (p.durum === 'bekliyor' && new Date(p.vade) < new Date()));
  const overdueAmount = overduePayments.reduce((sum, p) => sum + (p.tutar - (p.odenen_tutar || 0)), 0);
  const upcomingPayments = payments.filter(p => p.durum === 'bekliyor' && new Date(p.vade) >= new Date());
  const nextPayment = upcomingPayments.length > 0 ? upcomingPayments[0] : null;

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

        {/* Page Title */}
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-900">Ödeme Geçmişi</h2>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
            <p className="text-gray-500 text-xs font-medium">Toplam Tutar</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
            <p className="text-gray-500 text-xs font-medium">Ödenen</p>
            <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-amber-500">
            <p className="text-gray-500 text-xs font-medium">Kalan</p>
            <p className="text-xl font-bold text-amber-700 mt-1">{formatCurrency(totalAmount - totalPaid)}</p>
          </div>
          <div className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${overdueAmount > 0 ? 'border-red-500' : 'border-gray-300'}`}>
            <p className="text-gray-500 text-xs font-medium">Gecikmiş</p>
            <p className={`text-xl font-bold mt-1 ${overdueAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatCurrency(overdueAmount)}</p>
          </div>
        </div>

        {/* Next Payment Alert */}
        {nextPayment && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900 text-sm">Sıradaki Ödeme</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {getPaymentTypeLabel(nextPayment.tur)} — Vade: {formatDate(nextPayment.vade)}
                </p>
              </div>
            </div>
            <p className="font-bold text-amber-900">{formatCurrency(nextPayment.tutar)}</p>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {[
            { value: 'all', label: 'Tümü' },
            { value: 'bekliyor', label: 'Bekleyen' },
            { value: 'odendi', label: 'Ödenen' },
            { value: 'gecikli', label: 'Gecikmiş' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filterStatus === f.value
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sözleşme</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tür</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tutar</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ödenen</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vade</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ödeme Tarihi</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.map((p, idx) => {
                    const isOverdue = p.durum === 'bekliyor' && new Date(p.vade) < new Date();
                    return (
                      <tr key={p.id} className={`hover:bg-gray-50 transition ${isOverdue ? 'bg-red-50' : p.durum === 'gecikli' ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{p.contracts?.sozlesme_no || '-'}</p>
                          <p className="text-xs text-gray-400">{p.contracts?.tenants?.name}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{getPaymentTypeLabel(p.tur)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(p.tutar)}</td>
                        <td className="px-4 py-3 text-green-700 font-medium">{p.odenen_tutar ? formatCurrency(p.odenen_tutar) : '-'}</td>
                        <td className="px-4 py-3 text-gray-600">
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>{formatDate(p.vade)}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.odeme_tarihi ? formatDate(p.odeme_tarihi) : '-'}</td>
                        <td className="px-4 py-3">{getPaymentStatusBadge(isOverdue ? 'gecikli' : p.durum)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {filterStatus === 'all' ? 'Henüz ödeme kaydınız bulunmuyor' : 'Bu filtreye uygun ödeme bulunamadı'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
