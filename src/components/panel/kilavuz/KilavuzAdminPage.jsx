import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Shield,
  Users,
  Building2,
  CreditCard,
  Tag,
  Box,
  Eye,
  MessageSquare,
  BarChart3,
  UserCog,
  Mail,
  ChevronRight,
  AlertCircle,
  Star,
  CheckCircle,
  HelpCircle,
  Clock,
  Search,
  Lock,
  FileText,
  Package,
  Zap,
  Check,
  Edit,
  Settings,
} from 'lucide-react';

const sections = [
  { id: 'giris', title: '1. Giriş — Admin Kılavuzu Hakkında', icon: HelpCircle },
  { id: 'admin-panel', title: '2. Admin Panel Genel Bakış', icon: Shield },
  { id: 'firma-yonetimi', title: '3. Firma (Tenant) Yönetimi', icon: Building2 },
  { id: 'plan-yonetimi', title: '4. Plan Yönetimi', icon: CreditCard },
  { id: 'kupon-kampanya', title: '5. Kupon & Kampanya Sistemi', icon: Tag },
  { id: 'fuar-hazirlik', title: '6. Fuar Hazırlık Rehberi', icon: Box },
  { id: 'demo-senaryolari', title: '7. Demo Senaryoları', icon: Eye },
  { id: 'itiraz-yonetimi', title: '8. Müşteri İtiraz Yönetimi', icon: MessageSquare },
  { id: 'raporlama', title: '9. Raporlama ve İstatistikler', icon: BarChart3 },
  { id: 'onboarding', title: '10. Yeni Personel Onboarding Rehberi', icon: UserCog },
  { id: 'destek', title: '11. Destek ve İletişim', icon: Mail },
];

function InfoBox({ children, type = 'info' }) {
  const styles = {
    info: 'bg-indigo-50 border-indigo-300 text-indigo-800',
    warning: 'bg-amber-50 border-amber-300 text-amber-800',
    success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    tip: 'bg-sky-50 border-sky-300 text-sky-800',
  };
  const icons = {
    info: <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />,
    warning: <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />,
    success: <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />,
    tip: <Star className="w-5 h-5 flex-shrink-0 mt-0.5" />,
  };
  return (
    <div className={`flex gap-3 p-4 border-l-4 rounded-r-lg my-4 ${styles[type]}`}>
      {icons[type]}
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function PathBadge({ path }) {
  const parts = path.split(' → ');
  return (
    <div className="flex items-center gap-1 text-sm text-slate-500 mb-4 font-mono bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="w-3 h-3" />}
          <span className="text-indigo-600 font-medium">{part}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

function SectionTitle({ id, icon: Icon, children }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-slate-800 mt-12 mb-4 flex items-center gap-3 scroll-mt-24 print-break">
      <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600">
        <Icon className="w-5 h-5" />
      </span>
      {children}
    </h2>
  );
}

export default function KilavuzAdminPage() {
  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { font-size: 11pt; }
          a { text-decoration: none; color: black; }
          .print-title { display: block !important; }
        }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* Top Navigation Bar */}
      <div className="no-print sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            to="/panel"
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Panele Dön
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Yazdır
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Admin & Eğitimci Kılavuzu
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3">
            KonteynerTasarım — Yönetici Kılavuzu
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Süper adminler, eğitimciler ve fuar stant ekipleri için kapsamlı platform yönetim rehberi.
          </p>
          <p className="text-sm text-slate-400 mt-3">Son güncelleme: Nisan 2026 | Sürüm 1.0</p>
        </div>

        {/* Table of Contents */}
        <div className="bg-slate-50 rounded-2xl p-6 mb-12 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Edit className="w-5 h-5 text-indigo-500" />
            İçindekiler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
              >
                <s.icon className="w-4 h-4 text-indigo-400" />
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* ===================== SECTION 1 ===================== */}
        <SectionTitle id="giris" icon={HelpCircle}>
          1. Giriş — Admin Kılavuzu Hakkında
        </SectionTitle>
        <p className="text-slate-600 leading-relaxed mb-4">
          Bu kılavuz, <strong>KonteynerTasarım</strong> platformunun yönetim ve tanıtım süreçlerini kapsamlı
          şekilde ele almaktadır. Aşağıdaki profillere sahip kullanıcılar için hazırlanmıştır:
        </p>
        <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4 ml-4">
          <li>
            <strong>Süper Adminler:</strong> Platform genelinde firma, plan, kupon ve kullanıcı yönetiminden
            sorumlu teknik yöneticiler.
          </li>
          <li>
            <strong>Eğitimciler:</strong> Yeni personeli platforma alıştırmakla görevli ekip liderleri.
          </li>
          <li>
            <strong>Fuar Stant Ekipleri:</strong> TÜYAP ve benzeri fuarlarda ürün tanıtımı yapan, canlı demo
            gösteren ve potansiyel müşterileri kayıt ettiren saha personeli.
          </li>
        </ul>
        <InfoBox type="info">
          Bu kılavuz, abone kullanıcılar için hazırlanan Kullanım Kılavuzu'ndan farklıdır. Burada
          platform yönetimi, satış teknikleri ve eğitim süreçleri ele alınmaktadır.
        </InfoBox>

        {/* ===================== SECTION 2 ===================== */}
        <SectionTitle id="admin-panel" icon={Shield}>
          2. Admin Panel Genel Bakış
        </SectionTitle>
        <PathBadge path="Admin → Dashboard" />
        <p className="text-slate-600 leading-relaxed mb-4">
          Admin paneline <code className="bg-slate-100 px-2 py-0.5 rounded text-indigo-600 text-sm">/admin</code> adresinden
          erişilir. Yalnızca <strong>super_admin</strong> rolüne sahip kullanıcılar bu paneli görebilir.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          Admin Dashboard, platformun genel sağlık durumunu tek bakışta görmenizi sağlar. Aşağıdaki
          temel metrikleri içerir:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Toplam Firma', icon: Building2, color: 'indigo' },
            { label: 'Toplam Kullanıcı', icon: Users, color: 'sky' },
            { label: 'Aylık Gelir', icon: CreditCard, color: 'emerald' },
            { label: 'Aktif Abonelik', icon: Star, color: 'amber' },
          ].map((card) => (
            <div key={card.label} className={`bg-${card.color}-50 border border-${card.color}-200 rounded-xl p-4 text-center`}>
              <card.icon className={`w-6 h-6 text-${card.color}-500 mx-auto mb-2`} />
              <p className="text-xs text-slate-500">{card.label}</p>
              <p className={`text-lg font-bold text-${card.color}-700`}>—</p>
            </div>
          ))}
        </div>
        <p className="text-slate-600 leading-relaxed mb-4">
          Dashboard üzerinde ayrıca şu bilgileri de takip edebilirsiniz:
        </p>
        <ul className="list-disc list-inside text-slate-600 space-y-1 ml-4 mb-4">
          <li>Son 7 gün içinde kayıt olan firmalar</li>
          <li>Deneme süresi dolmak üzere olan abonelikler</li>
          <li>En aktif firmalar (tasarım ve müşteri sayısına göre)</li>
          <li>Kupon kullanım istatistikleri</li>
        </ul>
        <InfoBox type="tip">
          Dashboard verileri gerçek zamanlı olarak Supabase'den çekilir. Sayfayı yenilemeden
          güncel verileri görmek için sağ üst köşedeki yenile butonunu kullanabilirsiniz.
        </InfoBox>

        {/* ===================== SECTION 3 ===================== */}
        <SectionTitle id="firma-yonetimi" icon={Building2}>
          3. Firma (Tenant) Yönetimi
        </SectionTitle>
        <PathBadge path="Admin → Firmalar" />
        <p className="text-slate-600 leading-relaxed mb-4">
          Firmalar sayfası, platforma kayıtlı tüm şirketlerin listesini gösterir. Her firma kaydı
          aşağıdaki bilgileri içerir:
        </p>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Alan</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Açıklama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ['Firma Adı', 'Kayıt sırasında girilen şirket unvanı'],
                ['Plan', 'Mevcut abonelik planı (Ücretsiz / Başlangıç / Profesyonel / Kurumsal)'],
                ['Abonelik Durumu', 'Aktif, deneme, süresi dolmuş veya iptal edilmiş'],
                ['Üye Sayısı', 'Firmaya ait toplam kullanıcı sayısı'],
                ['Kayıt Tarihi', 'İlk kayıt tarihi'],
                ['Son Aktivite', 'Firma kullanıcılarının son giriş tarihi'],
              ].map(([alan, aciklama]) => (
                <tr key={alan} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{alan}</td>
                  <td className="px-4 py-3 text-slate-600">{aciklama}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Firma İşlemleri</h3>
        <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-4 mb-4">
          <li>
            <strong>Firma Detaylarını Görüntüleme:</strong> Firma satırına tıklayarak detay sayfasına gidin. Burada tüm
            kullanıcılar, tasarımlar ve abonelik geçmişi görüntülenir.
          </li>
          <li>
            <strong>Firmayı Devre Dışı Bırakma:</strong> Firma detay sayfasında "Devre Dışı Bırak" butonuna tıklayın.
            Bu işlem firma kullanıcılarının giriş yapmasını engeller ancak verileri silmez.
          </li>
          <li>
            <strong>Firmayı Yeniden Etkinleştirme:</strong> Devre dışı bırakılmış firmayı tekrar aktifleştirmek için
            "Etkinleştir" butonunu kullanın.
          </li>
          <li>
            <strong>Plan Değişikliği:</strong> Firma adına plan yükseltme veya düşürme işlemi yapabilirsiniz.
            Değişiklik anında uygulanır.
          </li>
        </ol>
        <InfoBox type="warning">
          Firmayı devre dışı bırakmak geri alınabilir bir işlemdir. Ancak firma silme işlemi
          yalnızca veritabanı üzerinden yapılmalıdır ve geri alınamaz. Bu işlemi yapmadan önce
          mutlaka yedek alın.
        </InfoBox>

        {/* ===================== SECTION 4 ===================== */}
        <SectionTitle id="plan-yonetimi" icon={CreditCard}>
          4. Plan Yönetimi
        </SectionTitle>
        <PathBadge path="Admin → Planlar" />
        <p className="text-slate-600 leading-relaxed mb-4">
          KonteynerTasarım dört farklı abonelik planı sunar. Her planın kendine özgü limitleri ve
          özellikleri vardır. Admin panelinden plan limitlerini düzenleyebilirsiniz.
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-indigo-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-indigo-800">Plan</th>
                <th className="text-center px-4 py-3 font-semibold text-indigo-800">Müşteri</th>
                <th className="text-center px-4 py-3 font-semibold text-indigo-800">Tasarım</th>
                <th className="text-center px-4 py-3 font-semibold text-indigo-800">Revizyon</th>
                <th className="text-center px-4 py-3 font-semibold text-indigo-800">Üye</th>
                <th className="text-center px-4 py-3 font-semibold text-indigo-800">Fiyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">Ücretsiz</td>
                <td className="px-4 py-3 text-center text-slate-600">5</td>
                <td className="px-4 py-3 text-center text-slate-600">5</td>
                <td className="px-4 py-3 text-center text-slate-600">1</td>
                <td className="px-4 py-3 text-center text-slate-600">1</td>
                <td className="px-4 py-3 text-center font-semibold text-emerald-600">₺0</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">Başlangıç</td>
                <td className="px-4 py-3 text-center text-slate-600">50</td>
                <td className="px-4 py-3 text-center text-slate-600">25</td>
                <td className="px-4 py-3 text-center text-slate-600">5</td>
                <td className="px-4 py-3 text-center text-slate-600">1</td>
                <td className="px-4 py-3 text-center font-semibold text-indigo-600">₺499/ay</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">Profesyonel</td>
                <td className="px-4 py-3 text-center text-slate-600">200</td>
                <td className="px-4 py-3 text-center text-slate-600">100</td>
                <td className="px-4 py-3 text-center text-slate-600">20</td>
                <td className="px-4 py-3 text-center text-slate-600">5</td>
                <td className="px-4 py-3 text-center font-semibold text-indigo-600">₺999/ay</td>
              </tr>
              <tr className="hover:bg-slate-50 bg-indigo-50/30">
                <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-1">
                  Kurumsal <Star className="w-3 h-3 text-amber-500" />
                </td>
                <td className="px-4 py-3 text-center text-slate-600">Sınırsız</td>
                <td className="px-4 py-3 text-center text-slate-600">Sınırsız</td>
                <td className="px-4 py-3 text-center text-slate-600">Sınırsız</td>
                <td className="px-4 py-3 text-center text-slate-600">20</td>
                <td className="px-4 py-3 text-center font-semibold text-indigo-600">₺1.999/ay</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Düzenlenebilir Limitler</h3>
        <p className="text-slate-600 leading-relaxed mb-3">
          Her plan için aşağıdaki limitler admin panelinden değiştirilebilir:
        </p>
        <ul className="list-disc list-inside text-slate-600 space-y-1 ml-4 mb-4">
          <li><code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">max_customers</code> — Maksimum müşteri sayısı</li>
          <li><code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">max_designs</code> — Maksimum tasarım sayısı</li>
          <li><code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">max_members</code> — Maksimum ekip üyesi sayısı</li>
        </ul>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Plan Özellikleri (Features)</h3>
        <p className="text-slate-600 leading-relaxed mb-3">
          Planlara bağlı açılıp kapatılabilen özellikler:
        </p>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Özellik</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-700">Ücretsiz</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-700">Başlangıç</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-700">Profesyonel</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-700">Kurumsal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ['pdf_export — PDF Dışa Aktarma', '—', '✓', '✓', '✓'],
                ['contract_management — Sözleşme Yönetimi', '—', '✓', '✓', '✓'],
                ['payment_tracking — Ödeme Takibi', '—', '—', '✓', '✓'],
                ['team_management — Ekip Yönetimi', '—', '—', '✓', '✓'],
                ['customer_portal — Müşteri Portalı', '—', '—', '—', '✓'],
              ].map(([feature, f1, f2, f3, f4]) => (
                <tr key={feature} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700 font-medium">{feature}</td>
                  <td className="px-4 py-3 text-center">{f1 === '✓' ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3 text-center">{f2 === '✓' ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3 text-center">{f3 === '✓' ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3 text-center">{f4 === '✓' ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <InfoBox type="tip">
          Plan limitlerinde değişiklik yaparken dikkatli olun. Mevcut firmaların limitleri aştığı durumlarda
          yeni kayıt yapmaları engellenir ancak mevcut verileri silinmez.
        </InfoBox>

        {/* ===================== SECTION 5 ===================== */}
        <SectionTitle id="kupon-kampanya" icon={Tag}>
          5. Kupon & Kampanya Sistemi
        </SectionTitle>
        <p className="text-slate-600 leading-relaxed mb-4">
          Kupon sistemi Supabase veritabanı üzerinden yönetilir. Kuponlar, belirli bir plan için
          belirli süre ücretsiz erişim sağlamak amacıyla kullanılır.
        </p>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Coupons Tablosu Yapısı</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Alan</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Tip</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Açıklama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ['code', 'text', 'Benzersiz kupon kodu (örn: TUYAP2026)'],
                ['plan_slug', 'text', 'Uygulanacak plan (örn: baslangic)'],
                ['duration_days', 'integer', 'Ücretsiz kullanım süresi (gün)'],
                ['max_uses', 'integer', 'Maksimum kullanım sayısı (null = sınırsız)'],
                ['campaign', 'text', 'Kampanya adı (raporlama için)'],
                ['is_active', 'boolean', 'Kupon aktif mi?'],
                ['valid_from', 'timestamp', 'Geçerlilik başlangıç tarihi'],
                ['valid_until', 'timestamp', 'Geçerlilik bitiş tarihi'],
              ].map(([alan, tip, aciklama]) => (
                <tr key={alan} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-indigo-600 font-medium">{alan}</td>
                  <td className="px-4 py-3 text-slate-500">{tip}</td>
                  <td className="px-4 py-3 text-slate-600">{aciklama}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Aktif Kampanya: TUYAP2026</h3>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Box className="w-6 h-6 text-indigo-600" />
            <span className="text-lg font-bold text-indigo-800">TUYAP2026 Fuar Kampanyası</span>
          </div>
          <ul className="text-sm text-indigo-700 space-y-1 ml-9">
            <li><strong>Kupon Kodu:</strong> TUYAP2026</li>
            <li><strong>Plan:</strong> Başlangıç (baslangic)</li>
            <li><strong>Süre:</strong> 30 gün ücretsiz</li>
            <li><strong>Kullanım:</strong> Sınırsız</li>
            <li><strong>Kampanya:</strong> TÜYAP Yapı Fuarı 2026</li>
          </ul>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Yeni Kupon Oluşturma</h3>
        <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-4 mb-4">
          <li>Supabase Dashboard'a gidin (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">supabase.com/dashboard</code>).</li>
          <li>Proje seçin ve <strong>Table Editor</strong> bölümüne gidin.</li>
          <li><code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">coupons</code> tablosunu açın.</li>
          <li><strong>"Insert row"</strong> butonuna tıklayın.</li>
          <li>Gerekli alanları doldurun (code, plan_slug, duration_days, vb.).</li>
          <li><strong>"Save"</strong> ile kaydedin.</li>
        </ol>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Kupon Kullanım Akışı (RPC)</h3>
        <p className="text-slate-600 leading-relaxed mb-3">
          Kupon doğrulama ve kullanım işlemleri iki Supabase RPC fonksiyonu ile yönetilir:
        </p>
        <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-4 mb-4">
          <li>
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">validate_coupon(code)</code> — Kupon kodunun
            geçerliliğini kontrol eder. Aktiflik, tarih aralığı ve kullanım limitini doğrular. Geçerliyse kupon
            detaylarını döner.
          </li>
          <li>
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">redeem_coupon(code, tenant_id)</code> — Kuponu
            ilgili firma için kullanır. Firma planını günceller, abonelik bitiş tarihini ayarlar ve
            kupon kullanım sayısını artırır.
          </li>
        </ol>
        <InfoBox type="warning">
          Kupon kodlarını fuardan önce mutlaka test edin. <code>validate_coupon</code> çağrısını yaparak
          kodun doğru çalıştığından emin olun.
        </InfoBox>

        {/* ===================== SECTION 6 ===================== */}
        <SectionTitle id="fuar-hazirlik" icon={Box}>
          6. Fuar Hazırlık Rehberi
        </SectionTitle>
        <p className="text-slate-600 leading-relaxed mb-6">
          Fuar, potansiyel müşterilerle yüz yüze temas kurmanın en etkili yoludur. İyi bir hazırlık,
          başarılı bir fuarın temelidir.
        </p>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Fuar Öncesi Kontrol Listesi</h3>
        <div className="bg-slate-50 rounded-xl p-5 mb-6 border border-slate-200">
          <ul className="space-y-3">
            {[
              'Stant kurulumu tamamlandı (masa, sandalye, banner, ekran)',
              'Demo cihazları hazır (laptop/tablet — en az 2 adet yedekli)',
              'İnternet bağlantısı test edildi (mobil hotspot yedek olarak bulundur)',
              'Broşürler ve kartvizitler basıldı (en az 500 adet)',
              'QR kod basılı materyaller hazır (kayıt sayfasına yönlendirme)',
              'TUYAP2026 kupon kodu test edildi ve çalışır durumda',
              'Demo hesabı oluşturuldu (örnek müşteriler ve tasarımlar yüklendi)',
              'Ekip üyeleri demo senaryolarını prova etti',
              'Şarj cihazları ve uzatma kabloları hazır',
              'Kayıt formu veya tablet ile iletişim bilgisi toplama sistemi kuruldu',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-slate-600 text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Fuar Günü Kontrol Listesi</h3>
        <div className="bg-emerald-50 rounded-xl p-5 mb-6 border border-emerald-200">
          <ul className="space-y-2 text-sm text-emerald-800">
            {[
              'Stant 30 dakika önce hazır — ekran açık, demo hesabı giriş yapılmış',
              'Ekip üyeleri KonteynerTasarım logolu kıyafetlerle stantta',
              'QR kodlu posterler görünür yerlere asıldı',
              'Broşürler masaya düzenli şekilde yerleştirildi',
              'Her demo sonrası demo hesabını sıfırla (önceki ziyaretçi verileri temizle)',
              'Toplanan iletişim bilgilerini düzenli olarak kaydet',
              'Molalarda ekipten en az 1 kişi stantta kalsın',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Fuar Sonrası Takip</h3>
        <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-4 mb-4">
          <li>Toplanan iletişim bilgilerini CRM veya tabloya aktarın (en geç fuar bitiminden sonraki 1 iş günü).</li>
          <li>Her ilgili kişiye kişiselleştirilmiş teşekkür e-postası gönderin.</li>
          <li>E-postada <strong>TUYAP2026</strong> kupon kodunu tekrar hatırlatın.</li>
          <li>İlgi düzeyine göre sıcak/ılık/soğuk olarak kategorize edin.</li>
          <li>Sıcak adaylara 48 saat içinde telefonla ulaşın.</li>
          <li>Kayıt olup platformu aktif kullanmayanlara 1 hafta sonra hatırlatma gönderin.</li>
          <li>Fuar performans raporunu hazırlayın (toplam temas, kayıt, dönüşüm oranı).</li>
        </ol>
        <InfoBox type="success">
          Fuar sonrası hızlı takip, dönüşüm oranını 3 kata kadar artırabilir. İlk 48 saat kritik öneme sahiptir.
        </InfoBox>

        {/* ===================== SECTION 7 ===================== */}
        <SectionTitle id="demo-senaryolari" icon={Eye}>
          7. Demo Senaryoları
        </SectionTitle>
        <p className="text-slate-600 leading-relaxed mb-6">
          Aşağıdaki senaryolar, fuar standında ve müşteri ziyaretlerinde kullanılmak üzere hazırlanmıştır.
          Her senaryo belirli bir kullanım durumunu kapsar ve adım adım uygulanabilir.
        </p>

        {/* Senaryo 1 */}
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold">1</span>
            <div>
              <h4 className="font-bold text-slate-800">Senaryo: "Yeni müşteri geldi, tasarım istedi"</h4>
              <p className="text-sm text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Tahmini süre: 5 dakika</p>
            </div>
          </div>
          <ol className="list-decimal list-inside text-slate-600 space-y-3 ml-4">
            <li>
              <strong>Müşteri oluştur:</strong> Sol menüden "Müşteriler" bölümüne gidin. "Yeni Müşteri" butonuna
              tıklayın. Müşteri adı, telefon ve e-posta girin. Kaydet.
            </li>
            <li>
              <strong>Tasarımcıyı aç:</strong> Müşteri detay sayfasından "Yeni Tasarım" butonuna tıklayın.
              Tasarım adı girin (örn: "3+1 Konteyner Ev").
            </li>
            <li>
              <strong>Konteyner yerleştir:</strong> Tasarım alanında sol panelden konteyner boyutunu seçin
              (20ft veya 40ft). Tuvale sürükleyip bırakın. İstediğiniz kombinasyonu oluşturun.
            </li>
            <li>
              <strong>Kapı ve pencere ekle:</strong> Konteyner üzerine tıklayın, sağ panelden kapı/pencere
              ekle seçeneğini kullanın. Pozisyonu ayarlayın.
            </li>
            <li>
              <strong>Tasarımı kaydet:</strong> Sağ üst köşedeki "Kaydet" butonuna tıklayın.
            </li>
            <li>
              <strong>PDF teklif oluştur:</strong> "PDF Teklif" butonuna tıklayarak profesyonel görünümlü
              teklif dokümanı oluşturun. Müşteriye e-posta ile gönderebilir veya anında yazdırabilirsiniz.
            </li>
          </ol>
          <InfoBox type="tip">
            Demo sırasında gerçek bir müşteri adı yerine "Demo Müşteri" kullanın. Demo bitiminde
            bu kaydı silmeyi unutmayın.
          </InfoBox>
        </div>

        {/* Senaryo 2 */}
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold">2</span>
            <div>
              <h4 className="font-bold text-slate-800">Senaryo: "Mevcut müşteri sözleşme imzalamak istiyor"</h4>
              <p className="text-sm text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Tahmini süre: 3 dakika</p>
            </div>
          </div>
          <ol className="list-decimal list-inside text-slate-600 space-y-3 ml-4">
            <li>
              <strong>Mevcut tasarımı aç:</strong> Müşteri sayfasına gidin, onaylanmış tasarımı seçin.
            </li>
            <li>
              <strong>Sözleşme oluştur:</strong> Tasarım detay sayfasından "Sözleşme Oluştur" butonuna
              tıklayın. Fiyat, teslim tarihi ve ödeme koşullarını girin.
            </li>
            <li>
              <strong>PDF sözleşmeyi göster:</strong> Oluşturulan sözleşmeyi PDF olarak önizleyin. Tüm
              bilgilerin doğru olduğunu müşteriyle birlikte kontrol edin.
            </li>
            <li>
              <strong>Ödeme planı:</strong> Ödeme planı bölümünden taksit sayısını ve tutarlarını belirleyin.
              Kapora, ara ödemeler ve teslim ödemesi olarak yapılandırın.
            </li>
          </ol>
        </div>

        {/* Senaryo 3 */}
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold">3</span>
            <div>
              <h4 className="font-bold text-slate-800">Senaryo: "Firma sahibi fiyat soruyor"</h4>
              <p className="text-sm text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Tahmini süre: 2 dakika</p>
            </div>
          </div>
          <ol className="list-decimal list-inside text-slate-600 space-y-3 ml-4">
            <li>
              <strong>Fiyatlandırma sayfasını göster:</strong> Ana sayfadaki fiyatlandırma bölümünü açın.
              Dört planı yan yana karşılaştırmalı olarak gösterin.
            </li>
            <li>
              <strong>İhtiyaç analizi yap:</strong> Firma sahibine şu soruları sorun:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-sm">
                <li>Kaç müşteriniz var?</li>
                <li>Ekibinizde kaç kişi kullanacak?</li>
                <li>PDF teklif ve sözleşme özelliğine ihtiyacınız var mı?</li>
              </ul>
            </li>
            <li>
              <strong>Uygun planı öner:</strong> İhtiyaca göre en uygun planı belirleyin ve özelliklerini
              detaylıca anlatın.
            </li>
            <li>
              <strong>TUYAP2026 kuponunu uygula:</strong> "Ayrıca fuara özel promosyonumuz var —
              TUYAP2026 koduyla Başlangıç planını 30 gün ücretsiz deneyebilirsiniz" deyin.
              Kayıt sırasında kupon kodunu girin ve uygulandığını gösterin.
            </li>
          </ol>
          <InfoBox type="success">
            Fiyat konuşmasını her zaman "değer" üzerinden yapın. Önce platformun sağladığı
            faydaları ve zaman tasarrufunu anlatın, sonra fiyata geçin.
          </InfoBox>
        </div>

        {/* ===================== SECTION 8 ===================== */}
        <SectionTitle id="itiraz-yonetimi" icon={MessageSquare}>
          8. Müşteri İtiraz Yönetimi
        </SectionTitle>
        <p className="text-slate-600 leading-relaxed mb-6">
          Satış sürecinde karşılaşacağınız yaygın itirazlar ve bunlara verilecek etkili yanıtlar
          aşağıda listelenmiştir. Her itirazı bir fırsat olarak değerlendirin.
        </p>

        {/* Objection 1 */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
          <div className="bg-red-50 px-5 py-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-red-500" />
            <span className="font-semibold text-red-800">"Çok pahalı"</span>
          </div>
          <div className="px-5 py-4 bg-emerald-50">
            <p className="text-sm text-emerald-800 font-medium mb-2">Yanıt Stratejisi:</p>
            <ul className="text-sm text-emerald-700 space-y-1.5">
              <li>• <strong>Ücretsiz plan mevcut:</strong> "Hiç ücret ödemeden başlayabilirsiniz. 5 müşteri ve 5 tasarıma kadar tamamen ücretsiz."</li>
              <li>• <strong>Taahhüt yok:</strong> "Aylık abonelik sistemi, istediğiniz zaman iptal edebilirsiniz."</li>
              <li>• <strong>Fuar özel teklifi:</strong> "TUYAP2026 koduyla Başlangıç planını 30 gün boyunca ücretsiz kullanabilirsiniz."</li>
              <li>• <strong>Değer karşılaştırması:</strong> "Bir tasarımcıya ödediğiniz saatlik ücretin çok altında. Üstelik sınırsız tasarım yapabilirsiniz."</li>
            </ul>
          </div>
        </div>

        {/* Objection 2 */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
          <div className="bg-red-50 px-5 py-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-red-500" />
            <span className="font-semibold text-red-800">"Excel ile idare ediyoruz"</span>
          </div>
          <div className="px-5 py-4 bg-emerald-50">
            <p className="text-sm text-emerald-800 font-medium mb-2">Yanıt Stratejisi:</p>
            <ul className="text-sm text-emerald-700 space-y-1.5">
              <li>• <strong>Zaman kaybı:</strong> "Excel'de bir teklif hazırlamak ortalama 30-45 dakika alır. KonteynerTasarım ile 5 dakikada profesyonel teklif çıkarabilirsiniz."</li>
              <li>• <strong>Hata riski:</strong> "Manuel formüllerde hata yapma riski yüksektir. Sistem otomatik hesaplama yapar."</li>
              <li>• <strong>Profesyonel görünüm:</strong> "Müşterilerinize Excel tablosu yerine markalı, profesyonel PDF teklif sunabilirsiniz."</li>
              <li>• <strong>Veri kaybı:</strong> "Excel dosyaları kaybolabilir, bozulabilir. Bulut tabanlı sistemde verileriniz her zaman güvende."</li>
            </ul>
          </div>
        </div>

        {/* Objection 3 */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
          <div className="bg-red-50 px-5 py-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-red-500" />
            <span className="font-semibold text-red-800">"Kullanmayı öğrenemeyiz"</span>
          </div>
          <div className="px-5 py-4 bg-emerald-50">
            <p className="text-sm text-emerald-800 font-medium mb-2">Yanıt Stratejisi:</p>
            <ul className="text-sm text-emerald-700 space-y-1.5">
              <li>• <strong>Kolay arayüz:</strong> "Sürükle-bırak tasarım sistemi, teknik bilgi gerektirmiyor. Akıllı telefon kullanabiliyorsanız bunu da kullanabilirsiniz."</li>
              <li>• <strong>Eğitim desteği:</strong> "Ücretsiz online eğitim desteği sağlıyoruz. İlk kullanımda ekibinize uzaktan eğitim verebiliriz."</li>
              <li>• <strong>Kılavuzlar mevcut:</strong> "Platform içinde adım adım kullanım kılavuzu bulunuyor. Her ekranda yardım butonları mevcut."</li>
              <li>• <strong>Canlı demo:</strong> "Şimdi size 5 dakikada göstereyim, ne kadar kolay olduğunu kendiniz görün."</li>
            </ul>
          </div>
        </div>

        {/* Objection 4 */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
          <div className="bg-red-50 px-5 py-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-red-500" />
            <span className="font-semibold text-red-800">"Verilerimiz güvende mi?"</span>
          </div>
          <div className="px-5 py-4 bg-emerald-50">
            <p className="text-sm text-emerald-800 font-medium mb-2">Yanıt Stratejisi:</p>
            <ul className="text-sm text-emerald-700 space-y-1.5">
              <li>• <strong>SSL şifreleme:</strong> "Tüm veri iletişimi 256-bit SSL ile şifrelenir. Banka düzeyinde güvenlik."</li>
              <li>• <strong>Supabase altyapısı:</strong> "Verileriniz dünya çapında güvenilirliği kanıtlanmış Supabase (PostgreSQL) altyapısında barınır."</li>
              <li>• <strong>Firma bazlı izolasyon:</strong> "Her firma kendi veri alanında çalışır. Başka firmaların verilerine erişim teknik olarak imkansızdır (Row Level Security)."</li>
              <li>• <strong>Otomatik yedekleme:</strong> "Verileriniz düzenli olarak yedeklenir. Veri kaybı riski sıfıra yakındır."</li>
            </ul>
          </div>
        </div>

        {/* Objection 5 */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <div className="bg-red-50 px-5 py-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-red-500" />
            <span className="font-semibold text-red-800">"Başka yazılım kullanıyoruz"</span>
          </div>
          <div className="px-5 py-4 bg-emerald-50">
            <p className="text-sm text-emerald-800 font-medium mb-2">Yanıt Stratejisi:</p>
            <ul className="text-sm text-emerald-700 space-y-1.5">
              <li>• <strong>Sektöre özel:</strong> "KonteynerTasarım, konteyner ev üreticileri için özel olarak geliştirilmiş tek platformdur."</li>
              <li>• <strong>Genel vs. özel:</strong> "Genel muhasebe/proje yazılımlarından farklı olarak, konteyner tasarımı, teklif ve sözleşme süreçlerini tek çatı altında toplar."</li>
              <li>• <strong>Tamamlayıcı kullanım:</strong> "Mevcut yazılımınızla birlikte de kullanabilirsiniz. Konteyner tasarım ve teklif süreçleri için mükemmel tamamlayıcıdır."</li>
              <li>• <strong>Ücretsiz deneme:</strong> "Hiçbir şey kaybetmeden deneyin. Ücretsiz planla başlayın, beğenirseniz devam edin."</li>
            </ul>
          </div>
        </div>

        <InfoBox type="tip">
          İtiraz yönetiminde en önemli kural: Önce dinleyin, onaylayın ("Sizi anlıyorum"), sonra
          yanıt verin. Asla müşteriyle tartışmayın. Her itiraz bir ilgi işaretidir.
        </InfoBox>

        {/* ===================== SECTION 9 ===================== */}
        <SectionTitle id="raporlama" icon={BarChart3}>
          9. Raporlama ve İstatistikler
        </SectionTitle>
        <PathBadge path="Admin → Dashboard → Raporlar" />
        <p className="text-slate-600 leading-relaxed mb-4">
          Admin paneli, platform performansını izlemek için çeşitli raporlar sunar. Bu veriler
          stratejik kararlar almak ve büyüme trendlerini takip etmek için kullanılır.
        </p>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Takip Edilen Metrikler</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            { title: 'Firma Metrikleri', icon: Building2, items: ['Toplam kayıtlı firma sayısı', 'Aktif / pasif firma oranı', 'Yeni kayıt trendi (haftalık/aylık)', 'Plan dağılımı (hangi plan kaç firma)'] },
            { title: 'Kullanıcı Metrikleri', icon: Users, items: ['Toplam kullanıcı sayısı', 'Günlük aktif kullanıcı (DAU)', 'Ortalama oturum süresi', 'En aktif kullanıcılar'] },
            { title: 'Gelir Metrikleri', icon: CreditCard, items: ['Aylık yinelenen gelir (MRR)', 'Plan bazlı gelir dağılımı', 'Churn oranı (iptal eden firmalar)', 'Kupon kullanım maliyeti'] },
            { title: 'Kullanım Metrikleri', icon: Zap, items: ['Toplam tasarım sayısı', 'Toplam müşteri kaydı', 'PDF oluşturma sayısı', 'Sözleşme oluşturma sayısı'] },
          ].map((group) => (
            <div key={group.title} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <group.icon className="w-4 h-4 text-indigo-500" />
                {group.title}
              </h4>
              <ul className="text-sm text-slate-600 space-y-1.5">
                {group.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Dashboard Kullanım İpuçları</h3>
        <ol className="list-decimal list-inside text-slate-600 space-y-2 ml-4 mb-4">
          <li>
            <strong>Haftalık kontrol:</strong> Her hafta başında dashboard'u kontrol edin. Yeni kayıtlar,
            iptal eden firmalar ve kupon kullanımını inceleyin.
          </li>
          <li>
            <strong>Trend analizi:</strong> Haftalık/aylık grafiklerdeki trendlere dikkat edin. Düşüş
            trendleri erken müdahale gerektirebilir.
          </li>
          <li>
            <strong>Churn takibi:</strong> İptal eden veya aktif olmayan firmaları tespit edip, neden
            ayrıldıklarını anlamak için iletişime geçin.
          </li>
          <li>
            <strong>Kampanya etkisi:</strong> Kupon kampanyalarının etkisini kayıt ve dönüşüm
            verileriyle ölçün.
          </li>
        </ol>
        <InfoBox type="info">
          Raporlama verileri günlük olarak güncellenir. Anlık veriler için Dashboard'daki yenile
          butonunu kullanabilirsiniz.
        </InfoBox>

        {/* ===================== SECTION 10 ===================== */}
        <SectionTitle id="onboarding" icon={UserCog}>
          10. Yeni Personel Onboarding Rehberi
        </SectionTitle>
        <p className="text-slate-600 leading-relaxed mb-6">
          Yeni bir ekip üyesinin platforma alıştırılması sistematik bir süreç gerektirir. Aşağıdaki
          adımları takip ederek yeni personelinizi hızla üretken hale getirebilirsiniz.
        </p>

        {/* Step 1 */}
        <div className="relative pl-8 pb-8 border-l-2 border-indigo-200">
          <div className="absolute left-0 top-0 w-4 h-4 -ml-2 rounded-full bg-indigo-600"></div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Adım 1: Hesap Oluşturma</h3>
          <ol className="list-decimal list-inside text-slate-600 space-y-1 ml-2 text-sm">
            <li>Admin panelinden firma sayfasına gidin.</li>
            <li>"Üye Ekle" butonuna tıklayın.</li>
            <li>Yeni personelin e-posta adresini ve rolünü (admin/üye) girin.</li>
            <li>Personele otomatik davet e-postası gönderilir.</li>
            <li>Personel, e-postadaki bağlantıdan şifresini oluşturarak giriş yapar.</li>
          </ol>
        </div>

        {/* Step 2 */}
        <div className="relative pl-8 pb-8 border-l-2 border-indigo-200">
          <div className="absolute left-0 top-0 w-4 h-4 -ml-2 rounded-full bg-indigo-600"></div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Adım 2: Platform Tanıtım Turu</h3>
          <p className="text-slate-600 text-sm mb-2">Yeni personele platformun ana bölümlerini sırasıyla gösterin:</p>
          <ol className="list-decimal list-inside text-slate-600 space-y-1 ml-2 text-sm">
            <li><strong>Dashboard:</strong> Genel bakış, özet istatistikler, hızlı erişim butonları.</li>
            <li><strong>Müşteriler:</strong> Müşteri listesi, yeni müşteri ekleme, müşteri detay sayfası.</li>
            <li><strong>Tasarımlar:</strong> Tasarım listesi, tasarımcı arayüzü, konteyner ekleme, kaydetme.</li>
            <li><strong>Sözleşmeler:</strong> Sözleşme oluşturma, PDF önizleme, ödeme takibi.</li>
            <li><strong>Ayarlar:</strong> Firma bilgileri, profil ayarları, bildirim tercihleri.</li>
          </ol>
        </div>

        {/* Step 3 */}
        <div className="relative pl-8 pb-8 border-l-2 border-indigo-200">
          <div className="absolute left-0 top-0 w-4 h-4 -ml-2 rounded-full bg-indigo-600"></div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Adım 3: Pratik Alıştırmalar</h3>
          <p className="text-slate-600 text-sm mb-2">Personelden aşağıdaki işlemleri kendi başına yapmasını isteyin:</p>
          <ol className="list-decimal list-inside text-slate-600 space-y-1 ml-2 text-sm">
            <li><strong>Demo müşteri oluştur:</strong> "Test Müşteri" adında bir müşteri kaydı oluştur.</li>
            <li><strong>Tasarım yap:</strong> Bu müşteri için basit bir konteyner tasarımı oluştur (1 konteyner, 1 kapı, 2 pencere).</li>
            <li><strong>Teklif çıkar:</strong> Tasarımdan PDF teklif oluştur ve indir.</li>
            <li><strong>Sözleşme hazırla:</strong> Tasarım üzerinden sözleşme oluştur ve PDF olarak önizle.</li>
            <li><strong>Test verilerini temizle:</strong> Oluşturulan demo kayıtları sil.</li>
          </ol>
        </div>

        {/* Step 4 */}
        <div className="relative pl-8 pb-2">
          <div className="absolute left-0 top-0 w-4 h-4 -ml-2 rounded-full bg-indigo-600"></div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Adım 4: Yetkinlik Kontrol Listesi</h3>
          <p className="text-slate-600 text-sm mb-3">Personel aşağıdaki tüm maddeleri bağımsız olarak yapabilmelidir:</p>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <ul className="space-y-2 text-sm text-slate-600">
              {[
                'Platforma giriş yapabilir ve dashboard\u2019u anlayabilir',
                'Yeni müşteri kaydı oluşturabilir',
                'Konteyner tasarımı yapabilir (yerleştirme, kapı/pencere, kaydetme)',
                'PDF teklif oluşturabilir',
                'Sözleşme oluşturabilir ve ödeme planı tanımlayabilir',
                'Müşteri bilgilerini güncelleyebilir',
                'Tasarım revizyonu yapabilir',
                'Platform kılavuzuna erişebilir ve kullanabilir',
                'Temel sorunları (şifre sıfırlama, vb.) çözebilir',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded border-2 border-slate-300 mt-0.5"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <InfoBox type="success">
          Onboarding süreci genellikle 1-2 saat sürer. Personelin kendi hızında öğrenmesi için
          kılavuz linkini paylaşın ve sorularını yanıtlamak için iletişimde kalın.
        </InfoBox>

        {/* ===================== SECTION 11 ===================== */}
        <SectionTitle id="destek" icon={Mail}>
          11. Destek ve İletişim
        </SectionTitle>
        <p className="text-slate-600 leading-relaxed mb-6">
          Teknik destek, eğitim talebi veya önerileriniz için aşağıdaki kanallardan bize ulaşabilirsiniz.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex items-start gap-4">
            <Mail className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-indigo-800 mb-1">E-posta Desteği</h4>
              <a href="mailto:destek@konteynertasarim.com.tr" className="text-indigo-600 font-medium text-sm hover:underline">
                destek@konteynertasarim.com.tr
              </a>
              <p className="text-xs text-indigo-500 mt-1">Yanıt süresi: En geç 24 saat</p>
            </div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex items-start gap-4">
            <Settings className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-indigo-800 mb-1">Telefon Desteği</h4>
              <a href="tel:+905337278034" className="text-indigo-600 font-medium text-sm hover:underline">
                0533 727 80 34
              </a>
              <p className="text-xs text-indigo-500 mt-1">Hafta içi 09:00 - 18:00</p>
            </div>
          </div>
        </div>

        <InfoBox type="info">
          Acil teknik sorunlarda (platform erişim sorunu, veri kaybı şüphesi vb.) telefon hattını
          tercih edin. Genel sorular ve özellik talepleri için e-posta yeterlidir.
        </InfoBox>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-400">
            KonteynerTasarım Yönetici Kılavuzu &copy; 2026 — Tüm hakları saklıdır.
          </p>
          <p className="text-xs text-slate-300 mt-1">
            Bu belge gizlidir. Yalnızca yetkili personel ile paylaşılabilir.
          </p>
        </div>
      </div>
    </div>
  );
}
