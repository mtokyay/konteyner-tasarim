import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, Save } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

export default function ContractCreate() {
  const { designId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [design, setDesign] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);

  const [contractNo, setContractNo] = useState('');
  const [contractDate, setContractDate] = useState(new Date().toISOString().split('T')[0]);

  const [totalPrice, setTotalPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('amount');
  const [netPrice, setNetPrice] = useState(0);
  const [vatRate, setVatRate] = useState(20);
  const [vatAmount, setVatAmount] = useState(0);
  const [totalWithVat, setTotalWithVat] = useState(0);

  const [downPayment, setDownPayment] = useState(0);
  const [downPaymentDate, setDownPaymentDate] = useState('');
  const [installmentCount, setInstallmentCount] = useState(1);
  const [installments, setInstallments] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState('');

  const [contractTerms, setContractTerms] = useState([]);
  const [specialNotes, setSpecialNotes] = useState('');

  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadData();
  }, [designId]);

  useEffect(() => {
    calculatePrices();
  }, [totalPrice, discount, discountType, vatRate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();

      // Load design
      const { data: designData, error: designError } = await supabase
        .from('designs')
        .select('*, customers(*)')
        .eq('id', designId)
        .single();

      if (designError) throw designError;
      setDesign(designData);
      setCustomer(designData.customers);
      setTotalPrice(designData.toplam_fiyat || 0);

      // Load company info
      const { data: companyData } = await supabase
        .from('company_info')
        .select('*')
        .single();

      if (companyData) {
        setCompanyInfo(companyData);
        setContractTerms(companyData.contract_terms || []);
      }

      // Generate contract number
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('year', year);

      const newContractNo = `TK-SZ-${year}-${String((count || 0) + 1).padStart(4, '0')}`;
      setContractNo(newContractNo);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      setMessage({ type: 'error', text: 'Veriler yüklenirken hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const calculatePrices = () => {
    const discountAmount = discountType === 'amount' ? discount : (totalPrice * discount) / 100;
    const calculatedNetPrice = totalPrice - discountAmount;
    const calculatedVat = (calculatedNetPrice * vatRate) / 100;
    const calculatedTotal = calculatedNetPrice + calculatedVat;

    setNetPrice(calculatedNetPrice);
    setVatAmount(calculatedVat);
    setTotalWithVat(calculatedTotal);
  };

  const generateInstallments = () => {
    if (!downPaymentDate || installmentCount < 1) {
      setMessage({ type: 'error', text: 'Peşinat tarihi ve taksit sayısı gerekli' });
      return;
    }

    const remaining = totalWithVat - downPayment;
    const installmentAmount = remaining / installmentCount;
    const baseDate = new Date(downPaymentDate);

    const newInstallments = Array.from({ length: installmentCount }, (_, i) => {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(dueDate.getMonth() + i + 1);

      return {
        no: i + 1,
        amount: installmentAmount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'bekliyor'
      };
    });

    setInstallments(newInstallments);
    setMessage({ type: 'success', text: 'Taksitler hesaplandı' });
  };

  const updateInstallment = (index, field, value) => {
    const updated = [...installments];
    updated[index] = { ...updated[index], [field]: value };
    setInstallments(updated);
  };

  const removeInstallment = (index) => {
    setInstallments(installments.filter((_, i) => i !== index));
  };

  const addTerm = () => {
    setContractTerms([...contractTerms, 'Yeni madde']);
  };

  const updateTerm = (index, value) => {
    const updated = [...contractTerms];
    updated[index] = value;
    setContractTerms(updated);
  };

  const removeTerm = (index) => {
    setContractTerms(contractTerms.filter((_, i) => i !== index));
  };

  const moveTerm = (index, direction) => {
    const updated = [...contractTerms];
    if (direction === 'up' && index > 0) {
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
    } else if (direction === 'down' && index < updated.length - 1) {
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    }
    setContractTerms(updated);
  };

  const handleSave = async (isDraft = true) => {
    try {
      setSaving(true);

      if (!contractNo || !contractDate || !downPaymentDate || installments.length === 0) {
        setMessage({ type: 'error', text: 'Lütfen tüm zorunlu alanları doldurun' });
        return;
      }

      const supabase = getSupabase();

      const contractData = {
        sozlesme_no: contractNo,
        design_id: designId,
        customer_id: customer?.id,
        tarih: contractDate,
        status: isDraft ? 'hazirlanda' : 'imzalandi',
        toplam_tutar: totalWithVat,
        terms: JSON.stringify(contractTerms),
        signed_pdf_urls: null
      };

      const { data: savedContract, error: contractError } = await supabase
        .from('contracts')
        .insert(contractData)
        .select()
        .single();

      if (contractError) throw contractError;

      // Save payment records
      const paymentRecords = [
        {
          sozlesme_id: savedContract.id,
          musteri_id: customer?.id,
          tur: 'pesinat',
          tutar: downPayment,
          odenen_tutar: 0,
          vade: downPaymentDate,
          durum: 'bekliyor'
        },
        ...installments.map((inst, idx) => ({
          sozlesme_id: savedContract.id,
          musteri_id: customer?.id,
          tur: 'taksit',
          tutar: inst.amount,
          odenen_tutar: 0,
          vade: inst.dueDate,
          durum: 'bekliyor'
        }))
      ];

      const { error: paymentError } = await supabase
        .from('payments')
        .insert(paymentRecords);

      if (paymentError) throw paymentError;

      setMessage({
        type: 'success',
        text: isDraft ? 'Sözleşme taslak olarak kaydedildi' : 'Sözleşme onaylanarak kaydedildi'
      });

      setTimeout(() => {
        navigate(`/contracts/${savedContract.id}`);
      }, 1500);
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      setMessage({ type: 'error', text: 'Kaydetme sırasında hata oluştu' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Yükleniyor...</div>;
  }

  if (!design || !customer) {
    return <div className="p-6 text-center text-red-600">Tasarım veya müşteri bilgileri bulunamadı</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sözleşme Oluştur</h1>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <Eye size={18} /> Önizleme
        </button>
      </div>

      {/* Sözleşme Bilgileri */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold mb-4">Sözleşme Bilgileri</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sözleşme No</label>
            <input
              type="text"
              value={contractNo}
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
            <input
              type="date"
              value={contractDate}
              onChange={(e) => setContractDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teslim Tarihi</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Müşteri Bilgileri</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Ad:</span> {customer.ad} {customer.soyad}</p>
              <p><span className="font-medium">E-posta:</span> {customer.eposta}</p>
              <p><span className="font-medium">Telefon:</span> {customer.telefon}</p>
              <p><span className="font-medium">Adres:</span> {customer.adres}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-3">Firma Bilgileri</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Firma:</span> {companyInfo?.company_name}</p>
              <p><span className="font-medium">E-posta:</span> {companyInfo?.email}</p>
              <p><span className="font-medium">Telefon:</span> {companyInfo?.phone}</p>
              <p><span className="font-medium">Vergi No:</span> {companyInfo?.tax_id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ödeme Planı */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold mb-4">Ödeme Planı</h3>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Fiyat</label>
            <input
              type="number"
              value={totalPrice}
              onChange={(e) => setTotalPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İndirim</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="amount">₺</option>
                <option value="percent">%</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Net Fiyat</label>
            <input
              type="text"
              value={netPrice.toFixed(2)}
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">KDV Oranı (%)</label>
            <input
              type="number"
              value={vatRate}
              onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">KDV Tutarı</label>
            <input
              type="text"
              value={vatAmount.toFixed(2)}
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">KDV Dahil Toplam</label>
            <input
              type="text"
              value={totalWithVat.toFixed(2)}
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-bold text-amber-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peşinat Tutarı</label>
            <input
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peşinat Tarihi</label>
            <input
              type="date"
              value={downPaymentDate}
              onChange={(e) => setDownPaymentDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taksit Sayısı</label>
            <input
              type="number"
              min="1"
              max="12"
              value={installmentCount}
              onChange={(e) => setInstallmentCount(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        <button
          onClick={generateInstallments}
          className="mb-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
        >
          Taksitleri Otomatik Hesapla
        </button>

        {installments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left">Taksit No</th>
                  <th className="px-4 py-2 text-left">Tutar</th>
                  <th className="px-4 py-2 text-left">Vade Tarihi</th>
                  <th className="px-4 py-2 text-left">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((inst, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="px-4 py-2">{inst.no}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={inst.amount}
                        onChange={(e) => updateInstallment(idx, 'amount', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        value={inst.dueDate}
                        onChange={(e) => updateInstallment(idx, 'dueDate', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeInstallment(idx)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sözleşme Maddeleri */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Sözleşme Maddeleri</h3>
          <button
            onClick={addTerm}
            className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
          >
            <Plus size={18} /> Madde Ekle
          </button>
        </div>
        <div className="space-y-3">
          {contractTerms.map((term, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="flex gap-1">
                <button
                  onClick={() => moveTerm(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 text-gray-400 disabled:opacity-30 hover:text-gray-600"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => moveTerm(idx, 'down')}
                  disabled={idx === contractTerms.length - 1}
                  className="p-1 text-gray-400 disabled:opacity-30 hover:text-gray-600"
                >
                  <ArrowDown size={16} />
                </button>
              </div>
              <input
                type="text"
                value={term}
                onChange={(e) => updateTerm(idx, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <button
                onClick={() => removeTerm(idx)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Özel Notlar */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold mb-4">Özel Notlar</h3>
        <textarea
          value={specialNotes}
          onChange={(e) => setSpecialNotes(e.target.value)}
          rows="4"
          placeholder="Sözleşmeye özel şartları yazın..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
        >
          İptal
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition font-medium"
        >
          <Save size={18} /> {saving ? 'Kaydediliyor...' : 'Kaydet (Taslak)'}
        </button>
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition font-medium"
        >
          <Save size={18} /> {saving ? 'Kaydediliyor...' : 'Onayla ve Kaydet'}
        </button>
      </div>
    </div>
  );
}
