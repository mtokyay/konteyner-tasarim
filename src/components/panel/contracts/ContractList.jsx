import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Eye, Plus, FileText } from 'lucide-react';
import { getSupabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';

const ContractList = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();
  const supabase = getSupabase();
  const { tenantId } = useTenant();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select('*, customers:customer_id(ad, soyad, eposta)')
        .eq('tenant_id', tenantId)
        .order('tarih', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (err) {
      console.error('Sözleşmeler yükleme hatası:', err);
    } finally {
      setLoading(false);
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

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.sozlesme_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.customers?.ad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.customers?.soyad?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || contract.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Sözleşmeler</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Tüm sözleşmeleri yönetin ve takip edin</p>
        </div>
        <button
          onClick={() => navigate('/panel/contracts/new')}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm md:text-base whitespace-nowrap"
        >
          <Plus size={20} />
          Yeni Sözleşme
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Sözleşme No, Müşteri Adı..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Tüm Durumlar</option>
            <option value="hazirlandi">Hazırlandı</option>
            <option value="imzalandi">İmzalandı</option>
            <option value="aktif">Aktif</option>
            <option value="tamamlandi">Tamamlandı</option>
            <option value="iptal">İptal</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Sözleşmeler yükleniyor...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-500">Sözleşme bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Sözleşme No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Müşteri</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Toplam Tutar</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tarih</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Durum</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{contract.sozlesme_no}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {contract.customers?.ad} {contract.customers?.soyad}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(contract.toplam_tutar)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(contract.tarih)}</td>
                    <td className="px-4 py-3">{getStatusBadge(contract.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        to={`/panel/contracts/${contract.id}`}
                        className="inline-flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded transition font-medium text-sm"
                      >
                        <Eye size={16} />
                        Gör
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractList;
