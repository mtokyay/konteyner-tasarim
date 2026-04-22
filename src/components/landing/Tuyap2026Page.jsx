import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Check, ArrowRight, Gift, Clock, Zap, Users, FileText, PenTool, Star, Copy, CheckCircle2 } from 'lucide-react';

const PROMO_CODE = 'TUYAP2026';

const Tuyap2026Page = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PROMO_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    navigate(`/kayit?promo=${PROMO_CODE}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50">
      {/* Navbar */}
      <nav className="border-b border-amber-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Box className="w-7 h-7 text-amber-600" />
            <span className="font-bold text-lg text-gray-900">Konteyner<span className="text-amber-600">Tasarim</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/sss" className="text-sm text-gray-600 hover:text-gray-900">S.S.S.</Link>
            <Link to="/giris" className="text-sm font-medium text-gray-600 hover:text-gray-900">Giris Yap</Link>
            <button onClick={handleStart}
              className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
              Ucretsiz Basla
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full mb-6">
          <Gift className="w-4 h-4" />
          Fuara Ozel · 30 Gun Ucretsiz Baslangic Paketi
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          Konteyner Ureticileri Icin<br />
          <span className="text-amber-600">Teklif Sureniz Saatten Dakikaya Iner</span>
        </h1>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Konteynertasarim ile olcu girisi, malzeme listesi, maliyet hesabi ve profesyonel teklif PDF'i dakikalar icinde hazir.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button onClick={handleStart}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-amber-200 transition transform hover:scale-105 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Hemen Basla — Ucretsiz
          </button>
          <a href="#nasil" className="text-amber-700 font-medium flex items-center gap-1 hover:underline">
            Nasil calisir? <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Transform stat */}
        <div className="inline-flex items-baseline gap-4 bg-white rounded-2xl shadow-md px-8 py-5 border border-amber-100">
          <span className="text-3xl font-extrabold text-gray-300 line-through">8 saat</span>
          <ArrowRight className="w-6 h-6 text-amber-500" />
          <span className="text-4xl font-extrabold text-amber-600">8 dakika</span>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Neler Yapabilirsiniz?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: PenTool, title: 'Gorsel Tasarim Editoru', desc: 'Konteyner olcusu girin, kapi/pencere/boluntu ekleyin, aninda 2D & 3D goruntuleyin.' },
            { icon: FileText, title: 'Otomatik Maliyet & Teklif', desc: 'Malzeme listesi anlik olusur, maliyet hesabi hazir, profesyonel PDF tek tikla.' },
            { icon: Users, title: 'Musteri & Ekip Yonetimi', desc: 'Musterilerinizi ve ekip uyelerinizi tek panelde yonetin.' },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="nasil" className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">5 Adimda Teklif Hazir</h2>
        <div className="space-y-4">
          {[
            { step: 1, title: 'Giris yap', desc: 'Web veya tabletten hesabina gir.' },
            { step: 2, title: 'Projeyi tasarla', desc: 'Hazir sablonlarla basla, ozellestir.' },
            { step: 3, title: 'Hesapla', desc: 'Malzeme ve maliyet otomatik cikar.' },
            { step: 4, title: 'Teklif gonder', desc: 'Kurumsal PDF tek tikla hazir.' },
            { step: 5, title: 'Takip et', desc: 'Onay – revizyon – kapanis tek ekranda.' },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-4 bg-white rounded-xl p-4 border border-gray-100">
              <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                {s.step}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{s.title}</h4>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Promo Section */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-br from-amber-700 to-amber-900 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          {/* Decorative */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full"></div>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 text-amber-100 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">
              <Star className="w-3.5 h-3.5" />
              Fuar 2026 Kampanyasi
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Fuara Ozel Uretici Firsati</h2>
            <p className="text-amber-100 mb-6 max-w-lg mx-auto">
              Tuyap Fuari'na ozel <strong className="text-white">30 gun ucretsiz Baslangic Plani</strong> (normalde aylik ₺499). Ucretsiz kurulum ve egitim dahil.
            </p>

            {/* Gifts */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Gift className="w-5 h-5 text-amber-200" />
                <span className="text-sm font-medium">30 Gun Baslangic Plani Hediye</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Gift className="w-5 h-5 text-amber-200" />
                <span className="text-sm font-medium">Ucretsiz Kurulum & Egitim</span>
              </div>
            </div>

            {/* Promo Code */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-sm mx-auto mb-6 border border-white/20">
              <p className="text-amber-200 text-xs uppercase tracking-wider font-bold mb-3">Promosyon Kodu</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-2xl font-mono font-extrabold tracking-widest text-white">{PROMO_CODE}</code>
                <button onClick={handleCopy} title="Kopyala"
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
                  {copied ? <CheckCircle2 className="w-5 h-5 text-green-300" /> : <Copy className="w-5 h-5 text-white" />}
                </button>
              </div>
              {copied && <p className="text-green-300 text-xs mt-2">Kopyalandi!</p>}
            </div>

            <button onClick={handleStart}
              className="bg-white text-amber-800 font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition transform hover:scale-105">
              Kayit Ol ve Kodu Kullan
            </button>

            <p className="text-amber-200 text-xs mt-4 opacity-80">
              Kayit sirasinda promosyon kodu otomatik uygulanir
            </p>
          </div>
        </div>
      </section>

      {/* Pricing quick view */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Fiyatlandirma</h2>
        <p className="text-center text-gray-500 text-sm mb-8">Fuara ozel: Baslangic plani 30 gun ucretsiz</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Ucretsiz', price: '₺0', features: ['5 musteri', '5 tasarim', '1 revizyon'], highlight: false },
            { name: 'Baslangic', price: '₺499/ay', features: ['50 musteri', '25 tasarim', 'PDF cikti'], highlight: true, badge: '30 GUN UCRETSIZ' },
            { name: 'Profesyonel', price: '₺999/ay', features: ['200 musteri', '100 tasarim', 'Sozlesme & odeme'], highlight: false },
            { name: 'Kurumsal', price: '₺1.999/ay', features: ['Sinirsiz', 'Musteri portali', 'API erisimi'], highlight: false },
          ].map((plan, i) => (
            <div key={i} className={`relative bg-white rounded-xl p-5 border ${plan.highlight ? 'border-amber-400 ring-2 ring-amber-100 shadow-md' : 'border-gray-200'}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                  {plan.badge}
                </div>
              )}
              <h3 className="font-bold text-gray-900">{plan.name}</h3>
              <p className={`text-xl font-extrabold mt-1 ${plan.highlight ? 'text-amber-600' : 'text-gray-900'}`}>{plan.price}</p>
              <ul className="mt-3 space-y-1.5">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="max-w-3xl mx-auto px-6 py-12 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
          <Clock className="w-8 h-8 text-amber-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Kampanya Suresi Sinirli</h3>
          <p className="text-gray-600 text-sm mb-6">Tuyap Fuari suresince gecerlidir. Kayit olduktan sonra 30 gun boyunca Baslangic planinin tum ozelliklerini ucretsiz kullanin.</p>
          <button onClick={handleStart}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-3 rounded-xl transition">
            Simdi Kayit Ol
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Box className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-gray-900">Konteyner<span className="text-amber-600">Tasarim</span></span>
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <p>0533 727 80 34 · destek@konteynertasarim.com.tr</p>
            <p>konteynertasarim.com.tr</p>
            <p className="text-xs text-gray-400 mt-3 italic">Konteynertasarim — Bir Tokyay Kereste markasidir.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Tuyap2026Page;
