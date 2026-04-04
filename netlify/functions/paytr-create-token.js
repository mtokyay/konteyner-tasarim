// PayTR iFrame API - Token Oluşturma
// Docs: https://dev.paytr.com/iframe-api

const crypto = require('crypto');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const {
      tenant_id,
      plan_id,
      plan_name,
      amount, // kuruş cinsinden
      email,
      user_name,
    } = JSON.parse(event.body);

    if (!tenant_id || !plan_id || !amount || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Eksik parametreler' }) };
    }

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

    // Generate unique merchant_oid (order ID)
    const merchant_oid = `SUB-${tenant_id.substring(0, 8)}-${Date.now()}`;

    // User info
    const user_ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || '127.0.0.1';
    const user_address = 'Türkiye';
    const user_phone = '05000000000';

    // Callback URLs
    const siteUrl = process.env.URL || process.env.SITE_URL || 'https://konteynertasarim.com.tr';
    const merchant_ok_url = `${siteUrl}/panel/subscription?status=success`;
    const merchant_fail_url = `${siteUrl}/panel/subscription?status=fail`;

    // Payment details
    const payment_amount = amount; // already in kuruş
    const currency = 'TL';
    const no_installment = 1; // taksit kapalı
    const max_installment = 0;
    const timeout_limit = 30; // minutes

    // Basket (JSON encoded and base64)
    const basket = JSON.stringify([
      [`${plan_name} Aylık Abonelik`, `${(payment_amount / 100).toFixed(2)}`, 1],
    ]);
    const user_basket = Buffer.from(basket).toString('base64');

    // Test mode (1 = test, 0 = live)
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
      user_name: user_name || email.split('@')[0],
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
          tenant_id,
          plan_id,
        }),
      };
    } else {
      console.error('PayTR token error:', result);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: result.reason || 'PayTR token oluşturulamadı' }),
      };
    }
  } catch (err) {
    console.error('PayTR create-token error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Sunucu hatası: ' + err.message }),
    };
  }
};
