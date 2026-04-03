import React, { useState, useEffect } from 'react';
import { Building2, Save, Loader2, AlertCircle, Check, Plus, Trash2, Upload } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../App';

const DEFAULT_CONTRACT_TERMS = [
  'Sözleşme imzalandıktan sonra 7 iş günü içinde peşinat ödenecektir.',
  'Üretim süresi, peşinat ödeme tarihinden itibaren başlar.',
  'Teslim tarihi tahmini olup, mücbir sebepler nedeniyle değişebilir.',
  'Kalite kontrol sonrası tespit edilen eksiklikler ücretsiz giderilecektir.',
  'Garanti süresi teslim tarihinden itibaren 2 yıldır.',
];

const DEFAULT_QC_ITEMS = [
  'Şase düzgünlüğü ve kaynak kalitesi',
  'Panel montajı ve yalıtım kontrolü',
  'Çatı sızdırmazlık testi',
  'Kapı ve pencere işlevselliği',
  'Elektrik tesisatı güvenlik kontrolü',
  'Boya ve kaplama kalitesi',
  'İç düzenleme ve temizlik',
];

const CompanyInfo = () => {
  const { user } = useAuth();
  const [existingId, setExistingId] = useState(null);
  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    tax_office: '',
    tax_number: '',
    iban: '',
    logo_url: '',
  });
  const [contractTerms, setContractTerms] = useState(DEFAULT_CONTRACT_TERMS);
  const [qcItems, setQcItems] = useState(DEFAULT_QC_ITEMS);
  const [bankInfo, setBankInfo] = useState({
    bank_name: '',
    branch: '',
    iban: '',
    account_no: '',
    footer_note: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setExistingId(data.id);
        setCompanyData(data);
        if (data.logo_url) setLogoPreview(data.logo_url);
        setContractTerms(data.contract_terms || DEFAULT_CONTRACT_TERMS);
        setQcItems(data.qc_items || DEFAULT_QC_ITEMS);
        setBankInfo({
          bank_name: data.bank_name || '',
          branch: data.bank_branch || '',
          iban: data.bank_iban || '',
          account_no: data.bank_account_no || '',
          footer_note: data.proforma_footer_note || '',
        });
      }
    } catch (error) {
      console.error('Firma bilgileri yükleme hatası:', error);
      setMessage({ type: 'error', text: 'Veriler yüklenirken hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCompanyChange = (field, value) => {
    setCompanyData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const supabase = getSupabase();
      if (!supabase) {
        setMessage({ type: 'error', text: 'Veritabanı bağlantısı yok' });
        return;
      }

      let logoUrl = companyData.logo_url;

      if (logoFile) {
        const fileName = `company-logo-${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('company')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage
          .from('company')
          .getPublicUrl(fileName);
        logoUrl = publicUrl.publicUrl;
      }

      const saveData = {
        name: companyData.name || '',
        address: companyData.address || '',
        phone: companyData.phone || '',
        email: companyData.email || '',
        tax_office: companyData.tax_office || '',
        tax_number: companyData.tax_number || '',
        iban: companyData.iban || '',
        logo_url: logoUrl,
        contract_terms: contractTerms,
        qc_items: qcItems,
        bank_name: bankInfo.bank_name,
        bank_branch: bankInfo.branch,
        bank_iban: bankInfo.iban,
        bank_account_no: bankInfo.account_no,
        proforma_footer_note: bankInfo.footer_note,
      };

      let result;
      if (existingId) {
        // Update existing record
        result = await supabase
          .from('company_info')
          .update(saveData)
          .eq('id', existingId);
      } else {
        // Insert new record with owner_id
        saveData.owner_id = user.id;
        result = await supabase
          .from('company_info')
          .insert(saveData)
          .select();
        if (result.data && result.data[0]) {
          setExistingId(result.data[0].id);
        }
      }

      if (result.error) throw result.error;

      setMessage({ type: 'success', text: 'Veriler başarıyla kaydedildi' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      setMessage({ type: 'error', text: 'Kaydetme sırasında hata oluştu' });
    } finally {
      setSaving(false);
    }
  };

  const addContractTerm = () => {
    setContractTerms([...contractTerms, 'Yeni madde']);
  };

  const updateContractTerm = (index, value) => {
    const updated = [...contractTerms];
    updated[index] = value;
    setContractTerms(updated);
  };

  const removeContractTerm = (index) => {
    setContractTerms(contractTerms.filter((_, i) => i !== index));
  };

  const addQcItem = () => {
    setQcItems([...qcItems, 'Yeni kontrol maddesi']);
  };

  const updateQcItem = (index, value) => {
    const updated = [...qcItems];
    updated[index] = value;
    setQcItems(updated);
  };

  const removeQcItem = (index) => {
    setQcItems(qcItems.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Firma bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-amber-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Firma Bilgileri</h1>
              <p className="text-gray-600">Şirket ve sözleşme ayarları</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <p
              className={
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Company Info */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Genel Bilgiler</h2>

          {/* Logo */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Firma Logosu
            </label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-20 h-20 object-contain rounded-lg border border-gray-200"
                />
              )}
              <label className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                Logo Yükle
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Firma Adı
              </label>
              <input
                type="text"
                value={companyData.name || ''}
                onChange={(e) => handleCompanyChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adres
              </label>
              <input
                type="text"
                value={companyData.address || ''}
                onChange={(e) => handleCompanyChange('address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telefon
              </label>
              <input
                type="text"
                value={companyData.phone || ''}
                onChange={(e) => handleCompanyChange('phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                E-posta
              </label>
              <input
                type="email"
                value={companyData.email || ''}
                onChange={(e) => handleCompanyChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vergi Dairesi
              </label>
              <input
                type="text"
                value={companyData.tax_office || ''}
                onChange={(e) => handleCompanyChange('tax_office', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vergi No
              </label>
              <input
                type="text"
                value={companyData.tax_number || ''}
                onChange={(e) => handleCompanyChange('tax_number', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Bank Info */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Banka Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Banka Adı
              </label>
              <input
                type="text"
                value={bankInfo.bank_name}
                onChange={(e) =>
                  setBankInfo((prev) => ({ ...prev, bank_name: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Şube
              </label>
              <input
                type="text"
                value={bankInfo.branch}
                onChange={(e) =>
                  setBankInfo((prev) => ({ ...prev, branch: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                IBAN
              </label>
              <input
                type="text"
                value={bankInfo.iban}
                onChange={(e) =>
                  setBankInfo((prev) => ({ ...prev, iban: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hesap No
              </label>
              <input
                type="text"
                value={bankInfo.account_no}
                onChange={(e) =>
                  setBankInfo((prev) => ({ ...prev, account_no: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Proforma Alt Notu
            </label>
            <textarea
              value={bankInfo.footer_note}
              onChange={(e) =>
                setBankInfo((prev) => ({ ...prev, footer_note: e.target.value }))
              }
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>
        </div>

        {/* Contract Terms */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Sözleşme Maddeleri</h2>
            <button
              onClick={addContractTerm}
              className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-semibold text-sm"
            >
              <Plus className="w-4 h-4" /> Madde Ekle
            </button>
          </div>
          <div className="space-y-3">
            {contractTerms.map((term, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-gray-500 font-semibold mt-2 w-8 text-right flex-shrink-0">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => updateContractTerm(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={() => removeContractTerm(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Checklist */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Kalite Kontrol Maddeleri
            </h2>
            <button
              onClick={addQcItem}
              className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-semibold text-sm"
            >
              <Plus className="w-4 h-4" /> Madde Ekle
            </button>
          </div>
          <div className="space-y-3">
            {qcItems.map((item, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-gray-500 font-semibold mt-2 w-8 text-right flex-shrink-0">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateQcItem(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={() => removeQcItem(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button (Bottom) */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfo;
