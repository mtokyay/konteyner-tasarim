import React, { useState, useEffect } from 'react';
import { Eye, Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, Building2, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSupabase } from '../../lib/supabase';

export default function TenantList() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [plans, setPlans] = useState([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const supabase = getSupabase();

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    loadTenants();
  }, [page, statusFilter, planFilter]);

  const loadPlans = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('plans').select('id, name, slug').order('price_monthly');
    setPlans(data || []);
  };

  const loadTenants = async () => {
    try {
      setLoading(true);
      if (!supabase) { setError('Supabase bağlantısı yok'); return; }

      let query = supabase
        .from('tenants')
        .select('id, name, slug, subscription_status, created_at, owner_id, plans!plan_id(id, name, slug)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (statusFilter !== 'all') {
        query = query.eq('subscription_status', statusFilter);
      }
      if (planFilter !== 'all') {
        query = query.eq('plan_id', planFilter);
      }

      const { data, error: qErr, count } = await query;
      if (qErr) throw qErr;

      // Get member counts for each tenant
      const tenantsWithCounts = await Promise.all(
        (data || []).map(async (t) => {
          const { count: memberCount } = await supabase
            .from('tenant_members')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', t.id)
            .eq('is_active', true);
          return { ...t, member_count: memberCount || 0 };
        })
      );

      setTenants(tenantsWithCounts);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) { loadTenants(); return; }
    try {
      setLoading(true);
      const { data, error: sErr, count } = await supabase
        .from('tenants')
        .select('id, name, slug, subscription_status, created_at, owner_id, plans!plan_id(id, name, slug)', { count: 'exact' })
        .or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (sErr) throw sErr;

      const tenantsWithCounts = await Promise.all(
        (data || []).map(async (t) => {
          const { count: memberCount } = await supabase
            .from('tenant_members')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', t.id)
            .eq('is_active', true);
          return { ...t, member_count: memberCount || 0 };
        })
      );

      setTenants(tenantsWithCounts);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      active: { label: 'Aktif', cls: 'bg-green-100 text-green-700' },
      trialing: { label: 'Deneme', cls: 'bg-yellow-100 text-yellow-700' },
      past_due: { label: 'Gecikmiş', cls: 'bg-orange-100 text-orange-700' },
      cancelled: { label: 'İptal', cls: 'bg-red-100 text-red-700' },
      expired: { label: 'Süresi Dolmuş', cls: 'bg-gray-100 text-gray-700' },
    };
    const badge = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>{badge.label}</span>;
  };

  const getPlanBadge = (planName, planSlug) => {
    const colors = {
      free: 'bg-gray-100 text-gray-700',
      starter: 'bg-blue-100 text-blue-700',
      pro: 'bg-amber-100 text-amber-700',
      enterprise: 'bg-purple-100 text-purple-700',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[planSlug] || 'bg-gray-100 text-gray-600'}`}>{planName}</span>;
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Firmalar</h1>
        <p className="text-gray-600 mt-1">Tüm firmaları ve aboneliklerini yönetin</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Firma adı veya slug ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="trialing">Deneme</option>
            <option value="past_due">Gecikmiş</option>
            <option value="cancelled">İptal</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(0); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Tüm Planlar</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button onClick={handleSearch} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            Ara
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Firma</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Üye</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kayıt Tarihi</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                          <p className="text-xs text-gray-400">{t.slug}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">{getPlanBadge(t.plans?.name || 'Free', t.plans?.slug || 'free')}</td>
                      <td className="px-5 py-3">{getStatusBadge(t.subscription_status)}</td>
                      <td className="px-5 py-3 text-center text-sm text-gray-600">{t.member_count}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{formatDate(t.created_at)}</td>
                      <td className="px-5 py-3 text-center">
                        <Link to={`/admin/tenants/${t.id}`} className="text-amber-600 hover:text-amber-700 transition inline-flex">
                          <Eye className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                        <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p>Firma bulunamadı</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-500">
                  Toplam {totalCount} firma, sayfa {page + 1}/{totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
