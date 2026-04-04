# Konteyner Tasarım Portalı — SaaS Mimari Planı

## 1. Genel Bakış

Tek bir URL'den (`konteyner-tasarim.app`) tüm firmalar giriş yapar. Her firma (tenant) kendi izole panelinde çalışır. Firmalar kendi müşterilerine de portal sunabilir.

```
konteyner-tasarim.app
├── /                   → Landing page (fiyatlandırma, özellikler, kayıt)
├── /giris              → Ortak login sayfası
├── /kayit              → Yeni firma kayıt (free trial başlar)
├── /admin              → Super Admin paneli (senin — platform yönetimi)
└── /panel              → Firma paneli (tenant bazlı, login sonrası)
    ├── /panel/dashboard
    ├── /panel/customers
    ├── /panel/designs
    ├── /panel/contracts
    ├── /panel/payments
    ├── /panel/team       → Çalışan yönetimi (Pro+)
    ├── /panel/settings   → Firma ayarları
    └── /panel/subscription → Abonelik yönetimi
```

## 2. Kullanıcı Hiyerarşisi

```
Platform Seviyesi:
  └── Super Admin (sen) — tüm tenantları yönetir, abonelikleri onaylar

Tenant (Firma) Seviyesi:
  └── Firma Sahibi (owner) — firma admin
      ├── Çalışanlar (member) — tasarımcı, üretici, muhasebe rolleri
      └── Müşteriler (customer) — firma müşterileri, kendi portalinden takip
```

### Roller:
| Rol | Açıklama | Erişim |
|-----|----------|--------|
| `super_admin` | Platform sahibi | Tüm tenantlar, abonelik onay, istatistikler |
| `owner` | Firma sahibi | Kendi firmasının tüm verileri + çalışan yönetimi |
| `admin` | Firma yöneticisi | Owner ile aynı (owner tarafından atanır) |
| `designer` | Tasarımcı | Müşteriler, tasarımlar |
| `production` | Üretici | Üretim takibi, kalite kontrol |
| `accounting` | Muhasebe | Sözleşmeler, ödemeler, finans |
| `customer` | Müşteri | Kendi sözleşmesi, ödemeleri, tasarım durumu |

## 3. Abonelik Planları

### Ücretsiz (Free)
- Müşteri oluşturma: ✅ (max 5)
- Tasarım yapma (HTML editör): ✅
- Tasarım kaydetme: ❌
- PDF çıktı: ❌
- Sözleşme/ödeme: ❌
- Çalışan ekleme: ❌
- Müşteri portalı: ❌

### Başlangıç (Starter) — ₺299/ay
- Müşteri: max 50
- Tasarım kaydetme: ✅ (max 20 aktif)
- PDF çıktı: ✅
- Sözleşme: ✅ (max 10/ay)
- Ödeme takibi: ✅
- Çalışan: 1 (sadece owner)
- Müşteri portalı: ❌

### Profesyonel (Pro) — ₺599/ay
- Müşteri: max 200
- Tasarım: sınırsız
- PDF çıktı: ✅
- Sözleşme: sınırsız
- Ödeme takibi: ✅
- Çalışan: max 5
- Müşteri portalı: ✅
- Firma logosu/marka: ✅

### Kurumsal (Enterprise) — ₺999/ay
- Her şey sınırsız
- Çalışan: max 20
- Müşteri portalı: ✅ (özelleştirilebilir)
- API erişimi: ✅
- Öncelikli destek: ✅
- Özel domain desteği: ✅ (ileride)

> Fiyatlar ve limitler `plans` tablosundan yönetilecek, kod değişikliği gerektirmeden güncellenebilir.

## 4. Veritabanı Şeması (Multi-Tenant)

### Temel Prensipler:
- Her tablo `tenant_id` kolonu ile izole edilir
- RLS (Row Level Security) tenant bazlı filtreleme yapar
- Kullanıcı hangi tenant'a ait olduğu `tenant_members` tablosundan belirlenir

### Tablolar:

```
tenants                    — Firmalar
├── id, name, slug, logo_url, settings (JSONB)
├── owner_id → auth.users
├── plan_id → plans
├── subscription_status, subscription_end
└── created_at, updated_at

plans                      — Abonelik planları
├── id, name, slug, price_monthly, price_yearly
├── limits (JSONB) → {max_customers, max_designs, max_contracts, max_members, ...}
├── features (JSONB) → {save_design, pdf_export, customer_portal, ...}
└── is_active, sort_order

tenant_members             — Firma üyeleri
├── id, tenant_id → tenants, user_id → auth.users
├── role (owner/admin/designer/production/accounting/customer)
└── invited_by, created_at

profiles                   — Kullanıcı profilleri
├── id → auth.users
├── full_name, avatar_url, phone
└── is_super_admin (platform yöneticisi mi?)

customers                  — Müşteriler (tenant bazlı)
├── id, tenant_id → tenants
├── ad, soyad, telefon, eposta, nereden_geldi, adres, notlar
├── portal_user_id → auth.users (müşteri portalı için, opsiyonel)
└── created_by, created_at, updated_at

designs                    — Tasarımlar (tenant bazlı)
├── id, tenant_id → tenants, customer_id → customers
├── ref_no, ad, aciklama
├── genislik, yukseklik, uzunluk, alan
├── ozellikler (JSONB), design_data (JSONB)
├── status, toplam_fiyat, indirim, net_fiyat
├── teslim_tarihi, notlar
└── created_by, created_at, updated_at

contracts                  — Sözleşmeler (tenant bazlı)
├── id, tenant_id → tenants
├── design_id → designs, customer_id → customers
├── sozlesme_no, tarih, toplam_tutar
├── terms (TEXT[]), signed_pdf_urls (TEXT[])
├── status
└── created_by, created_at, updated_at

payments                   — Ödemeler (tenant bazlı)
├── id, tenant_id → tenants
├── sozlesme_id → contracts, musteri_id → customers
├── tur, tutar, odenen_tutar, vade
├── odeme_tarihi, odeme_yontemi, dekont_url
├── notlar, durum
└── recorded_by, created_at

company_info               — Firma bilgileri (tenant bazlı, 1:1)
├── id, tenant_id → tenants (UNIQUE)
├── name, address, phone, email
├── tax_office, tax_number, iban, logo_url
├── contract_terms (TEXT[]), bank_name, bank_branch, bank_iban
└── proforma_footer_note, created_at, updated_at

subscription_payments      — Platform abonelik ödemeleri
├── id, tenant_id → tenants
├── plan_id → plans
├── amount, currency, payment_method
├── paytr_token, paytr_status
├── period_start, period_end
└── status, created_at

notifications              — Bildirimler (tenant bazlı)
├── id, tenant_id, user_id
├── baslik, mesaj, tur, okundu, link
└── created_at
```

## 5. RLS (Row Level Security) Stratejisi

```sql
-- Her tablo için temel RLS pattern:
-- 1. Kullanıcının tenant_id'sini bul
-- 2. Sadece kendi tenant verilerine erişsin

CREATE FUNCTION get_user_tenant_id() RETURNS UUID AS $$
  SELECT tenant_id FROM tenant_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Örnek: customers tablosu
CREATE POLICY "Tenant isolation" ON customers
  FOR ALL USING (tenant_id = get_user_tenant_id());
```

## 6. Auth Akışı

```
1. Kullanıcı /giris sayfasına gelir
2. Email + şifre ile Supabase Auth login
3. Login sonrası:
   a. profiles tablosundan is_super_admin kontrol
      → true ise /admin'e yönlendir
   b. tenant_members tablosundan tenant_id ve role al
      → role = 'customer' ise /portal'e yönlendir
      → diğer roller /panel'e yönlendir
4. Tenant context (tenant_id, role, plan) React Context'te tutulur
5. Her Supabase sorgusu otomatik RLS ile tenant-izole çalışır
```

## 7. Kayıt Akışı

```
1. Firma sahibi /kayit sayfasına gelir
2. Firma adı + email + şifre girer
3. Supabase auth.signUp() → user oluşur
4. Otomatik trigger:
   a. profiles tablosuna kayıt
   b. tenants tablosuna yeni firma
   c. tenant_members'a owner rolüyle kayıt
   d. company_info'ya boş kayıt
   e. Plan = 'free' olarak başlar
5. Hoşgeldin sayfası → firma ayarlarını tamamla
```

## 8. PayTR Entegrasyonu

```
Akış:
1. Firma /panel/subscription sayfasından plan seçer
2. "Abone Ol" butonuna tıklar
3. Backend (Netlify Function) PayTR iframe token oluşturur
4. PayTR ödeme formu açılır (iframe)
5. Ödeme başarılı → PayTR callback gelir
6. Netlify Function callback'i işler:
   a. subscription_payments'a kayıt
   b. tenants tablosunda plan_id, subscription_status güncelle
   c. subscription_end = +30 gün
7. Kullanıcıya "Abonelik aktif" bildirimi

Netlify Functions:
  /api/paytr-create-token  → Ödeme başlatma
  /api/paytr-callback      → Ödeme sonucu (PayTR → server)
  /api/paytr-success       → Başarılı sayfa yönlendirme
  /api/paytr-fail          → Başarısız sayfa yönlendirme
```

## 9. Limit Kontrolü (Feature Gate)

```javascript
// React hook: usePlanLimits()
const { canSave, canExportPDF, canAddMember, limits } = usePlanLimits();

// Kullanım:
if (!canSave) {
  showUpgradeModal("Tasarım kaydetmek için Starter plana geçin");
  return;
}

// Limit kontrolü:
const designCount = await getDesignCount(tenantId);
if (designCount >= limits.max_designs) {
  showUpgradeModal(`Maksimum ${limits.max_designs} tasarım limitine ulaştınız`);
  return;
}
```

## 10. Dosya Yapısı (Yeni)

```
web/src/
├── components/
│   ├── landing/           → Landing page, fiyatlandırma
│   │   ├── LandingPage.jsx
│   │   ├── PricingSection.jsx
│   │   └── FeaturesSection.jsx
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   └── ForgotPassword.jsx
│   ├── admin/             → Super Admin paneli
│   │   ├── AdminDashboard.jsx
│   │   ├── TenantList.jsx
│   │   ├── TenantDetail.jsx
│   │   ├── PlanManager.jsx
│   │   └── SubscriptionManager.jsx
│   ├── panel/             → Firma paneli (mevcut yapı buraya taşınır)
│   │   ├── dashboard/
│   │   ├── customers/
│   │   ├── design/
│   │   ├── contracts/
│   │   ├── payments/
│   │   ├── team/          → Çalışan yönetimi (Pro+)
│   │   ├── settings/      → Firma ayarları
│   │   └── subscription/  → Abonelik yönetimi
│   ├── portal/            → Müşteri portalı
│   │   ├── PortalDashboard.jsx
│   │   ├── PortalContract.jsx
│   │   ├── PortalPayments.jsx
│   │   └── PortalStatus.jsx
│   ├── layout/
│   │   ├── AppLayout.jsx      → Firma panel layout
│   │   ├── AdminLayout.jsx    → Super admin layout
│   │   ├── PortalLayout.jsx   → Müşteri portal layout
│   │   └── LandingLayout.jsx  → Landing page layout
│   └── shared/
│       ├── UpgradeModal.jsx
│       ├── PlanBadge.jsx
│       └── FeatureGate.jsx
├── contexts/
│   ├── AuthContext.jsx      → User + auth state
│   └── TenantContext.jsx    → Tenant + plan + limits
├── hooks/
│   ├── useAuth.js
│   ├── useTenant.js
│   ├── usePlanLimits.js
│   └── useSupabase.js
├── lib/
│   ├── supabase.js
│   └── paytr.js
├── App.jsx
└── main.jsx

web/netlify/functions/       → Serverless backend
├── paytr-create-token.js
├── paytr-callback.js
└── subscription-check.js
```

## 11. Uygulama Sırası

### Faz 1: Altyapı (Multi-Tenant + Auth)
1. Yeni DB şeması (SQL)
2. Auth akışı (login, register, tenant context)
3. RLS politikaları
4. Temel routing (landing, login, panel, admin)

### Faz 2: Landing + Kayıt
1. Landing page (özellikler, fiyatlandırma)
2. Kayıt akışı (firma oluşturma)
3. Hoşgeldin wizard

### Faz 3: Firma Paneli (Mevcut Kodun Adaptasyonu)
1. Mevcut componentleri /panel altına taşı
2. Her sorguya tenant_id ekle (RLS otomatik yapar)
3. Plan limitleri ekle (FeatureGate)

### Faz 4: Abonelik + PayTR
1. Abonelik yönetim sayfası
2. PayTR entegrasyonu (Netlify Functions)
3. Plan yükseltme/düşürme akışı

### Faz 5: Admin Panel
1. Tenant listesi ve yönetimi
2. Abonelik onay/iptal
3. Platform istatistikleri

### Faz 6: Müşteri Portalı + Ekip Yönetimi
1. Müşteri portal sayfaları
2. Çalışan davet/yönetim
3. Rol bazlı erişim kontrolü
