-- ============================================================
-- 1. Profiles tablosuna email kolonu ekle
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Mevcut kullanıcıların email'ini auth.users'dan çek
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Trigger'ı güncelle: yeni kayıtlarda email de yazılsın
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. Varsayılan sözleşme maddeleri (company_info.contract_terms)
--    Firma kaydı oluşturulurken boş geliyor,
--    bu migration mevcut boş firmalara standart maddeler ekler
-- ============================================================
UPDATE company_info
SET contract_terms = ARRAY[
  'İş bu sözleşme, taraflar arasında konteyner ev üretim ve teslimatına ilişkin karşılıklı hak ve yükümlülükleri düzenler.',
  'Üretici, sözleşmede belirtilen teknik özelliklere ve onaylanan tasarım projesine uygun olarak üretimi gerçekleştirecektir.',
  'Alıcı, toplam bedelin %30''unu sözleşme imzası ile peşinat olarak, kalan tutarı belirlenen taksit planına göre ödeyecektir.',
  'Üretim süresi, peşinat ödemesinin yapıldığı tarihten itibaren 45 iş günüdür. Mücbir sebep halleri bu süreye dahil değildir.',
  'Alıcı, üretim sürecinde en fazla 2 (iki) revizyon talep edebilir. Ek revizyonlar ayrıca ücretlendirilir.',
  'Teslimat, üretim tesisinde yapılır. Nakliye masrafları alıcıya aittir, aksi sözleşmede belirtilmedikçe.',
  'Üretici, yapısal bütünlük için 2 yıl, yalıtım sistemi için 1 yıl garanti verir. Garanti, normal kullanım koşullarını kapsar.',
  'Teslim sırasında alıcı konteyner evi kontrol edecek, varsa eksiklikler tutanak ile kayıt altına alınacaktır.',
  'Sözleşmenin tek taraflı feshi halinde, fesheden taraf diğer tarafa toplam bedelin %15''i oranında cezai şart ödeyecektir.',
  'İş bu sözleşmeden doğan uyuşmazlıklarda Türkiye Cumhuriyeti kanunları uygulanır ve yetkili mahkemeler belirlenmiş il mahkemeleridir.'
]
WHERE contract_terms = '{}' OR contract_terms IS NULL;

-- ============================================================
-- 3. Varsayılan kalite kontrol maddeleri (company_info.quality_checklist)
-- ============================================================
UPDATE company_info
SET quality_checklist = ARRAY[
  'Çelik iskelet kaynak kontrolleri yapıldı',
  'Zemin yalıtımı (XPS/EPS) uygulandı',
  'Duvar panelleri montajı ve sızdırmazlık kontrolü',
  'Çatı membran/trapez sac montajı ve su geçirmezlik testi',
  'Elektrik tesisatı döşendi ve test edildi',
  'Su tesisatı (sıcak/soğuk) döşendi ve basınç testi yapıldı',
  'PVC pencere/kapı montajı ve hava sızdırmazlık kontrolü',
  'İç kaplama (OSB/MDF/Alçıpan) montajı',
  'Zemin kaplama (laminat/seramik) uygulandı',
  'Banyo/WC seramik ve vitrifiye montajı',
  'Elektrik panosu ve sigorta testi',
  'Dış cephe boyası/kaplama kontrolü',
  'Genel temizlik ve son kontrol yapıldı',
  'Müşteriye teslim öncesi fotoğraflama'
],
qc_items = ARRAY[
  'Çelik iskelet kaynak kontrolleri yapıldı',
  'Zemin yalıtımı (XPS/EPS) uygulandı',
  'Duvar panelleri montajı ve sızdırmazlık kontrolü',
  'Çatı membran/trapez sac montajı ve su geçirmezlik testi',
  'Elektrik tesisatı döşendi ve test edildi',
  'Su tesisatı (sıcak/soğuk) döşendi ve basınç testi yapıldı',
  'PVC pencere/kapı montajı ve hava sızdırmazlık kontrolü',
  'İç kaplama (OSB/MDF/Alçıpan) montajı',
  'Zemin kaplama (laminat/seramik) uygulandı',
  'Banyo/WC seramik ve vitrifiye montajı',
  'Elektrik panosu ve sigorta testi',
  'Dış cephe boyası/kaplama kontrolü',
  'Genel temizlik ve son kontrol yapıldı',
  'Müşteriye teslim öncesi fotoğraflama'
]
WHERE (quality_checklist = '{}' OR quality_checklist IS NULL)
  AND (qc_items = '{}' OR qc_items IS NULL);

-- ============================================================
-- 4. Yeni firma oluşturulduğunda varsayılan değerleri ata
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_tenant()
RETURNS trigger AS $$
BEGIN
  INSERT INTO company_info (tenant_id, name, contract_terms, quality_checklist, qc_items)
  VALUES (
    NEW.id,
    NEW.name,
    ARRAY[
      'İş bu sözleşme, taraflar arasında konteyner ev üretim ve teslimatına ilişkin karşılıklı hak ve yükümlülükleri düzenler.',
      'Üretici, sözleşmede belirtilen teknik özelliklere ve onaylanan tasarım projesine uygun olarak üretimi gerçekleştirecektir.',
      'Alıcı, toplam bedelin %30''unu sözleşme imzası ile peşinat olarak, kalan tutarı belirlenen taksit planına göre ödeyecektir.',
      'Üretim süresi, peşinat ödemesinin yapıldığı tarihten itibaren 45 iş günüdür.',
      'Alıcı, üretim sürecinde en fazla 2 (iki) revizyon talep edebilir.',
      'Teslimat, üretim tesisinde yapılır. Nakliye masrafları alıcıya aittir.',
      'Üretici, yapısal bütünlük için 2 yıl, yalıtım sistemi için 1 yıl garanti verir.',
      'Teslim sırasında alıcı konteyner evi kontrol edecek, varsa eksiklikler tutanakla kayıt altına alınacaktır.',
      'Sözleşmenin tek taraflı feshi halinde, fesheden taraf %15 cezai şart ödeyecektir.',
      'Uyuşmazlıklarda Türkiye Cumhuriyeti kanunları uygulanır.'
    ],
    ARRAY[
      'Çelik iskelet kaynak kontrolleri yapıldı',
      'Zemin yalıtımı (XPS/EPS) uygulandı',
      'Duvar panelleri montajı ve sızdırmazlık kontrolü',
      'Çatı membran/trapez sac montajı ve su geçirmezlik testi',
      'Elektrik tesisatı döşendi ve test edildi',
      'Su tesisatı döşendi ve basınç testi yapıldı',
      'PVC pencere/kapı montajı ve hava sızdırmazlık kontrolü',
      'İç kaplama montajı',
      'Zemin kaplama uygulandı',
      'Banyo/WC seramik ve vitrifiye montajı',
      'Elektrik panosu ve sigorta testi',
      'Dış cephe kontrolü',
      'Genel temizlik ve son kontrol',
      'Müşteriye teslim öncesi fotoğraflama'
    ],
    ARRAY[
      'Çelik iskelet kaynak kontrolleri yapıldı',
      'Zemin yalıtımı (XPS/EPS) uygulandı',
      'Duvar panelleri montajı ve sızdırmazlık kontrolü',
      'Çatı membran/trapez sac montajı ve su geçirmezlik testi',
      'Elektrik tesisatı döşendi ve test edildi',
      'Su tesisatı döşendi ve basınç testi yapıldı',
      'PVC pencere/kapı montajı ve hava sızdırmazlık kontrolü',
      'İç kaplama montajı',
      'Zemin kaplama uygulandı',
      'Banyo/WC seramik ve vitrifiye montajı',
      'Elektrik panosu ve sigorta testi',
      'Dış cephe kontrolü',
      'Genel temizlik ve son kontrol',
      'Müşteriye teslim öncesi fotoğraflama'
    ]
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. Plan düşürme desteği (004'ten tekrar - IF NOT EXISTS)
-- ============================================================
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS next_plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;
