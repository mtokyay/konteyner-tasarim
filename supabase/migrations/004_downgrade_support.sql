-- Plan düşürme desteği: dönem sonunda geçiş yapılacak plan
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS next_plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;

-- Yorum: next_plan_id doluysa, subscription_end tarihinde plan_id = next_plan_id olarak güncellenir
-- Bu güncelleme ya cron job ya da kullanıcı login'inde kontrol edilir
