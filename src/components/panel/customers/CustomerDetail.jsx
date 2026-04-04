import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Plus,
  Edit2,
  Mail,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Save,
  X,
  Check,
} from 'lucide-react';
import { getSupabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';

const statusBadgeConfig = {
  yeni: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Yeni' },
  teklif_verildi: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    label: 'Teklif Verildi',
  },
  sozlesme: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Sözleşme' },
  uretimde: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    label: 'Üretimde',
  },
  teslim_edildi: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Teslim Edildi',
  },
};

const designStatusConfig = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Taslak' },
  concept: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Konsept' },
  proposal: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Teklif' },
  approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Onaylandı' },
  production: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    label: 'Üretim',
  },
  completed: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    label: 'Tamamlandı',
  },
};

const CustomerDetail = () => {
  const { id: customerId } = useParams();
  const { tenantId } = useTenant();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('designs');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (tenantId) {
      loadCustomerData();
    }
  }, [customerId, tenantId]);

  const loadCustomerData = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = getSupabase();

      if (!supabase) {
        // Placeholder data
        setCustomer({
          id: customerId,
          ad: 'Ahmet',
          soyad: 'Yılmaz',
          telefon: '05551234567',
          eposta: 'ahmet@example.com',
          nereden_geldi: 'referans',
          adres: 'Ankara, Türkiye',
          notlar: 'Önemli müşteri',
          created_at: new Date().toISOString(),
        });
        setDesigns([
          {
            id: 1,
            ad: 'Modern Ev Tasarımı',
            status: 'approved',
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            ad: 'Kütüphane Tasarımı',
            status: 'production',
            created_at: new Date().toISOString(),
          },
        ]);
        setContracts([]);
        setPayments([]);
        return;
      }

      // Fetch customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('tenant_id', tenantId)
        .single();

      if (customerError) {
        throw customerError;
      }

      setCustomer(customerData);

      // Fetch designs
      const { data: designsData, error: designsError } = await supabase
        .from('designs')
        .select('*')
        .eq('customer_id', customerId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (designsError) {
        console.warn('Could not fetch designs:', designsError);
      } else {
        setDesigns(designsData || []);
      }

      // Fetch contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('customer_id', customerId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (contractsError) {
        console.warn('Could not fetch contracts:', contractsError);
      } else {
        setContracts(contractsData || []);
      }

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('musteri_id', customerId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.warn('Could not fetch payments:', paymentsError);
      } else {
        setPayments(paymentsData || []);
      }
    } catch (err) {
      setError(err.message || 'Müşteri bilgileri yüklenirken hata oluştu');
      console.error('Customer detail load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setEditData({
      ad: customer.ad || '',
      soyad: customer.soyad || '',
      telefon: customer.telefon || '',
      eposta: customer.eposta || '',
      nereden_geldi: customer.nereden_geldi || '',
      adres: customer.adres || '',
      notlar: customer.notlar || '',
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditData({});
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCustomer = async () => {
    if (!editData.ad || !editData.soyad) {
      setError('Ad ve soyad zorunludur');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setCustomer(prev => ({ ...prev, ...editData }));
        setEditing(false);
        setSaving(false);
        return;
      }
      const { data, error: updateError } = await supabase
        .from('customers')
        .update({
          ad: editData.ad,
          soyad: editData.soyad,
          telefon: editData.telefon,
          eposta: editData.eposta,
          nereden_geldi: editData.nereden_geldi || null,
          adres: editData.adres,
          notlar: editData.notlar,
        })
        .eq('id', customerId)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (updateError) throw updateError;
      setCustomer(data);
      setEditing(false);
      setSuccessMsg('Müşteri bilgileri güncellendi');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Güncelleme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const getSourceLabel = (source) => {
    const labels = {
      referans: 'Referans',
      instagram: 'Instagram',
      facebook: 'Facebook',
      web_sitesi: 'Web Sitesi',
      ilan: 'İlan',
      arama: 'Arama',
      diger: 'Diğer',
    };
    return labels[source] || source;
  };

  const renderStatusBadge = (status, config = statusBadgeConfig) => {
    const badgeConfig = config[status] || config.yeni || { bg: 'bg-gray-100', text: 'text-gray-700', label: status || '—' };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeConfig.bg} ${badgeConfig.text}`}
      >
        {badgeConfig.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Müşteri bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/panel/customers')}
            className="p-2 hover:bg-white rounded-lg transition-colors mb-6"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Müşteri bulunamadı
            </h2>
            <p className="text-gray-600">
              Aradığınız müşteri kaydı sisteme kayıtlı değil.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/panel/customers')}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {customer.ad} {customer.soyad}
          </h1>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold">Hata</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Customer Info Card */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Müşteri Bilgileri</h2>
              {!editing ? (
                <button
                  onClick={startEditing}
                  className="p-2 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              ) : (
                <div className="flex gap-1">
                  <button
                    onClick={handleSaveCustomer}
                    disabled={saving}
                    className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                    title="Kaydet"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    title="İptal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {successMsg && (
              <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" /> {successMsg}
              </div>
            )}

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Ad</label>
                  <input type="text" value={editData.ad} onChange={e => handleEditChange('ad', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Soyad</label>
                  <input type="text" value={editData.soyad} onChange={e => handleEditChange('soyad', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Telefon</label>
                  <input type="text" value={editData.telefon} onChange={e => handleEditChange('telefon', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">E-posta</label>
                  <input type="email" value={editData.eposta} onChange={e => handleEditChange('eposta', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Nereden Geldi</label>
                  <select value={editData.nereden_geldi} onChange={e => handleEditChange('nereden_geldi', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm">
                    <option value="">Seçiniz</option>
                    <option value="referans">Referans</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="web_sitesi">Web Sitesi</option>
                    <option value="ilan">İlan</option>
                    <option value="arama">Arama</option>
                    <option value="diger">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Adres</label>
                  <textarea value={editData.adres} onChange={e => handleEditChange('adres', e.target.value)} rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Notlar</label>
                  <textarea value={editData.notlar} onChange={e => handleEditChange('notlar', e.target.value)} rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Phone className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Telefon</p>
                    <p className="font-semibold text-gray-900">{customer.telefon}</p>
                  </div>
                </div>
                {customer.eposta && (
                  <div className="flex gap-3">
                    <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">E-posta</p>
                      <p className="font-semibold text-gray-900">{customer.eposta}</p>
                    </div>
                  </div>
                )}
                {customer.adres && (
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Adres</p>
                      <p className="font-semibold text-gray-900">{customer.adres}</p>
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Nereden Geldi</p>
                  <p className="font-semibold text-gray-900">{getSourceLabel(customer.nereden_geldi)}</p>
                </div>
                {customer.notlar && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 flex items-center gap-2"><FileText className="w-4 h-4" /> Notlar</p>
                    <p className="font-semibold text-gray-900 text-sm">{customer.notlar}</p>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Kayıt Tarihi</p>
                  <p className="font-semibold text-gray-900">{formatDate(customer.created_at)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <p className="text-sm text-blue-600 font-semibold mb-2">Tasarımlar</p>
              <p className="text-3xl font-bold text-blue-700">{designs.length}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <p className="text-sm text-purple-600 font-semibold mb-2">
                Sözleşmeler
              </p>
              <p className="text-3xl font-bold text-purple-700">{contracts.length}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <p className="text-sm text-green-600 font-semibold mb-2">
                Toplam Ödemeler
              </p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(
                  payments.reduce((sum, p) => sum + (p.tutar || 0), 0)
                )}
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
              <p className="text-sm text-orange-600 font-semibold mb-2">
                Ödeme Sayısı
              </p>
              <p className="text-3xl font-bold text-orange-700">{payments.length}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 flex">
            <button
              onClick={() => setActiveTab('designs')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'designs'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tasarımlar
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'contracts'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sözleşmeler
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'payments'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ödemeler
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Designs Tab */}
            {activeTab === 'designs' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Tasarımlar ({designs.length})
                  </h3>
                  <button
                    onClick={() =>
                      navigate('/panel/designs/new', {
                        state: { customerId },
                      })
                    }
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Yeni Tasarım
                  </button>
                </div>

                {designs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Henüz tasarım kaydı bulunmamaktadır
                  </p>
                ) : (
                  <div className="space-y-3">
                    {designs.map((design) => (
                      <div
                        key={design.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-amber-400 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {design.ad || `Tasarım #${design.id}`}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatDate(design.created_at)}
                            </p>
                          </div>
                          {renderStatusBadge(design.status, designStatusConfig)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Contracts Tab */}
            {activeTab === 'contracts' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Sözleşmeler ({contracts.length})
                </h3>

                {contracts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Henüz sözleşme kaydı bulunmamaktadır
                  </p>
                ) : (
                  <div className="space-y-3">
                    {contracts.map((contract) => (
                      <div
                        key={contract.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-amber-400 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              Sözleşme #{contract.id}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatDate(contract.created_at)}
                            </p>
                          </div>
                          {contract.status && renderStatusBadge(contract.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Ödemeler ({payments.length})
                </h3>

                {payments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Henüz ödeme kaydı bulunmamaktadır
                  </p>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-amber-400 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <h4 className="font-semibold text-gray-900">
                                {formatCurrency(payment.tutar)}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-600">
                              {formatDate(payment.created_at)}
                            </p>
                            {payment.notlar && (
                              <p className="text-sm text-gray-600 mt-1">
                                {payment.notlar}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
