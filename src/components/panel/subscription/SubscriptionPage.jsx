import React, { useState, useEffect } from 'react';
import { Check, Crown, Loader2, AlertCircle, CreditCard, Calendar, ArrowRight } from 'lucide-react';
import { getSupabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';

const SubscriptionPage = () => {
  const { tenant, plan, membership, isSubscriptionActive } = useTenant();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [error, setError] = useState('');
  const [subscriptionPayments, setSubscriptionPayments] = useState([]);
  const supabase = getSupabase();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!supabase) {
        setPlans([
          { id: 1, name: 'Ücretsiz', slug: 'free', price_monthly: 0, features: { save_design: false, export_pdf: false, contracts: false, payments: false }, limits: { max_customers: 5, max_designs: 3 } },
          { id: 2, name: 'Başlangıç', slug: 'starter', price_monthly: 299, features: { save_design: true, export_pdf: true, contracts: true, payments: true }, limits: { max_customers: 50, max_designs: 20 } },
          { id: 3, name: 'Profesyonel', slug: 'pro', price_monthly: 599, features: { save_design: true, export_pdf: true, contracts: true, payments: true, customer_portal: true, team_management: true }, limits: { max_customers: 200, max_designs: -1, max_members: 5 } },
          { id: 4, name: 'Kurumsal', slug: 'enterprise', price_monthly: 999, features: { save_design: true, export_pdf: true, contracts: true, payments: true, customer_portal: true, team_management: true, api_access: true }, limits: { max_customers: -1, max_designs: -1, max_members: 20 } },
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

      const response = await fetch('/.netlify/functions/paytr-create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          plan_id: selectedPlan.id,
          plan_name: selectedPlan.name,
          amount: selectedPlan.price_monthly * 100,
          email: membership?.profiles?.email || '',
          user_name: membership?.profiles?.full_name || '',
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

  const getPlanFeatures = (p) => {
    const all = [];
    if (p.limits?.max_customers === -1) all.push('Sınırsız müşteri');
    else if (p.limits?.max_customers) all.push(`${p.limits.max_customers} müşteri`);

    if (p.limits?.max_designs === -1) all.push('Sınırsız tasarım');
    else if (p.limits?.max_designs) all.push(`${p.limits.max_designs} aktif tasarım`);

    if (p.features?.save_design) all.push('Tasarım kaydetme');
    else all.push('Tasarım kaydetme (yok)');

    if (p.features?.export_pdf) all.push('PDF çıktı');
    if (p.features?.contracts) all.push('Sözleşme oluşturma');
    if (p.features?.payments) all.push('Ödeme takibi');
    if (p.features?.customer_portal) all.push('Müşteri portalı');
    if (p.features?.team_management) {
      const maxMembers = p.limits?.max_members;
      all.push(maxMembers ? `${maxMembers} çalışana kadar` : 'Ekip yönetimi');
    }
    if (p.features?.api_access) all.push('API erişimi');
    if (p.slug === 'enterprise') all.push('Öncelikli destek');

    return all;
  };

  const isCurrentPlan = (p) => plan?.id === p.id;
  const isHigherPlan = (p) => (p.price_monthly || 0) > (plan?.price_monthly || 0);

  const formatDate = (d) => new Date(d).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

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
                {plan.price_monthly > 0 ? `₺${plan.price_monthly}/ay` : 'Ücretsiz plan'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => {
          const current = isCurrentPlan(p);
          const higher = isHigherPlan(p);
          const features = getPlanFeatures(p);
          const isPopular = p.slug === 'pro';

          return (
            <div key={p.id} className={`bg-white rounded-2xl p-6 border-2 transition-shadow relative ${
              isPopular ? 'border-amber-500 shadow-xl shadow-amber-100' : current ? 'border-green-400 shadow-lg' : 'border-gray-200 hover:border-gray-300'
            }`}>
              {isPopular && !current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Popüler
                </div>
              )}
              {current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Mevcut Plan
                </div>
              )}

              <h3 className="font-bold text-gray-900 text-lg mb-1">{p.name}</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">₺{p.price_monthly}</span>
                {p.price_monthly > 0 && <span className="text-gray-500 text-sm">/ay</span>}
              </div>

              <ul className="space-y-2.5 mb-6">
                {features.map((f, j) => {
                  const isDisabled = f.includes('(yok)');
                  return (
                    <li key={j} className={`flex items-start gap-2 text-sm ${isDisabled ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDisabled ? 'text-gray-300' : 'text-amber-500'}`} />
                      {f.replace(' (yok)', '')}
                    </li>
                  );
                })}
              </ul>

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
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
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

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          Plan değişiklikleriniz hemen geçerli olur. Yükseltme durumunda fark tutarı tahsil edilir.
          İstediğiniz zaman planınızı değiştirebilirsiniz. Sorularınız için destek@konteynertasarim.com.tr adresine yazabilirsiniz.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPage;
