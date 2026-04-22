import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, ChevronDown, ChevronUp, Search, HelpCircle, ArrowLeft } from 'lucide-react';

const faqData = [
  {
    category: 'Genel',
    questions: [
      {
        q: 'KonteynerTasarim nedir?',
        a: 'KonteynerTasarim, konteyner ev ureticileri icin gelistirilmis bir B2B SaaS platformudur. Gorsel tasarim editoru, otomatik maliyet hesabi, profesyonel PDF teklif, musteri yonetimi, sozlesme ve odeme takibi gibi ozellikleri tek catida sunar.',
      },
      {
        q: 'Kimler kullanabilir?',
        a: 'Konteyner ev ureticileri, prefabrik yapi firmalari, moduler yapi ureticileri ve tiny house uretim yapan isletmeler icin tasarlanmistir.',
      },
      {
        q: 'Internet baglantisi gerekli mi?',
        a: 'Evet, KonteynerTasarim web tabanli bir uygulamadir. Herhangi bir tarayicidan (Chrome, Firefox, Safari) erisebilirsiniz. Kurulum gerektirmez.',
      },
      {
        q: 'Mobil cihazdan kullanabilir miyim?',
        a: 'Evet, platform responsive tasarima sahiptir. Ancak tasarim editoru icin tablet veya bilgisayar kullanmanizi oneririz. Musteri yonetimi, sozlesme takibi gibi islemler mobilde de rahatca yapilabilir.',
      },
    ],
  },
  {
    category: 'Guvenlik & Veri',
    questions: [
      {
        q: 'Verilerim guvende mi?',
        a: 'Evet. Verileriniz SSL sifreleme ile korunur, Supabase altyapisi uzerinde guvenli sunucularda saklanir. Her firma kendi verilerine erisir, diger firmalarin verilerini goremez.',
      },
      {
        q: 'Mevcut musteri verilerimi aktarabilir miyim?',
        a: 'Excel ile toplu musteri aktarimi destegi planlanmaktadir. Su an icin musterilerinizi tek tek ekleyebilirsiniz.',
      },
    ],
  },
  {
    category: 'Fiyatlandirma & Odeme',
    questions: [
      {
        q: 'Ucretli plan almam gerekiyor mu?',
        a: 'Hayir. Ucretsiz plan ile 5 musteri ve 5 tasarima kadar kullanabilirsiniz. Isletmeniz buyudukce planinizi yukseltebilirsiniz.',
      },
      {
        q: 'Sozlesme suresi var mi?',
        a: 'Hayir, tum planlar aylik bazda calisir. Istediginiz zaman iptal edebilirsiniz, herhangi bir taahhut yoktur.',
      },
      {
        q: 'Odeme nasil yapilir?',
        a: 'Kredi karti ile online odeme yapabilirsiniz. Odeme altyapisi olarak guvenilir PayTR kullanilmaktadir.',
      },
      {
        q: 'Yillik odeme indirimi var mi?',
        a: 'Evet, yillik odeme tercih ettiginizde tum planlarda %10 indirim uygulanir.',
      },
      {
        q: 'Iade politikasi nedir?',
        a: 'Ilk 7 gun icinde memnun kalmazsaniz iptal ve iade talep edebilirsiniz.',
      },
    ],
  },
  {
    category: 'Ozellikler',
    questions: [
      {
        q: 'Kac kisi ayni anda kullanabilir?',
        a: 'Plana gore degisir: Ucretsiz ve Baslangic planlarinda 1 kullanici, Profesyonel\'de 5, Kurumsal\'da 20 kisiye kadar ekip uyesi eklenebilir.',
      },
      {
        q: 'Ozel tasarim sablonu eklenebilir mi?',
        a: 'Evet, hazir sablonlardan baslayip konteyner olculerini, kapi/pencere/boluntu yerlesimlerini tamamen ozellestirerek kendi tasariminizi olusturabilirsiniz.',
      },
      {
        q: 'PDF teklifleri ozellestirebilir miyim?',
        a: 'Evet, PDF tekliflere firma logonuz ve bilgileriniz otomatik olarak eklenir. Profesyonel gorunumlu teklifler tek tikla olusturulur.',
      },
      {
        q: 'Rakiplerden farki nedir?',
        a: 'KonteynerTasarim, konteyner ev sektorune ozel olarak gelistirilmistir. Genel mimari yazilimlardan farkli olarak sektorun ihtiyaclarina (maliyet hesabi, malzeme listesi, moduler yapi olculeri) odaklanir.',
      },
    ],
  },
  {
    category: 'Destek',
    questions: [
      {
        q: 'Egitim veriliyor mu?',
        a: 'Evet, ozellikle fuara ozel kampanyamizda ucretsiz kurulum ve egitim destegi sunulmaktadir. Ayrica platform icerisinde kullanim kilavuzlari bulunmaktadir.',
      },
      {
        q: 'Teknik destek nasil?',
        a: 'E-posta (destek@konteynertasarim.com.tr) ve telefon (0533 727 80 34) uzerinden destek alabilirsiniz. Kurumsal planlarda oncelikli destek sunulur.',
      },
      {
        q: 'Deneme suresi var mi?',
        a: 'Ucretsiz plan ile sureli sinir olmadan kullanabilirsiniz. Ayrica fuara ozel TUYAP2026 koduyla 30 gun ucretsiz Baslangic plani hediye edilmektedir.',
      },
    ],
  },
];

export default function SSSPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIdx, setOpenIdx] = useState(null);

  const toggle = (key) => setOpenIdx(openIdx === key ? null : key);

  const allQuestions = faqData.flatMap((cat, ci) =>
    cat.questions.map((q, qi) => ({ ...q, category: cat.category, key: `${ci}-${qi}` }))
  );

  const filtered = searchTerm.trim()
    ? allQuestions.filter(
        (item) =>
          item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.a.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Box className="w-7 h-7 text-amber-600" />
            <span className="font-bold text-lg text-gray-900">
              Konteyner<span className="text-amber-600">Tasarim</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Ana Sayfa
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-8 text-center">
        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-7 h-7 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sikca Sorulan Sorular</h1>
        <p className="text-gray-500">KonteynerTasarim hakkinda merak edilenler</p>
      </div>

      {/* Search */}
      <div className="max-w-3xl mx-auto px-6 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Soru ara..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
          />
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        {filtered ? (
          /* Search results */
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aramanizla eslesen sonuc bulunamadi.</p>
            ) : (
              filtered.map((item) => (
                <FAQItem
                  key={item.key}
                  q={item.q}
                  a={item.a}
                  isOpen={openIdx === item.key}
                  onToggle={() => toggle(item.key)}
                  badge={item.category}
                />
              ))
            )}
          </div>
        ) : (
          /* Grouped by category */
          faqData.map((cat, ci) => (
            <div key={ci} className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block"></span>
                {cat.category}
              </h2>
              <div className="space-y-2">
                {cat.questions.map((item, qi) => {
                  const key = `${ci}-${qi}`;
                  return (
                    <FAQItem
                      key={key}
                      q={item.q}
                      a={item.a}
                      isOpen={openIdx === key}
                      onToggle={() => toggle(key)}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <h3 className="font-bold text-gray-900 mb-1">Sorunuzun cevabini bulamadi misiniz?</h3>
          <p className="text-sm text-gray-600 mb-4">Bize ulasarak detayli bilgi alabilirsiniz.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="tel:05337278034" className="text-sm font-medium text-amber-700 hover:underline">
              0533 727 80 34
            </a>
            <span className="hidden sm:inline text-gray-300">|</span>
            <a href="mailto:destek@konteynertasarim.com.tr" className="text-sm font-medium text-amber-700 hover:underline">
              destek@konteynertasarim.com.tr
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a, isOpen, onToggle, badge }) {
  return (
    <div className={`border rounded-xl transition-all ${isOpen ? 'border-amber-300 bg-amber-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {badge && (
            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
          <span className="font-medium text-gray-900 text-sm">{q}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-amber-600 flex-shrink-0 ml-2" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-4">
          <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}
