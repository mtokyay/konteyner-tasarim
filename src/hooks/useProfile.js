import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSupabase } from '../lib/supabase';

/**
 * Hook to fetch and cache user profile
 * Returns: { profile, loading, error, refetch }
 */
export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch profile from database
   */
  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        setError('Supabase not configured');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Profile not found - not necessarily an error
          setProfile(null);
        } else {
          setError(fetchError.message);
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Auto-fetch profile when user changes
   */
  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
    }
  }, [user?.id]);

  /**
   * Manual refetch function
   */
  const refetch = () => {
    if (user?.id) {
      fetchProfile(user.id);
    }
  };

  return {
    profile,
    loading,
    error,
    refetch,
  };
}
