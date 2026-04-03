import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

/**
 * Generate a unique customer code (e.g., "TK-M-2026-0001")
 * Format: TK-[Initial]-[Year]-[Sequence]
 * @param {string} customerName - Customer's full name
 * @returns {string} Generated customer code
 */
export function generateCustomerCode(customerName) {
  const initial = (customerName?.charAt(0) || 'X').toUpperCase();
  const year = new Date().getFullYear();
  const sequence = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `TK-${initial}-${year}-${sequence}`;
}

/**
 * Generate a random password with mix of letters, numbers
 * @returns {string} Random 8-character password
 */
function generateRandomPassword() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  let password = '';

  // Add 2 random numbers
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));

  // Add 6 random letters
  for (let i = 0; i < 6; i++) {
    password += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Shuffle password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Create customer user account in Supabase Auth + update database
 * @param {string} customerId - ID from customers table
 * @param {string} email - Customer email
 * @param {string} customerName - Customer's full name
 * @returns {Promise<{email: string, password: string, customerCode: string}>}
 * @throws {Error} If account creation fails
 */
export async function createCustomerAccount(customerId, email, customerName) {
  try {
    // 1. Generate random password
    const password = generateRandomPassword();

    // 2. Create user in Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: customerName,
          role: 'musteri',
        },
      },
    });

    if (signUpError) {
      throw new Error(`Auth signup failed: ${signUpError.message}`);
    }

    const userId = authData.user?.id;
    if (!userId) {
      throw new Error('Failed to get user ID from auth response');
    }

    // 3. Update profiles table: set role='musteri', full_name
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'musteri',
        full_name: customerName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Profile update failed: ${profileError.message}`);
    }

    // 4. Generate customer code
    const customerCode = generateCustomerCode(customerName);

    // 5. Update customers table: set assigned_user_id and customer_code
    const { error: customerError } = await supabase
      .from('customers')
      .update({
        assigned_user_id: userId,
        customer_code: customerCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    if (customerError) {
      throw new Error(`Customer update failed: ${customerError.message}`);
    }

    // 6. Return credentials and code
    return {
      email,
      password,
      customerCode,
      userId,
    };
  } catch (error) {
    console.error('Error creating customer account:', error);
    throw error;
  }
}

/**
 * Generate WhatsApp message with login credentials
 * @param {string} customerName - Customer's full name
 * @param {string} email - Customer email
 * @param {string} password - Generated password
 * @param {string} customerCode - Generated customer code
 * @param {string} appUrl - Application base URL (e.g., https://app.example.com)
 * @returns {string} Formatted WhatsApp message
 */
export function generateCredentialsMessage(
  customerName,
  email,
  password,
  customerCode,
  appUrl
) {
  const loginUrl = `${appUrl}/login`;

  const message = `
Sayın ${customerName},

Tokyay Kereste Konteyner Yapi Yönetim Sistemi'ne hoş geldiniz!

Müşteri hesabınız başarıyla oluşturulmuştur. Aşağıdaki bilgileri kullanarak giriş yapabilirsiniz:

📧 E-posta: ${email}
🔐 Şifre: ${password}
📋 Müşteri Kodu: ${customerCode}

🔗 Giriş Linki: ${loginUrl}

Lütfen ilk girişte şifrenizi değiştirmeniz önerilir.

İhtiyacınız olan herhangi bir sorun için bizimle iletişime geçmekten çekinmeyin.

Saygılarımızla,
Tokyay Kereste Ekibi
  `.trim();

  return message;
}

/**
 * Send credentials via email (optional helper)
 * @param {string} email - Recipient email
 * @param {string} customerName - Customer name
 * @param {string} password - Generated password
 * @param {string} customerCode - Customer code
 * @returns {Promise<void>}
 */
export async function sendCredentialsEmail(email, customerName, password, customerCode) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: 'Tokyay Kereste - Müşteri Hesabı Bilgileri',
        template: 'customer-credentials',
        data: {
          customerName,
          email,
          password,
          customerCode,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending credentials email:', error);
    throw error;
  }
}

/**
 * Verify customer account was created successfully
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} Customer data with user info
 */
export async function verifyCustomerAccount(customerId) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select(
        `
        id,
        customer_code,
        assigned_user_id,
        ad,
        soyad,
        eposta,
        profiles:assigned_user_id(role, full_name)
      `
      )
      .eq('id', customerId)
      .single();

    if (error) {
      throw new Error(`Verification failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error verifying customer account:', error);
    throw error;
  }
}
