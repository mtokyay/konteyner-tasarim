import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

const CustomerCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [customerId, setCustomerId] = useState(null);

  const [formData, setFormData] = useState({
    ad: '',
    soyad: '',
    telefon: '',
    eposta: '',
    nereden_geldi: 'referans',
    adres: '',
    notlar: '',
  });

  const [errors, setErrors] = useState({});

  const formatTurkishPhone = (phone) => {
    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Turkish phone number format: +90 (5XX) XXX-XXXX
    if (cleaned.length === 10) {
      return `0${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('90')) {
      return `0${cleaned.slice(2)}`;
    }
    return phone;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.ad.trim()) {
      newErrors.ad = 'Ad alanı zorunludur';
    }

    if (!formData.soyad.trim()) {
      newErrors.soyad = 'Soyad alanı zorunludur';
    }

    if (!formData.telefon.trim()) {
      newErrors.telefon = 'Telefon alanı zorunludur';
    } else {
      const cleanPhone = formData.telefon.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        newErrors.telefon = 'Geçerli bir telefon numarası giriniz';
      }
    }

    if (formData.eposta && !formData.eposta.includes('@')) {
      newErrors.eposta = 'Geçerli bir e-posta adresi giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'telefon') {
      const formatted = formatTurkishPhone(value);
      setFormData((prev) => ({
        ...prev,
        [name]: formatted,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = getSupabase();

      if (!supabase) {
        throw new Error('Supabase konfigürasyonu bulunamadı');
      }

      const { data, error: insertError } = await supabase
        .from('customers')
        .insert([
          {
            ad: formData.ad.trim(),
            soyad: formData.soyad.trim(),
            telefon: formData.telefon.trim(),
            eposta: formData.eposta.trim() || null,
            nereden_geldi: formData.nereden_geldi,
            adres: formData.adres.trim() || null,
            notlar: formData.notlar.trim() || null,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (insertError) {
        throw insertError;
      }

      if (data && data[0]) {
        setCustomerId(data[0].id);
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Müşteri kaydedilirken bir hata oluştu');
      console.error('Customer creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Müşteri Kaydedildi!
            </h2>
            <p className="text-gray-600 mb-6">
              {formData.ad} {formData.soyad} başarıyla sisteme eklendi.
            </p>

            <div className="space-y-3">
              <button
                onClick={() =>
                  navigate('/designs/new', {
                    state: { customerId },
                  })
                }
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Tasarım Oluştur
              </button>
              <button
                onClick={() => navigate('/customers')}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Müşteri Listesine Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Müşteri</h1>
            <p className="text-gray-600">Müşteri bilgilerini girin</p>
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

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ad"
                  value={formData.ad}
                  onChange={handleInputChange}
                  placeholder="Müşteri adını giriniz"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                    errors.ad
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.ad && (
                  <p className="text-red-600 text-sm mt-1">{errors.ad}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="soyad"
                  value={formData.soyad}
                  onChange={handleInputChange}
                  placeholder="Müşteri soyadını giriniz"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                    errors.soyad
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.soyad && (
                  <p className="text-red-600 text-sm mt-1">{errors.soyad}</p>
                )}
              </div>
            </div>

            {/* Phone and Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="telefon"
                  value={formData.telefon}
                  onChange={handleInputChange}
                  placeholder="(5XX) XXX-XXXX"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                    errors.telefon
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.telefon && (
                  <p className="text-red-600 text-sm mt-1">{errors.telefon}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  E-posta
                </label>
                <input
                  type="email"
                  name="eposta"
                  value={formData.eposta}
                  onChange={handleInputChange}
                  placeholder="ornek@example.com"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                    errors.eposta
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.eposta && (
                  <p className="text-red-600 text-sm mt-1">{errors.eposta}</p>
                )}
              </div>
            </div>

            {/* Source Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nereden Geldi <span className="text-red-500">*</span>
              </label>
              <select
                name="nereden_geldi"
                value={formData.nereden_geldi}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors bg-white"
              >
                <option value="referans">Referans</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="web_sitesi">Web Sitesi</option>
                <option value="ilan">İlan</option>
                <option value="arama">Arama</option>
                <option value="diger">Diğer</option>
              </select>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adres
              </label>
              <textarea
                name="adres"
                value={formData.adres}
                onChange={handleInputChange}
                placeholder="Müşteri adresini giriniz (opsiyonel)"
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors bg-white resize-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notlar
              </label>
              <textarea
                name="notlar"
                value={formData.notlar}
                onChange={handleInputChange}
                placeholder="Ek notlar (opsiyonel)"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors bg-white resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Kaydediliyor...' : 'Müşteri Kaydet'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerCreate;
