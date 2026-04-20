import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { Box, Loader2, AlertCircle, Building2, ArrowRight, Check, Gift } from 'lucide-react';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const step = searchParams.get('step') || 'account';
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const { createTenant, tenant } = useTenant();

  // Step 1: Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Tenant
  const [companyName, setCompanyName] = useState('');

  // Promo code support
  const promoFromUrl = searchParams.get('promo') || '';
  const [promoCode, setPromoCode] = useState(promoFromUrl);
  const [promoApplied, setPromoApplied] = useState(!!promoFromUrl);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already has tenant, go to panel
  if (isAuthenticated && tenant) {
    navigate('/panel', { replace: true });
    return null;
  }

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(email, password, fullName);
      navigate('/kayit?step=tenant', { replace: true });
    } catch (err) {
      setError(err.message || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 30);

      await createTenant(companyName, slug + '-' + Date.now().toString().slice(-4), promoCode || null);
      navigate('/panel', { replace: true });
    } catch (err) {
      setError(err.message || 'Firma oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <Box className="w-8 h-8 text-amber-600" />
            <span className="font-bold text-xl text-gray-900">Konteyner<span className="text-amber-600">Tasarım</span></span>
          </Link>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`flex items-center gap-1.5 text-sm font-medium ${step === 'account' ? 'text-amber-600' : 'text-green-600'}`}>
            {step !== 'account' ? <Check className="w-4 h-4" /> : <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center">1</span>}
            Hesap
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300" />
          <div className={`flex items-center gap-1.5 text-sm font-medium ${step === 'tenant' ? 'text-amber-600' : 'text-gray-400'}`}>
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${step === 'tenant' ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
            Firma
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 'account' ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Hesap Oluştur</h2>
              <p className="text-gray-500 text-sm mb-6">
                {promoApplied ? '30 gün ücretsiz Başlangıç Planı' : '14 gün ücretsiz deneyin'}
              </p>

              {promoApplied && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <Gift className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-700">
                    <strong>Fuar kampanyası aktif!</strong> 30 gün ücretsiz Başlangıç Planı uygulanacak.
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    required autoFocus
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder="Mehmet Yılmaz" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder="ornek@firma.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    required minLength={6}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder="En az 6 karakter" />
                </div>
                {/* Promo Code */}
                {!promoApplied && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Promosyon Kodu <span className="text-gray-400 font-normal">(varsa)</span></label>
                    <div className="flex gap-2">
                      <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-mono tracking-wider"
                        placeholder="Ornek: TUYAP2026" />
                      {promoCode && (
                        <button type="button" onClick={() => setPromoApplied(true)}
                          className="px-3 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium hover:bg-green-100 transition">
                          Uygula
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {promoApplied && !promoFromUrl && (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium font-mono">{promoCode}</span>
                    </div>
                    <button type="button" onClick={() => { setPromoApplied(false); setPromoCode(''); }}
                      className="text-xs text-red-500 hover:underline">Kaldir</button>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Devam Et
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Firma Bilgileri</h2>
                  <p className="text-gray-500 text-sm">Firmanızı oluşturun</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleTenantSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Firma Adı</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                    required autoFocus
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder="Örn: Yılmaz Konteyner" />
                </div>
                <button type="submit" disabled={loading || !companyName.trim()}
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Firmayı Oluştur ve Başla
                </button>
              </form>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-700">
                  14 gün ücretsiz deneme ile başlarsınız. Kredi kartı gerekmez. İstediğiniz zaman plan yükseltebilirsiniz.
                </p>
              </div>
            </>
          )}

          {step === 'account' && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Zaten hesabınız var mı?{' '}
              <Link to="/giris" className="text-amber-600 hover:text-amber-700 font-semibold">Giriş Yap</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
