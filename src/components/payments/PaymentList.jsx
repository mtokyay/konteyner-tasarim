import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Eye,
  CreditCard,
  AlertCircle,
  Loader2,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  Calendar,
  Search,
} from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

const statusBadgeConfig = {
  bekliyor: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Bekliyor' },
  odendi: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ödendi' },
  gecikti: { bg: 'bg-red-100', text: 'text-red-700', label: 'Gecikti' },
  iptal: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'İptal' },
};

const paymentTypeConfig = {
  pesin: { label: 'Peşinat', color: 'blue' },
  taksit: { label: 'Taksit', color: 'purple' },
  kalan: { label: 'Kalan', color: 'orange' },
};

const PaymentList = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Summary data
  const [summary, setSummary] = useState({
    toplamAlacak: 0,
    toplamTahsilat: 0,
    kalanAlacak: 0,
    gecikenOdemeler: 0,
    gecikenTutar: 0,
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = getSupabase();

      if (!supabase) {
        // Placeholder data
        const placeholderPayments = [
          {
            id: 1,
            musteri_id: 1,
            musteri_adi: 'Ahmet Yılmaz',
            sozlesme_no: 'SK-001-2024',
            tur: 'pesin',
            tutar: 50000,
            odenen_tutar: 50000,
            vade: '2024-01-15',
            odeme_tarihi: '2024-01-14',
            durum: 'odendi',
            odeme_yontemi: 'havale',
          },
          {
            id: 2,
            musteri_id: 2,
            musteri_adi: 'Fatma Kaya',
            sozlesme_no: 'SK-002-2024',
            tur: 'taksit',
            tutar: 30000,
            odenen_tutar: 15000,
            vade: '2024-03-15',
            odeme_tarihi: null,
            durum: 'gecikti',
            odeme_yontemi: null,
          },
          {
            id: 3,
            musteri_id: 3,
            musteri_adi: 'İbrahim Demir',
            sozlesme_no: 'SK-003-2024',
            tur: 'kalan',
            tutar: 40000,
            odenen_tutar: 0,
            vade: '2024-05-20',
            odeme_tarihi: null,
            durum: 'bekliyor',
            odeme_yontemi: null,
          },
          {
            id: 4,
            musteri_id: 1,
            musteri_adi: 'Ahmet Yılmaz',
            sozlesme_no: 'SK-001-2024',
            tur: 'taksit',
            tutar: 30000,
            odenen_tutar: 30000,
            vade: '2024-02-15',
            odeme_tarihi: '2024-02-16',
            durum: 'odendi',
            odeme_yontemi: 'havale',
          },
        ];

        setPayments(placeholderPayments);
        calculateSummary(placeholderPayments);
        return;
      }

      // Fetch payments with customer and contract data
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(
          `
          id,
          musteri_id,
          sozlesme_id,
          tur,
          tutar,
          odenen_tutar,
          vade,
          odeme_tarihi,
          durum,
          odeme_yontemi,
          customers(ad, soyad),
          contracts(sozlesme_no)
        `
        )
        .order('vade', { ascending: true });

      if (paymentsError) {
        throw paymentsError;
      }

      // Format data
      const formattedPayments = paymentsData.map((payment) => ({
        id: payment.id,
        musteri_id: payment.musteri_id,
        musteri_adi: `${payment.customers?.ad} ${payment.customers?.soyad}`,
        sozlesme_no: payment.contracts?.sozlesme_no || 'N/A',
        tur: payment.tur,
        tutar: payment.tutar,
        odenen_tutar: payment.odenen_tutar || 0,
        vade: payment.vade,
        odeme_tarihi: payment.odeme_tarihi,
        durum: payment.durum,
        odeme_yontemi: payment.odeme_yontemi,
      }));

      setPayments(formattedPayments);
      calculateSummary(formattedPayments);
    } catch (err) {
      setError(err.message || 'Ödeme listesi yüklenirken hata oluştu');
      console.error('Payment load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (paymentsList) => {
    const today = new Date();
    let toplamAlacak = 0;
    let toplamTahsilat = 0;
    let gecikenTutar = 0;
    let gecikenCount = 0;

    paymentsList.forEach((payment) => {
      toplamAlacak += payment.tutar;
      toplamTahsilat += payment.odenen_tutar;

      if (new Date(payment.vade) < today && payment.durum === 'bekliyor') {
        gecikenCount += 1;
        gecikenTutar += payment.tutar - payment.odenen_tutar;
      }
    });

    setSummary({
      toplamAlacak,
      toplamTahsilat,
      kalanAlacak: toplamAlacak - toplamTahsilat,
      gecikenOdemeler: gecikenCount,
      gecikenTutar,
    });
  };

  // Filter payments
  useEffect(() => {
    let filtered = payments;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (payment) =>
          payment.musteri_adi.toLowerCase().includes(term) ||
          payment.sozlesme_no.toLowerCase().includes(term)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((payment) => payment.durum === statusFilter);
    }

    if (startDate) {
      filtered = filtered.filter(
        (payment) => new Date(payment.vade) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (payment) => new Date(payment.vade) <= new Date(endDate)
      );
    }

    setFilteredPayments(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, startDate, endDate, payments]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isPaymentOverdue = (payment) => {
    return (
      new Date(payment.vade) < new Date() && payment.durum === 'bekliyor'
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Ödemeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ödeme Listesi</h1>
          <p className="text-gray-600 mt-1">Tüm ödeme kayıtlarını yönetin</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">
                  Toplam Alacak
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {formatCurrency(summary.toplamAlacak)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-200" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">
                  Toplam Tahsilat
                </p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {formatCurrency(summary.toplamTahsilat)}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-200" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">
                  Kalan Alacak
                </p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {formatCurrency(summary.kalanAlacak)}
                </p>
              </div>
              <Clock className="w-10 h-10 text-purple-200" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">
                  Geciken Ödemeler
                </p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {summary.gecikenOdemeler}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-200" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">
                  Geciken Tutar
                </p>
                <p className="text-2xl font-bold text-orange-600 mt-2">
                  {formatCurrency(summary.gecikenTutar)}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-orange-200" />
            </div>
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

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Müşteri veya sözleşme ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="">Tüm Durumlar</option>
              <option value="bekliyor">Bekliyor</option>
              <option value="odendi">Ödendi</option>
              <option value="gecikti">Gecikti</option>
              <option value="iptal">İptal</option>
            </select>

            {/* Start Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* End Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Reset Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setStartDate('');
                setEndDate('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Temizle
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {paginatedPayments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">
                {searchTerm || statusFilter
                  ? 'Arama kriterlerine uygun ödeme bulunamadı'
                  : 'Henüz ödeme kaydı bulunmamaktadır'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">
                        Müşteri
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Sözleşme No
                      </th>
                      <th className="px-6 py-4 text-center font-semibold">
                        Tür
                      </th>
                      <th className="px-6 py-4 text-right font-semibold">
                        Tutar
                      </th>
                      <th className="px-6 py-4 text-right font-semibold">
                        Vade
                      </th>
                      <th className="px-6 py-4 text-right font-semibold">
                        Ödeme Tarihi
                      </th>
                      <th className="px-6 py-4 text-center font-semibold">
                        Durum
                      </th>
                      <th className="px-6 py-4 text-right font-semibold">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedPayments.map((payment) => {
                      const isOverdue = isPaymentOverdue(payment);
                      return (
                        <tr
                          key={payment.id}
                          className={`hover:bg-amber-50 transition-colors ${
                            isOverdue ? 'bg-red-50' : ''
                          }`}
                        >
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {payment.musteri_adi}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {payment.sozlesme_no}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold bg-${paymentTypeConfig[payment.tur]?.color}-100 text-${paymentTypeConfig[payment.tur]?.color}-700`}
                            >
                              {paymentTypeConfig[payment.tur]?.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">
                            {formatCurrency(payment.tutar)}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-700">
                            {formatDate(payment.vade)}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-700">
                            {formatDate(payment.odeme_tarihi)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                statusBadgeConfig[payment.durum]?.bg
                              } ${statusBadgeConfig[payment.durum]?.text}`}
                            >
                              {statusBadgeConfig[payment.durum]?.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/payments/entry?payment_id=${payment.id}`
                                  )
                                }
                                className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                                title="Tahsilat Gir"
                              >
                                <CreditCard className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() =>
                                  navigate(`/payments/${payment.id}`)
                                }
                                className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                title="Detay"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Sayfa {currentPage} / {totalPages} (Toplam{' '}
                    {filteredPayments.length} ödeme)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Önceki
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentList;
