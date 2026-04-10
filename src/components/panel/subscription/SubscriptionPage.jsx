import React, { useState, useEffect } from 'react';
import { Check, Crown, Loader2, AlertCircle, CreditCard, Calendar, ArrowRight, X as XIcon } from 'lucide-react';
import { getSupabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';
import { useAuth } from '../../../contexts/AuthContext';

const SubscriptionPage = () => {
  const { tenant, plan, membership, isSubscriptionActive } = useTenant();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [error, setError] = useState('');
  const [subscriptionPayments, setSubscriptionPayments] = useState([]);
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'
  const supabase = getSupabase();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!supabase) {
        setPlans([
          {
            id: 1, name: 'Ücretsiz', slug: 'free', price_monthly: 0, price_yearly: 0,
            features: {
              save_design: true, export_pdf: false, contracts: false, payments: false,
              customer_portal: false, team_management: false, version_tracking: false,
              worker_tracking: false, quality_control: false, api_access: false,
            },
            limits: { max_customers: 5, max_designs: 5, max_revisions: 1, max_members: 1 },
          },
          {
            id: 2, name: 'Başlangıç', slug: 'starter', price_monthly: 499, price_yearly: 5390,
            features: {
              save_design: true, export_pdf: true, contracts: false, payments: false,
              customer_portal: false, team_management: false, version_tracking: false,
              worker_tracking: false, quality_control: false, api_access: false,
            },
            limits: { max_customers: 50, max_designs: 25, max_revisions: 5, max_members: 1 },
          },
          {
            id: 3, name: 'Profesyonel', slug: 'pro', price_monthly: 999, price_yearly: 10790,
            features: {
              save_design: true, export_pdf: true, contracts: true, payments: true,
              customer_portal: false, team_management: true, version_tracking: false,
              worker_tracking: false, quality_control: false, api_access: false,
            },
            limits: { max_customers: 200, max_designs: 100, max_revisions: 20, max_members: 5 },
          },
          {
            id: 4, name: 'Kurumsal', slug: 'enterprise', price_monthly: 1999, price_yearly: 21590,
            features: {
              save_design: true, export_pdf: true, contracts: true, payments: true,
              customer_portal: true, team_management: true, version_tracking: true,
              worker_tracking: true, quality_control: true, api_access: true,
            },
            limits: { max_customers: -1, max_designs: -1, max_revisions: -1, max_members: 20 },
          },
        ]);
        setLoading(false);
        return;
      }

      const [plansRes, paymentsRes] = await Promise.all([
        supabase.from('plans').select('*').order('price_monthly', { ascending: true }),
        tenant?.id ? supabase.from('subscription_payments').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(10) : Promise.resolve({ data: [] }),
      ]);

      if (plansRes.error) throw plansRes.error;
      setPlans(plansRes.data || []);
      setSubscriptionPayments(paymentsRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (p) => {
    if (billingPeriod === 'yearly') {
      // If plan has explicit yearly price, use it; otherwise calculate with 10% discount
      if (p.price_yearly && p.price_yearly > 0) return p.price_yearly;
      return Math.round(p.price_monthly * 12 * 0.9);
    }
    return p.price_monthly;
  };

  const getMonthlyEquivalent = (p) => {
    if (billingPeriod !== 'yearly' || p.price_monthly === 0) return null;
    const yearlyTotal = getPrice(p);
    return Math.round(yearlyTotal / 12);
  };

  const getSavings = (p) => {
    if (billingPeriod !== 'yearly' || p.price_monthly === 0) return 0;
    const fullYearly = p.price_monthly * 12;
    const discountedYearly = getPrice(p);
    return fullYearly - discountedYearly;
  };

  const handleUpgrade = async (selectedPlan) => {
    if (!supabase || !tenant) return;

    if (selectedPlan.price_monthly === 0) {
      try {
        setUpgrading(selectedPlan.id);
        const { error: updateError } = await supabase
          .from('tenants')
          .update({ plan_id: selectedPlan.id, subscription_status: 'active' })
          .eq('id', tenant.id);
        if (updateError) throw updateError;
        window.location.reload();
      } catch (err) {
        setError(err.message);
      } finally {
        setUpgrading(null);
      }
      return;
    }

    try {
      setUpgrading(selectedPlan.id);
      setError('');

      const price = getPrice(selectedPlan);
      const periodMonths = billingPeriod === 'yearly' ? 12 : 1;

      const response = await fetch('/.netlify/functions/paytr-create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          plan_id: selectedPlan.id,
          plan_name: selectedPlan.name,
          amount: price * 100, // kuruş
          email: user?.email || '',
          user_name: user?.user_metadata?.full_name || tenant?.name || '',
          billing_period: billingPeriod,
          period_months: periodMonths,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.token) {
        const paytrDiv = document.getElementById('paytr-iframe-container');
        if (paytrDiv) {
          paytrDiv.innerHTML = `<iframe src="https://www.paytr.com/odeme/guvenli/${data.token}" id="paytriframe" frameborder="0" scrolling="no" style="width:100%;height:600px;"></iframe>`;
          paytrDiv.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } catch (err) {
      setError(err.message || 'Ödeme başlatılamadı. Lütfen tekrar deneyin.');
    } finally {
      setUpgrading(null);
    }
  };

  const isUnlimited = (val) => val === -1 || val >= 99999;

  const getPlanFeatures = (p) => {
    const all = [];

    if (isUnlimited(p.limits?.max_customers)) all.push('Sınırsız müşteri');
    else if (p.limits?.max_customers) all.push(`${p.limits.max_customers} müşteri`);

    if (isUnlimited(p.limits?.max_designs)) all.push('Sınırsız tasarım');
    else if (p.limits?.max_designs) all.push(`${p.limits.max_designs} aktif tasarım`);

    if (isUnlimited(p.limits?.max_revisions)) all.push('Sınırsız revizyon');
    else if (p.limits?.max_revisions) all.push(`Tasarım başına ${p.limits.max_revisions} revizyon`);

    if (p.features?.save_design) all.push('Tasarım kaydetme');
    if (p.features?.export_pdf) all.push('PDF çıktı / teklif');
    if (p.features?.contracts) all.push('Sözleşme oluşturma ve takibi');
    if (p.features?.payments) all.push('Ödeme takibi');

    if (p.features?.team_management) {
      const maxMembers = p.limits?.max_members;
      if (isUnlimited(maxMembers)) all.push('Sınırsız ekip üyesi');
      else all.push(maxMembers ? `${maxMembers} çalışana kadar` : 'Ekip yönetimi');
    }

    if (p.features?.customer_portal) all.push('Müşteri portalı');
    if (p.features?.version_tracking) all.push('Versiyon takibi');
    if (p.features?.worker_tracking) all.push('Usta / ekip izleme');
    if (p.features?.quality_control) all.push('Kalite kontrol modülü');
    if (p.features?.api_access) all.push('API erişimi');

    if (p.slug === 'enterprise') all.push('Öncelikli destek');

    return all;
  };

  const getMissingFeatures = (p) => {
    const missing = [];
    if (!p.features?.export_pdf) missing.push('PDF çıktı / teklif');
    if (!p.features?.contracts) missing.push('Sözleşme yönetimi');
    if (!p.features?.payments) missing.push('Ödeme takibi');
    if (!p.features?.team_management) missing.push('Ekip yönetimi');
    if (!p.features?.customer_portal) missing.push('Müşteri portalı');
    if (!p.features?.version_tracking) missing.push('Versiyon takibi');
    if (!p.features?.worker_tracking) missing.push('Usta izleme');
    if (!p.features?.quality_control) missing.push('Kalite kontrol');
    if (!p.features?.api_access) missing.push('API erişimi');
    return missing;
  };

  const isCurrentPlan = (p) => plan?.id === p.id;
  const isHigherPlan = (p) => (p.price_monthly || 0) > (plan?.price_monthly || 0);

  const formatDate = (d) => new Date(d).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

  const planColors = {
    free: { border: 'border-gray-200', header: 'from-gray-500 to-gray-600' },
    starter: { border: 'border-blue-200', header: 'from-blue-500 to-blue-600' },
    pro: { border: 'border-amber-500', header: 'from-amber-500 to-orange-500' },
    enterprise: { border: 'border-purple-300', header: 'from-purple-600 to-indigo-600' },
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Abonelik</h1>
        <p className="text-gray-600 mt-1">Planınızı yönetin ve yükseltin</p>
      </div>

      {plan && (
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-gray-900">Mevcut Plan: {plan.name}</h2>
              </div>
              <p className="text-gray-600 text-sm">
                {plan.price_monthly > 0 ? `₺${plan.price_monthly.toLocaleString('tr-TR')}/ay` : 'Ücretsiz plan'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isSubscriptionActive() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isSubscriptionActive() ? 'Aktif' : 'Pasif'}
            </div>
          </div>
          {tenant?.subscription_end && (
            <p className="text-sm text-gray-500 mt-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Bitiş tarihi: {formatDate(tenant.subscription_end)}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Billing Period Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-full p-1 flex items-center gap-1">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-white text-gray-900 shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Aylık
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              billingPeriod === 'yearly'
                ? 'bg-white text-gray-900 shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Yıllık
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
              %10 İndirim
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => {
          const current = isCurrentPlan(p);
          const higher = isHigherPlan(p);
          const features = getPlanFeatures(p);
          const missingFeatures = getMissingFeatures(p);
          const isPopular = p.slug === 'pro';
          const colors = planColors[p.slug] || planColors.free;
          const price = getPrice(p);
          const monthlyEq = getMonthlyEquivalent(p);
          const savings = getSavings(p);

          return (
            <div key={p.id} className={`bg-white rounded-2xl p-6 border-2 transition-shadow relative ${
              isPopular ? `${colors.border} shadow-xl shadow-amber-100` : current ? 'border-green-400 shadow-lg' : `${colors.border} hover:border-gray-300`
            }`}>
              {isPopular && !current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
                  En Popüler
                </div>
              )}
              {current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Mevcut Plan
                </div>
              )}

              <h3 className="font-bold text-gray-900 text-lg mb-1">{p.name}</h3>
              <div className="mb-2">
                {p.price_monthly === 0 ? (
                  <>
                    <span className="text-3xl font-bold text-gray-900">₺0</span>
                    <span className="text-gray-400 text-sm ml-1">Ücretsiz</span>
                  </>
                ) : billingPeriod === 'yearly' ? (
                  <>
                    <span className="text-3xl font-bold text-gray-900">
                      ₺{price.toLocaleString('tr-TR')}
                    </span>
                    <span className="text-gray-500 text-sm">/yıl</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-gray-900">
                      ₺{price.toLocaleString('tr-TR')}
                    </span>
                    <span className="text-gray-500 text-sm">/ay</span>
                  </>
                )}
              </div>

              {/* Monthly equivalent for yearly */}
              {billingPeriod === 'yearly' && monthlyEq && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    aylık <span className="line-through text-gray-400">₺{p.price_monthly.toLocaleString('tr-TR')}</span>
                    {' '}<span className="font-semibold text-green-600">₺{monthlyEq.toLocaleString('tr-TR')}</span>
                  </p>
                  {savings > 0 && (
                    <p className="text-xs text-green-600 font-medium mt-0.5">
                      Yıllık ₺{savings.toLocaleString('tr-TR')} tasarruf
                    </p>
                  )}
                </div>
              )}

              {billingPeriod === 'monthly' && p.price_monthly > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-400">
                    Yıllık ödemede %10 indirim
                  </p>
                </div>
              )}

              {p.price_monthly === 0 && <div className="mb-4"></div>}

              {/* Aktif özellikler */}
              <ul className="space-y-2 mb-4">
                {features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Eksik özellikler (max 3 göster) */}
              {missingFeatures.length > 0 && (
                <ul className="space-y-1.5 mb-4 border-t border-gray-100 pt-3">
                  {missingFeatures.slice(0, 3).map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-400">
                      <XIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-300" />
                      <span className="line-through">{f}</span>
                    </li>
                  ))}
                  {missingFeatures.length > 3 && (
                    <li className="text-xs text-gray-400 ml-6">
                      +{missingFeatures.length - 3} daha...
                    </li>
                  )}
                </ul>
              )}

              {current ? (
                <div className="text-center py-2.5 rounded-xl font-semibold text-sm bg-green-100 text-green-700">
                  Aktif Plan
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(p)}
                  disabled={upgrading === p.id}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
                    higher
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } disabled:opacity-50`}
                >
                  {upgrading === p.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {higher ? 'Yükselt' : 'Değiştir'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div id="paytr-iframe-container" className="mt-8"></div>

      {subscriptionPayments.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-600" />
            Ödeme Geçmişi
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tarih</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Plan</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Tutar</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Dönem</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subscriptionPayments.map((sp) => (
                  <tr key={sp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{formatDate(sp.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{sp.plan_name || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">₺{sp.amount}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {sp.period_start && sp.period_end
                        ? `${formatDate(sp.period_start)} - ${formatDate(sp.period_end)}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sp.status === 'completed' ? 'bg-green-100 text-green-700' :
                        sp.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {sp.status === 'completed' ? 'Ödendi' : sp.status === 'pending' ? 'Bekliyor' : 'Başarısız'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plan Karşılaştırma Tablosu */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Plan Karşılaştırma</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-48">Özellik</th>
                {plans.map((p) => (
                  <th key={p.id} className="px-4 py-3 text-center font-semibold text-gray-700">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-2.5 text-gray-600 font-medium">Aylık Fiyat</td>
                {plans.map((p) => (
                  <td key={p.id} className="px-4 py-2.5 text-center font-bold text-gray-900">
                    {p.price_monthly > 0 ? `₺${p.price_monthly}` : 'Ücretsiz'}
                  </td>
                ))}
              </tr>
              <tr className="bg-green-50">
                <td className="px-4 py-2.5 text-gray-600 font-medium">Yıllık Fiyat <span className="text-green-600 text-xs">(%10 indirimli)</span></td>
                {plans.map((p) => {
                  const yp = getPrice({ ...p, price_monthly: p.price_monthly }); // force monthly context temporarily
                  const yearlyPrice = p.price_yearly || Math.round(p.price_monthly * 12 * 0.9);
                  return (
                    <td key={p.id} className="px-4 py-2.5 text-center font-bold text-green-700">
                      {p.price_monthly > 0 ? `₺${yearlyPrice.toLocaleString('tr-TR')}` : 'Ücretsiz'}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">Müşteri Limiti</td>
                {plans.map((p) => (
                  <td key={p.id} className="px-4 py-2.5 text-center font-medium">
                    {isUnlimited(p.limits?.max_customers) ? 'Sınırsız' : p.limits?.max_customers}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-2.5 text-gray-600">Tasarım Limiti</td>
                {plans.map((p) => (
                  <td key={p.id} className="px-4 py-2.5 text-center font-medium">
                    {isUnlimited(p.limits?.max_designs) ? 'Sınırsız' : p.limits?.max_designs}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-600">Revizyon Hakkı</td>
                {plans.map((p) => (
                  <td key={p.id} className="px-4 py-2.5 text-center font-medium">
                    {isUnlimited(p.limits?.max_revisions) ? 'Sınırsız' : `${p.limits?.max_revisions || 0}/tasarım`}
                  </td>
                ))}
              </tr>
              {[
                { key: 'save_design', label: 'Tasarım Kaydetme' },
                { key: 'export_pdf', label: 'PDF Çıktı / Teklif' },
                { key: 'contracts', label: 'Sözleşme Yönetimi' },
                { key: 'payments', label: 'Ödeme Takibi' },
                { key: 'team_management', label: 'Ekip Yönetimi' },
                { key: 'customer_portal', label: 'Müşteri Portalı' },
                { key: 'version_tracking', label: 'Versiyon Takibi' },
                { key: 'worker_tracking', label: 'Usta İzleme' },
                { key: 'quality_control', label: 'Kalite Kontrol' },
                { key: 'api_access', label: 'API Erişimi' },
              ].map(({ key, label }, idx) => (
                <tr key={key} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="px-4 py-2.5 text-gray-600">{label}</td>
                  {plans.map((p) => (
                    <td key={p.id} className="px-4 py-2.5 text-center">
                      {p.features?.[key] ? (
                        <Check className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <XIcon className="w-4 h-4 text-gray-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="px-4 py-2.5 text-gray-600">Ekip Üyesi</td>
                {plans.map((p) => (
                  <td key={p.id} className="px-4 py-2.5 text-center font-medium">
                    {p.features?.team_management
                      ? (isUnlimited(p.limits?.max_members) ? 'Sınırsız' : `${p.limits?.max_members || 1}`)
                      : '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          Plan değişiklikleriniz hemen geçerli olur. Yükseltme durumunda fark tutarı tahsil edilir.
          Yıllık ödemede <strong>%10 indirim</strong> uygulanır.
          İstediğiniz zaman planınızı değiştirebilirsiniz. Sorularınız için destek@konteynertasarim.com.tr adresine yazabilirsiniz.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPage;
