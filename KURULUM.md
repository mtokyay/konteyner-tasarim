# Tokyay Kereste - Konteyner Tasarim Portali
## Kurulum Rehberi

### 1. Supabase Kurulumu

1. https://supabase.com adresine gidin ve hesap olusturun
2. "New Project" ile yeni bir proje olusturun:
   - Isim: `tokyay-kereste`
   - Sifre: guclu bir veritabani sifresi belirleyin
   - Bolge: `eu-central-1` (Frankfurt)
3. Proje olusturulduktan sonra **SQL Editor** bolumune gidin
4. `supabase/schema.sql` dosyasinin icerigini kopyalayip SQL Editor'de calistirin
5. **Settings > API** bolumunden su bilgileri not edin:
   - Project URL (ornek: `https://xxxxx.supabase.co`)
   - anon/public key

### 2. Supabase Storage Bucket Olusturma

SQL Editor'de asagidaki SQL'i calistirin:

```sql
-- Storage bucket'lari olustur
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('designs', 'designs', true),
  ('contracts', 'contracts', false),
  ('payment_receipts', 'payment_receipts', false),
  ('production_photos', 'production_photos', true),
  ('company', 'company', true);

-- Storage politikalari
CREATE POLICY "Public design images" ON storage.objects
  FOR SELECT USING (bucket_id = 'designs');

CREATE POLICY "Auth users upload designs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'designs' AND auth.role() = 'authenticated');

CREATE POLICY "Auth users read contracts" ON storage.objects
  FOR SELECT USING (bucket_id = 'contracts' AND auth.role() = 'authenticated');

CREATE POLICY "Auth users upload contracts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'contracts' AND auth.role() = 'authenticated');

CREATE POLICY "Auth users read receipts" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment_receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Auth users upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment_receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Public production photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'production_photos');

CREATE POLICY "Auth users upload production photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'production_photos' AND auth.role() = 'authenticated');

CREATE POLICY "Public company assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'company');

CREATE POLICY "Auth users upload company assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'company' AND auth.role() = 'authenticated');
```

### 3. Ilk Kullanici Olusturma

Supabase Dashboard > Authentication > Users bolumunden:
1. "Add User" > "Create new user"
2. Email: `patron@tokyaykereste.com`
3. Sifre belirleyin
4. Kullanici olustuktan sonra SQL Editor'de:

```sql
UPDATE profiles
SET role = 'patron', full_name = 'Mehmet Tokyay'
WHERE id = 'olusturulan-user-id';
```

Diger roller icin de ayni sekilde kullanici olusturun:
- `tasarimci@tokyaykereste.com` (role: tasarimci)
- `muhasebe@tokyaykereste.com` (role: muhasebeci)
- `kalite@tokyaykereste.com` (role: kalite_kontrolcu)
- `usta@tokyaykereste.com` (role: usta)

### 4. Lokal Gelistirme

```bash
cd web
npm install
cp .env.example .env
```

`.env` dosyasini duzenleyin:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

```bash
npm run dev
```

Tarayicide `http://localhost:3000` adresini acin.

> **Not:** Supabase baglantisi olmadan da demo modda calisir. Login ekraninda rol secip giris yapabilirsiniz.

### 5. GitHub'a Yukleme

```bash
cd web
git init
git add .
git commit -m "Tokyay Kereste Portal - Faz 1-4 + Faz 7"
git remote add origin https://github.com/KULLANICI/tokyay-kereste.git
git push -u origin main
```

### 6. Netlify Deploy

1. https://app.netlify.com adresine gidin
2. "Add new site" > "Import an existing project"
3. GitHub reponuzu secin
4. Build ayarlari:
   - Base directory: `web`
   - Build command: `npm run build`
   - Publish directory: `web/dist`
5. Environment variables ekleyin:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. "Deploy" butonuna basin

### 7. Tasarim Editoru Entegrasyonu

Mevcut `app/index.html` dosyasi tasarim editoru olarak iframe icinde kullanilir.
Deploy edildiginde `public/app/index.html` olarak yer alir.

```bash
# Guncelleme gerektiginde:
cp app/index.html web/public/app/index.html
```

### Proje Yapisi

```
web/
  src/
    App.jsx                    # Ana uygulama + router + auth
    main.jsx                   # React entry point
    index.css                  # Tailwind + global stiller
    lib/
      supabase.js              # Supabase client
    contexts/
      AuthContext.jsx           # Auth state yonetimi
    hooks/
      useProfile.js            # Profil hook
    utils/
      contractPdf.js           # Sozlesme PDF olusturucu (jsPDF)
      customerAccount.js       # Otomatik musteri hesabi olusturma
      formatters.js            # Para, tarih, telefon formatlamalari
    components/
      auth/
        LoginPage.jsx           # Giris ekrani
        SupabaseConfig.jsx      # Ilk kurulum ekrani
      layout/
        AppLayout.jsx           # Ana layout (sidebar + header)
      dashboard/
        PatronDashboard.jsx     # Patron paneli
        TasarimciDashboard.jsx  # Tasarimci paneli
        MusteriDashboard.jsx    # Musteri paneli
      customers/
        CustomerCreate.jsx      # Musteri olusturma
        CustomerList.jsx        # Musteri listesi + arama/filtreleme
        CustomerDetail.jsx      # Musteri detay (tabli)
      design/
        DesignList.jsx          # Tasarim listesi
        DesignNew.jsx           # Yeni tasarim akisi (2 adim)
        DesignEditor.jsx        # Tasarim editoru (iframe)
        DesignDetail.jsx        # Tasarim detay + fiyat
      contracts/
        ContractCreate.jsx      # Sozlesme olusturma + odeme plani
        ContractList.jsx        # Sozlesme listesi
        ContractDetail.jsx      # Sozlesme detay + imza yukleme
      payments/
        PaymentList.jsx         # Odeme listesi + ozet kartlar
        PaymentEntry.jsx        # Tahsilat girisi formu
        FinanceDashboard.jsx    # Finansal dashboard + grafikler
        CustomerPaymentNotification.jsx  # "Para Gonderdim" ozeligi
      company/
        CompanyInfo.jsx         # Firma bilgileri (4 tab)
      customer-portal/
        CustomerContract.jsx    # Musteri - sozlesme goruntulemesi
        CustomerStatus.jsx      # Musteri - uretim durumu takibi
  supabase/
    schema.sql                  # Veritabani semasi (1024 satir)
  public/
    app/index.html              # Standalone tasarim editoru
  package.json
  vite.config.js
  tailwind.config.js
  postcss.config.js
  netlify.toml                  # SPA redirect ayari
  .env.example                  # Ornek ortam degiskenleri
  .gitignore
```

### Roller ve Erisim

| Rol | Dashboard | Musteriler | Tasarim | Sozlesme | Odeme | Firma | Uretim | Kalite |
|-----|-----------|-----------|---------|----------|-------|-------|--------|--------|
| Patron | x | x | x | x | x | x | x | x |
| Tasarimci | x | x | x | - | - | - | - | - |
| Muhasebeci | - | x | - | x | x | - | - | - |
| Kalite Kontrolcu | - | - | - | - | - | - | x | x |
| Usta | - | - | - | - | - | - | x | - |
| Musteri | x | - | - | Kendi | Kendi | - | Kendi | - |

### Faz Plani

**Faz 1 (Tamamlandi):** Temel Altyapi
- [x] Auth + Login + Rol secimi
- [x] Musteri CRUD (olusturma, listeleme, detay)
- [x] Tasarim editoru entegrasyonu (iframe)
- [x] Rol bazli dashboard

**Faz 2 (Tamamlandi):** Sozlesme + Odeme
- [x] Sozlesme olusturma + maddeler
- [x] Odeme plani (pesinat, taksit, kalan)
- [x] Otomatik taksit hesaplama
- [x] Sozlesme PDF ciktisi (jsPDF)

**Faz 3 (Tamamlandi):** Firma Bilgileri
- [x] Firma bilgileri yonetimi (4 tab)
- [x] Sozlesme sablonu
- [x] Kalite kontrol ayarlari
- [x] Proforma ayarlari

**Faz 4 (Tamamlandi):** Musteri Portali
- [x] Musteri sozlesme goruntulemesi
- [x] Musteri odeme bildirimi ("Para Gonderdim")
- [x] Uretim durumu takibi + fotolar
- [x] Mesajlasma

**Faz 7 (Tamamlandi):** Finans
- [x] Tahsilat girisi
- [x] Finansal dashboard + grafikler
- [x] Odeme hatirlatma
- [x] Musteri bazli odeme durumu

**Faz 5 (Planlanmis):** Usta Paneli + Uretim
- [ ] Usta is listesi
- [ ] Uretim asamalari (tik + foto yukleme)
- [ ] Is tamamlama akisi

**Faz 6 (Planlanmis):** Kalite Kontrol + Sevk
- [ ] Kalite kontrol paneli
- [ ] Patron onay akisi
- [ ] Sevk/teslimat sureci

**Faz 8 (Planlanmis):** Bildirimler + Raporlar
- [ ] Bildirim sistemi
- [ ] Detayli raporlar
- [ ] Mobil optimizasyon
