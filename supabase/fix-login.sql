-- =============================================
-- GIRIS PROBLEMINI COZME - Supabase SQL Editor'de calistirin
-- =============================================

-- 1. Profiles tablosundaki RLS politikalarini duzenle
-- (Profil okunamadigi icin giris sonrasi rol alinamiyor)

-- Mevcut politikalari kaldir
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_auth" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Yeni basit politikalar olustur
-- Tum giris yapmis kullanicilar profilleri gorebilir
CREATE POLICY "profiles_select_auth" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Kullanicilar kendi profillerini guncelleyebilir
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Kullanicilar kendi profillerini olusturabilir (trigger icin)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Mehmet'in rolunu patron olarak ayarla
UPDATE profiles
SET role = 'patron', full_name = 'Mehmet Tokyay'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'mehmet@tokyay.com.tr'
);

-- 3. Dogrulama - sonucu kontrol edin
SELECT id, full_name, role, email FROM profiles
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'mehmet@tokyay.com.tr'
);
