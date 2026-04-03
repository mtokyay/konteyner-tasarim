import React, { useState, useEffect } from 'react';
import {
  Loader2,
  AlertCircle,
  FileText,
  ArrowLeft,
  Download,
  CheckCircle,
  Maximize2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '../../lib/supabase';

const CustomerContract = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const [contract, setContract] = useState(null);
  const [design, setDesign] = useState(null);
  const [paymentPlan, setPaymentPlan] = useState([]);

  useEffect(() => {
    loadContractData();
  }, []);

  const loadContractData = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = getSupabase();

      if (!supabase) {
        // Placeholder data
        setContract({
          id: 1,
          sozlesme_no: 'SK-001-2024',
          customer_id: 1,
          design_id: 1,
          tarih: '2024-01-15',
          toplam_tutar: 200000,
          status: 'aktif',
          signed_pdf_urls: [
            'https://via.placeholder.com/500x700?text=Sayfa+1',
            'https://via.placeholder.com/500x700?text=Sayfa+2',
            'https://via.placeholder.com/500x700?text=Sayfa+3',
          ],
        });

        setDesign({
          id: 1,
          ad: 'Modern Konteyner Ev',
          genislik: '6m',
          yukseklik: '3m',
          uzunluk: '12m',
          alan: '72m²',
          ozellikler: 'Açılır teras, çift yatak odası, açık mutfak',
        });

        setPaymentPlan([
          { tur: 'pesin', tutar: 50000, tarih: '2024-01-15', odendi: true },
          { tur: 'taksit', tutar: 30000, tarih: '2024-02-15', odendi: true },
          { tur: 'taksit', tutar: 30000, tarih: '2024-03-15', odendi: false },
          { tur: 'taksit', tutar: 30000, tarih: '2024-04-15', odendi: false },
          { tur: 'kalan', tutar: 60000, tarih: '2024-05-15', odendi: false },
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

      // Fetch contract
      const { data: contractData } = await supabase
        .from('contracts')
        .select(
          `
          id,
          sozlesme_no,
          tarih,
          toplam_tutar,
          status,
          signed_pdf_urls,
          design_id,
          designs(
            id,
            ad,
            genislik,
            yukseklik,
            uzunluk,
            alan,
            ozellikler
          )
        `
        )
        .eq('customer_id', customerData.id)
        .eq('status', 'aktif')
        .single();

      if (contractData) {
        setContract(contractData);
        if (contractData.designs) {
          setDesign(contractData.designs);
        }
      }

      // Fetch payment plan
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('sozlesme_id', contractData?.id)
        .order('vade', { ascending: true });

      if (paymentsData) {
        const formattedPayments = paymentsData.map((p) => ({
          tur: p.tur,
          tutar: p.tutar,
          tarih: p.vade,
          odendi: p.durum === 'odendi',
        }));
        setPaymentPlan(formattedPayments);
      }
    } catch (err) {
      setError(err.message || 'Sözleşme yüklenirken hata oluştu');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    // Placeholder for PDF download
    alert('PDF indirilmesi özelliği yakında eklenecektir');
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
              Sözleşmem
            </h1>
            <p className="text-gray-600 mt-1">
              Sözleşme detayları ve ödemeler
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

        {!contract ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="text-blue-800 font-semibold">
              Henüz aktif bir sözleşme bulunmamaktadır
            </p>
          </div>
        ) : (
          <>
            {/* Contract Summary Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {contract.sozlesme_no}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Sözleşme Tarihi: {formatDate(contract.tarih)}
                  </p>
                </div>
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold text-sm">
                  Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-b md:border-b-0 md:border-r border-gray-200 pb-6 md:pb-0 md:pr-6">
                  <p className="text-gray-600 text-sm font-semibold">
                    Toplam Sözleşme Değeri
                  </p>
                  <p className="text-3xl font-bold text-amber-600 mt-2">
                    {formatCurrency(contract.toplam_tutar)}
                  </p>
                </div>
                <div>
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    PDF İndir
                  </button>
                </div>
              </div>
            </div>

            {/* Design Summary */}
            {design && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Tasarım Özeti
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600 text-sm font-semibold">
                      Tasarım Adı
                    </p>
                    <p className="text-lg font-semibold text-gray-900 mt-2">
                      {design.ad}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600 text-sm font-semibold">
                      Genişlik
                    </p>
                    <p className="text-lg font-semibold text-gray-900 mt-2">
                      {design.genislik}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600 text-sm font-semibold">
                      Yükseklik
                    </p>
                    <p className="text-lg font-semibold text-gray-900 mt-2">
                      {design.yukseklik}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600 text-sm font-semibold">
                      Uzunluk
                    </p>
                    <p className="text-lg font-semibold text-gray-900 mt-2">
                      {design.uzunluk}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600 text-sm font-semibold">Alan</p>
                    <p className="text-lg font-semibold text-gray-900 mt-2">
                      {design.alan}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600 text-sm font-semibold">
                      Özellikler
                    </p>
                    <p className="text-sm text-gray-900 mt-2">
                      {design.ozellikler}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sözleşme Maddeleri */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Sözleşme Maddeleri
              </h2>
              <ol className="space-y-3 list-decimal list-inside">
                <li className="text-gray-700">
                  Taraflar sözleşmeyi tamamen kabul edip anlamış sayılırlar.
                </li>
                <li className="text-gray-700">
                  Ödeme planı tabloda belirtildiği şekilde yapılacaktır.
                </li>
                <li className="text-gray-700">
                  İş başlangıcı ön ödemenin tamamlanmasından sonra başlayacaktır.
                </li>
                <li className="text-gray-700">
                  Taşıma ve kurulum müşterinin sorumluluğundadır.
                </li>
                <li className="text-gray-700">
                  Garanti süresi teslimat tarihinden itibaren 1 yıldır.
                </li>
                <li className="text-gray-700">
                  Her iki taraf da yazılı bildiri ile sözleşmeyi feshedebilir.
                </li>
              </ol>
            </div>

            {/* Payment Plan Table */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Ödeme Planı
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Ödeme Türü
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Tutar
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        Vade
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        Durum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paymentPlan.map((payment, idx) => (
                      <tr key={idx} className="hover:bg-amber-50">
                        <td className="px-4 py-3 text-gray-900 font-semibold">
                          {payment.tur === 'pesin'
                            ? 'Peşinat'
                            : payment.tur === 'taksit'
                            ? 'Taksit'
                            : 'Kalan'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatCurrency(payment.tutar)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {formatDate(payment.tarih)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {payment.odendi ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              <CheckCircle className="w-4 h-4" />
                              Ödendi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                              Bekliyor
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contract Pages Gallery */}
            {contract.signed_pdf_urls && contract.signed_pdf_urls.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  İmzalı Sözleşme Sayfaları
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {contract.signed_pdf_urls.map((url, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg overflow-hidden group hover:shadow-lg transition-shadow"
                    >
                      <div className="relative bg-gray-100 aspect-[1/1.4]">
                        <img
                          src={url}
                          alt={`Sözleşme Sayfası ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setSelectedImage({ url, title: `Sözleşme Sayfası ${idx + 1}` })}
                          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all"
                        >
                          <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-gray-900">
                          Sözleşme Sayfası {idx + 1}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerContract;
