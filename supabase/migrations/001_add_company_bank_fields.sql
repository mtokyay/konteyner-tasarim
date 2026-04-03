-- Migration 001: Add missing bank and proforma fields to company_info
-- Run this in Supabase SQL Editor to fix the "Firma Bilgileri" save error
--
-- The company_info table was missing these columns that CompanyInfo.jsx tries to save.
-- Also, the code was sending "qc_items" but the DB column is "quality_checklist" —
-- this was fixed in the code to use the correct column name.

ALTER TABLE company_info ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE company_info ADD COLUMN IF NOT EXISTS bank_branch TEXT;
ALTER TABLE company_info ADD COLUMN IF NOT EXISTS bank_iban TEXT;
ALTER TABLE company_info ADD COLUMN IF NOT EXISTS bank_account_no TEXT;
ALTER TABLE company_info ADD COLUMN IF NOT EXISTS proforma_footer_note TEXT;

-- NOTE: All React components have been updated to use English column names matching the schema.
-- The field name mapping that was applied:
--
-- customers: ad→first_name, soyad→last_name, telefon→phone, eposta→email,
--            nereden_geldi→source, adres→address, notlar→notes
--
-- designs: ad→title, toplam_fiyat→total_price, indirim→discount,
--          net_fiyat→final_price, teslim_tarihi→delivery_date, notlar→notes
--          (genislik/yukseklik/uzunluk/alan/ozellikler/aciklama/ref_no → stored in design_data JSONB)
--
-- contracts: sozlesme_no→contract_number, toplam_tutar→total_amount, tarih→contract_date
--
-- payments: musteri_id→customer_id, sozlesme_id→contract_id, tutar→amount,
--           odenen_tutar→paid_amount, odeme_tarihi→paid_date, odeme_yontemi→payment_method,
--           vade→due_date, durum→status, dekont_url→receipt_url, tur→payment_type
--
-- company_info: qc_items→quality_checklist (code fix, not DB change)
