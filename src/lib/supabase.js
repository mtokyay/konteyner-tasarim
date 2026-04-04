import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const ENV_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const CONFIG_KEYS = {
  URL: 'tk_supabase_url',
  KEY: 'tk_supabase_key',
};

let supabaseClient = null;

export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  let url = ENV_URL;
  let key = ENV_KEY;

  if (!url || !key) {
    url = localStorage.getItem(CONFIG_KEYS.URL) || '';
    key = localStorage.getItem(CONFIG_KEYS.KEY) || '';
  }

  if (!url || !key) return null;

  try {
    supabaseClient = createSupabaseClient(url, key);
    return supabaseClient;
  } catch (error) {
    console.error('Supabase init error:', error);
    return null;
  }
}

export function isConfigured() {
  if (ENV_URL && ENV_KEY) return true;
  return !!(localStorage.getItem(CONFIG_KEYS.URL) && localStorage.getItem(CONFIG_KEYS.KEY));
}

export function saveConfig(url, key) {
  localStorage.setItem(CONFIG_KEYS.URL, url);
  localStorage.setItem(CONFIG_KEYS.KEY, key);
  supabaseClient = null;
}

export function clearConfig() {
  localStorage.removeItem(CONFIG_KEYS.URL);
  localStorage.removeItem(CONFIG_KEYS.KEY);
  supabaseClient = null;
}
