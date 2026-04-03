import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSupabase } from '../../lib/supabase';
import { ArrowLeft, Upload, Check } from 'lucide-react';

export default function PaymentEntry() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    odenen_tutar: '',
    odeme_tarihi: '',
    odeme_yontemi: 'nakit',
    notlar: '',
    dekont_file: null,
  });

  useEffect(() => {
    fetchPaymentDetails();
  }, [id]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();

      const { data, error: fetchError } = await supabase
        .from('payments')
        .select('*, customers:musteri_id(ad, soyad, eposta), contracts:sozlesme_id(sozlesme_no, toplam_tutar)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      setPayment(data);
      setFormData(prev => ({
        ...prev,
        odenen_tutar: data.odenen_tutar || '',
        odeme_tarihi: data.odeme_tarihi || new Date().toISOString().split('T')[0],
        odeme_yontemi: data.odeme_yontemi || 'nakit',
        notlar: data.notlar || '',
      }));

      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Ödeme detayları yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        dekont_file: file,
      }));
    }
  };

  const uploadReceipt = async (supabase, paymentId, file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${paymentId}_${Date.now()}.${fileExt}`;
      const filePath = `payment_receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment_receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('payment_receipts').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.error('Dekont yükleme hatası:', err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.odenen_tutar || !formData.odeme_tarihi || !formData.odeme_yontemi) {
      setError('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    try {
      setSaving(true);
      const supabase = getSupabase();

      let dekontUrl = payment.dekont_url;
      if (formData.dekont_file) {
        dekontUrl = await uploadReceipt(supabase, payment.id, formData.dekont_file);
      }

      const { error: updateError } = await supabase
        .from('payments')
        .update({
          odenen_tutar: parseFloat(formData.odenen_tutar),
          odeme_tarihi: formData.odeme_tarihi,
          odeme_yontemi: formData.odeme_yontemi,
          durum: 'odendi',
          notlar: formData.notlar,
          dekont_url: dekontUrl,
          recorded_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', payment.id);

      if (updateError) throw updateError;

      setError(null);
      setTimeout(() => {
        navigate('/payments');
      }, 1500);
    } catch (err) {
      setError(err.message);
      console.error('Ödeme kaydetme hatası:', err);
    } finally {
      setSaving(false);
    }
  };

  const getOdemeYontemiLabel = (yontem) => {
    switch (yontem) {
      case 'nakit':
        return 'Nakit';
      case 'havale':
        return 'Havale';
      case 'kredi_karti':
        return 'Kredi Kartı';
      default:
        return yontem;
    }
  };

  const getTurLabel = (tur) => {
    switch (tur) {
      case 'pesinat':
        return 'Peşinat';
      case 'taksit':
        return 'Taksit';
      case 'kalan':
        return 'Kalan';
      default:
        return tur;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Ödeme detayları yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Ödeme bulunamadı</p>
          <button
            onClick={() => navigate('/payments')}
            className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const remainingAmount = payment.tutar - (parseFloat(formData.odenen_tutar) || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/payments')}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Geri Dön
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Ödeme Kaydı</h1>
          <p className="text-gray-600">Ödeme işlemini tamamlayın ve kaydı güncelleyin</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            Hata: {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Ödeme Özeti</h2>

              <div className="space-y-4">
                {/* Customer Info */}
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                    Müşteri
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {payment.customers?.ad} {payment.customers?.soyad}
                  </p>
                </div>

                {/* Contract Info */}
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                    Sözleşme No
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {payment.contracts?.sozlesme_no}
                  </p>
                </div>

                {/* Payment Type */}
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                    Ödeme Türü
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {getTurLabel(payment.tur)}
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  {/* Total Amount */}
                  <div className="mb-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                      Toplam Tutar
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(payment.tutar)}
                    </p>
                  </div>

                  {/* Paid Amount */}
                  <div className="mb-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                      Ödenen Tutar
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(parseFloat(formData.odenen_tutar) || 0)}
                    </p>
                  </div>

                  {/* Remaining Amount */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                      Kalan Tutar
                    </p>
                    <p className={`text-lg font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(remainingAmount)}
                    </p>
                  </div>
                </div>

                {/* Due Date */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                    Vade
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(payment.vade)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Ödeme Bilgileri</h2>

              <div className="space-y-6">
                {/* Paid Amount Input */}
                <div>
                  <label htmlFor="odenen_tutar" className="block text-sm font-semibold text-gray-700 mb-2">
                    Ödenen Tutar *
                  </label>
                  <input
                    type="number"
                    id="odenen_tutar"
                    name="odenen_tutar"
                    step="0.01"
                    min="0"
                    value={formData.odenen_tutar}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    placeholder="0.00"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">TRY cinsinden tutar giriniz</p>
                </div>

                {/* Payment Date */}
                <div>
                  <label htmlFor="odeme_tarihi" className="block text-sm font-semibold text-gray-700 mb-2">
                    Ödeme Tarihi *
                  </label>
                  <input
                    type="date"
                    id="odeme_tarihi"
                    name="odeme_tarihi"
                    value={formData.odeme_tarihi}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    required
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label htmlFor="odeme_yontemi" className="block text-sm font-semibold text-gray-700 mb-2">
                    Ödeme Yöntemi *
                  </label>
                  <select
                    id="odeme_yontemi"
                    name="odeme_yontemi"
                    value={formData.odeme_yontemi}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    required
                  >
                    <option value="nakit">Nakit</option>
                    <option value="havale">Havale</option>
                    <option value="kredi_karti">Kredi Kartı</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notlar" className="block text-sm font-semibold text-gray-700 mb-2">
                    Notlar
                  </label>
                  <textarea
                    id="notlar"
                    name="notlar"
                    value={formData.notlar}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    placeholder="Ödeme hakkında herhangi bir not ekleyin..."
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label htmlFor="dekont_file" className="block text-sm font-semibold text-gray-700 mb-2">
                    Ödeme Dekontı (Makbuz)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="dekont_file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <label
                      htmlFor="dekont_file"
                      className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50 hover:bg-amber-100 cursor-pointer transition-colors"
                    >
                      <div className="text-center">
                        <Upload className="mx-auto mb-2 text-amber-600" size={24} />
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {formData.dekont_file ? formData.dekont_file.name : 'Dosya yüklemek için tıklayın veya sürükleyin'}
                        </p>
                        <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 10MB)</p>
                      </div>
                    </label>
                  </div>
                  {payment.dekont_url && !formData.dekont_file && (
                    <p className="mt-2 text-xs text-green-600 font-medium">
                      ✓ Dekont zaten yüklü
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Check size={20} />
                        Ödemeyi Kaydet
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/payments')}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
