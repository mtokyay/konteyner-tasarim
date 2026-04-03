import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Download, Edit, Filter } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

const STATUS_MAP = {
  hazirlanda: { label: 'Hazırlandı', color: 'bg-yellow-100 text-yellow-800' },
  imzalandi: { label: 'İmzalandı', color: 'bg-blue-100 text-blue-800' },
  aktif: { label: 'Aktif', color: 'bg-green-100 text-green-800' },
  tamamlandi: { label: 'Tamamlandı', color: 'bg-gray-100 text-gray-800' }
};

export default function ContractList() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from('contracts')
        .select('*, customers(ad, eposta)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Sözleşmeleri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (contractId) => {
    try {
      // TODO: Implement PDF generation and download
      console.log('PDF indiriliyor:', contractId);
    } catch (error) {
      console.error('PDF indirme hatası:', error);
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch =
      contract.sozlesme_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.customers?.ad?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || contract.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="p-6 text-center">Yükleniyor...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sözleşmeler</h1>
        <button
          onClick={() => navigate('/designs')}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-medium"
        >
          Yeni Sözleşme
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Sözleşme No veya Müşteri Adı..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">Tümü</option>
              <option value="hazirlanda">Hazırlandı</option>
              <option value="imzalandi">İmzalandı</option>
              <option value="aktif">Aktif</option>
              <option value="tamamlandi">Tamamlandı</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredContracts.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center text-gray-500">
          Sözleşme bulunamadı
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Sözleşme No</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Müşteri</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Toplam Tutar</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Durum</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tarih</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{contract.sozlesme_no}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{contract.customers?.ad}</td>
                  <td className="px-6 py-4 text-sm font-medium text-amber-600">
                    {contract.toplam_tutar?.toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                      minimumFractionDigits: 2
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_MAP[contract.status]?.color}`}>
                      {STATUS_MAP[contract.status]?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(contract.tarih).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Görüntüle"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(contract.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="PDF İndir"
                      >
                        <Download size={18} />
                      </button>
                      {contract.status === 'hazirlanda' && (
                        <button
                          onClick={() => navigate(`/contracts/${contract.id}/edit`)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="Düzenle"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        {[
          { status: 'hazirlanda', label: 'Hazırlandı' },
          { status: 'imzalandi', label: 'İmzalandı' },
          { status: 'aktif', label: 'Aktif' },
          { status: 'tamamlandi', label: 'Tamamlandı' }
        ].map(({ status, label }) => (
          <div key={status} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-amber-600">
              {contracts.filter(c => c.status === status).length}
            </div>
            <div className="text-sm text-gray-600">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
