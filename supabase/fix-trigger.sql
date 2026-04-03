-- Mevcut trigger'i kaldir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_profile_on_signup() CASCADE;

-- Cok basit trigger fonksiyonu
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Kullanici'),
    'musteri'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Hata olursa bile kullanici olusturulabilsin
  RAISE LOG 'Profile creation error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Trigger'i tekrar ekle
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_on_signup();
