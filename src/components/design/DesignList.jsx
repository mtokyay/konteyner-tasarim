import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  Edit,
  Eye,
  Trash2,
} from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

const DesignList = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [filteredDesigns, setFilteredDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Placeholder data
  const placeholderDesigns = [
    {
      id: 1,
      ref_no: 'TK-2024-001',
      customer_name: 'Ahmet Yılmaz',
      dimensions: '400x300',
      status: 'taslak',
      price: 5000,
      date: '2024-04-01',
    },
    {
      id: 2,
      ref_no: 'TK-2024-002',
      customer_name: 'İbrahim Demir',
      dimensions: '450x350',
      status: 'teklif',
      price: 6500,
      date: '2024-03-28',
    },
    {
      id: 3,
      ref_no: 'TK-2024-003',
      customer_name: 'Fatma Kaya',
      dimensions: '400x250',
      status: 'onaylı',
      price: 4800,
      date: '2024-03-25',
    },
    {
      id: 4,
      ref_no: 'TK-2024-004',
      customer_name: 'Murat Ağıl',
      dimensions: '500x400',
      status: 'taslak',
      price: 0,
      date: '2024-03-20',
    },
    {
      id: 5,
      ref_no: 'TK-2024-005',
      customer_name: 'Zeynep Çetinkaya',
      dimensions: '380x320',
      status: 'teklif',
      price: 5500,
      date: '2024-03-15',
    },
  ];

  useEffect(() => {
    const fetchDesigns = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabase();

        if (!supabase) {
          // Use placeholder data
          console.warn('Supabase not configured, using placeholder data');
          setDesigns(placeholderDesigns);
          setFilteredDesigns(placeholderDesigns);
          setLoading(false);
          return;
        }

        // Fetch designs with customer join
        const { data, error: fetchError } = await supabase
          .from('designs')
          .select(
            `
            id,
            ref_no,
            customer_id,
            design_data,
            status,
            toplam_fiyat,
            indirim,
            net_fiyat,
            teslim_tarihi,
            created_at,
            updated_at,
            customers (
              id,
              ad,
              soyad
            )
          `
          )
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        // Transform data
        const transformedDesigns = data.map((design) => ({
          id: design.id,
          ref_no: design.ref_no,
          customer_name: design.customers
            ? `${design.customers.ad} ${design.customers.soyad}`
            : 'Bilinmiyor',
          customer_id: design.customer_id,
          design_data: design.design_data,
          dimensions: extractDimensions(design.design_data),
          status: design.status,
          price: design.net_fiyat || design.toplam_fiyat || 0,
          date: new Date(design.created_at).toLocaleDateString('tr-TR'),
        }));

        setDesigns(transformedDesigns);
        setFilteredDesigns(transformedDesigns);
      } catch (err) {
        console.error('Error fetching designs:', err);
        setError(err.message);
        // Fall back to placeholder data
        setDesigns(placeholderDesigns);
        setFilteredDesigns(placeholderDesigns);
      } finally {
        setLoading(false);
      }
    };

    fetchDesigns();
  }, []);

  // Filter designs based on search and status
  useEffect(() => {
    let filtered = designs;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((design) => design.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (design) =>
          design.customer_name.toLowerCase().includes(term) ||
          design.ref_no.toLowerCase().includes(term)
      );
    }

    setFilteredDesigns(filtered);
  }, [searchTerm, statusFilter, designs]);

  const extractDimensions = (designData) => {
    try {
      if (typeof designData === 'string') {
        const data = JSON.parse(designData);
        return `${data.width || 0}x${data.height || 0}`;
      }
      return `${designData.width || 0}x${designData.height || 0}`;
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'taslak':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock size={12} />
            Taslak
          </span>
        );
      case 'teklif':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle size={12} />
            Teklif
          </span>
        );
      case 'onaylı':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} />
            Onaylı
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">Bilinmiyor</span>;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  const handleNewDesign = () => {
    navigate('/designs/new');
  };

  const handleEditDesign = (designId) => {
    navigate(`/designs/${designId}`);
  };

  const handleDeleteDesign = (designId) => {
    if (window.confirm('Bu tasarımı silmek istediğinize emin misiniz?')) {
      // TODO: Implement delete functionality
      console.log('Delete design:', designId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasarımlar</h1>
            <p className="text-gray-600 mt-1">
              {designs.length} tasarım bulunmaktadır
            </p>
          </div>
          <button
            onClick={handleNewDesign}
            className="flex items-center gap-2 bg-amber-700 text-white px-6 py-2 rounded-lg hover:bg-amber-800 transition-colors font-medium"
          >
            <Plus size={20} />
            Yeni Tasarım
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Müşteri adı veya Ref No ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="taslak">Taslak</option>
                <option value="teklif">Teklif</option>
                <option value="onaylı">Onaylı</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">Hata: {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
              <p className="text-gray-600">Yükleniyor...</p>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && filteredDesigns.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Ref No
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Müşteri
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Boyutlar
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Fiyat
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDesigns.map((design) => (
                    <tr
                      key={design.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {design.ref_no}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {design.customer_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {design.dimensions}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {getStatusBadge(design.status)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {design.price > 0
                          ? formatPrice(design.price)
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {design.date}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditDesign(design.id)}
                            className="p-1.5 text-amber-700 hover:bg-amber-50 rounded transition-colors"
                            title="Düzenle"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteDesign(design.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
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
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredDesigns.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Eye className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tasarım bulunamadı
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Arama kriterlerinize uygun tasarım bulunamadı'
                : 'Henüz tasarım oluşturulmamış'}
            </p>
            <button
              onClick={handleNewDesign}
              className="inline-flex items-center gap-2 bg-amber-700 text-white px-6 py-2 rounded-lg hover:bg-amber-800 transition-colors font-medium"
            >
              <Plus size={20} />
              Yeni Tasarım Oluştur
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignList;
