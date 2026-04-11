// PayTR iFrame API - Ödeme Callback
// PayTR sunucuları bu endpoint'i POST ile çağırır

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    if (!merchant_key || !merchant_salt) {
      return { statusCode: 500, body: 'Configuration error' };
    }

    // Parse form data from PayTR
    const params = new URLSearchParams(event.body);
    const merchant_oid = params.get('merchant_oid') || '';
    const status = params.get('status') || '';
    const total_amount = params.get('total_amount') || '';
    const hash = params.get('hash') || '';
    const failed_reason_code = params.get('failed_reason_code') || '';
    const failed_reason_msg = params.get('failed_reason_msg') || '';
    const test_mode = params.get('test_mode') || '0';
    const payment_type = params.get('payment_type') || '';

    // --- INPUT VALIDATION ---
    if (!merchant_oid || !status || !total_amount || !hash) {
      return { statusCode: 400, body: 'Missing required parameters' };
    }

    // Validate status value
    if (!['success', 'failed'].includes(status)) {
      return { statusCode: 400, body: 'Invalid status value' };
    }

    // Validate total_amount is a positive integer
    const amountNum = parseInt(total_amount, 10);
    if (isNaN(amountNum) || amountNum < 0) {
      return { statusCode: 400, body: 'Invalid total_amount' };
    }

    // Validate merchant_oid format (SUB-Y/M-xxxx-timestamp or legacy SUB-xxxx-timestamp)
    if (!/^SUB-[A-Za-z0-9-]+$/.test(merchant_oid) || merchant_oid.length > 80) {
      return { statusCode: 400, body: 'Invalid merchant_oid format' };
    }

    // --- TIMING-SAFE HMAC VERIFICATION ---
    const hash_str = `${merchant_oid}${merchant_salt}${status}${total_amount}`;
    const expected_hash = crypto
      .createHmac('sha256', merchant_key)
      .update(hash_str)
      .digest('base64');

    // Timing-safe comparison to prevent timing attacks
    const hashBuffer = Buffer.from(hash);
    const expectedBuffer = Buffer.from(expected_hash);
    if (hashBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(hashBuffer, expectedBuffer)) {
      console.error('PayTR hash mismatch for oid:', merchant_oid.substring(0, 20));
      return { statusCode: 400, body: 'PAYTR notification hash mismatch' };
    }

    // Initialize Supabase with service role key
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return { statusCode: 500, body: 'Database configuration error' };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse merchant_oid to get tenant info
    // Format: SUB-{M|Y}-{tenant_id_prefix}-{timestamp} or legacy SUB-{tenant_id_prefix}-{timestamp}
    const oidParts = merchant_oid.split('-');
    let tenantPrefix;
    let isYearly = false;

    if (oidParts[1] === 'Y' || oidParts[1] === 'M') {
      isYearly = oidParts[1] === 'Y';
      tenantPrefix = oidParts[2];
    } else {
      tenantPrefix = oidParts[1];
    }

    // Validate tenant prefix (should be hex chars, 8 chars long)
    if (!tenantPrefix || !/^[a-f0-9]{4,12}$/.test(tenantPrefix)) {
      return { statusCode: 200, body: 'OK' }; // Respond OK but don't process
    }

    // Find the tenant by prefix
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, plan_id')
      .like('id', `${tenantPrefix}%`)
      .limit(1);

    if (tenantError || !tenants || tenants.length === 0) {
      return { statusCode: 200, body: 'OK' };
    }

    const tenant = tenants[0];

    if (status === 'success') {
      const now = new Date();
      const subscriptionEnd = new Date(now);
      if (isYearly) {
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
      } else {
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
      }

      // Record payment
      await supabase.from('subscription_payments').insert({
        tenant_id: tenant.id,
        merchant_oid,
        amount: amountNum / 100,
        status: 'completed',
        payment_type,
        period_start: now.toISOString(),
        period_end: subscriptionEnd.toISOString(),
        paytr_data: {
          merchant_oid,
          total_amount: String(amountNum),
          test_mode,
          payment_type,
        },
      });

      // Find pending plan
      const { data: pendingPayment } = await supabase
        .from('subscription_payments')
        .select('plan_id')
        .eq('merchant_oid', merchant_oid)
        .single();

      const planId = pendingPayment?.plan_id || tenant.plan_id;

      // Update tenant subscription
      await supabase
        .from('tenants')
        .update({
          plan_id: planId,
          subscription_status: 'active',
          subscription_start: now.toISOString(),
          subscription_end: subscriptionEnd.toISOString(),
          next_plan_id: null, // Clear any pending downgrade
        })
        .eq('id', tenant.id);

    } else {
      // Payment failed
      await supabase.from('subscription_payments').insert({
        tenant_id: tenant.id,
        merchant_oid,
        amount: amountNum / 100,
        status: 'failed',
        payment_type,
        paytr_data: {
          merchant_oid,
          total_amount: String(amountNum),
          failed_reason_code,
          failed_reason_msg: (failed_reason_msg || '').substring(0, 500),
          test_mode,
        },
      });
    }

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('PayTR callback error:', err.message);
    return { statusCode: 200, body: 'OK' };
  }
};
