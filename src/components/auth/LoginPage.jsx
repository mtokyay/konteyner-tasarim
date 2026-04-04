import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Loader2, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Already logged in
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <Box className="w-8 h-8 text-amber-600" />
            <span className="font-bold text-xl text-gray-900">Konteyner<span className="text-amber-600">Tasarım</span></span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Giriş Yap</h2>
          <p className="text-gray-500 text-sm mb-6">Hesabınıza giriş yapın</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoFocus
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                placeholder="ornek@firma.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Hesabınız yok mu?{' '}
            <Link to="/kayit" className="text-amber-600 hover:text-amber-700 font-semibold">Ücretsiz Kayıt Ol</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
