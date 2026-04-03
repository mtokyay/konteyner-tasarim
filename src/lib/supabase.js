import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const CONFIG_KEYS = {
  URL: 'tk_supabase_url',
  KEY: 'tk_supabase_key',
};

let supabaseClient = null;

/**
 * Initialize Supabase client from localStorage config
 * Returns null if not configured
 */
export function getSupabase() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = localStorage.getItem(CONFIG_KEYS.URL);
  const key = localStorage.getItem(CONFIG_KEYS.KEY);

  if (!url || !key) {
    return null;
  }

  try {
    supabaseClient = createSupabaseClient(url, key);
    return supabaseClient;
  } catch (error) {
    console.error('Supabase initialization error:', error);
    return null;
  }
}

/**
 * Create a client with custom credentials (for testing)
 */
export function createClient(url, key) {
  try {
    return createSupabaseClient(url, key);
  } catch (error) {
    console.error('Supabase client creation error:', error);
    return null;
  }
}

/**
 * Check if Supabase is configured in localStorage
 */
export function isConfigured() {
  const url = localStorage.getItem(CONFIG_KEYS.URL);
  const key = localStorage.getItem(CONFIG_KEYS.KEY);
  return !!(url && key);
}

/**
 * Save Supabase config to localStorage
 */
export function saveConfig(url, key) {
  localStorage.setItem(CONFIG_KEYS.URL, url);
  localStorage.setItem(CONFIG_KEYS.KEY, key);
  // Reset client to force re-initialization
  supabaseClient = null;
}

/**
 * Clear Supabase config from localStorage
 */
export function clearConfig() {
  localStorage.removeItem(CONFIG_KEYS.URL);
  localStorage.removeItem(CONFIG_KEYS.KEY);
  supabaseClient = null;
}
