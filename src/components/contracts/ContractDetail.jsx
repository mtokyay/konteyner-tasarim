import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, CheckCircle, AlertCircle, Clock, Upload, Trash2, Eye } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

const STATUS_MAP = {
  hazirlanda: { label: 'Hazırlandı', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  imzalandi: { label: 'İmzalandı', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  aktif: { label: 'Aktif', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  tamamlandi: { label: 'Tamamlandı', color: 'bg-gray-100 text-gray-800', icon: CheckCircle }
};

const PAYMENT_STATUS_MAP = {
  ödendi: { label: 'Ödendi ✅', color: 'text-green-600' },
  bekliyor: { label: 'Bekliyor ⏳', color: 'text-yellow-600' },
  gecikti: { label: 'Gecikti ❌', color: 'text-red-600' }
};

export default function ContractDetail() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState(null);
  const [design, setDesign] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [signedPages, setSignedPages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadContract();
  }, [contractId]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();

      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('*, customers(*), designs(*)')
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;

      setContract(contractData);
      setCustomer(contractData.customers);
      setDesign(contractData.designs);

      // Load payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('contract_id', contractId)
        .order('payment_no');

      if (!paymentsError) {
        setPayments(paymentsData || []);
      }

      // Load signed pages
      const { data: pagesData, error: pagesError } = await supabase
        .from('contract_signed_pages')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at');

      if (!pagesError) {
        setSignedPages(pagesData || []);
      }
    } catch (error) {
      console.error('Sözleşme yükleme hatası:', error);
      setMessage({ type: 'error', text: 'Sözleşme yüklenirken hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploading(true);
      const supabase = getSupabase();

      for (const file of files) {
        const fileName = `contracts/${contractId}/${Date.now()}-${file.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('contract-pages')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from('contract-pages')
          .getPublicUrl(fileName);

        await supabase
          .from('contract_signed_pages')
          .insert({
            contract_id: contractId,
            page_url: publicUrl.publicUrl,
            file_name: file.name
          });
      }

      setMessage({ type: 'success', text: 'Sayfalar başarıyla yüklendi' });
      loadContract();
    } catch (error) {
      console.error('Yükleme hatası:', error);
      setMessage({ type: 'error', text: 'Yükleme sırasında hata oluştu' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!window.confirm('Bu sayfayı silmek istediğinize emin misiniz?')) return;

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('contract_signed_pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Sayfa silindi' });
      loadContract();
    } catch (error) {
      console.error('Silme hatası:', error);
      setMessage({ type: 'error', text: 'Silme sırasında hata oluştu' });
    }
  };

  const handleApproveContract = async () => {
    try {
      const supabase = getSupabase();

      const { error } = await supabase
        .from('contracts')
        .update({ status: 'imzalandi' })
        .eq('id', contractId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Sözleşme onaylandı' });
      setTimeout(() => loadContract(), 1000);
    } catch (error) {
      console.error('Onaylama hatası:', error);
      setMessage({ type: 'error', text: 'Onaylama sırasında hata oluştu' });
    }
  };

  const handleCreateCustomerAccount = async () => {
    try {
      // TODO: Implement customer account creation
      alert('Müşteri hesabı oluşturma özelliği yakında kullanılabilir');
    } catch (error) {
      console.error('Hesap oluşturma hatası:', error);
      setMessage({ type: 'error', text: 'Hesap oluşturma sırasında hata oluştu' });
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Yükleniyor...</div>;
  }

  if (!contract) {
    return <div className="p-6 text-center text-red-600">Sözleşme bulunamadı</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{contract.contract_no}</h1>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_MAP[contract.status]?.color}`}>
              {STATUS_MAP[contract.status]?.label}
            </span>
            <span className="text-sm text-gray-600">
              {new Date(contract.contract_date).toLocaleDateString('tr-TR')}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => console.log('PDF indiriliyor')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            <Download size={18} /> PDF İndir
          </button>

          {contract.status === 'hazirlanda' && (
            <button
              onClick={handleApproveContract}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
            >
              <CheckCircle size={18} /> Sözleşmeyi Onayla
            </button>
          )}

          {contract.status === 'imzalandi' && (
            <button
              onClick={handleCreateCustomerAccount}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              <CheckCircle size={18} /> Müşteri Hesabı Oluştur
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        {['overview', 'payments', 'documents'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 font-medium border-b-2 transition ${
              activeTab === tab
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'overview' && 'Genel Bakış'}
            {tab === 'payments' && 'Ödeme Planı'}
            {tab === 'documents' && 'İmzalı Sayfalar'}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Customer Info */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Müşteri Bilgileri</h3>
              {customer && (
                <div className="space-y-3">
                  <p><span className="font-medium text-gray-700">Ad:</span> {customer.name}</p>
                  <p><span className="font-medium text-gray-700">E-posta:</span> {customer.email}</p>
                  <p><span className="font-medium text-gray-700">Telefon:</span> {customer.phone}</p>
                  <p><span className="font-medium text-gray-700">Adres:</span> {customer.address}</p>
                </div>
              )}
            </div>

            {/* Design Info */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Tasarım Bilgileri</h3>
              {design && (
                <div className="space-y-3">
                  <p><span className="font-medium text-gray-700">Model:</span> {design.model_name}</p>
                  <p><span className="font-medium text-gray-700">Ölçüler:</span> {design.width}m x {design.length}m</p>
                  <p><span className="font-medium text-gray-700">Teslim Tarihi:</span> {new Date(contract.delivery_date).toLocaleDateString('tr-TR')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contract Terms */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Sözleşme Maddeleri</h3>
            <ol className="space-y-2">
              {contract.contract_terms?.map((term, idx) => (
                <li key={idx} className="text-gray-700">
                  <span className="font-medium">{idx + 1}.</span> {term}
                </li>
              ))}
            </ol>
          </div>

          {/* Special Notes */}
          {contract.special_notes && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Özel Notlar</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{contract.special_notes}</p>
            </div>
          )}

          {/* Financial Summary */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Finansal Özet</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Toplam Fiyat</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contract.total_price?.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                    minimumFractionDigits: 2
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">KDV Dahil Toplam</p>
                <p className="text-2xl font-bold text-amber-600">
                  {contract.total_with_vat?.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                    minimumFractionDigits: 2
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Peşinat</p>
                <p className="text-2xl font-bold text-green-600">
                  {contract.down_payment?.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                    minimumFractionDigits: 2
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {payments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Ödeme planı bulunamadı</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ödeme Tipi</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tutar</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Vade Tarihi</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {payment.type === 'pesinat' ? 'Peşinat' : `Taksit ${payment.payment_no}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-amber-600">
                        {payment.amount?.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                          minimumFractionDigits: 2
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(payment.due_date).toLocaleDateString('tr-TR')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${PAYMENT_STATUS_MAP[payment.status]?.color}`}>
                        {PAYMENT_STATUS_MAP[payment.status]?.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">İmzalı Sayfaları Yükle</h3>

            <label className="flex items-center justify-center gap-2 px-6 py-8 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-50 transition mb-6">
              <Upload size={20} className="text-amber-600" />
              <span className="text-amber-600 font-medium">Fotoğraf veya Dosya Yükle</span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>

            {uploading && <p className="text-center text-gray-600">Yükleniyor...</p>}
          </div>

          {signedPages.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Yüklü Sayfalar ({signedPages.length})</h3>
              <div className="grid grid-cols-4 gap-4">
                {signedPages.map((page) => (
                  <div key={page.id} className="relative group">
                    <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square">
                      {page.page_url.includes('pdf') ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <Eye size={32} className="text-gray-400" />
                        </div>
                      ) : (
                        <img
                          src={page.page_url}
                          alt={page.file_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <button
                      onClick={() => handleDeletePage(page.id)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                      title="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                    <p className="text-xs text-gray-600 mt-2 truncate">{page.file_name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
