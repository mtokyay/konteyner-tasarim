import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Loader2,
  AlertCircle,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import { getSupabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';

const statusBadgeConfig = {
  yeni: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Yeni' },
  teklif_verildi: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    label: 'Teklif Verildi',
  },
  sozlesme: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Sözleşme' },
  uretimde: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    label: 'Üretimde',
  },
  teslim_edildi: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Teslim Edildi',
  },
};

const CustomerList = () => {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = getSupabase();

      if (!supabase) {
        // Use placeholder data if Supabase not configured
        const placeholderData = [
          {
            id: 1,
            ad: 'Ahmet',
            soyad: 'Yılmaz',
            telefon: '05551234567',
            nereden_geldi: 'referans',
            tasarim_sayisi: 2,
            durum: 'yeni',
          },
          {
            id: 2,
            ad: 'Fatma',
            soyad: 'Kaya',
            telefon: '05559876543',
            nereden_geldi: 'instagram',
            tasarim_sayisi: 1,
            durum: 'teklif_verildi',
          },
          {
            id: 3,
            ad: 'İbrahim',
            soyad: 'Demir',
            telefon: '05553334444',
            nereden_geldi: 'web_sitesi',
            tasarim_sayisi: 3,
            durum: 'sozlesme',
          },
        ];
        setCustomers(placeholderData);
        setFilteredCustomers(placeholderData);
        return;
      }

      // Fetch customers with design count
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(
          `
          id,
          ad,
          soyad,
          telefon,
          eposta,
          nereden_geldi,
          adres,
          notlar,
          created_at,
          designs(count)
        `
        )
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (customersError) {
        throw customersError;
      }

      // Map customers with design count
      const formattedCustomers = customersData.map((customer) => {
        return {
          id: customer.id,
          ad: customer.ad,
          soyad: customer.soyad,
          telefon: customer.telefon,
          eposta: customer.eposta,
          nereden_geldi: customer.nereden_geldi,
          adres: customer.adres,
          notlar: customer.notlar,
          created_at: customer.created_at,
          tasarim_sayisi: customer.designs?.[0]?.count || 0,
          durum: 'yeni',
        };
      });

      setCustomers(formattedCustomers);
      setFilteredCustomers(formattedCustomers);
    } catch (err) {
      setError(err.message || 'Müşteri listesi yüklenirken hata oluştu');
      console.error('Customer load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle search and filter
  useEffect(() => {
    let filtered = customers;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (customer) =>
          (customer.ad || '').toLowerCase().includes(term) ||
          (customer.soyad || '').toLowerCase().includes(term) ||
          (customer.telefon || '').includes(term)
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((customer) => customer.durum === statusFilter);
    }

    setFilteredCustomers(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, customers]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getSourceLabel = (source) => {
    const labels = {
      referans: 'Referans',
      instagram: 'Instagram',
      facebook: 'Facebook',
      web_sitesi: 'Web Sitesi',
      ilan: 'İlan',
      arama: 'Arama',
      diger: 'Diğer',
    };
    return labels[source] || source;
  };

  const renderStatusBadge = (status) => {
    const config = statusBadgeConfig[status] || statusBadgeConfig.yeni;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Müşteriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Müşteriler</h1>
            <p className="text-gray-600 mt-1">
              Toplam {customers.length} müşteri
            </p>
          </div>
          <button
            onClick={() => navigate('/panel/customers/new')}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Müşteri
          </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Ad, soyad veya telefon ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors bg-white"
            >
              <option value="">Tüm Durumlar</option>
              <option value="yeni">Yeni</option>
              <option value="teklif_verildi">Teklif Verildi</option>
              <option value="sozlesme">Sözleşme</option>
              <option value="uretimde">Üretimde</option>
              <option value="teslim_edildi">Teslim Edildi</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {paginatedCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">
                {searchTerm || statusFilter
                  ? 'Arama kriterlerine uygun müşteri bulunamadı'
                  : 'Henüz müşteri kaydı bulunmamaktadır'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">
                        Ad Soyad
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Telefon
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Kaynak
                      </th>
                      <th className="px-6 py-4 text-center font-semibold">
                        Tasarım Sayısı
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
                    {paginatedCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-amber-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">
                            {customer.ad} {customer.soyad}
                          </div>
                          {customer.eposta && (
                            <div className="text-sm text-gray-600">
                              {customer.eposta}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {customer.telefon}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {getSourceLabel(customer.nereden_geldi)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-semibold text-sm">
                            {customer.tasarim_sayisi}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderStatusBadge(customer.durum)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/panel/customers/${customer.id}`}
                              className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                              title="Detayları Görüntüle"
                            >
                              <Eye className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() =>
                                navigate(`/customers/${customer.id}`)
                              }
                              className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Sayfa {currentPage} / {totalPages} (Toplam{' '}
                    {filteredCustomers.length} müşteri)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Önceki
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default CustomerList;
