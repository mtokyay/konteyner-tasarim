import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabase, isConfigured } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isConfigured: false,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(isConfigured());

  /**
   * Fetch user profile from profiles table
   */
  const fetchProfile = async (userId) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)