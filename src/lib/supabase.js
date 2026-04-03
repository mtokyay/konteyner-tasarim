import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const CONFIG_KEYS = {
  URL: 'tk_supabase_url',
  KEY: 'tk_supabase_key',
};

// Netlify env variables (VITE_ prefix ile)
const ENV_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient = null;

/**
 * Initialize Supabase client
 * Priority: 1) Environment variables 2) localStorage
 * Returns null if not configured
 */
export function getSupabase() {
  if (supabaseClient) {
    return supabaseClient;
  }

  // Oncelik: env variables (Netlify deploy)
  let url = ENV_URL;
  let key = ENV_KEY;

  // Env yoksa localStorage'dan oku (manual config)
  if (!url || !key) {
    url = localStorage.getItem(CONFIG_KEYS.URL) || '';
    key = localStorage.getItem(CONFIG_KEYS.KEY) || '';
  }

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
 * Check if Supabase is configured
 * Either via env variables or localStorage
 */
export function isConfigured() {
  if (ENV_URL && ENV_KEY) return true;
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
