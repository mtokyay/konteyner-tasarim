import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Check, ArrowRight, Shield, Zap, Users, PenTool, FileText, BarChart3 } from 'lucide-react';

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
    name: 'Ücretsiz', price: '0', period: '',
    features: ['5 müşteri', '3 tasarım', 'Tasarım editörü', 'Demo kullanım'],
    notIncluded: ['Tasarım kaydetme', 'PDF çıktı', 'Sözleşme', 'Ödeme takibi'],
    cta: 'Ücretsiz Başla', highlight: false,
  },
  {
    name: 'Başlangıç', price: '299', period: '/ay',
    features: ['50 müşteri', '20 aktif tasarım', 'Tasarım kaydetme', 'PDF çıktı', 'Sözleşme oluşturma', 'Ödeme takibi'],
    notIncluded: ['Müşteri portalı', 'Ekip yönetimi'],
    cta: 'Planı Seç', highlight: false,
  },
  {
    name: 'Profesyonel', price: '599', period: '/ay',
    features: ['200 müşteri', 'Sınırsız tasarım', 'Müşteri portalı', '5 çalışana kadar', 'Firma markası', 'Tüm Başlangıç özellikleri'],
    notIncluded: [],
    cta: 'Planı Seç', highlight: true,
  },
  {
    name: 'Kurumsal', price: '999', period: '/ay',
    features: ['Sınırsız her şey', '20 çalışana kadar', 'API erişimi', 'Öncelikli destek', 'Özel entegrasyon', 'Tüm Pro özellikleri'],
    notIncluded: [],
    cta: 'İletişime Geç', highlight: false,
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Box className="w-7 h-7 text-amber-600" />
            <span className="font-bold text-lg text-gray-900">Konteyner<span className="text-amber-600">Tasarım</span></span>
          </div>
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
          <p className="text-gray-600 text-center mb-12">İşletmenize uygun planı seçin. İstediğiniz zaman yükseltin.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p, i) => (
              <div key={i} className={`bg-white rounded-2xl p-6 border-2 transition-shadow ${
                p.highlight ? 'border-amber-500 shadow-xl shadow-amber-100 relative' : 'border-gray-200 hover:border-gray-300'
              }`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Popüler
                  </div>
                )}
                <h3 className="font-bold text-gray-900 text-lg mb-1">{p.name}</h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">₺{p.price}</span>
                  <span className="text-gray-500 text-sm">{p.period}</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                  {p.notIncluded.map((f, j) => (
                    <li key={`no-${j}`} className="flex items-start gap-2 text-sm text-gray-400 line-through">
                      <Check className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/kayit"
                  className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition ${
                    p.highlight
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}>
                  {p.cta}
                </Link>
              </div>
            ))}
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
