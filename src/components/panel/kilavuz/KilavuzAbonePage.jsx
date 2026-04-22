import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Box,
  Users,
  PenTool,
  FileText,
  CreditCard,
  Settings,
  BarChart3,
  UserCog,
  LayoutDashboardDashboard,
  Shield,
  Search,
  Zap,
  HelpCircle,
  Eye,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Star,
  Palette,
  Download,
  Clock,
  Building2,
  Mail,
  Lock,
} from 'lucide-react';

const printStyles = `
@media print {
  .no-print { display: none !important; }
  .print-break { page-break-before: always; }
  body { font-size: 11pt; }
  a { text-decoration: none; color: black; }
  .print-title { display: block !important; }
}
`;

const tocItems = [
  { id: 'hos-geldiniz', label: '1. Hos Geldiniz', icon: Box },
  { id: 'kayit-giris', label: '2. Kayit ve Giris', icon: Eye },
  { id: 'kontrol-paneli', label: '3. Kontrol Paneli', icon: LayoutDashboard },
  { id: 'musteri-yonetimi', label: '4. Musteri Yonetimi', icon: Users },
  { id: 'tasarim-editoru', label: '5. Tasarim Editoru', icon: PenTool },
  { id: 'pdf-teklif', label: '6. PDF Teklif Olusturma', icon: FileText },
  { id: 'sozlesme-yonetimi', label: '7. Sozlesme Yonetimi', icon: FileText },
  { id: 'odeme-takibi', label: '8. Odeme Takibi', icon: CreditCard },
  { id: 'finans-ozeti', label: '9. Finans Ozeti', icon: BarChart3 },
  { id: 'ekip-yonetimi', label: '10. Ekip Yonetimi', icon: UserCog },
  { id: 'firma-ayarlari', label: '11. Firma Ayarlari', icon: Settings },
  { id: 'plan-abonelik', label: '12. Plan ve Abonelik', icon: Star },
  { id: 'musteri-portali', label: '13. Musteri Portali', icon: Search },
  { id: 'ipuclari', label: '14. Ipuclari ve Kisayollar', icon: Zap },
  { id: 'destek', label: '15. Destek', icon: HelpCircle },
];

function TipBox({ children }) {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg my-4">
      <div className="flex items-start gap-2">
        <Zap className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-amber-900 text-sm">{children}</div>
      </div>
    </div>
  );
}

function WarningBox({ children }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg my-4">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="text-red-900 text-sm">{children}</div>
      </div>
    </div>
  );
}

function SectionHeading({ id, number, title, icon: Icon }) {
  return (
    <h2
      id={id}
      className="text-2xl font-bold text-gray-900 border-b-2 border-amber-400 pb-3 mb-6 flex items-center gap-3 scroll-mt-24"
    >
      <span className="bg-amber-500 text-white w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0">
        {number}
      </span>
      {Icon && <Icon className="w-6 h-6 text-amber-600" />}
      {title}
    </h2>
  );
}

function PathIndicator({ path }) {
  const parts = path.split(' → ');
  return (
    <div className="flex items-center gap-1 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg mb-4 flex-wrap">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          <span className="font-medium text-gray-700">{part}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

function StepList({ steps }) {
  return (
    <ol className="space-y-3 my-4">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="bg-amber-100 text-amber-800 font-bold w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
            {i + 1}
          </span>
          <span className="text-gray-700 leading-relaxed">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export default function KilavuzAbonePage() {
  return (
    <div className="min-h-screen bg-white">
      <style>{printStyles}</style>

      {/* Top Navigation Bar */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            to="/panel"
            className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Panele Don</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:inline">
              KonteynerTasarim Kullanim Kilavuzu
            </span>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <Printer className="w-4 h-4" />
              Yazdir
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <Building2 className="w-10 h-10 text-amber-500" />
            <h1 className="text-4xl font-extrabold text-gray-900">
              Konteyner<span className="text-amber-500">Tasarim</span>
            </h1>
          </div>
          <p className="text-xl text-gray-500 font-medium">Abone Kullanim Kilavuzu</p>
          <p className="text-sm text-gray-400 mt-2">Son guncelleme: Nisan 2026</p>
        </div>

        {/* Table of Contents */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-12 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Box className="w-5 h-5 text-amber-500" />
            Icindekiler
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {tocItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors text-sm"
                >
                  <Icon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>

        {/* ================================================================ */}
        {/* SECTION 1: Hos Geldiniz */}
        {/* ================================================================ */}
        <section className="mb-16">
          <SectionHeading id="hos-geldiniz" number="1" title="Hos Geldiniz" icon={Box} />

          <p className="text-gray-700 leading-relaxed mb-4">
            <strong>KonteynerTasarim</strong>, konteyner ev ureticileri icin gelistirilmis
            profesyonel bir B2B SaaS platformudur. Bu platform sayesinde konteyner ev
            tasarimlarinizi gorsel editorde olusturabilir, musterilerinizi yonetebilir,
            profesyonel PDF teklifler hazirlayabilir, sozlesmelerinizi takip edebilir ve
            odemelerinizi kolayca yonetebilirsiniz.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Bu kilavuz, platformun tum ozelliklerini adim adim anlatmaktadir. Ister yeni
            baslayin ister mevcut bir kullanici olun, ihtiyaciniz olan tum bilgileri burada
            bulabilirsiniz.
          </p>

          <TipBox>
            <strong>Hizli Baslangic:</strong> Platformu ilk kez kullaniyorsaniz, oncelikle
            <em> Firma Ayarlari</em> bolumunden sirket bilgilerinizi tamamlayin, ardindan ilk
            musterinizi ve tasariminizi olusturun.
          </TipBox>
        </section>

        {/* ================================================================ */}
        {/* SECTION 2: Kayit ve Giris */}
        {/* ================================================================ */}
        <section className="mb-16 print-break">
          <SectionHeading id="kayit-giris" number="2" title="Kayit ve Giris" icon={Eye} />

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Yeni Hesap Olusturma</h3>
          <StepList
            steps={[
              'konteynertasarim.com.tr adresine gidin ve "Ucretsiz Dene" butonuna tiklayin.',
              'Kayit formunda adinizi, soyadinizi, e-posta adresinizi ve sifrenizi girin.',
              'Firma adinizi ve telefon numaranizi yazin.',
              'Eger bir promosyon kodunuz varsa "Promosyon Kodu" alanina girin. Promosyon kodlari size ozel indirimler veya ek ozellikler saglayabilir.',
              '"Hesap Olustur" butonuna tiklayin.',
              'E-posta adresinize gelen dogrulama linkine tiklayarak hesabinizi aktif edin.',
            ]}
          />

          <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-8">Giris Yapma</h3>
          <StepList
            steps={[
              'konteynertasarim.com.tr/giris adresine gidin.',
              'Kayitli e-posta adresinizi ve sifrenizi girin.',
              '"Giris Yap" butonuna tiklayin.',
              'Kontrol panelinize yonlendirileceksiniz.',
            ]}
          />

          <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-8">Sifremi Unuttum</h3>
          <StepList
            steps={[
              'Giris sayfasinda "Sifremi Unuttum" linkine tiklayin.',
              'Kayitli e-posta adresinizi girin.',
              'E-postaniza gelen sifre sifirlama linkine tiklayin.',
              'Yeni sifrenizi belirleyin ve onaylayin.',
            ]}
          />

          <TipBox>
            <strong>Guvenlik Onerisi:</strong> Sifreniz en az 8 karakter uzunlugunda olmali ve
            buyuk harf, kucuk harf, rakam icermelidir. Sifrenizi duzenli olarak degistirmenizi
            oneririz.
          </TipBox>
        </section>

        {/* ================================================================ */}
        {/* SECTION 3: Kontrol Paneli (Dashboard) */}
        {/* ================================================================ */}
        <section className="mb-16 print-break">
          <SectionHeading id="kontrol-paneli" number="3" title="Kontrol Paneli (Dashboard)" icon={LayoutDashboard} />

          <p className="text-gray-700 leading-relaxed mb-4">
            Giris yaptiktan sonra sizi karsilayan kontrol paneli, isletmenizin genel durumunu
            tek bakista gormenizi saglar.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Istatistik Kartlari</h3>
          <p className="text-gray-700 leading-relaxed mb-2">
            Panelin ust kisminda dort ana istatistik karti yer alir:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-2">
            <li><strong>Musteriler:</strong> Toplam kayitli musteri sayiniz</li>
            <li><strong>Tasarimlar:</strong> Olusturdgunuz konteyner tasarimi sayisi</li>
            <li><strong>Sozlesmeler:</strong> Aktif ve tamamlanmis sozlesme sayisi</li>
            <li><strong>Ekip:</strong> Platformda kayitli ekip uyesi sayiniz</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Plan Kullanim Cubugu</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Istatistik kartlarinin altinda, mevcut planinizin kullanim durumunu gosteren
            cubuk grafikler bulunur. Bu grafikler musteri limiti, tasarim limiti ve diger plan
            sinirlarinizi gorsel olarak gosterir. Limit dolmak uzereyse cubuk kirmiziya doner
            ve plan yukseltme onerisi gosterilir.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Hizli Islemler</h3>
          <p className="text-gray-700 leading-relaxed mb-2">
            Kontrol panelinde sik kullanilan islemlere hizla erisebileceginiz butonlar vardir:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-2">
            <li>+ Yeni Musteri Ekle</li>
            <li>+ Yeni Tasarim Olustur</li>
            <li>+ Yeni Sozlesme</li>
            <li>Odemeleri Goruntule</li>
          </ul>

          <TipBox>
            <strong>Ipucu:</strong> Kontrol paneli her giris yaptiginizda otomatik
            guncellenir. Guncel verileri gormek icin sayfayi yenilemenize gerek yoktur.
          </TipBox>
        </section>

        {/* ================================================================ */}
        {/* SECTION 4: Musteri Yonetimi */}
        {/* ================================================================ */}
        <section className="mb-16 print-break">
          <SectionHeading id="musteri-yonetimi" number="4" title="Musteri Yonetimi" icon={Users} />
          <PathIndicator path="Panel → Musteriler → + Yeni Musteri" />

          <p className="text-gray-700 leading-relaxed mb-4">
            Musteri yonetimi modulu, tum musterilerinizi tek bir yerde organize etmenizi saglar.
            Her musteri icin detayli bilgi karti olusturabilir, gecmis tasarim ve sozlesmelerine
            erisebilirsiniz.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Yeni Musteri Ekleme</h3>
          <StepList
            steps={[
              'Sol menuden "Musteriler" bolumune gidin.',
              'Sag ust kosedeki "+ Yeni Musteri" butonuna tiklayin.',
              'Acilan formda asagidaki bilgileri doldurun.',
              '"Kaydet" butonuna tiklayarak musteriyi kaydedin.',
            ]}
          />

          <div className="bg-gray-50 rounded-xl p-5 my-4">
            <h4 className="font-semibold text-gray-800 mb-3">Musteri Formu Alanlari</h4>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span><strong>Ad</strong> (zorunlu)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span><strong>Soyad</strong> (zorunlu)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span><strong>Telefon</strong> (zorunlu)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span><strong>E-posta</strong> (istege bagli)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span><strong>Adres</strong> (istege bagli)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span><strong>Notlar</strong> (istege bagli)</span>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-8">Musteri Arama ve Filtreleme</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Musteriler listesinin ust kismindaki arama cubugundan musteri adi, soyadi, telefon
            numarasi veya e-posta adresi ile arama yapabilirsiniz. Sonuclar siz yazarken
            anlik olarak filtrelenir.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Musteri Detaylari</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Herhangi bir musterinin adina tiklayarak detay sayfasina ulasabilirsiniz. Detay
            sayfasinda musteriye ait tum tasarimlar, sozlesmeler ve odeme gecmisi listelenir.
            Ayrica musteri bilgilerini duzenlemek icin "Duzenle" butonunu kullanabilirsiniz.
          </p>

          <TipBox>
            <strong>Ipucu:</strong> Notlar alanini musteri ile yaptiginiz gorusmeleri ve ozel
            istekleri kaydetmek icin kullanin. Bu bilgiler ileride teklif hazirlarken cok
            faydali olacaktir.
          </TipBox>
        </section>

        {/* ================================================================ */}
        {/* SECTION 5: Tasarim Editoru */}
        {/* ================================================================ */}
        <section className="mb-16 print-break">
          <SectionHeading id="tasarim-editoru" number="5" title="Tasarim Editoru" icon={PenTool} />
          <PathIndicator path="Panel → Tasarimlar → + Yeni Tasarim → Editoru Ac" />

          <p className="text-gray-700 leading-relaxed mb-4">
            Tasarim Editoru, KonteynerTasarim platformunun en guclu ozelligidir. Bu gorsel
            editor sayesinde konteyner ev planlarinizi surukle-birak yontemiyle kolayca
            olusturabilirsiniz.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Yeni Tasarim Olusturma</h3>
          <StepList
            steps={[
              'Sol menuden "Tasarimlar" bolumune gidin.',
              '"+ Yeni Tasarim" butonuna tiklayin.',
              'Tasarima bir isim verin (ornegin: "3+1 Cift Katli Konteyner Ev").',
              'Konteyner tipini secin (standart 20ft, 40ft veya ozel boyut).',
              '"Editoru Ac" butonuna tiklayarak gorsel editore gecin.',
            ]}
          />

          <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-8">Editoru Kullanma</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Gorsel editor acildiginda konteynerinizin ust gorunumunu (plan gorunusu)
            goreceksiniz. Sol taraftaki arac cubugunda sunlari bulabilirsiniz:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-2">
            <li><strong>Kapi Ekleme:</strong> Farkli kapi tipleri (tek kanatli, cift kanatli, surme) secip konteyner uzerine surukleyin.</li>
            <li><strong>Pencere Ekleme:</strong> Cesitli pencere boyutlari arasinden secim yapin ve duvara yerlestirin.</li>
            <li><strong>Bolme Duvari:</strong> Konteyner icini odalara bolmek icin bolme duvarlari ekleyin.</li>
            <li><strong>Mobilya ve Ekipman:</strong> Mutfak, banyo, WC gibi hazir sablonlari kullanin.</li>
            <li><strong>Olcu Gosterimi:</strong> Olculer otomatik olarak hesaplanir ve gosterilir.</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Elemanlari Duzenleme</h3>
          <StepList
            steps={[
              'Bir eleman (kapi, pencere, bolme) uzerine tiklayin.',
              'Sag tarafta acilan ozellikler panelinde boyut, konum ve diger ayarlari degistirin.',
              'Elemani fare ile surukleyerek yeniden konumlandirim.',
              'Silmek icin elemani secip klavyeden Delete tusuna basin veya sag tik menusunden "Sil" secenegini kullanin.',
            ]}
          />

          <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-8">Kaydetme ve Sablon Kullanma</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Tasariminiz uzerinde calisirken duzenli olarak "Kaydet" butonuna tiklayin.
            Platform otomatik kaydetme ozelligi sunsa da, onemli degisikliklerden sonra
            manuel kaydetmenizi oneririz.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Sik kullandiginiz tasarimlari sablon olarak kaydedebilirsiniz. Bunun icin
            "Sablon Olarak Kaydet" secenegini kullanin. Yeni tasarim olustururken bu
            sablonlardan birini baslangic noktasi olarak secebilirsiniz.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Revizyon Gecmisi</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Her kaydetme islemi bir revizyon olarak tutulur. "Revizyon Gecmisi" butonuna
            tiklayarak onceki versiyonlari gorebilir ve istediginiz bir versiyona geri
            donebilirsiniz. Bu ozellik yanlis silme veya degisiklik durumlarinda hayat
            kurtarici olacaktir.
          </p>

          <TipBox>
            <strong>Ipucu:</strong> Tasarim editorunde Ctrl+Z (geri al) ve Ctrl+Y (yinele)
            kisayollarini kullanabilirsiniz. Ayrica Ctrl+S ile hizla kaydedebilirsiniz.
          </TipBox>
        </section>

        {/* ================================================================ */}
        {/* SECTION 6: PDF Teklif Olusturma */}
        {/* ================================================================ */}
        <section className="mb-16 print-break">
          <SectionHeading id="pdf-teklif" number="6" title="PDF Teklif Olusturma" icon={FileText} />
          <PathIndicator path="Tasarim detay → PDF Teklif" />

          <p className="text-gray-700 leading-relaxed mb-4">
            Tasarimlarinizdan profesyonel PDF teklifler olusturabilirsiniz. Bu teklifler
            firma logonuzu, iletisim bilgilerinizi ve tasarim gorselllerini icerir.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Teklif Olusturma Adimlari</h3>
          <StepList
            steps={[
              'Tasarimlar listesinden ilgili tasarimii secin ve detay sayfasina gidin.',
              '"PDF Teklif" butonuna tiklayin.',
              'Teklif ayarlarini yapilandirin: musteriye ozel fiyatlandirma, opsiyonel kalemler, ozel notlar.',
              'Onizleme ekraninda teklifi kontrol edin.',
              '"PDF Olustur" butonuna tiklayarak PDF dosyasini indirin veya dogrudan musteriye e-posta ile gonderin.',
            ]}
          />

          <div className="bg-gray-50 rounded-xl p-5 my-4">
            <h4 className="font-semibold text-gray-800 mb-3">PDF Teklifte Yer Alan Bilgiler</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
              <li>Firma logosu ve iletisim bilgileri</li>
              <li>Musteri adi ve iletisim bilgileri</li>
              <li>Teklif numarasi ve tarihi</li>
              <li>Konteyner tasarim gorseli (plan gorunumu)</li>
              <li>Malzeme ve iscilik kalemleri</li>
              <li>Toplam fiyat ve KDV hesaplamasi</li>
              <li>Gecerlilik suresi ve odeme kosullari</li>
            </ul>
          </div>

          <TipBox>
            <strong>Ipucu:</strong> PDF tekliflerinizin profesyonel gorunmesi icin
            "Firma Ayarlari" bolumunden firma logonuzu ve tam adres bilgilerinizi
            mutlaka yukleyin.
          </TipBox>
        </section>

        {/* ================================================================ */}
        {/* SECTION 7: Sozlesme Yonetimi */}
        {/* ================================================================ */}
        <section className="mb-16 print-break">
          <SectionHeading id="sozlesme-yonetimi" number="7" title="Sozlesme Yonetimi" icon={FileText} />
          <PathIndicator path="Panel → Sozlesmeler → + Yeni Sozlesme" />

          <p className="text-gray-700 leading-relaxed mb-4">
            Sozlesme yonetimi modulu, musterilerinizle yaptginiz sozlesmeleri dijital ortamda
            takip etmenize olanak tanir. Sozlesmeleri tasarimlar ve musterilerle iliskilendirebilirsiniz.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Yeni Sozlesme Olusturma</h3>
          <StepList
            steps={[
              '"Sozlesmeler" bolumune gidin ve "+ Yeni Sozlesme" butonuna tiklayin.',
              'Ilgili musteriyi listeden secin.',
              'Ilgili tasarimi secin (opsiyonel).',
              'Sozlesme sablonlarindan birini secin veya sifirdan olusturun.',
              'Sozlesme detaylarini doldurun: baslangic tarihi, teslim tarihi, toplam tutar, ozel kosullar.',
              '"Kaydet" butonuna tiklayin.',
            ]}
          />

          <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-8">Sozlesme Durumlari</h3>
          <div className="grid sm:grid-cols-3 gap-3 my-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <span className="text-yellow-700 font-bold text-sm">Taslak</span>
              <p className="text-xs text-yellow-600 mt-1">Henuz onaylanmamis, duzenleme yapilabilir</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <span className="text-green-700 font-bold text-sm">Onayli</span>
              <p className="text-xs text-green-600 mt-1">Musteri tarafindan onaylanmis</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <span className="text-red-700 font-bold text-sm">Iptal</span>
              <p className="text-xs text-red-600 mt-1">Iptal edilmis sozlesme</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-8">PDF Cikti</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Onayli sozlesmeleri PDF formatinda indirebilirsiniz. Sozlesme detay sayfasindaki
            "PDF Indir" butonunu kullanarak imzaya hazir sozlesme belgesini olusturun.
          </p>

          <TipBox>
            <strong>Ipucu:</strong> Sik kullandiginiz sozlesme maddelerini sablon olarak
            kaydedin. Bu sayede yeni sozlesmelerde ayni maddeleri tekrar tekrar yazmak
            zorunda kalmazsiniz.
          </TipBox>
        </section>

        {/* ================================================================ */}
        {/* SECTION 8: Odeme Takibi */}
        {/* ================================================================ */}
        <section className="mb-16 print-break">
          <SectionHeading id="odeme-takibi" number="8" title="Odeme Takibi" icon={CreditCard} />
          <PathIndicator path="Panel → Odemeler" />

          <p className="text-gray-700 leading-relaxed mb-4">
            Odeme takibi modulu, musterilerinizden alacaklarinizi ve odeme planlarinizi
            duzenli bir sekilde yonetmenizi saglar.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Odeme Kaydi Olusturma</h3>
          <StepList
            steps={[
              '"Odemeler" bolumune gidin.',
              '"+ Yeni Odeme" butonuna tiklayin.',
              'Ilgili sozlesmeyi veya musteriyi secin.',
              'Odeme turunu belirleyin: tek seferlik veya taksitli.',
              'Taksitli odemelerde taksit sayisini, baslangic tarihini ve taksit araligini girin.',
              'Odeme tutarini ve para birimini girin.',
              '"Kaydet" butonuna tiklayin.',
            ]}
          />

          <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-8">Taksit Planlari</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Buyuk tutarli sozlesmeler icin taksit plani olusturabilirsiniz. Sistem otomatik
            olarak taksit tarihlerini ve tutarlarini hesaplar. Her taksitin vade tarihini
            ve durumunu ayri ayri takip edebilirsiniz.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Odeme Durumlari</h3>
          <div className="grid sm:grid-cols-3 gap-3 my-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 text-amber-600 mx-auto mb-1" />
              <span className="text-amber-700 font-bold text-sm">Bekliyor</span>
              <p className="text-xs text-amber-600 mt-1">Vadesi gelmemis odeme</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <span className="text-green-700 font-bold text-sm">Odendi</span>
              <p className="text-xs text-green-600 mt-1">Odemesi tamamlanmis</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <span className="text-red-700 font-bold text-sm">Gecikmis</span>
              <p className="text-xs text-red-600 mt-1">Vadesi gecmis odeme</p>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed mb-4">
            Bir odemeyi "odendi" olarak isaretlemek icin ilgili odeme satirindaki
            "Odendi Isaretle" butonuna tiklayin. Odeme tarihi ve yontemi (nakit, havale, kredi
            karti) bilgilerini girebilirsiniz.
          </p>

          <WarningBox>
            <strong>Dikkat:</strong> Vadesi gecmis odemeler kontrol panelinde kirmizi
            uyari olarak gosterilir. Bu odemeleri duzenli olarak kontrol edin ve
            musterilerinize hatirlama mesaji gonderin.
          </WarningBox>
        </section>

        {/* ================================================================ */}
        {/* SECTION 9: Finans Ozeti */}
        {/* ================================================================ */}
        <section className="mb-16 print-break">
          <SectionHeading id="finans-ozeti" number="9" title="Finans Ozeti" icon={BarChart3} />
          <PathIndicator path="Panel → Finans" />

          <p className="text-gray-700 leading-relaxed mb-4">
            Finans ozeti sayfasi, isletmenizin mali durumunu grafikler ve ozet tablolarla
            gosterir.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Finans Panelinde Gorunenler</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-2">
            <li><strong>Toplam Gelir:</strong> Tum sozlesmelerden elde edilen toplam tutar</li>
            <li><strong>Tahsil Edilen:</strong> Simdiye kadar tahsil edilen toplam odeme</li>
            <li><strong>Bekleyen Alacak:</strong> Henuz odenmemis toplam tutar</li>
            <li><strong>Gecikmis Alacak:</strong> Vadesi gecmis odemelerin toplami</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Grafikler</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Aylik gelir dagilimi, musteri bazinda ciro, ve odeme durumu pasta grafigi gibi
            gorsellerle finansal durumunuzu analiz edebilirsiniz. Tarih araligini
            filtreleyerek belirli donemler icin rapor alabilirsiniz.
          </p>

          <TipBox>
            <strong>Ipucu:</strong> Finans ozeti sayfasindaki "Rapor Indir" butonu ile
            belirli bir donem icin detayli finansal raporu Excel veya PDF formatinda
            indirebilirsiniz.
          </TipBox>
        </section>

        {/* ================================================================ */}
        {/* SECTION 10: Ekip Yonetimi */}
        {/* ================================================================ */}
        <section className="mb-16 print-break">
          <SectionHeading id="ekip-yonetimi" number="10" title="Ekip Yonetimi" icon={UserCog} />
          <PathIndicator path="Panel → Ekip" />

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <p className="text-purple-800 text-sm font-medium">
              <Shield className="w-4 h-4 inline mr-1" />
              Bu ozellik <strong>Profesyonel</strong> ve <strong>Kurumsal</strong> planlarda kullanilabilir.
            </p>
          </div>

          <p className="text-gray-700 leading-relaxed mb-4">
            Ekip yonetimi ile calisanlarinizi platforma davet edebilir ve her birine uygun
            roller atayabilirsiniz.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Ekip Uyesi Davet Etme</h3>
          <StepList
            steps={[
              '"Ekip" bolumune gidin.',
              '"+ Uye Davet Et" butonuna tiklayin.',
              'Davet edilecek kisinin e-posta adresini girin.',
              'Uygun rolu secin (asagiya bakiniz).',
              '"Davet Gonder" butonuna tiklayin.',
              'Davet edilen kisi e-postasindaki linke tiklayarak hesabini olusturur.',
            ]}
          />

          <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-8">Roller ve Yetkiler</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse my-4">
              <thead>
                <tr className="bg-amber-50">
                  <th className="border border-amber-200 px-4 py-2 text-left font-semibold text-amber-900">Rol</th>
                  <th className="border border-amber-200 px-4 py-2 text-left font-semibold text-amber-900">Aciklama</th>
                  <th className="border border-amber-200 px-4 py-2 text-left font-semibold text-amber-900">Yetkiler</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-4 py-2 font-medium">Tasarimci</td>
                  <td className="border border-gray-200 px-4 py-2 text-gray-600">Tasarim ekibi uyesi</td>
                  <td className="border border-gray-200 px-4 py-2 text-gray-600">Tasarim olusturma ve duzenleme, musteri goruntuuleme</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-medium">Uretici</td>
                  <td className="border border-gray-200 px-4 py-2 text-gray-600">Uretim sorumlusu</td>
                  <td className="border border-gray-200 px-4 py-2 text-gray-600">Tasarimlari goruntuleme, uretim notlari ekleme</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2 font-medium">Muhasebe</td>
                  <td className="border border-gray-200 px-4 py-2 text-gray-600">Mali isler sorumlusu</td>
                  <td className="border border-gray-200 px-4 py-2 text-gray-600">Odemeler, finans, sozlesmeler, fatura yonetimi</td>
                </tr>
              </tbody>
            </table>
          </div>

          <TipBox>
            <strong>Ipucu:</strong> Her ekip uyesine yalnizca ihtiyac duydugu yetkileri verin.
            Bu hem guvenlik hem de kullanim kolayligi acisindan onemlidir.
          </TipBox>
        </section>

        {/* ================================================================ */}
        {/* SECTION 11: Firma Ayarlari */}
        {/* ================================================================ */}
        <section className="mb-16 print-break">
          <SectionHeading id="firma-ayarlari" number="11" title="Firma Ayarlari" icon={Settings} />
          <PathIndicator path="Panel → Ayarlar" />

          <p className="text-gray-700 leading-relaxed mb-4">
            Firma ayarlari bolumunde sirketinize ait temel bilgileri guncelleyebilirsiniz.
            Bu bilgiler PDF tekliflerinizde, sozlesmelerde ve musteri portali icerisinde
            gosterilir.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Duzenlenebilir Alanlar</h3>
          <StepList
            steps={[
              'Sol menuden "Ayarlar" bolumune gidin.',
              '"Firma Bilgileri" sekmesine tiklayin.',
              'Asagidaki bilgileri doldurun veya guncelleyin:',
              '"Degisiklikleri Kaydet" butonuna tiklayin.',
            ]}
          />

          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-2">
            <li><strong>Firma Adi:</strong> Resmi sirket unvaniniz</li>
            <li><strong>Logo:</strong> Firmanizin logosu (PNG veya JPG, en az 200x200 piksel onerili)</li>
            <li><strong>Telefon:</strong> Firma iletisim numarasi</li>
            <li><strong>E-posta:</strong> Firma iletisim e-postasi</li>
            <li><strong>Adres:</strong> Sirket adresi (teklif ve sozlesmelerde gorunur)</li>
            <li><strong>Vergi Dairesi & No:</strong> Fatura bilgileri icin</li>
            <li><strong>Web Sitesi:</strong> Firma web adresi</li>
          </ul>

          <WarningBox>
            <strong>Onemli:</strong> Firma bilgilerinizi tamamlamadan PDF teklif ve sozlesme
            olusturmaniz durumunda belgelerinizde eksik bilgiler gorunecektir. Lutfen bu
            alanlari ilk is olarak doldurun.
          </WarningBox>
        </section>

        {/* ================================================================ */}
        {/* SECTION 12: Plan ve Abonelik */}
        {/* ================================================================ */}
        <section className="mb-16 print-break">
          <SectionHeading id="plan-abonelik" number="12" title="Plan ve Abonelik" icon={Star} />
          <PathIndicator path="Panel → Plan & Abonelik" />

          <p className="text-gray-700 leading-relaxed mb-4">
            KonteynerTasarim dort farkli plan sunmaktadir. Ihtiyaclariniza en uygun plani
            secebilir ve istediginiz zaman yukseltme yapabilirsiniz.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse my-6">
              <thead>
                <tr className="bg-amber-50">
                  <th className="border border-amber-200 px-3 py-2 text-left font-semibold text-amber-900">Ozellik</th>
                  <th className="border border-amber-200 px-3 py-2 text-center font-semibold text-amber-900">Ucretsiz</th>
                  <th className="border border-amber-200 px-3 py-2 text-center font-semibold text-amber-900">Baslangic</th>
                  <th className="border border-amber-200 px-3 py-2 text-center font-semibold text-amber-900">Profesyonel</th>
                  <th className="border border-amber-200 px-3 py-2 text-center font-semibold text-amber-900">Kurumsal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 font-medium">Musteri Limiti</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">5</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">50</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">500</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">Sinirsiz</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 font-medium">Tasarim Limiti</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">3</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">30</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">300</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">Sinirsiz</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 font-medium">PDF Teklif</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">-</td>
                  <td className="border border-gray-200 px-3 py-2 text-center text-green-600">&#10003;</td>
                  <td className="border border-gray-200 px-3 py-2 text-center text-green-600">&#10003;</td>
                  <td className="border border-gray-200 px-3 py-2 text-center text-green-600">&#10003;</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 font-medium">Sozlesme Yonetimi</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">-</td>
                  <td className="border border-gray-200 px-3 py-2 text-center text-green-600">&#10003;</td>
                  <td className="border border-gray-200 px-3 py-2 text-center text-green-600">&#10003;</td>
                  <td className="border border-gray-200 px-3 py-2 text-center text-green-600">&#10003;</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 font-medium">Ekip Yonetimi</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">-</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">-</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">5 uye</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">Sinirsiz</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 font-medium">Musteri Portali</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">-</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">-</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">-</td>
                  <td className="border border-gray-200 px-3 py-2 text-center text-green-600">&#10003;</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 font-medium">Oncelikli Destek</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">-</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">-</td>
                  <td className="border border-gray-200 px-3 py-2 text-center text-green-600">&#10003;</td>
                  <td className="border border-gray-200 px-3 py-2 text-center text-green-600">&#10003;</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Plan Yukseltme</h3>
          <StepList
            steps={[
              '"Plan & Abonelik" sayfasina gidin.',
              'Yukseltmek istediginiz plani secin.',
              'Faturalama donemini secin: Aylik veya Yillik.',
              'Odeme bilgilerinizi girin.',
              '"Plani Yukselt" butonuna tiklayin.',
            ]}
          />

          <TipBox>
            <strong>Tasarruf Ipucu:</strong> Yillik faturalama secenegi ile <strong>%10 indirim</strong> elde
            edersiniz. Ornegin aylik 500 TL olan bir plan, yillik secimde aylik 450 TL'ye duser.
          </TipBox>
        </section>

        {/* ================================================================ */}
        {/* SECTION 13: Musteri Portali */}
        {/* ================================================================ */}
        <section className="mb-16 print-break">
          <SectionHeading id="musteri-portali" number="13" title="Musteri Portali" icon={Search} />

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <p className="text-purple-800 text-sm font-medium">
              <Shield className="w-4 h-4 inline mr-1" />
              Bu ozellik yalnizca <strong>Kurumsal</strong> planda kullanilabilir.
            </p>
          </div>

          <p className="text-gray-700 leading-relaxed mb-4">
            Musteri Portali, musterilerinizin kendi siparislerini, sozlesmelerini ve
            odemelerini goruntuleycekleri ozel bir erisim alanidir. Bu ozellik sayesinde
            musterileriniz size surekli telefon acmak zorunda kalmadan guncel bilgilere
            ulasabilir.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">Musteri Portalinin Calisma Mantigi</h3>
          <StepList
            steps={[
              'Musteri detay sayfasindan "Portal Erisimi Aktiflestir" butonuna tiklayin.',
              'Sistem otomatik olarak musteriye bir davet e-postasi gonderir.',
              'Musteri e-postasindaki linke tiklayarak sifre olusturur.',
              'Musteri artik kendi panelinden siparislerini, sozlesmelerini ve odeme durumlarini gorebilir.',
            ]}
          />

          <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-8">Musterinin Gorebilecekleri</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-2">
            <li>Kendisine ait tasarimlarin gorsel onizlemesi</li>
            <li>Sozlesme detaylari ve durumu</li>
            <li>Odeme plani ve yapilan odemeler</li>
            <li>Teslim tarihi ve proje ilerleme durumu</li>
          </ul>

          <TipBox>
            <strong>Ipucu:</strong> Musteri portali erisimini istediginiz zaman kapatabilirsiniz.
            Bu islem musterinin mevcut verilerini silmez, yalnizca erisimi durdurur.
          </TipBox>
        </section>

        {/* ================================================================ */}
        {/* SECTION 14: Ipuclari ve Kisayollar */}
        {/* ================================================================ */}
        <section className="mb-16 print-break">
          <SectionHeading id="ipuclari" number="14" title="Ipuclari ve Kisayollar" icon={Zap} />

          <p className="text-gray-700 leading-relaxed mb-6">
            Platformu daha verimli kullanmaniz icin asagidaki ipuclarini uygulayabilirsiniz:
          </p>

          <div className="space-y-4">
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
              <h4 className="font-semibold text-amber-900 mb-2">Klavye Kisayollari (Tasarim Editoru)</h4>
              <div className="grid sm:grid-cols-2 gap-2 text-sm text-amber-800">
                <div><code className="bg-amber-100 px-2 py-0.5 rounded">Ctrl + S</code> — Kaydet</div>
                <div><code className="bg-amber-100 px-2 py-0.5 rounded">Ctrl + Z</code> — Geri Al</div>
                <div><code className="bg-amber-100 px-2 py-0.5 rounded">Ctrl + Y</code> — Yinele</div>
                <div><code className="bg-amber-100 px-2 py-0.5 rounded">Delete</code> — Secili Elemani Sil</div>
                <div><code className="bg-amber-100 px-2 py-0.5 rounded">Ctrl + D</code> — Secili Elemani Kopyala</div>
                <div><code className="bg-amber-100 px-2 py-0.5 rounded">Esc</code> — Secimi Kaldir</div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
              <h4 className="font-semibold text-amber-900 mb-2">Verimlilik Onerileri</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-amber-800">
                <li>Sik kullandiginiz tasarimlari sablon olarak kaydedin — yeni projelerde zaman kazanin.</li>
                <li>Musterilerinizin notlar alanini aktif kullanin — gecmis gorusmelere hizla erisin.</li>
                <li>Odeme hatirlatmalarini kontrol panelinden duzenli takip edin.</li>
                <li>Ekip uyelerinize dogru rolleri atayarak is akisini hizlandirin.</li>
                <li>PDF tekliflerinizi gondermeden once mutlaka onizleme yapin.</li>
                <li>Revizyon gecmisini kullanarak tasarim degisikliklerini takip edin.</li>
              </ul>
            </div>

            <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
              <h4 className="font-semibold text-amber-900 mb-2">Sik Yapilan Hatalar</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-amber-800">
                <li>Firma ayarlarini tamamlamadan teklif gondermek — eksik bilgili belgeler olusur.</li>
                <li>Tasarimi kaydetmeden editorden cikmak — son degisiklikler kaybolabilir.</li>
                <li>Yanlislikla musteri silmek — silme islemi geri alinamaz, dikkatli olun.</li>
                <li>Taksit planini olusturmadan sozlesme onayi vermek — odeme takibi zorlarir.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SECTION 15: Destek */}
        {/* ================================================================ */}
        <section className="mb-16 print-break">
          <SectionHeading id="destek" number="15" title="Destek" icon={HelpCircle} />

          <p className="text-gray-700 leading-relaxed mb-6">
            Herhangi bir sorunuz veya sorununuz oldugunda bizimle iletisime gecmekten
            cekinmeyin. Destek ekibimiz size en kisa surede yardimci olacaktir.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex items-start gap-4">
              <Mail className="w-8 h-8 text-amber-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">E-posta Destek</h4>
                <a
                  href="mailto:destek@konteynertasarim.com.tr"
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  destek@konteynertasarim.com.tr
                </a>
                <p className="text-xs text-gray-500 mt-1">Is gunleri 24 saat icinde yanit</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex items-start gap-4">
              <Lock className="w-8 h-8 text-amber-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Telefon Destek</h4>
                <a
                  href="tel:+905337278034"
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  0533 727 80 34
                </a>
                <p className="text-xs text-gray-500 mt-1">Pazartesi - Cuma, 09:00 - 18:00</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
            <h4 className="font-semibold text-amber-900 mb-3">Destek Talabi Olustururken</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-amber-800">
              <li>Sorununuzu mumkun oldugunca detayli aciklayin.</li>
              <li>Ekran goruntusu eklemeniz cozum surecini hizlandirir.</li>
              <li>Hangi sayfada / modülde sorun yasadiginizi belirtin.</li>
              <li>Profesyonel ve Kurumsal plan kullanicilari oncelikli destek alir.</li>
            </ul>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-8 mt-16 text-center text-sm text-gray-400">
          <p>&copy; 2026 KonteynerTasarim. Tum haklari saklidir.</p>
          <p className="mt-1">Bu kilavuz en son Nisan 2026 tarihinde guncellenmistir.</p>
        </div>
      </div>
    </div>
  );
}
