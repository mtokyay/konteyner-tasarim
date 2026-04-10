import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Check, ArrowRight, Shield, Zap, Users, PenTool, FileText, BarChart3, X as XIcon } from 'lucide-react';

const features = [
  { icon: PenTool, title: '3D Konteyner Tasarım', desc: 'Görsel editörle konteyner tasarımı yapın, kapı, pencere, bölüntü ekleyin.' },
  { icon: Users, title: 'Müşteri Yönetimi', desc: 'Müşteri bilgilerini kaydedin, takip edin ve tasarımlarla ilişkilendirin.' },
  { icon: FileText, title: 'Sözleşme & PDF', desc: 'Otomatik sözleşme oluşturun, PDF çıktısı alın, imza takibi yapın.' },
  { icon: BarChart3, title: 'Ödeme Takibi', desc: 'Taksit planları, vade takibi, ödeme bildirimleri ile finansı yönetin.' },
  { icon: Shield, title: 'Müşteri Portalı', desc: 'Müşterilerinize özel portal sunun — sipariş durumu, ödeme takibi.' },
  { icon: Zap, title: 'Ekip Yönetimi', desc: 'Çalışanlarınıza roller atayın — tasarımcı, üretici, muhasebe.' },
];

const plans = [
  {
    name: 'Ücretsiz', slug: 'free', priceMonthly: 0, priceYearly: 0,
    features: ['5 müşteri', '5 aktif tasarım', 'Tasarım başına 1 revizyon', 'Tasarım editörü', 'Tasarım kaydetme'],
    notIncluded: ['PDF çıktı', 'Sözleşme yönetimi', 'Ödeme takibi', 'Ekip yönetimi'],
    cta: 'Ücretsiz Başla', highlight: false,
  },
  {
    name: 'Başlangıç', slug: 'starter', priceMonthly: 499, priceYearly: 5390,
    features: ['50 müşteri', '25 aktif tasarım', 'Tasarım başına 5 revizyon', 'Tasarım kaydetme', 'PDF çıktı / teklif'],
    notIncluded: ['Sözleşme yönetimi', 'Ödeme takibi', 'Ekip yönetimi'],
    cta: 'Planı Seç', highlight: false,
  },
  {
    name: 'Profesyonel', slug: 'pro', priceMonthly: 999, priceYearly: 10790,
    features: ['200 müşteri', '100 aktif tasarım', 'Tasarım başına 20 revizyon', 'PDF çıktı / teklif', 'Sözleşme oluşturma ve takibi', 'Ödeme takibi', '5 çalışana kadar'],
    notIncluded: [],
    cta: 'Planı Seç', highlight: true,
  },
  {
    name: 'Kurumsal', slug: 'enterprise', priceMonthly: 1999, priceYearly: 21590,
    features: ['Sınırsız müşteri', 'Sınırsız tasarım', 'Sınırsız revizyon', 'Müşteri portalı', '20 çalışana kadar', 'Versiyon takibi', 'Usta / ekip izleme', 'Kalite kontrol modülü', 'API erişimi', 'Öncelikli destek'],
    notIncluded: [],
    cta: 'İletişime Geç', highlight: false,
  },
];

const LandingPage = () => {
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const getPrice = (p) => billingPeriod === 'yearly' ? p.priceYearly : p.priceMonthly;
  const getMonthlyEq = (p) => billingPeriod === 'yearly' && p.priceMonthly > 0 ? Math.round(p.priceYearly / 12) : null;
  const getSavings = (p) => billingPeriod === 'yearly' && p.priceMonthly > 0 ? (p.priceMonthly * 12) - p.priceYearly : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} className="flex items-center gap-2 cursor-pointer">
            <Box className="w-7 h-7 text-amber-600" />
            <span className="font-bold text-lg text-gray-900">Konteyner<span className="text-amber-600">Tasarım</span></span>
          </button>
          <div className="flex items-center gap-4">
            <a href="#ozellikler" className="text-sm text-gray-600 hover:text-gray-900 hidden md:inline">Özellikler</a>
            <a href="#fiyatlandirma" className="text-sm text-gray-600 hover:text-gray-900 hidden md:inline">Fiyatlandırma</a>
            <Link to="/giris" className="text-sm font-medium text-gray-700 hover:text-gray-900">Giriş Yap</Link>
            <Link to="/kayit" className="text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition">
              Ücretsiz Dene
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Zap className="w-4 h-4" /> Konteyner ev üreticileri için SaaS platform
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Konteyner Tasarımdan<br/>
          <span className="text-amber-600">Teslimata Kadar</span> Yönetin
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
          Müşteri yönetimi, görsel konteyner tasarım, sözleşme, ödeme takibi ve müşteri portalı — hepsi tek platformda.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/kayit"
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition shadow-lg shadow-amber-200">
            Ücretsiz Başla <ArrowRight className="w-5 h-5" />
          </Link>
          <a href="#ozellikler" className="text-gray-600 hover:text-gray-900 font-medium px-6 py-3.5">
            Daha Fazla Bilgi
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="ozellikler" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Neler Yapabilirsiniz?</h2>
        <p className="text-gray-600 text-center mb-12 max-w-xl mx-auto">
          Konteyner ev üretim sürecinizin her aşamasını dijitalleştirin.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-6 hover:border-amber-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="fiyatlandirma" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Fiyatlandırma</h2>
          <p className="text-gray-600 text-center mb-8">İşletmenize uygun planı seçin. İstediğiniz zaman yükseltin.</p>

          {/* Billing Period Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-white rounded-full p-1.5 flex items-center gap-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  billingPeriod === 'yearly'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Yıllık
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  billingPeriod === 'yearly'
                    ? 'bg-green-400 text-green-900'
                    : 'bg-green-100 text-green-700'
                }`}>
                  %10 İndirim
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p, i) => {
              const price = getPrice(p);
              const monthlyEq = getMonthlyEq(p);
              const savings = getSavings(p);

              return (
                <div key={i} className={`bg-white rounded-2xl p-6 border-2 transition-shadow ${
                  p.highlight ? 'border-amber-500 shadow-xl shadow-amber-100 relative' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  {p.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
                      En Popüler
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{p.name}</h3>

                  {/* Price Display */}
                  <div className="mb-2">
                    {p.priceMonthly === 0 ? (
                      <>
                        <span className="text-3xl font-bold text-gray-900">₺0</span>
                        <span className="text-gray-400 text-sm ml-1">Ücretsiz</span>
                      </>
                    ) : billingPeriod === 'yearly' ? (
                      <>
                        <span className="text-3xl font-bold text-gray-900">₺{price.toLocaleString('tr-TR')}</span>
                        <span className="text-gray-500 text-sm">/yıl</span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-gray-900">₺{price.toLocaleString('tr-TR')}</span>
                        <span className="text-gray-500 text-sm">/ay</span>
                      </>
                    )}
                  </div>

                  {/* Monthly equivalent & savings for yearly */}
                  {billingPeriod === 'yearly' && monthlyEq ? (
                    <div className="mb-5">
                      <p className="text-sm text-gray-500">
                        aylık <span className="line-through text-gray-400">₺{p.priceMonthly.toLocaleString('tr-TR')}</span>
                        {' '}<span className="font-semibold text-green-600">₺{monthlyEq.toLocaleString('tr-TR')}</span>
                      </p>
                      {savings > 0 && (
                        <p className="text-xs text-green-600 font-medium mt-0.5">
                          Yıllık ₺{savings.toLocaleString('tr-TR')} tasarruf
                        </p>
                      )}
                    </div>
                  ) : billingPeriod === 'monthly' && p.priceMonthly > 0 ? (
                    <div className="mb-5">
                      <p className="text-xs text-gray-400">Yıllık ödemede %10 indirim</p>
                    </div>
                  ) : (
                    <div className="mb-5"></div>
                  )}

                  {/* Features */}
                  <ul className="space-y-2.5 mb-4">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Not Included */}
                  {p.notIncluded.length > 0 && (
                    <ul className="space-y-1.5 mb-4 border-t border-gray-100 pt-3">
                      {p.notIncluded.map((f, j) => (
                        <li key={`no-${j}`} className="flex items-start gap-2 text-sm text-gray-400">
                          <XIcon className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                          <span className="line-through">{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Link to="/kayit"
                    className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition ${
                      p.highlight
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}>
                    {p.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Box className="w-6 h-6 text-amber-500" />
            <span className="font-bold text-white">KonteynerTasarım</span>
          </div>
          <p className="text-sm">Konteyner ev üreticileri için dijital yönetim platformu</p>
          <p className="text-xs mt-4 text-gray-500">© 2025 Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
