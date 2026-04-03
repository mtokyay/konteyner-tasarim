import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseConfig } from './SupabaseConfig';
import { clearConfig } from '../../lib/supabase';

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
    marginBottom: '24px',
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
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: '#8b7355',
  },
  resetLink: {
    backgroundColor: 'none',
    border: 'none',
    color: '#b8860b',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '0',
    textDecoration: 'underline',
  },
  roleBadge: {
    display: 'inline-block',
    backgroundColor: '#b8860b',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    marginLeft: '8px',
  },
  loadingSpinner: {
    display: 'inline-block',
    width: '4px',
    height: '4px',
    backgroundColor: 'white',
    borderRadius: '50%',
    marginRight: '4px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
};

export function LoginPage({ onLoginSuccess }) {
  const { user, isConfigured, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  if (!isConfigured) {
    return <SupabaseConfig onConfigured={() => setShowConfig(false)} />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        setError('Lütfen e-mail ve şifre girin');
        setLoading(false);
        return;
      }

      await signIn(email, password);
      onLoginSuccess?.();
    } catch (err) {
      // Translate common Supabase error messages
      let errorMessage = 'Giriş başarısız oldu';

      if (err.message.includes('Invalid login credentials')) {
        errorMessage = 'E-mail veya şifre hatalı';
      } else if (err.message.includes('Email not confirmed')) {
        errorMessage = 'E-mailini doğrula';
      } else if (err.message.includes('User not found')) {
        errorMessage = 'Kullanıcı bulunamadı';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetConfig = () => {
    clearConfig();
    setShowConfig(true);
    window.location.reload();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo placeholder */}
        <div style={styles.logoContainer}>
          <div style={styles.logoPlaceholder}>TK</div>
        </div>

        <h1 style={styles.title}>Tokyay Kereste</h1>
        <p style={styles.subtitle}>Giriş Yap</p>

        {user && (
          <div style={{ ...styles.subtitle, color: '#059669', marginBottom: '24px' }}>
            Hoş geldiniz
            {user.email && <span style={styles.roleBadge}>{user.email}</span>}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@example.com"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              disabled={loading}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div style={styles.footer}>
          <span>Supabase yapılandırması kaydedildi</span>
          <button onClick={handleResetConfig} style={styles.resetLink}>
            Ayarları Sıfırla
          </button>
        </div>
      </div>
    </div>
  );
}
