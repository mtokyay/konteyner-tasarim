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
      console.error('PayTR credentials missing');
      return { statusCode: 500, body: 'Configuration error' };
    }

    // Parse form data from PayTR
    const params = new URLSearchParams(event.body);
    const merchant_oid = params.get('merchant_oid');
    const status = params.get('status'); // 'success' or 'failed'
    const total_amount = params.get('total_amount');
    const hash = params.get('hash');
    const failed_reason_code = params.get('failed_reason_code') || '';
    const failed_reason_msg = params.get('failed_reason_msg') || '';
    const test_mode = params.get('test_mode') || '0';
    const payment_type = params.get('payment_type') || '';

    // Verify hash
    const hash_str = `${merchant_oid}${merchant_salt}${status}${total_amount}`;
    const expected_hash = crypto
      .createHmac('sha256', merchant_key)
      .update(hash_str)
      .digest('base64');

    if (hash !== expected_hash) {
      console.error('PayTR hash mismatch', { merchant_oid, expected_hash, received_hash: hash });
      return { statusCode: 400, body: 'PAYTR notification hash mismatch' };
    }

    // Initialize Supabase with service role key
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials missing');
      return { statusCode: 500, body: 'Database configuration error' };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse merchant_oid to get tenant info
    // Format: SUB-{tenant_id_prefix}-{timestamp}
    const oidParts = merchant_oid.split('-');
    const tenantPrefix = oidParts[1]; // first 8 chars of tenant_id

    // Find the tenant by prefix
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, plan_id')
      .like('id', `${tenantPrefix}%`)
      .limit(1);

    if (tenantError || !tenants || tenants.length === 0) {
      console.error('Tenant not found for oid:', merchant_oid);
      // Still respond OK to PayTR
      return { statusCode: 200, body: 'OK' };
    }

    const tenant = tenants[0];

    if (status === 'success') {
      // Payment successful - update tenant subscription
      const now = new Date();
      const subscriptionEnd = new Date(now);
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

      // Record payment
      await supabase.from('subscription_payments').insert({
        tenant_id: tenant.id,
        merchant_oid,
        amount: parseInt(total_amount) / 100, // kuruş to TL
        status: 'completed',
        payment_type,
        period_start: now.toISOString(),
        period_end: subscriptionEnd.toISOString(),
        paytr_data: {
          merchant_oid,
          total_amount,
          test_mode,
          payment_type,
        },
      });

      // Find the plan from the pending payment or use current plan
      // We need to find which plan was being purchased
      const { data: pendingPayment } = await supabase
        .from('subscription_payments')
        .select('plan_id')
        .eq('merchant_oid', merchant_oid)
        .single();

      const planId = pendingPayment?.plan_id || tenant.plan_id;

      // Update tenant subscription status
      await supabase
        .from('tenants')
        .update({
          plan_id: planId,
          subscription_status: 'active',
          subscription_start: now.toISOString(),
          subscription_end: subscriptionEnd.toISOString(),
        })
        .eq('id', tenant.id);

      console.log(`Subscription activated for tenant ${tenant.id}, plan ${planId}`);
    } else {
      // Payment failed
      await supabase.from('subscription_payments').insert({
        tenant_id: tenant.id,
        merchant_oid,
        amount: parseInt(total_amount) / 100,
        status: 'failed',
        payment_type,
        paytr_data: {
          merchant_oid,
          total_amount,
          failed_reason_code,
          failed_reason_msg,
          test_mode,
        },
      });

      console.log(`Payment failed for tenant ${tenant.id}: ${failed_reason_msg}`);
    }

    // PayTR expects "OK" response
    return {
      statusCode: 200,
      body: 'OK',
    };
  } catch (err) {
    console.error('PayTR callback error:', err);
    // Still respond OK to avoid PayTR retries on server errors
    return { statusCode: 200, body: 'OK' };
  }
};
