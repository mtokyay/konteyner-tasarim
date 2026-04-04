import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Upload, Download, Loader, Printer } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const supabase = getSupabase();

  useEffect(() => {
    loadContractData();
  }, [id]);

  const loadContractData = async () => {
    try {
      setLoading(true);

      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('*, customers:customer_id(ad, soyad, telefon, eposta, adres), designs:design_id(ad, ref_no, genislik, uzunluk, teslim_tarihi)')
        .eq('id', id)
        .single();

      if (contractError) throw contractError;
      setContract(contractData);

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('sozlesme_id', id)
        .order('vade', { ascending: true });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);
    } catch (err) {
      console.error('Sözleşme yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const { error } = await supabase
        .from('contracts')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setContract({ ...contract, status: newStatus });
    } catch (err) {
      console.error('Durum güncelleme hatası:', err);
      alert('Durum güncellenirken hata oluştu');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileName = `${id}-${Date.now()}-${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from('contracts').getPublicUrl(fileName);

      const updatedUrls = [...(contract.signed_pdf_urls || []), publicUrl.publicUrl];
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ signed_pdf_urls: updatedUrls })
        .eq('id', id);

      if (updateError) throw updateError;

      setContract({ ...contract, signed_pdf_urls: updatedUrls });
      setSelectedFile(null);
      alert('PDF başarıyla yüklendi');
    } catch (err) {
      console.error('Dosya yükleme hatası:', err);
      alert('Dosya yüklenirken hata oluştu: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      hazirlandi: 'bg-amber-100 text-amber-800 border border-amber-300',
      imzalandi: 'bg-orange-100 text-orange-800 border border-orange-300',
      aktif: 'bg-green-100 text-green-800 border border-green-300',
      tamamlandi: 'bg-blue-100 text-blue-800 border border-blue-300',
      iptal: 'bg-red-100 text-red-800 border border-red-300',
    };

    const statusLabels = {
      hazirlandi: 'Hazırlandı',
      imzalandi: 'İmzalandı',
      aktif: 'Aktif',
      tamamlandi: 'Tamamlandı',
      iptal: 'İptal',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[status] || statusStyles.hazirlandi}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusStyles = {
      bekliyor: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      kismen_odendi: 'bg-blue-100 text-blue-800 border border-blue-300',
      odendi: 'bg-green-100 text-green-800 border border-green-300',
      gecikli: 'bg-red-100 text-red-800 border border-red-300',
    };

    const statusLabels = {
      bekliyor: 'Bekleniyor',
      kismen_odendi: 'Kısmen Ödendi',
      odendi: 'Ödendi',
      gecikli: 'Gecikli',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[status] || statusStyles.bekliyor}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Sözleşme yükleniyor...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Sözleşme bulunamadı</p>
      </div>
    );
  }

  const totalPayments = payments.reduce((sum, p) => sum + (p.odenen_tutar || 0), 0);
  const remainingAmount = contract.toplam_tutar - totalPayments;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/contracts')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{contract.sozlesme_no}</h1>
            <p className="text-gray-600 mt-1">{formatDate(contract.tarih)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/contracts/${id}/pdf`)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <Printer size={18} />
            PDF Oluştur
          </button>
          {getStatusBadge(contract.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Müşteri Bilgileri</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Ad Soyad</p>
              <p className="font-medium">{contract.customers?.ad} {contract.customers?.soyad}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Telefon</p>
              <p className="font-medium">{contract.customers?.telefon}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">E-posta</p>
              <p className="font-medium">{contract.customers?.eposta}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Adres</p>
              <p className="font-medium text-sm">{contract.customers?.adres}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Tasarım Bilgileri</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Tasarım Adı</p>
              <p className="font-medium">{contract.designs?.ad}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Referans No</p>
              <p className="font-medium">{contract.designs?.ref_no}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Boyutlar</p>
              <p className="font-medium">
                {contract.designs?.genislik} x {contract.designs?.uzunluk} m
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Teslim Tarihi</p>
              <p className="font-medium">{formatDate(contract.designs?.teslim_tarihi)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Sözleşme Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Toplam Tutar</p>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(contract.toplam_tutar)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Ödenen Tutar</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPayments)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Kalan Tutar</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(remainingAmount)}</p>
          </div>
        </div>

        {contract.terms && contract.terms.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Sözleşme Şartları</h3>
            <ul className="space-y-2">
              {contract.terms.map((term, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  {term}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Ödeme Takvimi</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium">Tür</th>
                <th className="px-4 py-3 text-left font-medium">Tutar</th>
                <th className="px-4 py-3 text-left font-medium">Ödenen</th>
                <th className="px-4 py-3 text-left font-medium">Vade</th>
                <th className="px-4 py-3 text-left font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {payment.tur === 'pesinat' ? 'Peşinat' : 'Taksit'}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(payment.tutar)}</td>
                  <td className="px-4 py-3">{formatCurrency(payment.odenen_tutar || 0)}</td>
                  <td className="px-4 py-3">{formatDate(payment.vade)}</td>
                  <td className="px-4 py-3">{getPaymentStatusBadge(payment.durum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">İmzalanan Sözleşmeler</h2>

        {contract.signed_pdf_urls && contract.signed_pdf_urls.length > 0 ? (
          <div className="space-y-2">
            {contract.signed_pdf_urls.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <FileText className="text-red-500" size={20} />
                  <span className="text-sm font-medium text-gray-700">İmzalı Sözleşme {idx + 1}</span>
                </div>
                <Download size={18} className="text-amber-600" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Henüz imzalı sözleşme yüklenmemiş</p>
        )}

        {contract.status !== 'tamamlandi' && contract.status !== 'iptal' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İmzalı PDF Yükle
            </label>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0])}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={() => {
                  if (selectedFile) {
                    handleFileUpload({ target: { files: [selectedFile] } });
                  }
                }}
                disabled={!selectedFile || uploading}
                className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                {uploading ? <Loader size={18} className="animate-spin" /> : <Upload size={18} />}
                Yükle
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Durum Yönetimi</h2>
        <div className="flex flex-wrap gap-2">
          {['hazirlandi', 'imzalandi', 'aktif', 'tamamlandi', 'iptal'].map((status) => (
            <button
              key={status}
              onClick={() => updateStatus(status)}
              disabled={updatingStatus || contract.status === status}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                contract.status === status
                  ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
              }`}
            >
              {status === 'hazirlandi'
                ? 'Hazırlandı'
                : status === 'imzalandi'
                  ? 'İmzalandı'
                  : status === 'aktif'
                    ? 'Aktif'
                    : status === 'tamamlandi'
                      ? 'Tamamlandı'
                      : 'İptal'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContractDetail;
