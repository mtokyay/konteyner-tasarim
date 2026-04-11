// PayTR iFrame API - Token Oluşturma
// Docs: https://dev.paytr.com/iframe-api

const crypto = require('crypto');

// Simple in-memory rate limiter (resets on cold start)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 requests per minute per IP

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return false;
  return true;
}

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Rate limiting
  const clientIp = (event.headers['x-forwarded-for'] || event.headers['client-ip'] || '0.0.0.0').split(',')[0].trim();
  if (!checkRateLimit(clientIp)) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Çok fazla istek. Lütfen biraz bekleyin.' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const {
      tenant_id,
      plan_id,
      plan_name,
      amount,
      email,
      user_name,
      billing_period,
      period_months,
    } = body;

    // --- INPUT VALIDATION ---
    if (!tenant_id || !plan_id || !amount || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Eksik parametreler' }) };
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Geçersiz e-posta adresi' }) };
    }

    // Validate amount is a positive integer
    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > 10000000) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Geçersiz tutar' }) };
    }

    // Validate tenant_id format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenant_id)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Geçersiz tenant' }) };
    }

    // Validate plan_id format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(plan_id)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Geçersiz plan' }) };
    }

    // Sanitize string inputs
    const safePlanName = (plan_name || 'Plan').replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜ0-9\s-]/g, '').substring(0, 100);
    const safeUserName = (user_name || email.split('@')[0]).replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜ0-9\s.-]/g, '').substring(0, 100);

    // PayTR credentials from environment variables
    const merchant_id = process.env.PAYTR_MERCHANT_ID;
    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    if (!merchant_id || !merchant_key || !merchant_salt) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'PayTR yapılandırması eksik. Lütfen yönetici ile iletişime geçin.' }),
      };
    }

    // Determine billing info
    const isYearly = billing_period === 'yearly' || period_months === 12;
    const periodLabel = isYearly ? 'Yıllık' : 'Aylık';

    // Generate unique merchant_oid with cryptographic randomness
    const periodCode = isYearly ? 'Y' : 'M';
    const randomPart = crypto.randomBytes(4).toString('hex');
    const merchant_oid = `SUB-${periodCode}-${tenant_id.substring(0, 8)}-${randomPart}-${Date.now()}`;

    // User info
    const user_ip = clientIp;
    const user_address = 'Türkiye';
    const user_phone = '05000000000';

    // Callback URLs
    const siteUrl = process.env.URL || process.env.SITE_URL || 'https://konteynertasarim.com.tr';
    const merchant_ok_url = `${siteUrl}/panel/subscription?status=success`;
    const merchant_fail_url = `${siteUrl}/panel/subscription?status=fail`;

    // Payment details
    const payment_amount = amountNum;
    const currency = 'TL';
    const no_installment = 1;
    const max_installment = 0;
    const timeout_limit = 30;

    // Basket (JSON encoded and base64)
    const basket = JSON.stringify([
      [`${safePlanName} ${periodLabel} Abonelik`, `${(payment_amount / 100).toFixed(2)}`, 1],
    ]);
    const user_basket = Buffer.from(basket).toString('base64');

    // Test mode
    const test_mode = process.env.PAYTR_TEST_MODE === 'true' ? 1 : 0;
    const debug_on = process.env.PAYTR_DEBUG === 'true' ? 1 : 0;

    // Generate hash
    const hash_str = `${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
    const paytr_token = crypto
      .createHmac('sha256', merchant_key)
      .update(hash_str + merchant_salt)
      .digest('base64');

    // Send request to PayTR
    const params = new URLSearchParams({
      merchant_id,
      user_ip,
      merchant_oid,
      email,
      payment_amount: payment_amount.toString(),
      paytr_token,
      user_basket,
      debug_on: debug_on.toString(),
      no_installment: no_installment.toString(),
      max_installment: max_installment.toString(),
      user_name: safeUserName,
      user_address,
      user_phone,
      merchant_ok_url,
      merchant_fail_url,
      timeout_limit: timeout_limit.toString(),
      currency,
      test_mode: test_mode.toString(),
      lang: 'tr',
    });

    const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const result = await response.json();

    if (result.status === 'success') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: result.token,
          merchant_oid,
          billing_period: isYearly ? 'yearly' : 'monthly',
          period_months: isYearly ? 12 : 1,
        }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: result.reason || 'PayTR token oluşturulamadı' }),
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Sunucu hatası. Lütfen tekrar deneyin.' }),
    };
  }
};
