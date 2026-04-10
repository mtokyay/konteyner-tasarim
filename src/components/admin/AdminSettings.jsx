import React, { useState, useEffect } from 'react';
import {
  Settings,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  Eye,
  EyeOff,
  Shield,
  Globe,
  TestTube,
} from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showKeys, setShowKeys] = useState({});
  const supabase = getSupabase();

  // PayTR settings
  const [paytr, setPaytr] = useState({
    merchant_id: '',
    merchant_key: '',
    merchant_salt: '',
    test_mode: true,
    debug_mode: false,
  });

  // Site settings
  const [site, setSite] = useState({
    site_url: '',
    support_email: '',
    company_name: '',
    trial_days: 14,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('platform_settings')
        .select('*')
        .limit(50);

      if (fetchError) {
        // Table might not exist yet — that's OK
        if (fetchError.code === '42P01') {
          console.warn('platform_settings tablosu henüz oluşturulmamış');
        } else {
          throw fetchError;
        }
      }

      if (data && data.length > 0) {
        const settings = {};
        data.forEach((row) => {
          settings[row.key] = row.value;
        });

        setPaytr({
          merchant_id: settings.paytr_merchant_id || '',
          merchant_key: settings.paytr_merchant_key || '',
          merchant_salt: settings.paytr_merchant_salt || '',
          test_mode: settings.paytr_test_mode === 'true',
          debug_mode: settings.paytr_debug_mode === 'true',
        });

        setSite({
          site_url: settings.site_url || '',
          support_email: settings.support_email || '',
          company_name: settings.company_name || '',
          trial_days: parseInt(settings.trial_days) || 14,
        });
      }
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

      if (!supabase) {
        setSuccess('Demo modda ayarlar kaydedildi');
        setSaving(false);
        return;
      }

      const entries = [
        { key: 'paytr_merchant_id', value: paytr.merchant_id },
        { key: 'paytr_merchant_key', value: paytr.merchant_key },
        { key: 'paytr_merchant_salt', value: paytr.merchant_salt },
        { key: 'paytr_test_mode', value: String(paytr.test_mode) },
        { key: 'paytr_debug_mode', value: String(paytr.debug_mode) },
        { key: 'site_url', value: site.site_url },
        { key: 'support_email', value: site.support_email },
        { key: 'company_name', value: site.company_name },
        { key: 'trial_days', value: String(site.trial_days) },
      ];

      for (const entry of entries) {
        const { error: upsertError } = await supabase
          .from('platform_settings')
          .upsert(
            { key: entry.key, value: entry.value, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );

        if (upsertError) throw upsertError;
      }

      setSuccess('Ayarlar başarıyla kaydedildi');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleShowKey = (key) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const maskValue = (val) => {
    if (!val || val.length < 6) return '••••••••';
    return val.substring(0, 3) + '•'.repeat(Math.max(val.length - 6, 4)) + val.substring(val.length - 3);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-7 h-7 text-amber-600" />
          Platform Ayarları
        </h1>
        <p className="text-gray-600 mt-1 text-sm">PayTR ödeme entegrasyonu ve genel platform ayarları</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* PayTR Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-600" />
          PayTR Ödeme Ayarları
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          PayTR iFrame API bilgilerini girin. Bu bilgiler ödeme işlemleri için kullanılacaktır.
          <a href="https://dev.paytr.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 ml-1">
            PayTR Dokümantasyon →
          </a>
        </p>

        <div className="space-y-4">
          {/* Merchant ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID</label>
            <input
              type="text"
              value={paytr.merchant_id}
              onChange={(e) => setPaytr((p) => ({ ...p, merchant_id: e.target.value }))}
              placeholder="Örn: 123456"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Merchant Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Key</label>
            <div className="relative">
              <input
                type={showKeys.merchant_key ? 'text' : 'password'}
                value={paytr.merchant_key}
                onChange={(e) => setPaytr((p) => ({ ...p, merchant_key: e.target.value }))}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('merchant_key')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKeys.merchant_key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Merchant Salt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Salt</label>
            <div className="relative">
              <input
                type={showKeys.merchant_salt ? 'text' : 'password'}
                value={paytr.merchant_salt}
                onChange={(e) => setPaytr((p) => ({ ...p, merchant_salt: e.target.value }))}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('merchant_salt')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKeys.merchant_salt ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mode toggles */}
          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={paytr.test_mode}
                  onChange={(e) => setPaytr((p) => ({ ...p, test_mode: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-amber-500 transition-colors"></div>
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
              </div>
              <div className="flex items-center gap-1.5">
                <TestTube className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-gray-700">Test Modu</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={paytr.debug_mode}
                  onChange={(e) => setPaytr((p) => ({ ...p, debug_mode: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-amber-500 transition-colors"></div>
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
              </div>
              <span className="text-sm font-medium text-gray-700">Debug Modu</span>
            </label>
          </div>

          {paytr.test_mode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <strong>Test modu aktif.</strong> Gerçek ödeme alınmayacaktır. Canlıya almak için test modunu kapatın.
            </div>
          )}
        </div>
      </div>

      {/* Site Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Globe className="w-5 h-5 text-amber-600" />
          Genel Ayarlar
        </h2>
        <p className="text-sm text-gray-500 mb-6">Platform genelinde kullanılan temel ayarlar</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site URL</label>
            <input
              type="url"
              value={site.site_url}
              onChange={(e) => setSite((s) => ({ ...s, site_url: e.target.value }))}
              placeholder="https://konteynertasarim.com.tr"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destek E-posta</label>
            <input
              type="email"
              value={site.support_email}
              onChange={(e) => setSite((s) => ({ ...s, support_email: e.target.value }))}
              placeholder="destek@konteynertasarim.com.tr"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firma Adı</label>
            <input
              type="text"
              value={site.company_name}
              onChange={(e) => setSite((s) => ({ ...s, company_name: e.target.value }))}
              placeholder="Tokyay Kereste"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deneme Süresi (Gün)</label>
            <input
              type="number"
              min={0}
              max={90}
              value={site.trial_days}
              onChange={(e) => setSite((s) => ({ ...s, trial_days: parseInt(e.target.value) || 0 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Tenant Subscription Management Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-600" />
          Abonelik Yönetimi
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Firma aboneliklerini yönetmek için <strong>Firmalar</strong> menüsünden ilgili firmaya tıklayın.
          Firma detay sayfasından plan değiştirme, abonelik durumu güncelleme ve süre uzatma işlemlerini yapabilirsiniz.
        </p>
        <button
          onClick={() => window.location.href = '/admin/tenants'}
          className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition"
        >
          Firma Listesine Git →
        </button>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition disabled:opacity-50 shadow-md"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Ayarları Kaydet
        </button>
      </div>

      {/* DB Migration Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-semibold text-gray-700 mb-2">Veritabanı Tablosu Gereksinimi</p>
        <p className="mb-2">Bu sayfanın çalışması için <code className="bg-gray-200 px-1 rounded">platform_settings</code> tablosunun oluşturulması gerekir:</p>
        <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">{`CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: sadece super admin erişebilir
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage settings"
  ON platform_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );`}</pre>
      </div>
    </div>
  );
}
