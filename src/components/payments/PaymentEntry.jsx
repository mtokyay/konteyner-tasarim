import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

const PaymentEntry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [customers, setCustomers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);

  const [formData, setFormData] = useState({
    musteri_id: '',
    sozlesme_id: '',
    odeme_id: '',
    odenen_tutar: '',
    odeme_tarihi: new Date().toISOString().split('T')[0],
    odeme_yontemi: 'havale',
    notlar: '',
    dekont: null,
  });

  const [fileName, setFileName] = useState('');

  useEffect(() => {
    loadInitialData();
  }, [paymentId]);

  const loadInitialData = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = getSupabase();

      if (!supabase) {
        // Placeholder data
        setCustomers([
          { id: 1, ad: 'Ahmet', soyad: 'Yılmaz' },
          { id: 2, ad: 'Fatma', soyad: 'Kaya' },
        ]);
        setContracts([
          { id: 1, sozlesme_no: 'SK-001-2024', musteri_id: 1 },
        ]);
        setPayments([
          {
            id: 1,
            sozlesme_id: 1,
            musteri_id: 1,
            tutar: 30000,
            odenen_tutar: 0,
            durum: 'bekliyor',
          },
        ]);

        if (paymentId) {
          setFormData((prev) => ({
            ...prev,
            odeme_id: paymentId,
            musteri_id: 1,
            sozlesme_id: 1,
            odenen_tutar: '',
          }));
        }
        return;
      }

      // Fetch customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, ad, soyad');

      if (customersData) {
        setCustomers(customersData);
      }

      // Fetch contracts
      const { data: contractsData } = await supabase
        .from('contracts')
        .select('id, sozlesme_no, musteri_id');

      if (contractsData) {
        setContracts(contractsData);
      }

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('id, sozlesme_id, musteri_id, tutar, odenen_tutar, durum');

      if (paymentsData) {
        setPayments(paymentsData);

        // Pre-populate if payment_id provided
        if (paymentId) {
          const selectedPayment = paymentsData.find(
            (p) => p.id.toString() === paymentId
          );
          if (selectedPayment) {
            setFormData((prev) => ({
              ...prev,
              odeme_id: paymentId,
              musteri_id: selectedPayment.musteri_id,
              sozlesme_id: selectedPayment.sozlesme_id,
              odenen_tutar: selectedPayment.tutar - selectedPayment.odenen_tutar,
            }));
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Veri yüklenirken hata oluştu');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Update contracts when customer changes
    if (name === 'musteri_id') {
      const customerContracts = contracts.filter(
        (c) => c.musteri_id.toString() === value
      );
      if (customerContracts.length === 1) {
        setFormData((prev) => ({
          ...prev,
          sozlesme_id: customerContracts[0].id,
        }));
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        dekont: file,
      }));
      setFileName(file.name);
    }
  };

  const removeFile = () => {
    setFormData((prev) => ({
      ...prev,
      dekont: null,
    }));
    setFileName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      if (!formData.musteri_id || !formData.odeme_id || !formData.odenen_tutar) {
        setError('Lütfen tüm zorunlu alanları doldurunuz');
        setSaving(false);
        return;
      }

      const supabase = getSupabase();

      if (!supabase) {
        // Show success for demo
        setSuccessMessage('Tahsilat başarıyla kaydedildi!');
        setTimeout(() => {
          navigate('/payments');
        }, 2000);
        setSaving(false);
        return;
      }

      // Update payment record
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          odenen_tutar: formData.odenen_tutar,
          odeme_tarihi: formData.odeme_tarihi,
          durum: 'odendi',
          odeme_yontemi: formData.odeme_yontemi,
          notlar: formData.notlar,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formData.odeme_id);

      if (updateError) {
        throw updateError;
      }

      // Upload file if provided
      if (formData.dekont) {
        const fileName = `dekont_${formData.odeme_id}_${Date.now()}`;
        const { error: uploadError } = await supabase.storage
          .from('payment_receipts')
          .upload(fileName, formData.dekont);

        if (uploadError) {
          console.warn('File upload failed:', uploadError);
        }
      }

      // Create notification for customer
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          musteri_id: formData.musteri_id,
          baslik: 'Ödeme Onaylandı',
          mesaj: `${formData.odenen_tutar} TL ödemeniz alındı ve kaydedilmiştir.`,
          tur: 'odeme',
          okundu: false,
          created_at: new Date().toISOString(),
        });

      if (notifError) {
        console.warn('Notification creation failed:', notifError);
      }

      setSuccessMessage('Tahsilat başarıyla kaydedildi!');
      setTimeout(() => {
        navigate('/payments');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Tahsilat kaydedilirken hata oluştu');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const getSelectedPaymentInfo = () => {
    if (!formData.odeme_id) return null;
    return payments.find((p) => p.id.toString() === formData.odeme_id);
  };

  const paymentInfo = getSelectedPaymentInfo();
  const remainingAmount = paymentInfo
    ? paymentInfo.tutar - (paymentInfo.odenen_tutar || 0)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/payments')}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tahsilat Girişi</h1>
            <p className="text-gray-600 mt-1">
              Yeni bir tahsilat kaydı oluşturun
            </p>
          </div>
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

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 font-semibold">{successMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            {/* Müşteri */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Müşteri *
              </label>
              <select
                name="musteri_id"
                value={formData.musteri_id}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="">Müşteri Seçiniz</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.ad} {customer.soyad}
                  </option>
                ))}
              </select>
            </div>

            {/* Sözleşme */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sözleşme *
              </label>
              <select
                name="sozlesme_id"
                value={formData.sozlesme_id}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="">Sözleşme Seçiniz</option>
                {contracts
                  .filter(
                    (c) =>
                      !formData.musteri_id ||
                      c.musteri_id.toString() === formData.musteri_id
                  )
                  .map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.sozlesme_no}
                    </option>
                  ))}
              </select>
            </div>

            {/* Ödeme Kalemi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ödeme Kalemi *
              </label>
              <select
                name="odeme_id"
                value={formData.odeme_id}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="">Ödeme Kalemi Seçiniz</option>
                {payments
                  .filter(
                    (p) =>
                      !formData.sozlesme_id ||
                      p.sozlesme_id.toString() === formData.sozlesme_id
                  )
                  .map((payment) => (
                    <option key={payment.id} value={payment.id}>
                      {payment.id} - Kalan:{' '}
                      {payment.tutar - (payment.odenen_tutar || 0)} TL
                    </option>
                  ))}
              </select>
            </div>

            {/* Payment Info */}
            {paymentInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Toplam Tutar:</span>{' '}
                  {paymentInfo.tutar} TL
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Ödenen Tutar:</span>{' '}
                  {paymentInfo.odenen_tutar || 0} TL
                </p>
                <p className="text-sm text-gray-900 font-semibold">
                  <span>Kalan Tutar:</span> {remainingAmount} TL
                </p>
              </div>
            )}

            {/* Ödenen Tutar */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ödenen Tutar (TL) *
              </label>
              <input
                type="number"
                name="odenen_tutar"
                value={formData.odenen_tutar}
                onChange={handleInputChange}
                min="0"
                max={remainingAmount}
                step="0.01"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-xs text-gray-600 mt-1">
                Kalan tutar: {remainingAmount} TL
              </p>
            </div>

            {/* Ödeme Tarihi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ödeme Tarihi *
              </label>
              <input
                type="date"
                name="odeme_tarihi"
                value={formData.odeme_tarihi}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Ödeme Yöntemi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Ödeme Yöntemi *
              </label>
              <div className="space-y-3">
                {[
                  { value: 'nakit', label: 'Nakit' },
                  { value: 'havale', label: 'Havale/EFT' },
                  { value: 'kredi_karti', label: 'Kredi Kartı' },
                ].map((method) => (
                  <label key={method.value} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="odeme_yontemi"
                      value={method.value}
                      checked={formData.odeme_yontemi === method.value}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-amber-600"
                    />
                    <span className="text-gray-700">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dekont/Makbuz Yükleme
              </label>
              {!fileName ? (
                <label className="flex items-center justify-center gap-3 w-full px-4 py-3 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
                  <Upload className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Dosya yüklemek için tıklayınız
                    </p>
                    <p className="text-xs text-gray-600">
                      JPG, PNG, PDF (Max 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-green-800">
                    {fileName}
                  </p>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Notlar */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notlar
              </label>
              <textarea
                name="notlar"
                value={formData.notlar}
                onChange={handleInputChange}
                rows={4}
                placeholder="Ödeme ile ilgili notlar..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Kaydet
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/payments')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentEntry;
