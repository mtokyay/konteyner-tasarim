import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSupabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';

const statusColors = {
  taslak: { bg: 'bg-gray-100', text: 'text-gray-800', badge: 'bg-gray-200' },
  teklif: { bg: 'bg-blue-100', text: 'text-blue-800', badge: 'bg-blue-200' },
  onaylandi: { bg: 'bg-amber-100', text: 'text-amber-800', badge: 'bg-amber-200' },
  uretimde: { bg: 'bg-orange-100', text: 'text-orange-800', badge: 'bg-orange-200' },
  tamamlandi: { bg: 'bg-green-100', text: 'text-green-800', badge: 'bg-green-200' },
  teslim_edildi: { bg: 'bg-emerald-100', text: 'text-emerald-800', badge: 'bg-emerald-200' },
  iptal: { bg: 'bg-red-100', text: 'text-red-800', badge: 'bg-red-200' },
};

const statusLabels = {
  taslak: 'Taslak',
  teklif: 'Teklif',
  onaylandi: 'Onaylandı',
  uretimde: 'Üretimde',
  tamamlandi: 'Tamamlandı',
  teslim_edildi: 'Teslim Edildi',
  iptal: 'İptal',
};

const placeholderData = [
  {
    id: '1',
    ad: 'Modern Ev Tasarımı',
    ref_no: 'TH-001',
    status: 'onaylandi',
    toplam_fiyat: 45000,
    net_fiyat: 42000,
    teslim_tarihi: '2026-05-15',
    created_at: '2026-04-01',
    customers: { ad: 'Ahmet', soyad: 'Yılmaz' },
  },
  {
    id: '2',
    ad: 'Kompakt Tasarım',
    ref_no: 'TH-002',
    status: 'uretimde',
    toplam_fiyat: 35000,
    net_fiyat: 33000,
    teslim_tarihi: '2026-06-01',
    created_at: '2026-03-28',
    customers: { ad: 'Fatma', soyad: 'Kara' },
  },
  {
    id: '3',
    ad: 'Lüks İçerik',
    ref_no: 'TH-003',
    status: 'taslak',
    toplam_fiyat: 55000,
    net_fiyat: 50000,
    teslim_tarihi: '2026-07-10',
    created_at: '2026-04-02',
    customers: { ad: 'Mehmet', soyad: 'Demir' },
  },
];

export default function DesignList() {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();

      if (!supabase) {
        setDesigns(placeholderData);
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from('designs')
        .select('id, ad, ref_no, status, toplam_fiyat, net_fiyat, teslim_tarihi, created_at, customers:customer_id(ad, soyad)')
        .eq('tenant_id', tenantId);

      if (queryError) throw queryError;
      setDesigns(data || []);
    } catch (err) {
      console.error('Error fetching designs:', err);
      setError('Tasarımlar yüklenemedi');
      setDesigns(placeholderData);
    } finally {
      setLoading(false);
    }
  };

  const filteredDesigns = designs.filter(design => {
    const matchesSearch =
      (design.ref_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      design.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (design.customers && `${design.customers.ad} ${design.customers.soyad}`.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = !filterStatus || design.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDesigns.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedDesigns = filteredDesigns.slice(startIdx, startIdx + itemsPerPage);

  const handleDelete = async (id) => {
    if (window.confirm('Bu tasarımı silmek istediğinizden emin misiniz?')) {
      try {
        const supabase = getSupabase();
        if (supabase) {
          await supabase.from('designs').delete().eq('id', id).eq('tenant_id', tenantId);
        }
        fetchDesigns();
      } catch (err) {
        console.error('Error deleting design:', err);
      }
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Tasarımlar</h1>
            <p className="text-gray-600">Tüm tasarımlarınızı yönetin ve izleyin</p>
          </div>
          <Link
            to="/panel/designs/new"
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg"
          >
            <Plus size={20} />
            Yeni Tasarım
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Ref No, tasarım adı veya müşteri ile ara..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Tüm Durumlar</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-4"></div>
              <p>Tasarımlar yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-600">
              <p>{error}</p>
              <button
                onClick={fetchDesigns}
                className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          ) : paginatedDesigns.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg mb-4">Tasarım bulunamadı</p>
              <Link
                to="/panel/designs/new"
                className="inline-block px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                İlk Tasarımı Oluştur
              </Link>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ref No</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tasarım Adı</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Müşteri</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Fiyat</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Durum</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Teslim Tarihi</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDesigns.map((design, idx) => (
                    <tr key={design.id} className={`border-b border-gray-200 hover:bg-amber-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4 font-semibold text-amber-700">{design.ref_no || '-'}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{design.ad}</td>
                      <td className="px-6 py-4 text-gray-700">
                        {design.customers ? `${design.customers.ad} ${design.customers.soyad}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900 font-semibold">
                        {formatCurrency(design.net_fiyat)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColors[design.status]?.badge}`}>
                          {statusLabels[design.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatDate(design.teslim_tarihi)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-3">
                          <Link
                            to={`/panel/designs/${design.id}`}
                            className="text-amber-600 hover:text-amber-800 transition-colors"
                            title="Detayı Görüntüle"
                          >
                            <Eye size={18} />
                          </Link>
                          <Link
                            to={`/panel/designs/${design.id}/editor`}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Düzenle"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(design.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Sil"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Sayfa {currentPage} / {totalPages} ({filteredDesigns.length} tasarım)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={18} />
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
}
