import React, { useState, useEffect } from 'react';
import {
  Loader2,
  AlertCircle,
  Send,
  Upload,
  X,
  CheckCircle,
  Clock,
  XCircle,
  FileUp,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '../../lib/supabase';

const CustomerPaymentNotification = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [pendingPayments, setPendingPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [formData, setFormData] = useState({
    odeme_id: '',
    odeme_tutari: '',
    odeme_tarihi: new Date().toISOString().split('T')[0],
    dekont: null,
    aciklama: '',
  });

  const [fileName, setFileName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = getSupabase();

      if (!supabase) {
        // Placeholder data
        setPendingPayments([
          {
            id: 1,
            contract_number: 'SK-001-2024',
            payment_type: 'peşinat',
            amount: 50000,
            due_date: '2024-01-15',
            status: 'pending',
          },
          {
            id: 2,
            contract_number: 'SK-001-2024',
            payment_type: 'taksit',
            amount: 30000,
            due_date: '2024-02-15',
            status: 'pending',
          },
        ]);

        setNotifications([
          {
            id: 1,
            baslik: 'Ödeme Bildirimi Gönderildi',
            tutar: 50000,
            tarih: '2024-01-10',
            durum: 'onaylandi',
          },
          {
            id: 2,
            baslik: 'Ödeme Bildirimi Gönderildi',
            tutar: 25000,
            tarih: '2023-12-20',
            durum: 'reddedildi',
          },
        ]);

        return;
      }

      // Get current user's customer ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      // Fetch customer by user email
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!customerData) {
        throw new Error('Müşteri profili bulunamadı');
      }

      // Fetch pending payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select(
          `
          id,
          payment_type,
          amount,
          paid_amount,
          due_date,
          status,
          contracts(contract_number)
        `
        )
        .eq('customer_id', customerData.id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true });

      if (paymentsData) {
        const formattedPayments = paymentsData.map((p) => ({
          id: p.id,
          contract_number: p.contracts?.contract_number || 'N/A',
          payment_type: p.payment_type,
          amount: p.amount,
          paid_amount: p.paid_amount || 0,
          due_date: p.due_date,
          status: p.status,
        }));
        setPendingPayments(formattedPayments);
      }

      // Fetch payment notifications
      const { data: notificationsData } = await supabase
        .from('payment_notifications')
        .select('*')
        .eq('customer_id', customerData.id)
        .order('created_at', { ascending: false });

      if (notificationsData) {
        setNotifications(notificationsData);
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

    // Auto-fill amount when payment selected
    if (name === 'odeme_id') {
      const selectedPayment = pendingPayments.find(
        (p) => p.id.toString() === value
      );
      if (selectedPayment) {
        setFormData((prev) => ({
          ...prev,
          odeme_tutari:
            selectedPayment.amount - (selectedPayment.paid_amount || 0),
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
    setSending(true);
    setError('');
    setSuccessMessage('');

    try {
      if (!formData.odeme_id || !formData.odeme_tutari) {
        setError('Lütfen ödeme seçiniz ve tutarı giriniz');
        setSending(false);
        return;
      }

      const supabase = getSupabase();

      if (!supabase) {
        // Show success for demo
        setSuccessMessage(
          'Ödeme bildirimi başarıyla gönderildi! İnceleme için bekleyiniz.'
        );
        setTimeout(() => {
          loadData();
          setFormData({
            odeme_id: '',
            odeme_tutari: '',
            odeme_tarihi: new Date().toISOString().split('T')[0],
            dekont: null,
            aciklama: '',
          });
          setFileName('');
        }, 2000);
        setSending(false);
        return;
      }

      // Get customer ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, first_name, last_name')
        .eq('email', user.email)
        .single();

      if (!customerData) {
        throw new Error('Müşteri profili bulunamadı');
      }

      // Get payment info
      const selectedPayment = pendingPayments.find(
        (p) => p.id.toString() === formData.odeme_id
      );

      // Upload file if provided
      let dekont_url = null;
      if (formData.dekont) {
        const fileName = `dekont_customer_${formData.odeme_id}_${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment_receipts')
          .upload(fileName, formData.dekont);

        if (uploadError) {
          console.warn('File upload warning:', uploadError);
        } else if (uploadData) {
          dekont_url = uploadData.path;
        }
      }

      // Create payment notification
      const { error: notifError } = await supabase
        .from('payment_notifications')
        .insert({
          customer_id: customerData.id,
          payment_id: formData.odeme_id,
          amount: parseFloat(formData.odeme_tutari),
          paid_date: formData.odeme_tarihi,
          receipt_url: dekont_url,
          notes: formData.aciklama,
          status: 'pending',
          created_at: new Date().toISOString(),
        });

      if (notifError) {
        throw notifError;
      }

      // Create notification for admin
      await supabase.from('notifications').insert({
        customer_id: null,
        tur: 'odeme_bildirimi',
        baslik: 'Yeni Ödeme Bildirimi',
        mesaj: `${customerData.first_name} ${customerData.last_name} tarafından ${formData.odeme_tutari} TL ödeme bildirimi gönderilmiştir.`,
        veri: {
          payment_id: formData.odeme_id,
          notification_id: null,
        },
        okundu: false,
        created_at: new Date().toISOString(),
      });

      setSuccessMessage(
        'Ödeme bildirimi başarıyla gönderildi! İnceleme için bekleyiniz.'
      );

      // Reset form and reload data
      setTimeout(() => {
        loadData();
        setFormData({
          odeme_id: '',
          odeme_tutari: '',
          odeme_tarihi: new Date().toISOString().split('T')[0],
          dekont: null,
          aciklama: '',
        });
        setFileName('');
      }, 2000);
    } catch (err) {
      setError(
        err.message || 'Ödeme bildirimi gönderilirken hata oluştu'
      );
      console.error('Submit error:', err);
    } finally {
      setSending(false);
    }
  };

  const getSelectedPaymentInfo = () => {
    if (!formData.odeme_id) return null;
    return pendingPayments.find((p) => p.id.toString() === formData.odeme_id);
  };

  const selectedPayment = getSelectedPaymentInfo();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'onaylandi':
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircle className="w-4 h-4" />
            Onaylandı
          </span>
        );
      case 'reddedildi':
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <XCircle className="w-4 h-4" />
            Reddedildi
          </span>
        );
      case 'bekliyor':
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            <Clock className="w-4 h-4" />
            Bekliyor
          </span>
        );
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Ödeme Bildirimi
            </h1>
            <p className="text-gray-600 mt-1">
              Para gönderdim bildirimini buradan yapınız
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
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 font-semibold">{successMessage}</p>
          </div>
        )}

        {/* Pending Payments Summary */}
        {pendingPayments.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Beklenen Ödemeler
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-amber-400 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {payment.contract_number}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">
                        {payment.payment_type === 'pesin'
                          ? 'Peşinat'
                          : payment.payment_type === 'taksit'
                          ? 'Taksit'
                          : 'Kalan'}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-amber-600">
                      {formatCurrency(
                        payment.amount - (payment.paid_amount || 0)
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">
                    Vade: {formatDate(payment.due_date)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingPayments.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <p className="text-blue-800 font-semibold">
              Şu anda ödenmesi gereken ödemeler bulunmamaktadır.
            </p>
          </div>
        )}

        {/* Payment Notification Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Ödeme Bildirimi Gönder
          </h2>

          <div className="space-y-6">
            {/* Hangi Ödeme */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hangi Ödeme? *
              </label>
              <select
                name="odeme_id"
                value={formData.odeme_id}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="">Ödeme Seçiniz</option>
                {pendingPayments.map((payment) => (
                  <option key={payment.id} value={payment.id}>
                    {payment.contract_number} - {payment.payment_type} -{' '}
                    {formatCurrency(
                      payment.amount - (payment.paid_amount || 0)
                    )}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Info */}
            {selectedPayment && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Toplam Tutar:</span>{' '}
                  {formatCurrency(selectedPayment.tutar)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Ödenen Tutar:</span>{' '}
                  {formatCurrency(selectedPayment.odenen_tutar || 0)}
                </p>
                <p className="text-sm text-gray-900 font-semibold">
                  <span>Kalan Tutar:</span>{' '}
                  {formatCurrency(
                    selectedPayment.tutar - (selectedPayment.odenen_tutar || 0)
                  )}
                </p>
              </div>
            )}

            {/* Ödeme Tutarı */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ödeme Tutarı (TL) *
              </label>
              <input
                type="number"
                name="odeme_tutari"
                value={formData.odeme_tutari}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
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

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dekont/Makbuz Fotoğrafı
              </label>
              {!fileName ? (
                <label className="flex items-center justify-center gap-3 w-full px-4 py-3 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
                  <FileUp className="w-5 h-5 text-amber-600" />
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

            {/* Açıklama */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                name="aciklama"
                value={formData.aciklama}
                onChange={handleInputChange}
                rows={3}
                placeholder="Ödeme ile ilgili açıklama ekleyebilirsiniz..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={sending || pendingPayments.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Bildirimi Gönder
                </>
              )}
            </button>
          </div>
        </form>

        {/* Past Notifications */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Geçmiş Bildirimler
            </h2>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-amber-400 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {notification.baslik}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(notification.created_at || notification.tarih)} -{' '}
                      {formatCurrency(notification.odeme_tutari || notification.tutar)}
                    </p>
                  </div>
                  {getStatusBadge(notification.durum)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPaymentNotification;
