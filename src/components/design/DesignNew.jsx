import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Plus, X } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

const placeholderCustomers = [
  { id: '1', ad: 'Ahmet', soyad: 'Yılmaz', telefon: '0532 123 45 67', eposta: 'ahmet@example.com' },
  { id: '2', ad: 'Fatma', soyad: 'Kara', telefon: '0533 234 56 78', eposta: 'fatma@example.com' },
  { id: '3', ad: 'Mehmet', soyad: 'Demir', telefon: '0534 345 67 89', eposta: 'mehmet@example.com' },
];

export default function DesignNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [customersLoading, setCustomersLoading] = useState(false);

  // Step 1: Customer Selection
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Step 2: Design Details
  const [formData, setFormData] = useState({
    ad: '',
    aciklama: '',
    genislik: '',
    yukseklik: '',
    uzunluk: '',
    ozellikler: [],
    toplam_fiyat: '',
    indirim: '',
    teslim_tarihi: '',
    notlar: '',
  });

  // Step 3: New Customer Modal
  const [newCustomer, setNewCustomer] = useState({
    ad: '',
    soyad: '',
    telefon: '',
    eposta: '',
    nereden_geldi: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      const supabase = getSupabase();

      if (!supabase) {
        setCustomers(placeholderCustomers);
        setCustomersLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from('customers')
        .select('id, ad, soyad, telefon, eposta')
        .order('ad', { ascending: true });

      if (queryError) throw queryError;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setCustomers(placeholderCustomers);
    } finally {
      setCustomersLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    `${customer.ad} ${customer.soyad}`.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    (customer.telefon || '').includes(searchCustomer)
  );

  const handleSelectCustomer = (customer) => {
    // Navigate to full-screen design editor with customer info
    navigate('/designs/new/editor', {
      state: {
        customerId: customer.id,
        customerInfo: {
          ad: customer.ad,
          soyad: customer.soyad,
          telefon: customer.telefon,
          eposta: customer.eposta,
        },
      },
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChecked = (feature) => {
    setFormData(prev => ({
      ...prev,
      ozellikler: prev.ozellikler.includes(feature)
        ? prev.ozellikler.filter(f => f !== feature)
        : [...prev.ozellikler, feature],
    }));
  };

  const calculateArea = () => {
    const width = parseFloat(formData.genislik) || 0;
    const length = parseFloat(formData.uzunluk) || 0;
    return (width * length).toFixed(2);
  };

  const calculateNetPrice = () => {
    const total = parseFloat(formData.toplam_fiyat) || 0;
    const disc = parseFloat(formData.indirim) || 0;
    return Math.max(0, total - disc).toFixed(2);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.ad || !newCustomer.soyad || !newCustomer.telefon || !newCustomer.eposta) {
      setError('Lütfen tüm alanları doldurunuz');
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabase();

      if (!supabase) {
        const mockCustomer = {
          id: Date.now().toString(),
          ...newCustomer,
        };
        setSelectedCustomer(mockCustomer);
        setShowCustomerModal(false);
        setNewCustomer({ ad: '', soyad: '', telefon: '', eposta: '', nereden_geldi: '' });
        setError('');
        setStep(2);
        return;
      }

      const { data, error: insertError } = await supabase
        .from('customers')
        .insert([newCustomer])
        .select();

      if (insertError) throw insertError;

      const addedCustomer = data[0];
      setSelectedCustomer(addedCustomer);
      setShowCustomerModal(false);
      setNewCustomer({ ad: '', soyad: '', telefon: '', eposta: '', nereden_geldi: '' });
      setError('');
      await fetchCustomers();
      setStep(2);
    } catch (err) {
      console.error('Error adding customer:', err);
      setError('Müşteri eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDesign = async (e) => {
    e.preventDefault();
    if (!formData.ad || !selectedCustomer) {
      setError('Lütfen gerekli alanları doldurunuz');
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabase();
      const netPrice = parseFloat(calculateNetPrice());

      const designPayload = {
        customer_id: selectedCustomer.id,
        ad: formData.ad,
        aciklama: formData.aciklama,
        genislik: formData.genislik ? parseFloat(formData.genislik) : null,
        yukseklik: formData.yukseklik ? parseFloat(formData.yukseklik) : null,
        uzunluk: formData.uzunluk ? parseFloat(formData.uzunluk) : null,
        alan: parseFloat(calculateArea()),
        ozellikler: formData.ozellikler,
        ref_no: `TH-${Date.now().toString().slice(-6)}`,
        status: 'taslak',
        toplam_fiyat: parseFloat(formData.toplam_fiyat) || 0,
        indirim: parseFloat(formData.indirim) || 0,
        net_fiyat: netPrice,
        teslim_tarihi: formData.teslim_tarihi || null,
        notlar: formData.notlar,
      };

      if (!supabase) {
        const mockDesign = {
          id: Date.now().toString(),
          ...designPayload,
          created_at: new Date().toISOString(),
        };
        navigate(`/designs/${mockDesign.id}`, { state: { successMessage: 'Tasarım başarıyla oluşturuldu!' } });
        return;
      }

      const { data, error: insertError } = await supabase
        .from('designs')
        .insert([designPayload])
        .select();

      if (insertError) throw insertError;

      const newDesign = data[0];
      navigate(`/designs/${newDesign.id}`, { state: { successMessage: 'Tasarım başarıyla oluşturuldu!' } });
    } catch (err) {
      console.error('Error creating design:', err);
      setError('Tasarım oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { id: 'kat', label: 'Çatı Sistemi' },
    { id: 'isitma', label: 'Isıtma Sistemi' },
    { id: 'sogucut', label: 'Soğutma Sistemi' },
    { id: 'su', label: 'Su Sistemi' },
    { id: 'elektrik', label: 'Elektrik Sistemi' },
    { id: 'esya', label: 'Eşya Dahil' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Yeni Tasarım Oluştur</h1>
          <p className="text-gray-600">Adım adım yeni tasarımı oluşturun</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step >= s
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
              {s < 2 && (
                <div className={`flex-1 h-1 mx-2 transition-all ${step > s ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between mb-8 text-sm">
          <div className={`font-semibold ${step >= 1 ? 'text-amber-700' : 'text-gray-500'}`}>
            Adım 1: Müşteri Seç
          </div>
          <div className={`font-semibold ${step >= 2 ? 'text-amber-700' : 'text-gray-500'}`}>
            Adım 2: Tasarım Detayları
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        {/* Step 1: Customer Selection */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Müşteri Seçin</h2>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Müşteri adı veya telefon ile ara..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {customersLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-4"></div>
                <p className="text-gray-600">Müşteriler yükleniyor...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {filteredCustomers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all text-left"
                  >
                    <div className="font-semibold text-gray-900 mb-1">{customer.ad} {customer.soyad}</div>
                    <div className="text-sm text-gray-600 mb-2">{customer.telefon}</div>
                    <div className="text-sm text-gray-500">{customer.eposta}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="border-t-2 border-gray-200 pt-6">
              <button
                onClick={() => setShowCustomerModal(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-amber-500 text-amber-700 rounded-lg hover:bg-amber-50 font-semibold transition-all"
              >
                <Plus size={20} />
                Yeni Müşteri Ekle
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Design Details */}
        {step === 2 && (
          <form onSubmit={handleSubmitDesign} className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Tasarım Detayları - {selectedCustomer?.ad} {selectedCustomer?.soyad}
            </h2>

            {/* Basic Info */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Tasarım Adı *</label>
              <input
                type="text"
                name="ad"
                value={formData.ad}
                onChange={handleInputChange}
                placeholder="Örn: Modern Ev Tasarımı"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Açıklama</label>
              <textarea
                name="aciklama"
                value={formData.aciklama}
                onChange={handleInputChange}
                placeholder="Tasarım hakkında açıklama..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              ></textarea>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Genişlik (m)</label>
                <input
                  type="number"
                  name="genislik"
                  value={formData.genislik}
                  onChange={handleInputChange}
                  step="0.1"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Yükseklik (m)</label>
                <input
                  type="number"
                  name="yukseklik"
                  value={formData.yukseklik}
                  onChange={handleInputChange}
                  step="0.1"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Uzunluk (m)</label>
                <input
                  type="number"
                  name="uzunluk"
                  value={formData.uzunluk}
                  onChange={handleInputChange}
                  step="0.1"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Area */}
            <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Alan (m²)</label>
              <div className="text-3xl font-bold text-amber-700">{calculateArea()}</div>
            </div>

            {/* Features */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">Özellikler</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {features.map(feature => (
                  <label key={feature.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.ozellikler.includes(feature.id)}
                      onChange={() => handleChecked(feature.id)}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-gray-700">{feature.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Toplam Fiyat (₺)</label>
                <input
                  type="number"
                  name="toplam_fiyat"
                  value={formData.toplam_fiyat}
                  onChange={handleInputChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">İndirim (₺)</label>
                <input
                  type="number"
                  name="indirim"
                  value={formData.indirim}
                  onChange={handleInputChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Net Fiyat (₺)</label>
                <div className="px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-lg font-bold text-orange-700">{calculateNetPrice()}</div>
                </div>
              </div>
            </div>

            {/* Delivery Date */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Teslim Tarihi</label>
              <input
                type="date"
                name="teslim_tarihi"
                value={formData.teslim_tarihi}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Notlar</label>
              <textarea
                name="notlar"
                value={formData.notlar}
                onChange={handleInputChange}
                placeholder="Ek notlar..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              ></textarea>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
              >
                <ArrowLeft size={20} />
                Geri
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Kaydediliyor...' : 'Tasarımı Oluştur'}
                <ArrowRight size={20} />
              </button>
            </div>
          </form>
        )}

        {/* Add Customer Modal */}
        {showCustomerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Yeni Müşteri Ekle</h3>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Ad *</label>
                  <input
                    type="text"
                    value={newCustomer.ad}
                    onChange={(e) => setNewCustomer({ ...newCustomer, ad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Soyad *</label>
                  <input
                    type="text"
                    value={newCustomer.soyad}
                    onChange={(e) => setNewCustomer({ ...newCustomer, soyad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Telefon *</label>
                  <input
                    type="tel"
                    value={newCustomer.telefon}
                    onChange={(e) => setNewCustomer({ ...newCustomer, telefon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">E-posta *</label>
                  <input
                    type="email"
                    value={newCustomer.eposta}
                    onChange={(e) => setNewCustomer({ ...newCustomer, eposta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Nereden Geldi</label>
                  <input
                    type="text"
                    value={newCustomer.nereden_geldi}
                    onChange={(e) => setNewCustomer({ ...newCustomer, nereden_geldi: e.target.value })}
                    placeholder="Sosyal medya, referans, vb."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCustomerModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 font-semibold transition-all disabled:opacity-50"
                  >
                    Ekle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
