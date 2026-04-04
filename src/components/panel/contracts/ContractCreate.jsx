import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { getSupabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';
import { useAuth } from '../../../contexts/AuthContext';

const ContractCreate = () => {
  const [designs, setDesigns] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [contractTerms, setContractTerms] = useState([]);
  const [paymentSchedule, setPaymentSchedule] = useState([]);
  const [newTerm, setNewTerm] = useState('');
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [installmentCount, setInstallmentCount] = useState(3);
  const navigate = useNavigate();
  const { user } = useAuth();
  const supabase = getSupabase();
  const { tenantId } = useTenant();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedDesign) {
      loadCustomer(selectedDesign.customer_id);
    }
  }, [selectedDesign]);

  useEffect(() => {
    if (selectedDesign) {
      generatePaymentSchedule();
    }
  }, [selectedDesign, downPaymentPercent, installmentCount]);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();

      const { data: designsData, error: designsError } = await supabase
        .from('designs')
        .select('*, customers:customer_id(ad, soyad, telefon, eposta, adres)')
        .eq('status', 'onaylandi')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (designsError) throw designsError;
      setDesigns(designsData || []);

      const { data: companyData, error: companyError } = await supabase
        .from('company_info')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (companyError && companyError.code !== 'PGRST116') throw companyError;
      if (companyData) {
        setCompanyInfo(companyData);
        setContractTerms(companyData.contract_terms || []);
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomer = async (customerId) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('tenant_id', tenantId)
        .single();

      if (error) throw error;
      setCustomer(data);
    } catch (err) {
      console.error('Müşteri yükleme hatası:', err);
    }
  };

  const generatePaymentSchedule = () => {
    if (!selectedDesign) return;

    const totalAmount = selectedDesign.net_fiyat;
    const downPayment = (totalAmount * downPaymentPercent) / 100;
    const remainingAmount = totalAmount - downPayment;
    const installmentAmount = remainingAmount / installmentCount;

    const schedule = [
      {
        type: 'pesinat',
        tutar: downPayment,
        vade: new Date().toISOString().split('T')[0],
        durum: 'bekliyor',
      },
    ];

    const startDate = new Date(selectedDesign.teslim_tarihi || new Date());
    for (let i = 1; i <= installmentCount; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      schedule.push({
        type: 'taksit',
        tutar: installmentAmount,
        vade: dueDate.toISOString().split('T')[0],
        durum: 'bekliyor',
      });
    }

    setPaymentSchedule(schedule);
  };

  const addTerm = () => {
    if (newTerm.trim()) {
      setContractTerms([...contractTerms, newTerm]);
      setNewTerm('');
    }
  };

  const removeTerm = (index) => {
    setContractTerms(contractTerms.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDesign || !customer || !companyInfo) {
      alert('Lütfen tüm gerekli alanları doldurun');
      return;
    }

    try {
      setSubmitting(true);

      // Get the actual Supabase auth user for FK references
      let authUserId = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authUserId = session?.user?.id || null;
        if (!authUserId) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          authUserId = authUser?.id || null;
        }
      } catch (authErr) {
        console.warn('Auth user alınamadı:', authErr);
      }

      const sozlesmeNo = 'SK-' + Date.now().toString().slice(-8);

      const contractInsert = {
        tenant_id: tenantId,
        design_id: selectedDesign.id,
        customer_id: customer.id,
        sozlesme_no: sozlesmeNo,
        tarih: new Date().toISOString().split('T')[0],
        toplam_tutar: selectedDesign.net_fiyat,
        terms: contractTerms,
        status: 'hazirlandi',
      };
      if (authUserId) contractInsert.created_by = authUserId;

      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .insert([contractInsert])
        .select('id');

      if (contractError) throw contractError;
      const contractId = contractData[0].id;

      const paymentRecords = paymentSchedule.map((payment) => {
        const rec = {
          tenant_id: tenantId,
          sozlesme_id: contractId,
          musteri_id: customer.id,
          tur: payment.type === 'pesinat' ? 'pesinat' : 'taksit',
          tutar: payment.tutar,
          odenen_tutar: 0,
          vade: payment.vade,
          durum: 'bekliyor',
        };
        if (authUserId) rec.recorded_by = authUserId;
        return rec;
      });

      const { error: paymentError } = await supabase.from('payments').insert(paymentRecords);

      if (paymentError) throw paymentError;

      navigate(`/panel/contracts/${contractId}`);
    } catch (err) {
      console.error('Sözleşme oluşturma hatası:', err);
      alert('Sözleşme oluşturulurken hata oluştu: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Veriler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/panel/contracts')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Yeni Sözleşme Oluştur</h1>
          <p className="text-gray-600 mt-1">Onaylanan tasarımdan sözleşme oluşturun</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Tasarım Seçimi</h2>
          <select
            value={selectedDesign?.id || ''}
            onChange={(e) => {
              const design = designs.find((d) => d.id === e.target.value);
              setSelectedDesign(design || null);
            }}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Onaylanan tasarım seçin</option>
            {designs.map((design) => (
              <option key={design.id} value={design.id}>
                {design.ad} ({design.ref_no}) - {formatCurrency(design.net_fiyat)}
              </option>
            ))}
          </select>
        </div>

        {selectedDesign && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Müşteri Bilgileri</h2>
                {customer && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Ad Soyad</p>
                      <p className="font-medium">{customer.ad} {customer.soyad}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Telefon</p>
                      <p className="font-medium">{customer.telefon}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">E-posta</p>
                      <p className="font-medium">{customer.eposta}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Adres</p>
                      <p className="font-medium text-sm">{customer.adres}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Tasarım Bilgileri</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Tasarım Adı</p>
                    <p className="font-medium">{selectedDesign.ad}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Referans No</p>
                    <p className="font-medium">{selectedDesign.ref_no}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Net Fiyat</p>
                    <p className="font-medium text-amber-600">{formatCurrency(selectedDesign.net_fiyat)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teslim Tarihi</p>
                    <p className="font-medium">
                      {new Date(selectedDesign.teslim_tarihi).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Ödeme Planı</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peşinat Yüzdesi (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taksit Sayısı
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <h3 className="font-semibold text-gray-900">Ödeme Takvimi</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-3 py-2 text-left font-medium">Tür</th>
                        <th className="px-3 py-2 text-left font-medium">Tutar</th>
                        <th className="px-3 py-2 text-left font-medium">Vade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentSchedule.map((payment, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="px-3 py-2">
                            {payment.type === 'pesinat' ? 'Peşinat' : `Taksit ${idx}`}
                          </td>
                          <td className="px-3 py-2 font-medium">{formatCurrency(payment.tutar)}</td>
                          <td className="px-3 py-2">{payment.vade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Sözleşme Şartları</h2>
              <div className="space-y-3">
                {contractTerms.map((term, index) => (
                  <div key={index} className="flex items-start justify-between bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{term}</p>
                    <button
                      type="button"
                      onClick={() => removeTerm(index)}
                      className="text-red-600 hover:text-red-700 transition p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder="Yeni şart ekleyin..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTerm();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addTerm}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                >
                  <Plus size={18} />
                  Ekle
                </button>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/panel/contracts')}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            İptal Et
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedDesign}
            className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            {submitting ? 'Oluşturuluyor...' : 'Sözleşme Oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContractCreate;
