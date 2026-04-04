import React, { useState, useEffect } from 'react';
import { Edit, Plus, DollarSign, Users, Zap, Loader2, AlertCircle, Save, X, Check, Trash2, CheckCircle } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

export default function PlanManager() {
  const [plans, setPlans] = useState([]);
  const [planStats, setPlanStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingPlan, setEditingPlan] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const supabase = getSupabase();

  const emptyPlan = {
    name: '',
    slug: '',
    price_monthly: 0,
    features: {
      save_design: false,
      export_pdf: false,
      contracts: false,
      payments: false,
      customer_portal: false,
      team_management: false,
      api_access: false,
    },
    limits: {
      max_customers: 5,
      max_designs: 3,
      max_members: 1,
    },
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      if (!supabase) { setError('Supabase bağlantısı yok'); return; }

      const { data, error: pErr } = await supabase
        .from('plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (pErr) throw pErr;
      setPlans(data || []);

      // Get tenant counts and revenue per plan
      const statsMap = {};
      let totalRevenue = 0;
      let mostPopular = { name: '-', count: 0 };

      for (const p of (data || [])) {
        const { count } = await supabase
          .from('tenants')
          .select('id', { count: 'exact', head: true })
          .eq('plan_id', p.id);

        const tenantCount = count || 0;
        const revenue = tenantCount * (p.price_monthly || 0);
        totalRevenue += revenue;

        if (tenantCount > mostPopular.count) {
          mostPopular = { name: p.name, count: tenantCount };
        }

        statsMap[p.id] = { tenantCount, revenue };
      }

      statsMap._total = { totalRevenue, mostPopular: mostPopular.name, totalTenants: Object.values(statsMap).reduce((s, v) => s + (v.tenantCount || 0), 0) };
      setPlanStats(statsMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (planData) => {
    try {
      setError('');
      setSuccess('');

      if (!planData.name || !planData.slug) {
        setError('Plan adı ve slug zorunludur');
        return;
      }

      if (planData.id) {
        // Update existing
        const { error: uErr } = await supabase
          .from('plans')
          .update({
            name: planData.name,
            slug: planData.slug,
            price_monthly: parseInt(planData.price_monthly) || 0,
            features: planData.features,
            limits: planData.limits,
          })
          .eq('id', planData.id);

        if (uErr) throw uErr;
        setSuccess(`${planData.name} planı güncellendi`);
      } else {
        // Insert new
        const { error: iErr } = await supabase
          .from('plans')
          .insert({
            name: planData.name,
            slug: planData.slug,
            price_monthly: parseInt(planData.price_monthly) || 0,
            features: planData.features,
            limits: planData.limits,
          });

        if (iErr) throw iErr;
        setSuccess(`${planData.name} planı oluşturuldu`);
      }

      setEditingPlan(null);
      setShowNewForm(false);
      await loadPlans();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (plan) => {
    const tenantCount = planStats[plan.id]?.tenantCount || 0;
    if (tenantCount > 0) {
      setError(`Bu plan ${tenantCount} firma tarafından kullanılıyor. Önce firmaları başka plana taşıyın.`);
      return;
    }

    try {
      setError('');
      const { error: dErr } = await supabase
        .from('plans')
        .delete()
        .eq('id', plan.id);
      if (dErr) throw dErr;
      setSuccess(`${plan.name} planı silindi`);
      await loadPlans();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatCurrency = (v) => `₺${(v || 0).toLocaleString('tr-TR')}`;

  const getColorForSlug = (slug) => {
    const map = { free: 'gray', starter: 'blue', pro: 'amber', enterprise: 'purple' };
    return map[slug] || 'gray';
  };

  const headerColorMap = {
    gray: 'from-gray-500 to-gray-600',
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-amber-600',
    purple: 'from-purple-500 to-purple-600',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plan Yönetimi</h1>
          <p className="text-gray-600 mt-1">Abonelik planlarını ve fiyatlandırmayı yönetin</p>
        </div>
        <button
          onClick={() => { setEditingPlan({ ...emptyPlan }); setShowNewForm(true); }}
          className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-5 rounded-lg flex items-center gap-2 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Yeni Plan
        </button>
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

      {/* Edit / Create Form */}
      {editingPlan && (
        <PlanForm
          plan={editingPlan}
          isNew={showNewForm}
          onSave={handleSave}
          onCancel={() => { setEditingPlan(null); setShowNewForm(false); }}
        />
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan) => {
          const color = getColorForSlug(plan.slug);
          const stat = planStats[plan.id] || {};
          const features = [];

          if (plan.limits?.max_customers === -1) features.push('Sınırsız müşteri');
          else if (plan.limits?.max_customers) features.push(`${plan.limits.max_customers} müşteri`);

          if (plan.limits?.max_designs === -1) features.push('Sınırsız tasarım');
          else if (plan.limits?.max_designs) features.push(`${plan.limits.max_designs} tasarım`);

          if (plan.features?.save_design) features.push('Tasarım kaydetme');
          if (plan.features?.export_pdf) features.push('PDF çıktı');
          if (plan.features?.contracts) features.push('Sözleşme');
          if (plan.features?.payments) features.push('Ödeme takibi');
          if (plan.features?.customer_portal) features.push('Müşteri portalı');
          if (plan.features?.team_management) features.push('Ekip yönetimi');
          if (plan.features?.api_access) features.push('API erişimi');

          return (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
              <div className={`bg-gradient-to-r ${headerColorMap[color]} px-5 py-4 text-white`}>
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-white/70 text-xs mt-0.5">{plan.slug}</p>
              </div>

              <div className="p-5">
                <div className="mb-4">
                  <p className="text-3xl font-bold text-gray-900">₺{plan.price_monthly}</p>
                  <p className="text-xs text-gray-500">/ay</p>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Firma sayısı</span>
                    <span className="font-semibold text-gray-700">{stat.tenantCount || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-500">Aylık gelir</span>
                    <span className="font-semibold text-gray-700">{formatCurrency(stat.revenue)}</span>
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Check className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingPlan({ ...plan }); setShowNewForm(false); }}
                    className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-600 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition"
                  >
                    <Edit className="w-3 h-3" />
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(plan)}
                    className="px-3 bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded-lg text-xs font-medium transition"
                    title="Sil"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Statistics */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Platform İstatistikleri</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <DollarSign className="w-7 h-7 text-amber-500" />
            <div>
              <p className="text-xs text-gray-500">Toplam Aylık Gelir (MRR)</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(planStats._total?.totalRevenue)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Users className="w-7 h-7 text-amber-500" />
            <div>
              <p className="text-xs text-gray-500">Toplam Firma</p>
              <p className="text-xl font-bold text-gray-900">{planStats._total?.totalTenants || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Zap className="w-7 h-7 text-amber-500" />
            <div>
              <p className="text-xs text-gray-500">En Popüler Plan</p>
              <p className="text-xl font-bold text-gray-900">{planStats._total?.mostPopular || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Plan Edit/Create Form Component
function PlanForm({ plan, isNew, onSave, onCancel }) {
  const [form, setForm] = useState({ ...plan });

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateFeature = (key, value) => setForm((prev) => ({ ...prev, features: { ...prev.features, [key]: value } }));
  const updateLimit = (key, value) => setForm((prev) => ({ ...prev, limits: { ...prev.limits, [key]: parseInt(value) || 0 } }));

  const featureLabels = {
    save_design: 'Tasarım Kaydetme',
    export_pdf: 'PDF Çıktı',
    contracts: 'Sözleşme Oluşturma',
    payments: 'Ödeme Takibi',
    customer_portal: 'Müşteri Portalı',
    team_management: 'Ekip Yönetimi',
    api_access: 'API Erişimi',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-amber-300 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{isNew ? 'Yeni Plan Oluştur' : `${plan.name} Planını Düzenle`}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Plan Adı</label>
          <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
          <input type="text" value={form.slug} onChange={(e) => updateField('slug', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Aylık Fiyat (₺)</label>
          <input type="number" value={form.price_monthly} onChange={(e) => updateField('price_monthly', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Özellikler</label>
          <div className="space-y-2">
            {Object.entries(featureLabels).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.features?.[key] || false}
                  onChange={(e) => updateFeature(key, e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Limitler (-1 = sınırsız)</label>
          <div className="space-y-3">
            {[
              { key: 'max_customers', label: 'Maks. Müşteri' },
              { key: 'max_designs', label: 'Maks. Tasarım' },
              { key: 'max_members', label: 'Maks. Üye' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <label className="text-sm text-gray-600 w-28">{label}</label>
                <input
                  type="number"
                  value={form.limits?.[key] ?? 0}
                  onChange={(e) => updateLimit(key, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">İptal</button>
        <button
          onClick={() => onSave(form)}
          className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
        >
          <Save className="w-4 h-4" />
          {isNew ? 'Oluştur' : 'Güncelle'}
        </button>
      </div>
    </div>
  );
}
