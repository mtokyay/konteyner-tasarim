/**
 * Customer Account Management Utility Functions
 * Handles customer account creation, verification, and retrieval
 */

/**
 * Creates an authentication user account for a customer
 * @param {object} supabase - Supabase client instance
 * @param {string} customerId - Customer ID from customers table
 * @param {string} email - Customer email address
 * @returns {object} - Created user object or error
 */
export async function createCustomerAccount(supabase, customerId, email) {
  try {
    if (!email || !customerId) {
      throw new Error('E-posta ve Müşteri ID gereklidir');
    }

    // Check if customer already has an account
    const existingUser = await verifyCustomerAccount(supabase, email);
    if (existingUser) {
      throw new Error('Bu e-posta ile zaten bir hesap bulunmaktadır');
    }

    // Create auth user with email
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: false,
      user_metadata: {
        customer_id: customerId,
      },
    });

    if (error) {
      throw error;
    }

    // Update customer record with assigned_user_id
    if (data?.user?.id) {
      const { error: updateError } = await supabase
        .from('customers')
        .update({ assigned_user_id: data.user.id })
        .eq('id', customerId);

      if (updateError) {
        console.error('Müşteri güncelleme hatası:', updateError);
        throw updateError;
      }
    }

    return {
      success: true,
      user: data.user,
      message: 'Müşteri hesabı başarıyla oluşturuldu',
    };
  } catch (error) {
    console.error('Müşteri hesabı oluşturma hatası:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verifies if a customer account exists by email
 * @param {object} supabase - Supabase client instance
 * @param {string} email - Customer email address
 * @returns {object|null} - Customer object if exists, null otherwise
 */
export async function verifyCustomerAccount(supabase, email) {
  try {
    if (!email) {
      throw new Error('E-posta adresi gereklidir');
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Müşteri doğrulama hatası:', error);
    return null;
  }
}

/**
 * Fetches customer record by email
 * @param {object} supabase - Supabase client instance
 * @param {string} email - Customer email address
 * @returns {object|null} - Customer object with all fields (ad, soyad, eposta, assigned_user_id, etc.)
 */
export async function getCustomerByEmail(supabase, email) {
  try {
    if (!email) {
      throw new Error('E-posta adresi gereklidir');
    }

    const { data, error } = await supabase
      .from('customers')
      .select('id, first_name, last_name, phone, email, assigned_user_id, created_at, updated_at')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      success: true,
      customer: data,
    };
  } catch (error) {
    console.error('Müşteri getirme hatası:', error);
    return {
      success: false,
      error: error.message,
      customer: null,
    };
  }
}

/**
 * Helper function to check if customer has active auth account
 * @param {object} supabase - Supabase client instance
 * @param {string} customerId - Customer ID
 * @returns {boolean} - True if customer has assigned user
 */
export async function hasActiveAccount(supabase, customerId) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('assigned_user_id')
      .eq('id', customerId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.assigned_user_id !== null && data?.assigned_user_id !== undefined;
  } catch (error) {
    console.error('Hesap kontrol hatası:', error);
    return false;
  }
}

/**
 * Helper function to get customer with related data
 * @param {object} supabase - Supabase client instance
 * @param {string} customerId - Customer ID
 * @returns {object|null} - Customer object with related contracts and payments
 */
export async function getCustomerWithRelations(supabase, customerId) {
  try {
    if (!customerId) {
      throw new Error('Müşteri ID gereklidir');
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .maybeSingle();

    if (customerError) {
      throw customerError;
    }

    if (!customer) {
      return null;
    }

    // Get related contracts
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .eq('customer_id', customerId);

    if (contractsError) {
      console.error('Sözleşme getirme hatası:', contractsError);
    }

    // Get related payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('customer_id', customerId);

    if (paymentsError) {
      console.error('Ödeme getirme hatası:', paymentsError);
    }

    return {
      customer,
      contracts: contracts || [],
      payments: payments || [],
    };
  } catch (error) {
    console.error('Müşteri ilişkileri getirme hatası:', error);
    return null;
  }
}

/**
 * Updates customer email address
 * @param {object} supabase - Supabase client instance
 * @param {string} customerId - Customer ID
 * @param {string} newEmail - New email address
 * @returns {object} - Success status and message
 */
export async function updateCustomerEmail(supabase, customerId, newEmail) {
  try {
    if (!customerId || !newEmail) {
      throw new Error('Müşteri ID ve yeni e-posta gereklidir');
    }

    // Check if new email is already in use
    const existingCustomer = await verifyCustomerAccount(supabase, newEmail);
    if (existingCustomer && existingCustomer.id !== customerId) {
      throw new Error('Bu e-posta adresi başka bir müşteri tarafından kullanılmaktadır');
    }

    // Update customer email
    const { error } = await supabase
      .from('customers')
      .update({ eposta: newEmail })
      .eq('id', customerId);

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'E-posta adresi başarıyla güncellendi',
    };
  } catch (error) {
    console.error('E-posta güncelleme hatası:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
