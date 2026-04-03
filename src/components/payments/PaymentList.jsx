import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '../../lib/supabase';
import { Search, ChevronRight, Filter } from 'lucide-react';

export default function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();

      let query = supabase
        .from('payments')
        .select('*, customers:musteri_id(ad, soyad), contracts:sozlesme_id(sozlesme_no)');

      if (filterStatus) {
        query = query.eq('durum', filterStatus);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      let filteredData = data || [];
      if (searchTerm) {
        filteredData = filteredData.filter(payment =>
          `${payment.customers?.ad} ${payment.customers?.soyad}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      }

      setPayments(filteredData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Ödeme yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'odendi':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'bekliyor':
        return 'bg-amber-100 text-amber-800 border border-amber-300';
      case 'gecikti':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'iptal':
        return 'bg-gray-100 text-gray-800 border border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'odendi':
        return 'Ödendi';
      case 'bekliyor':
        return 'Bekliyor';
      case 'gecikti':
        return 'Gecikti';
      case 'iptal':
        return 'İptal';
      default:
        return status;
    }
  };

  const getTurLabel = (tur) => {
    switch (tur) {
      case 'pesinat':
        return 'Peşinat';
      case 'taksit':
        return 'Taksit';
      case 'kalan':
        return 'Kalan';
      default:
        return tur;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Pagination
  const filteredPayments = payments.filter(payment =>
    filterStatus === '' || payment.durum === filterStatus
  );

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Ödeme verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Ödeme Yönetimi</h1>
          <p className="text-gray-600">Tüm ödeme işlemlerini yönetin ve takip edin</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            Hata: {error}
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Müşteri adı ile ara..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 items-center">
              <Filter size={20} className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              >
                <option value="">Tümü</option>
                <option value="bekliyor">Bekliyor</option>
                <option value="odendi">Ödendi</option>
                <option value="gecikti">Gecikti</option>
                <option value="iptal">İptal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="mb-4 text-sm text-gray-600">
          Toplam {filteredPayments.length} ödeme gösteriliyor
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Müşteri</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Sözleşme No</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Tür</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Tutar</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Ödenen</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Vade</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Durum</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedPayments.length > 0 ? (
                  paginatedPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-amber-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {payment.customers?.ad} {payment.customers?.soyad}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {payment.contracts?.sozlesme_no}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {getTurLabel(payment.tur)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(payment.tutar)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-right">
                        {formatCurrency(payment.odenen_tutar || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(payment.vade)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(payment.durum)}`}>
                          {getStatusLabel(payment.durum)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate(`/payments/${payment.id}`)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          Kaydet
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      Ödeme bulunamadı
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Önceki
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-amber-500 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Sonraki
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
