import React, { useState, useEffect } from 'react';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Pause,
  MapPin,
  MessageSquare,
  Send,
  ArrowLeft,
  Camera,
  Maximize2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '../../lib/supabase';

const stepsConfig = {
  tasarım: { label: 'Tasarım Onayı', icon: '✏️', order: 1 },
  malzeme: { label: 'Malzeme Tedariki', icon: '📦', order: 2 },
  kesme: { label: 'Kesme İşlemleri', icon: '✂️', order: 3 },
  montaj: { label: 'Montaj', icon: '🔧', order: 4 },
  boyama: { label: 'Boyama', icon: '🎨', order: 5 },
  bitirme: { label: 'Bitirme İşlemleri', icon: '✨', order: 6 },
  sevkiyat: { label: 'Sevkiyat', icon: '🚚', order: 7 },
};

const CustomerStatus = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const [order, setOrder] = useState(null);
  const [steps, setSteps] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [workPhotos, setWorkPhotos] = useState([]);

  useEffect(() => {
    loadStatusData();
  }, []);

  const loadStatusData = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = getSupabase();

      if (!supabase) {
        // Placeholder data
        setOrder({
          id: 1,
          sozlesme_no: 'SK-001-2024',
          musteri_id: 1,
          tasarim_id: 1,
          durum: 'montaj',
          tahmini_teslim_tarihi: '2024-06-15',
          ilerleme: 65,
        });

        setSteps([
          {
            id: 1,
            ad: 'tasarım',
            durum: 'tamamlandı',
            tamamlama_tarihi: '2024-01-20',
            isci: 'Ali Bey',
          },
          {
            id: 2,
            ad: 'malzeme',
            durum: 'tamamlandı',
            tamamlama_tarihi: '2024-02-10',
            isci: 'Veli Bey',
          },
          {
            id: 3,
            ad: 'kesme',
            durum: 'tamamlandı',
            tamamlama_tarihi: '2024-02-28',
            isci: 'Mehmet Bey',
          },
          {
            id: 4,
            ad: 'montaj',
            durum: 'devam_ediyor',
            tamamlama_tarihi: null,
            isci: 'Ali Bey',
          },
          {
            id: 5,
            ad: 'boyama',
            durum: 'bekliyor',
            tamamlama_tarihi: null,
            isci: null,
          },
          {
            id: 6,
            ad: 'bitirme',
            durum: 'bekliyor',
            tamamlama_tarihi: null,
            isci: null,
          },
          {
            id: 7,
            ad: 'sevkiyat',
            durum: 'bekliyor',
            tamamlama_tarihi: null,
            isci: null,
          },
        ]);

        setMessages([
          {
            id: 1,
            gonderen: 'Ali Bey',
            rol: 'işçi',
            mesaj: 'Merhaba! Montaj işlemleri başarıyla başladı. İlk aşama tamamlandı.',
            tarih: '2024-03-10T10:30:00',
          },
          {
            id: 2,
            gonderen: 'Sistem',
            rol: 'sistem',
            mesaj: 'Kesme işlemleri tamamlanmıştır.',
            tarih: '2024-02-28T16:45:00',
          },
        ]);

        setWorkPhotos([
          {
            id: 1,
            baslik: 'Kesme İşlemleri',
            adim: 'kesme',
            resim_url: 'https://via.placeholder.com/400x300?text=Kesme+Işlemleri',
            tarih: '2024-02-28',
          },
          {
            id: 2,
            baslik: 'Montaj Başlangıcı',
            adim: 'montaj',
            resim_url: 'https://via.placeholder.com/400x300?text=Montaj+Baslangici',
            tarih: '2024-03-05',
          },
          {
            id: 3,
            baslik: 'Montaj Devam Ediyor',
            adim: 'montaj',
            resim_url: 'https://via.placeholder.com/400x300?text=Montaj+Devam',
            tarih: '2024-03-10',
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

      // Fetch customer
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('eposta', user.email)
        .single();

      if (!customerData) {
        throw new Error('Müşteri profili bulunamadı');
      }

      // Fetch order
      const { data: orderData } = await supabase
        .from('production_orders')
        .select('*')
        .eq('musteri_id', customerData.id)
        .eq('durum', 'uretimde')
        .single();

      if (orderData) {
        setOrder(orderData);

        // Fetch steps
        const { data: stepsData } = await supabase
          .from('production_steps')
          .select('*')
          .eq('siparis_id', orderData.id)
          .order('sira', { ascending: true });

        if (stepsData) {
          setSteps(stepsData);
        }

        // Fetch work photos
        const { data: photosData } = await supabase
          .from('work_photos')
          .select('*')
          .eq('siparis_id', orderData.id)
          .order('created_at', { ascending: false });

        if (photosData) {
          setWorkPhotos(photosData);
        }
      }

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('order_messages')
        .select('*')
        .eq('siparis_id', orderData?.id)
        .order('created_at', { ascending: true });

      if (messagesData) {
        setMessages(messagesData);
      }
    } catch (err) {
      setError(err.message || 'Veriler yüklenirken hata oluştu');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !order) return;

    setSending(true);

    try {
      const supabase = getSupabase();

      if (!supabase) {
        // Demo mode
        const newMsg = {
          id: messages.length + 1,
          gonderen: 'Siz',
          rol: 'musteri',
          mesaj: newMessage,
          tarih: new Date().toISOString(),
        };
        setMessages([...messages, newMsg]);
        setNewMessage('');
        setSending(false);
        return;
      }

      // Get customer name
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: customerData } = await supabase
        .from('customers')
        .select('ad, soyad')
        .eq('eposta', user.email)
        .single();

      const { error: msgError } = await supabase
        .from('order_messages')
        .insert({
          siparis_id: order.id,
          gonderen: `${customerData?.ad} ${customerData?.soyad}`,
          rol: 'musteri',
          mesaj: newMessage,
          created_at: new Date().toISOString(),
        });

      if (msgError) {
        throw msgError;
      }

      setNewMessage('');
      await loadStatusData();
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  const getStepStatus = (durum) => {
    if (durum === 'tamamlandı') {
      return { label: 'Tamamlandı', color: 'green', icon: '✓' };
    } else if (durum === 'devam_ediyor') {
      return { label: 'Devam Ediyor', color: 'blue', icon: '⟳' };
    } else {
      return { label: 'Bekliyor', color: 'gray', icon: '○' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  const daysUntilDelivery = order
    ? Math.ceil(
        (new Date(order.tahmini_teslim_tarihi) - new Date()) /
          (1000 * 60 * 60 * 24)
      )
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
              Üretim Durumum
            </h1>
            <p className="text-gray-600 mt-1">
              Siparişinizin üretim aşamalarını takip edin
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

        {!order ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="text-blue-800 font-semibold">
              Şu anda üretimde olan sipariş bulunmamaktadır
            </p>
          </div>
        ) : (
          <>
            {/* Current Status Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {order.sozlesme_no}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Durum:{' '}
                    <span className="font-semibold capitalize text-amber-600">
                      {order.durum === 'tasarimda'
                        ? 'Tasarımda'
                        : order.durum === 'uretimde'
                        ? 'Üretimde'
                        : 'Teslimde'}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Tahmini Teslim</p>
                  <p className="text-lg font-bold text-amber-600">
                    {formatDate(order.tahmini_teslim_tarihi)}
                  </p>
                  {daysUntilDelivery > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {daysUntilDelivery} gün kaldı
                    </p>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-gray-700">
                    İlerleme
                  </p>
                  <p className="text-lg font-bold text-amber-600">
                    %{order.ilerleme}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${order.ilerleme}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Üretim Aşamaları
              </h2>
              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const stepConfig = stepsConfig[step.ad];
                  const statusInfo = getStepStatus(step.durum);
                  const isCompleted = step.durum === 'tamamlandı';
                  const isActive = step.durum === 'devam_ediyor';

                  return (
                    <div key={step.id}>
                      <div
                        className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                          isActive
                            ? 'border-amber-500 bg-amber-50'
                            : isCompleted
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                            isCompleted
                              ? 'bg-green-200 text-green-700'
                              : isActive
                              ? 'bg-amber-200 text-amber-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {statusInfo.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {stepConfig?.label}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                isCompleted
                                  ? 'bg-green-100 text-green-700'
                                  : isActive
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          {step.isci && (
                            <p className="text-sm text-gray-600 mt-1">
                              Sorumlu: <span className="font-semibold">{step.isci}</span>
                            </p>
                          )}
                          {step.tamamlama_tarihi && (
                            <p className="text-sm text-gray-600 mt-1">
                              Tamamlama: {formatDate(step.tamamlama_tarihi)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Divider */}
                      {idx < steps.length - 1 && (
                        <div className="flex justify-center py-2">
                          <div className="w-0.5 h-6 bg-gray-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Work Photos */}
            {workPhotos.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Camera className="w-6 h-6" />
                  Çalışma Fotoğrafları
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {workPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="border border-gray-200 rounded-lg overflow-hidden group hover:shadow-lg transition-shadow"
                    >
                      <div className="relative bg-gray-100 aspect-[4/3]">
                        <img
                          src={photo.resim_url || photo.dosya_url}
                          alt={photo.baslik}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setSelectedImage(photo)}
                          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all"
                        >
                          <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {photo.baslik}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatDate(photo.tarih || photo.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                İletişim
              </h2>

              {/* Messages List */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">
                    Henüz mesaj bulunmamaktadır
                  </p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white text-xs ${
                          message.rol === 'musteri'
                            ? 'bg-blue-500'
                            : message.rol === 'işçi'
                            ? 'bg-amber-500'
                            : 'bg-gray-500'
                        }`}
                      >
                        {message.gonderen
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {message.gonderen}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(message.tarih || message.created_at).toLocaleString('tr-TR')}
                          </p>
                        </div>
                        <p className="text-gray-700 mt-1">{message.mesaj}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Form */}
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mesaj yazınız..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-2xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
            <img
              src={selectedImage.resim_url || selectedImage.dosya_url}
              alt={selectedImage.baslik}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
              <p className="font-semibold">{selectedImage.baslik}</p>
              <p className="text-sm">{formatDate(selectedImage.tarih || selectedImage.created_at)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerStatus;
