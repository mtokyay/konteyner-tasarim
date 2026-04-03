import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Edit2,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  Package,
  Truck,
  Ban,
} from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

const statusColors = {
  taslak: { bg: 'bg-gray-100', text: 'text-gray-800', badge: 'bg-gray-200', icon: AlertCircle },
  teklif: { bg: 'bg-blue-100', text: 'text-blue-800', badge: 'bg-blue-200', icon: Clock },
  onaylandi: { bg: 'bg-amber-100', text: 'text-amber-800', badge: 'bg-amber-200', icon: CheckCircle },
  uretimde: { bg: 'bg-orange-100', text: 'text-orange-800', badge: 'bg-orange-200', icon: Zap },
  tamamlandi: { bg: 'bg-green-100', text: 'text-green-800', badge: 'bg-green-200', icon: Package },
  teslim_edildi: { bg: 'bg-emerald-100', text: 'text-emerald-800', badge: 'bg-emerald-200', icon: Truck },
  iptal: { bg: 'bg-red-100', text: 'text-red-800', badge: 'bg-red-200', icon: Ban },
};

const statusLabels = {
  taslak: 'Taslak',
  teklif: 'Teklif',
  onaylandi: 'Onaylandı',
  uretimde: 'Üretimde',
  tamamlandi: 'Tamamlandı',
  teslim_edildi: 'Teslim Edildi',
  iptal: 'İptal',
};

const statusTransitions = {
  taslak: ['teklif', 'iptal'],
  teklif: ['onaylandi', 'iptal'],
  onaylandi: ['uretimde', 'iptal'],
  uretimde: ['tamamlandi', 'iptal'],
  tamamlandi: ['teslim_edildi'],
  teslim_edildi: [],
  iptal: ['taslak'],
};

const placeholderDesign = {
  id: '1',
  title: 'Modern Ev Tasarımı',
  design_data: {
    ref_no: 'TH-001',
    description: 'Şehir tipi kompakt ev tasarımı',
    width: 5.0,
    height: 3.5,
    length: 10.0,
    area: 50.0,
    features: ['kat', 'isitma', 'elektrik'],
  },
  total_price: 45000,
  discount: 3000,
  final_price: 42000,
  delivery_date: '2026-05-15',
  notes: 'Müşteri özel istek ile tasarlandı',
  status: 'onaylandi',
  customer_id: '1',
  created_at: '2026-04-01',
};

const placeholderCustomer = {
  id: '1',
  first_name: 'Ahmet',
  last_name: 'Yılmaz',
  phone: '0532 123 45 67',
  email: 'ahmet@example.com',
};

export default function DesignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [design, setDesign] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const [editData, setEditData] = useState({
    total_price: '',
    discount: '',
    notes: '',
    delivery_date: '',
  });

  useEffect(() => {
    fetchDesign();
    if (successMessage) {
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  }, [id]);

  const fetchDesign = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();

      if (!supabase) {
        setDesign(placeholderDesign);
        setCustomer(placeholderCustomer);
        setEditData({
          total_price: placeholderDesign.total_price,
          discount: placeholderDesign.discount,
          notes: placeholderDesign.notes,
          delivery_date: placeholderDesign.delivery_date,
        });
        setLoading(false);
        return;
      }

      const { data: designData, error: designError } = await supabase
        .from('designs')
        .select('*')
        .eq('id', id)
        .single();

      if (designError) throw designError;

      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, first_name, last_name, phone, email')
        .eq('id', designData.customer_id)
        .single();

      if (customerError && customerError.code !== 'PGRST116') throw customerError;

      setDesign(designData);
      setCustomer(customerData || null);
      setEditData({
        total_price: designData.total_price,
        discount: designData.discount,
        notes: designData.notes,
        delivery_date: designData.delivery_date,
      });
    } catch (err) {
      console.error('Error fetching design:', err);
      setError('Tasarım yüklenemedi');
      setDesign(placeholderDesign);
      setCustomer(placeholderCustomer);
    } finally {
      setLoading(false);
    }
  };

  const calculateNetPrice = () => {
    const toplam = parseFloat(editData.total_price) || 0;
    const indirim = parseFloat(editData.discount) || 0;
    return Math.max(0, toplam - indirim).toFixed(2);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const supabase = getSupabase();

      if (!supabase) {
        setDesign({ ...design, status: newStatus });
        setShowStatusModal(false);
        setSelectedStatus(null);
        return;
      }

      const { error: updateError } = await supabase
        .from('designs')
        .update({ status: newStatus })
        .eq('id', id);

      if (updateError) throw updateError;

      setDesign({ ...design, status: newStatus });
      setShowStatusModal(false);
      setSelectedStatus(null);
      setSuccessMessage('Durum başarıyla güncellendi');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Durum güncellenemedi');
    }
  };

  const handleSaveChanges = async () => {
    try {
      const netPrice = parseFloat(calculateNetPrice());
      const supabase = getSupabase();

      const updateData = {
        total_price: parseFloat(editData.total_price) || 0,
        discount: parseFloat(editData.discount) || 0,
        final_price: netPrice,
        notes: editData.notes,
        delivery_date: editData.delivery_date || null,
      };

      if (!supabase) {
        setDesign({ ...design, ...updateData });
        setIsEditing(false);
        setSuccessMessage('Değişiklikler kaydedildi');
        setTimeout(() => setSuccessMessage(''), 3000);
        return;
      }

      const { error: updateError } = await supabase
        .from('designs')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      setDesign({ ...design, ...updateData });
      setIsEditing(false);
      setSuccessMessage('Değişiklikler kaydedildi');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving changes:', err);
      setError('Değişiklikler kaydedilemedi');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
          <p className="text-gray-600 text-lg">Tasarım yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/designs')}
            className="flex items-center gap-2 text-amber-600 hover:text-amber-800 mb-6 font-semibold transition-colors"
          >
            <ArrowLeft size={20} />
            Geri
          </button>
          <div className="bg-red-100 border border-red-400 text-red-800 px-6 py-4 rounded-lg">
            {error || 'Tasarım yüklenemedi'}
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = statusColors[design.status]?.icon || AlertCircle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/designs')}
            className="flex items-center gap-2 text-amber-600 hover:text-amber-800 font-semibold transition-colors"
          >
            <ArrowLeft size={20} />
            Geri
          </button>
          <div className="flex items-center gap-3">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold transition-all"
              >
                <Edit2 size={18} />
                Düzenle
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      total_price: design.total_price,
                      discount: design.discount,
                      notes: design.notes,
                      delivery_date: design.delivery_date,
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                >
                  <X size={18} />
                  İptal
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 font-semibold transition-all"
                >
                  <Save size={18} />
                  Kaydet
                </button>
              </>
            )}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Design Info */}
          <div className="lg:col-span-2">
            {/* Design Header Card */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-sm font-semibold text-gray-500 mb-1">Ref No</div>
                  <div className="text-3xl font-bold text-amber-700 mb-4">{design.design_data?.ref_no || '-'}</div>
                  <h1 className="text-4xl font-bold text-gray-900">{design.title}</h1>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusColors[design.status]?.badge}`}>
                    <StatusIcon size={18} />
                    <span className="font-semibold">{statusLabels[design.status]}</span>
                  </div>
                </div>
              </div>

              {design.aciklama && (
                <p className="text-gray-600 text-lg">{design.aciklama}</p>
              )}
            </div>

            {/* Dimensions Card */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Boyutlar</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-sm text-gray-600 mb-2">Genişlik</div>
                  <div className="text-2xl font-bold text-orange-700">{design.genislik || '-'} m</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-sm text-gray-600 mb-2">Yükseklik</div>
                  <div className="text-2xl font-bold text-orange-700">{design.yukseklik || '-'} m</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-sm text-gray-600 mb-2">Uzunluk</div>
                  <div className="text-2xl font-bold text-orange-700">{design.uzunluk || '-'} m</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-sm text-gray-600 mb-2">Alan</div>
                  <div className="text-2xl font-bold text-amber-700">{design.alan || '-'} m²</div>
                </div>
              </div>
            </div>

            {/* Features Card */}
            {design.ozellikler && design.ozellikler.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Özellikler</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {design.ozellikler.map(feature => (
                    <div key={feature} className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-semibold text-sm">
                      {feature === 'kat' && 'Çatı Sistemi'}
                      {feature === 'isitma' && 'Isıtma Sistemi'}
                      {feature === 'sogucut' && 'Soğutma Sistemi'}
                      {feature === 'su' && 'Su Sistemi'}
                      {feature === 'elektrik' && 'Elektrik Sistemi'}
                      {feature === 'esya' && 'Eşya Dahil'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Card */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Fiyatlandırma</h2>
              {!isEditing ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-700">Toplam Fiyat:</span>
                    <span className="text-xl font-bold text-gray-900">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      }).format(design.total_price)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-700">İndirim:</span>
                    <span className="text-xl font-bold text-red-600">
                      -{new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      }).format(design.discount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 bg-amber-50 px-4 py-3 rounded-lg border border-amber-200">
                    <span className="font-bold text-gray-900">Net Fiyat:</span>
                    <span className="text-2xl font-bold text-amber-700">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      }).format(design.final_price)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Toplam Fiyat (₺)</label>
                    <input
                      type="number"
                      value={editData.total_price}
                      onChange={(e) => setEditData({ ...editData, total_price: e.target.value })}
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">İndirim (₺)</label>
                    <input
                      type="number"
                      value={editData.discount}
                      onChange={(e) => setEditData({ ...editData, discount: e.target.value })}
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Net Fiyat (₺)</label>
                    <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="text-lg font-bold text-amber-700">{calculateNetPrice()}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes Card */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Notlar</h2>
              {!isEditing ? (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {design.notes || 'Nota eklenmemiş'}
                </p>
              ) : (
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              )}
            </div>
          </div>

          {/* Right Column - Customer & Delivery Info */}
          <div>
            {/* Customer Card */}
            {customer && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Müşteri Bilgileri</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Ad Soyad</div>
                    <div className="font-semibold text-gray-900">{customer.first_name} {customer.last_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Telefon</div>
                    <a href={`tel:${customer.phone}`} className="font-semibold text-amber-600 hover:text-amber-800">
                      {customer.phone}
                    </a>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">E-posta</div>
                    <a href={`mailto:${customer.email}`} className="font-semibold text-amber-600 hover:text-amber-800 break-all">
                      {customer.email}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Info Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Teslim Bilgileri</h3>
              {!isEditing ? (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Teslim Tarihi</div>
                  <div className="text-xl font-bold text-gray-900">
                    {design.delivery_date
                      ? new Date(design.delivery_date).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                      : 'Belirlenmemiş'}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Teslim Tarihi</label>
                  <input
                    type="date"
                    value={editData.delivery_date}
                    onChange={(e) => setEditData({ ...editData, delivery_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Status Control Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Durum Değiştir</h3>
              <button
                onClick={() => setShowStatusModal(true)}
                className={`w-full px-4 py-3 rounded-lg font-semibold text-white transition-all ${statusColors[design.status]?.text} ${statusColors[design.status]?.bg} hover:opacity-80`}
              >
                Mevcut: {statusLabels[design.status]}
              </button>

              {showStatusModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Yeni Durum Seçin</h3>
                    <div className="space-y-2 mb-6">
                      {statusTransitions[design.status].map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${statusColors[status]?.badge}`}
                        >
                          {statusLabels[status]}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowStatusModal(false)}
                      className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
