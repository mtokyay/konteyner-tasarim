import React, { useState, useEffect } from 'react';
import { AlertCircle, Upload, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

const DEFAULT_CONTRACT_TERMS = [
  "İş bu sözleşme, taraflar arasında aşağıdaki şartlarla düzenlenmiştir.",
  "Yüklenici, sözleşmede belirtilen konteyner yapıyı, teknik şartnameye uygun olarak üretmeyi ve teslim etmeyi taahhüt eder.",
  "Ödeme planında belirtilen tutarlar, belirtilen tarihlerde ödenecektir. Gecikme halinde aylık %2 gecikme faizi uygulanır.",
  "Teslim tarihi, peşinat ödemesinin yapıldığı tarihten itibaren hesaplanır.",
  "Yüklenici, üretim sürecinde teknik zorunluluk nedeniyle küçük değişiklikler yapma hakkını saklı tutar.",
  "Garanti süresi teslim tarihinden itibaren 2 yıldır. Doğal afet ve kullanıcı hatası garanti kapsamı dışındadır.",
  "Sözleşmeden tek taraflı dönülmesi halinde, peşinat tutarı iade edilmez.",
  "İhtilaf halinde Antalya Mahkemeleri ve İcra Daireleri yetkilidir."
];

const DEFAULT_QC_ITEMS = [
  "Dış ölçüler sözleşmeye uygun mu?",
  "Duvar panelleri düzgün monte edilmiş mi?",
  "Çatı izolasyonu yapılmış mı?",
  "Kapı ve pencereler düzgün çalışıyor mu?",
  "Elektrik tesisatı çalışıyor mu?",
  "Zemin kaplaması yapılmış mı?",
  "Boya/kaplama kalitesi uygun mu?",
  "WC/Banyo tesisatı çalışıyor mu?",
  "Genel temizlik yapılmış mı?"
];

export default function CompanyInfo() {
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [companyData, setCompanyData] = useState({
    company_name: '',
    address: '',
    phone: '',
    email: '',
    tax_office: '',
    tax_id: '',
    iban: '',
    logo_url: '',
    authorized_name: '',
    authorized_title: ''
  });

  const [contractTerms, setContractTerms] = useState(DEFAULT_CONTRACT_TERMS);
  const [qcItems, setQcItems] = useState(DEFAULT_QC_ITEMS);
  const [bankInfo, setBankInfo] = useState({
    bank_name: '',
    branch: '',
    iban: '',
    account_no: '',
    footer_note: ''
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCompanyData(data);
        if (data.logo_url) setLogoPreview(data.logo_url);
        setContractTerms(data.contract_terms || DEFAULT_CONTRACT_TERMS);
        setQcItems(data.qc_items || DEFAULT_QC_ITEMS);
        setBankInfo({
          bank_name: data.bank_name || '',
          branch: data.bank_branch || '',
          iban: data.bank_iban || '',
          account_no: data.bank_account_no || '',
          footer_note: data.proforma_footer_note || ''
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
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const supabase = getSupabase();

      let logoUrl = companyData.logo_url;

      if (logoFile) {
        const fileName = `company-logo-${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('company-files')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage
          .from('company-files')
          .getPublicUrl(fileName);
        logoUrl = publicUrl.publicUrl;
      }

      const saveData = {
        ...companyData,
        logo_url: logoUrl,
        contract_terms: contractTerms,
        qc_items: qcItems,
        bank_name: bankInfo.bank_name,
        bank_branch: bankInfo.branch,
        bank_iban: bankInfo.iban,
        bank_account_no: bankInfo.account_no,
        proforma_footer_note: bankInfo.footer_note
      };

      const { error } = await supabase
        .from('company_info')
        .upsert(saveData, { onConflict: 'id' });

      if (error) throw error;

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

  const moveContractTerm = (index, direction) => {
    const updated = [...contractTerms];
    if (direction === 'up' && index > 0) {
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
    } else if (direction === 'down' && index < updated.length - 1) {
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    }
    setContractTerms(updated);
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

  const moveQcItem = (index, direction) => {
    const updated = [...qcItems];
    if (direction === 'up' && index > 0) {
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
    } else if (direction === 'down' && index < updated.length - 1) {
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    }
    setQcItems(updated);
  };

  if (loading) {
    return <div className="p-6 text-center">Yükleniyor...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-4 mb-6 border-b">
        {['company', 'contracts', 'qc', 'bank'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 font-medium border-b-2 transition ${
              activeTab === tab
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'company' && 'Firma Bilgileri'}
            {tab === 'contracts' && 'Sözleşme Şablonu'}
            {tab === 'qc' && 'Kalite Kontrol'}
            {tab === 'bank' && 'Proforma Ayarları'}
          </button>
        ))}
      </div>

      {/* Tab: Firma Bilgileri */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Firma Bilgileri</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Firma Adı"
                value={companyData.company_name}
                onChange={(e) => handleCompanyChange('company_name', e.target.value)}
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <textarea
                placeholder="Adres"
                value={companyData.address}
                onChange={(e) => handleCompanyChange('address', e.target.value)}
                rows="3"
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <input
                type="tel"
                placeholder="Telefon"
                value={companyData.phone}
                onChange={(e) => handleCompanyChange('phone', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <input
                type="email"
                placeholder="E-posta"
                value={companyData.email}
                onChange={(e) => handleCompanyChange('email', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <input
                type="text"
                placeholder="Vergi Dairesi"
                value={companyData.tax_office}
                onChange={(e) => handleCompanyChange('tax_office', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <input
                type="text"
                placeholder="Vergi No"
                value={companyData.tax_id}
                onChange={(e) => handleCompanyChange('tax_id', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <input
                type="text"
                placeholder="IBAN"
                value={companyData.iban}
                onChange={(e) => handleCompanyChange('iban', e.target.value)}
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <input
                type="text"
                placeholder="Yetkili Adı"
                value={companyData.authorized_name}
                onChange={(e) => handleCompanyChange('authorized_name', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <input
                type="text"
                placeholder="Yetkili Unvanı"
                value={companyData.authorized_title}
                onChange={(e) => handleCompanyChange('authorized_title', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Firma Logosu</h3>
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-50 transition">
                  <Upload size={20} className="text-amber-600" />
                  <span className="text-amber-600 font-medium">Logo Yükle</span>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
              {logoPreview && (
                <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                  <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Sözleşme Şablonu */}
      {activeTab === 'contracts' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Sözleşme Maddeleri</h3>
            <button
              onClick={addContractTerm}
              className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
            >
              <Plus size={18} /> Madde Ekle
            </button>
          </div>
          <div className="space-y-3">
            {contractTerms.map((term, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex gap-1">
                  <button
                    onClick={() => moveContractTerm(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 disabled:opacity-30 hover:text-gray-600"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => moveContractTerm(index, 'down')}
                    disabled={index === contractTerms.length - 1}
                    className="p-1 text-gray-400 disabled:opacity-30 hover:text-gray-600"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => updateContractTerm(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <button
                  onClick={() => removeContractTerm(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Kalite Kontrol */}
      {activeTab === 'qc' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Kalite Kontrol Maddeleri</h3>
            <button
              onClick={addQcItem}
              className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
            >
              <Plus size={18} /> Madde Ekle
            </button>
          </div>
          <div className="space-y-3">
            {qcItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex gap-1">
                  <button
                    onClick={() => moveQcItem(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 disabled:opacity-30 hover:text-gray-600"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => moveQcItem(index, 'down')}
                    disabled={index === qcItems.length - 1}
                    className="p-1 text-gray-400 disabled:opacity-30 hover:text-gray-600"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateQcItem(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <button
                  onClick={() => removeQcItem(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Proforma Ayarları */}
      {activeTab === 'bank' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Banka Bilgileri</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Banka Adı"
                value={bankInfo.bank_name}
                onChange={(e) => setBankInfo({ ...bankInfo, bank_name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <input
                type="text"
                placeholder="Şube"
                value={bankInfo.branch}
                onChange={(e) => setBankInfo({ ...bankInfo, branch: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <input
                type="text"
                placeholder="IBAN"
                value={bankInfo.iban}
                onChange={(e) => setBankInfo({ ...bankInfo, iban: e.target.value })}
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <input
                type="text"
                placeholder="Hesap No"
                value={bankInfo.account_no}
                onChange={(e) => setBankInfo({ ...bankInfo, account_no: e.target.value })}
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Alt Bilgi Notu</h3>
            <textarea
              value={bankInfo.footer_note}
              onChange={(e) => setBankInfo({ ...bankInfo, footer_note: e.target.value })}
              rows="4"
              placeholder="Proforma faturanın alt kısmında görüntülenecek notu girin..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition font-medium"
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}
