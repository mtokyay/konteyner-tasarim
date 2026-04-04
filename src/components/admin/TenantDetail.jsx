import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, CreditCard, Users, FileText, Palette, Loader2, AlertCircle, Shield, Save, CheckCircle } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({});
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPlan, setEditPlan] = useState('');
  const supabase = getSupabase();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!supabase) { setError('Supabase bağlantısı yok'); return; }

      const [tenantRes, membersRes, plansRes, paymentsRes] = await Promise.all([
        supabase
          .from('tenants')
          .select('*, plans(id, name, slug, price_monthly)')
          .eq('id', id)
          .single(),
        supabase
          .from('tenant_members')
          .select('id, role, is_active, created_at, user_id, profiles:user_id(full_name, email, avatar_url)')
          .eq('tenant_id', id)
          .order('created_at', { ascending: true }),
        supabase.from('plans').select('id, name, slug, price_monthly').order('price_monthly'),
        supabase
          .from('subscription_payments')
          .select('*')
          .eq('tenant_id', id)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (tenantRes.error) throw tenantRes.error;

      setTenant(tenantRes.data);
      setEditStatus(tenantRes.data.subscription_status || '');
      setEditPlan(tenantRes.data.plan_id || '');
      setMembers(membersRes.data || []);
      setPlans(plansRes.data || []);
      setPayments(paymentsRes.data || []);

      // Get usage stats
      const [designsCount, contractsCount, customersCount] = await Promise.all([
        supabase.from('designs').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
        supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
      ]);

      setStats({
        designs: designsCount.count || 0,
        contracts: contractsCount.count || 0,
        customers: customersCount.count || 0,
        members: (membersRes.data || []).filter(m => m.is_active).length,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updates = {};
      if (editStatus !== tenant.subscription_status) updates.subscription_status = editStatus;
      if (editPlan !== tenant.plan_id) updates.plan_id = editPlan;

      if (Object.keys(updates).length === 0) {
        setSuccess('Değişiklik yok');
        return;
      }

      const { error: uErr } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', id);

      if (uErr) throw uErr;
      setSuccess('Firma bilgileri güncellendi');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (v) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(v || 0);
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Firma bulunamadı</p>
        <button onClick={() => navigate('/admin/tenants')} className="mt-4 text-amber-600 hover:text-amber-700">
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin/tenants')} className="flex items-center gap-2 text-amber-600 hover:text-amber-700 transition text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />
        Firmalara Dön
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <p className="text-amber-100 text-sm mt-1">slug: {tenant.slug} | ID: {tenant.id.substring(0, 8)}...</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            tenant.subscription_status === 'active' ? 'bg-green-500/20 text-green-100' :
            tenant.subscription_status === 'trialing' ? 'bg-yellow-500/20 text-yellow-100' :
            'bg-red-500/20 text-red-100'
          }`}>
            {tenant.subscription_status === 'active' ? 'Aktif' :
             tenant.subscription_status === 'trialing' ? 'Deneme' :
             tenant.subscription_status === 'cancelled' ? 'İptal' : tenant.subscription_status}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Üyeler', value: stats.members, icon: Users, color: 'amber' },
          { label: 'Tasarımlar', value: stats.designs, icon: Palette, color: 'blue' },
          { label: 'Sözleşmeler', value: stats.contracts, icon: FileText, color: 'green' },
          { label: 'Müşteriler', value: stats.customers, icon: Users, color: 'purple' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 text-center">
              <Icon className={`w-6 h-6 mx-auto mb-2 text-${s.color}-500 opacity-60`} />
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Management */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" />
            Firma Yönetimi
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kayıt Tarihi</label>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{formatDate(tenant.created_at)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Abonelik Durumu</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
              >
                <option value="active">Aktif</option>
                <option value="trialing">Deneme</option>
                <option value="past_due">Gecikmiş</option>
                <option value="cancelled">İptal</option>
                <option value="expired">Süresi Dolmuş</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select
                value={editPlan}
                onChange={(e) => setEditPlan(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} - ₺{p.price_monthly}/ay</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Abonelik Başlangıç:</span>
                <p className="font-medium">{formatDate(tenant.subscription_start)}</p>
              </div>
              <div>
                <span className="text-gray-500">Abonelik Bitiş:</span>
                <p className="font-medium">{formatDate(tenant.subscription_end)}</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Kaydet
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            Üyeler ({members.length})
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
                    {(m.profiles?.full_name || m.profiles?.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.profiles?.full_name || 'İsimsiz'}</p>
                    <p className="text-xs text-gray-500">{m.profiles?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    m.role === 'owner' ? 'bg-amber-100 text-amber-700' :
                    m.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {m.role === 'owner' ? 'Sahip' : m.role === 'admin' ? 'Yönetici' : 'Üye'}
                  </span>
                  {!m.is_active && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Pasif</span>
                  )}
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">Üye bulunamadı</p>
            )}
          </div>
        </div>
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-600" />
            Ödeme Geçmişi
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Tarih</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">Tutar</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Dönem</th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-600">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-600">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-2 text-gray-600">
                      {p.period_start && p.period_end ? `${formatDate(p.period_start)} - ${formatDate(p.period_end)}` : '-'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'completed' ? 'bg-green-100 text-green-700' :
                        p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {p.status === 'completed' ? 'Ödendi' : p.status === 'pending' ? 'Bekliyor' : 'Başarısız'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
