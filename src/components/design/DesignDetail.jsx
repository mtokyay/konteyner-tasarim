import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Download,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader,
} from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import DesignEditor from './DesignEditor';

const DesignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [design, setDesign] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    status: 'taslak',
    price: 0,
    discount: 0,
    net_price: 0,
    delivery_date: '',
    notes: '',
  });

  const [editablePrices, setEditablePrices] = useState({
    price: 0,
    discount: 0,
    net_price: 0,
  });

  // Placeholder design
  const placeholderDesign = {
    id: 1,
    ref_no: 'TK-2024-001',
    customer_id: 1,
    design_data: { width: 400, height: 300, items: [] },
    status: 'taslak',
    price: 5000,
    discount: 0,
    net_price: 5000,
    delivery_date: '2024-05-01',
    notes: '',
    created_at: '2024-04-01',
    updated_at: '2024-04-01',
  };

  const placeholderCustomer = {
    id: 1,
    first_name: 'Ahmet',
    last_name: 'Yılmaz',
    phone: '0312 555 0001',
    source: 'Web',
  };

  useEffect(() => {
    const fetchDesign = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabase();

        if (!supabase) {
          // Use placeholder data
          console.warn('Supabase not configured, using placeholder data');
          setDesign(placeholderDesign);
          setCustomer(placeholderCustomer);
          setFormData({
            status: placeholderDesign.status,
            price: placeholderDesign.price,
            discount: placeholderDesign.discount,
            net_price: placeholderDesign.net_price,
            delivery_date: placeholderDesign.delivery_date,
            notes: placeholderDesign.notes || '',
          });
          setEditablePrices({
            price: placeholderDesign.price,
            discount: placeholderDesign.discount,
            net_price: placeholderDesign.net_price,
          });
          setLoading(false);
          return;
        }

        // Fetch design with customer info
        const { data: designData, error: designError } = await supabase
          .from('designs')
          .select(
            `
            id,
            ref_no,
            customer_id,
            design_data,
            status,
            price,
            discount,
            net_price,
            delivery_date,
            notes,
            created_at,
            updated_at,
            customers (
              id,
              first_name,
              last_name,
              phone,
              source
            )
          `
          )
          .eq('id', id)
          .single();

        if (designError) {
          throw designError;
        }

        setDesign(designData);
        if (designData.customers) {
          setCustomer(designData.customers);
        }

        setFormData({
          status: designData.status,
          price: designData.price || 0,
          discount: designData.discount || 0,
          net_price: designData.net_price || 0,
          delivery_date: designData.delivery_date || '',
          notes: designData.notes || '',
        });

        setEditablePrices({
          price: designData.price || 0,
          discount: designData.discount || 0,
          net_price: designData.net_price || 0,
        });
      } catch (err) {
        console.error('Error fetching design:', err);
        setError('Tasarım yüklenirken hata oluştu: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDesign();
    }
  }, [id]);

  // Auto-calculate net price
  useEffect(() => {
    const calculated = editablePrices.price - editablePrices.discount;
    setEditablePrices((prev) => ({
      ...prev,
      net_price: Math.max(0, calculated),
    }));
  }, [editablePrices.price, editablePrices.discount]);

  const handleSavePrices = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const supabase = getSupabase();

      if (!supabase) {
        // Mock save
        setFormData(editablePrices);
        setIsSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('designs')
        .update({
          price: editablePrices.price,
          discount: editablePrices.discount,
          net_price: editablePrices.net_price,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      setFormData((prev) => ({
        ...prev,
        price: editablePrices.price,
        discount: editablePrices.discount,
        net_price: editablePrices.net_price,
      }));
    } catch (err) {
      console.error('Error updating prices:', err);
      setError('Fiyat güncelleme başarısız: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setIsSaving(true);
    setError(null);

    try {
      const supabase = getSupabase();

      if (!supabase) {
        setFormData((prev) => ({ ...prev, status: newStatus }));
        setIsSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('designs')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      setFormData((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Durum güncelleme başarısız: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'taslak':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <Clock size={16} />
            Taslak
          </span>
        );
      case 'teklif':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle size={16} />
            Teklif
          </span>
        );
      case 'onaylı':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle size={16} />
            Onaylı
          </span>
        );
      default:
        return <span className="text-sm text-gray-500">Bilinmiyor</span>;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  const extractDimensions = () => {
    try {
      if (!design || !design.design_data) return 'N/A';
      const data =
        typeof design.design_data === 'string'
          ? JSON.parse(design.design_data)
          : design.design_data;
      return `${data.width || 0}x${data.height || 0}`;
    } catch {
      return 'N/A';
    }
  };

  const handleBackFromEditor = () => {
    setIsEditing(false);
    // Refresh design data
    window.location.reload();
  };

  if (isEditing && design) {
    return (
      <div className="h-screen flex flex-col">
        <DesignEditor
          customerId={design.customer_id}
          customerName={
            customer
              ? `${customer.first_name} ${customer.last_name}`
              : 'Bilinmiyor'
          }
          designId={design.id}
          initialData={design.design_data}
          onCancel={handleBackFromEditor}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-amber-700 mx-auto mb-4" size={32} />
          <p className="text-gray-700">Tasarım yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/designs')}
            className="flex items-center gap-2 text-amber-700 hover:text-amber-800 mb-6"
          >
            <ArrowLeft size={20} />
            Geri Dön
          </button>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-red-700 font-medium mb-4">
              {error || 'Tasarım bulunamadı'}
            </p>
            <button
              onClick={() => navigate('/designs')}
              className="text-amber-700 hover:text-amber-800"
            >
              Tasarımlar listesine dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/designs')}
          className="flex items-center gap-2 text-amber-700 hover:text-amber-800 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Geri Dön
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Ref No</p>
              <h1 className="text-3xl font-bold text-gray-900">
                {design.ref_no}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div>{getStatusBadge(formData.status)}</div>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors"
              >
                <Edit size={20} />
                Düzenle
              </button>
            </div>
          </div>

          {/* Customer Info */}
          {customer && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Müşteri</p>
                <p className="text-lg font-semibold text-gray-900">
                  {customer.first_name} {customer.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Telefon</p>
                <p className="text-lg font-semibold text-gray-900">
                  {customer.phone}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Design Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Tasarım Özeti
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Boyutlar</p>
                <p className="text-lg font-semibold text-gray-900">
                  {extractDimensions()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(design.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Güncelleme Tarihi</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(design.updated_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
          </div>

          {/* Status Change Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Durum Değiştir
            </h2>
            <div className="space-y-2">
              {['taslak', 'teklif', 'onaylı'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isSaving}
                  className={`w-full p-3 rounded-lg border-2 transition-all font-medium ${
                    formData.status === status
                      ? 'border-amber-700 bg-amber-50 text-amber-900'
                      : 'border-gray-200 text-gray-700 hover:border-amber-700'
                  } disabled:opacity-50`}
                >
                  {status === 'taslak' && 'Taslak'}
                  {status === 'teklif' && 'Teklif'}
                  {status === 'onaylı' && 'Onaylı'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Fiyatlandırma
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Toplam Fiyat
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={editablePrices.price}
                  onChange={(e) =>
                    setEditablePrices({
                      ...editablePrices,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatPrice(editablePrices.price)}
              </p>
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İndirim
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={editablePrices.discount}
                  onChange={(e) =>
                    setEditablePrices({
                      ...editablePrices,
                      discount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatPrice(editablePrices.discount)}
              </p>
            </div>

            {/* Net Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Net Fiyat
              </label>
              <div className="px-4 py-2 bg-gray-100 rounded-lg border border-gray-300">
                <p className="font-semibold text-gray-900">
                  {formatPrice(editablePrices.net_price)}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Otomatik hesaplanır</p>
            </div>
          </div>

          <button
            onClick={handleSavePrices}
            disabled={isSaving}
            className="mt-4 px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium disabled:opacity-50"
          >
            {isSaving ? 'Kaydediliyor...' : 'Fiyatları Kaydet'}
          </button>
        </div>

        {/* Delivery Date Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Teslimat Tarihi
          </h2>
          <input
            type="date"
            value={formData.delivery_date}
            onChange={(e) =>
              setFormData({ ...formData, delivery_date: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700"
          />
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notlar</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700"
            placeholder="Tasarımla ilgili notları buraya yazın..."
          />
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              title="PDF olarak indir"
            >
              <Download size={20} />
              PDF İndir
            </button>
            <button
              onClick={() => navigate('/contracts/new')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium"
              disabled={formData.status !== 'onaylı'}
            >
              <FileText size={20} />
              Sözleşme Oluştur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignDetail;
