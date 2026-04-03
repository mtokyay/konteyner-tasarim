import React, { useState } from 'react';
import { createClient, saveConfig } from '../../lib/supabase';

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f3f0',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  logoPlaceholder: {
    width: '60px',
    height: '60px',
    backgroundColor: '#b8860b',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  title: {
    textAlign: 'center',
    margin: '0 0 8px 0',
    color: '#5a4a42',
    fontSize: '28px',
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
    margin: '0 0 32px 0',
    color: '#8b7355',
    fontSize: '14px',
  },
  form: {
    marginBottom: '32px',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#5a4a42',
    fontWeight: '500',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d4c4b8',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    color: '#5a4a42',
    backgroundColor: '#faf9f7',
    transition: 'border-color 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: '#b8860b',
    },
  },
  hint: {
    marginTop: '4px',
    fontSize: '12px',
    color: '#8b7355',
    margin: '4px 0 0 0',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
    borderLeft: '4px solid #c33',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#b8860b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#a67608',
    },
  },
  successBox: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#f0f9ff',
    borderRadius: '12px',
    borderLeft: '4px solid #059669',
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    color: '#059669',
  },
  successTitle: {
    color: '#5a4a42',
    margin: '0 0 8px 0',
    fontSize: '24px',
  },
  successText: {
    color: '#8b7355',
    margin: '0',
    fontSize: '14px',
  },
  infoBox: {
    backgroundColor: '#faf9f7',
    padding: '16px',
    borderRadius: '6px',
    borderLeft: '4px solid #b8860b',
  },
  infoTitle: {
    margin: '0 0 12px 0',
    color: '#5a4a42',
    fontSize: '14px',
    fontWeight: '600',
  },
  infoList: {
    margin: '0',
    paddingLeft: '20px',
    color: '#8b7355',
    fontSize: '13px',
  },
};

export function SupabaseConfig({ onConfigured }) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleTest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!url.trim() || !key.trim()) {
        setError('Lütfen Supabase URL ve Anahtar\'ı girin');
        setLoading(false);
        return;
      }

      // Test connection
      const client = createClient(url, key);
      if (!client) {
        setError('Geçersiz Supabase bilgileri');
        setLoading(false);
        return;
      }

      // Try to get auth status to verify connection
      const { error: authError } = await client.auth.getSession();

      if (authError && authError.message !== 'Not authenticated') {
        setError('Bağlantı başarısız oldu. Lütfen URL ve Anahtarı kontrol edin');
        setLoading(false);
        return;
      }

      // Save config
      saveConfig(url, key);
      setSuccess(true);

      // Call callback after brief delay to show success
      setTimeout(() => {
        onConfigured();
      }, 1000);
    } catch (err) {
      setError(`Hata: ${err.message || 'Bilinmeyen bir hata oluştu'}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.successBox}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Bağlantı Başarılı!</h2>
          <p style={styles.successText}>Supabase yapılandırması kaydedildi.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo placeholder */}
        <div style={styles.logoContainer}>
          <div style={styles.logoPlaceholder}>TK</div>
        </div>

        <h1 style={styles.title}>Tokyay Kereste</h1>
        <p style={styles.subtitle}>İlk Kez Kurulum</p>

        <form onSubmit={handleTest} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Supabase URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
              style={styles.input}
              disabled={loading}
            />
            <p style={styles.hint}>Supabase Project Settings &gt; API &gt; Project URL</p>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Supabase Anahtar (Anon)</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGc..."
              style={styles.input}
              disabled={loading}
            />
            <p style={styles.hint}>Supabase Project Settings &gt; API &gt; anon public</p>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
          </button>
        </form>

        <div style={styles.infoBox}>
          <h3 style={styles.infoTitle}>Supabase Bilgileri</h3>
          <ul style={styles.infoList}>
            <li>Supabase hesabını oluşturun veya giriş yapın</li>
            <li>Yeni bir proje oluşturun</li>
            <li>Project Settings sayfasından URL ve Anahtar\'ı kopyalayın</li>
            <li>Bilgileri yukarıdaki alanlara yapıştırın</li>
            <li>Bağlantı tamamlandıktan sonra giriş yapabilirsiniz</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
