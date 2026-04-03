import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getSupabase, isConfigured } from './lib/supabase';
import AppLayout from './components/layout/AppLayout';
import PatronDashboard from './components/dashboard/PatronDashboard';
import TasarimciDashboard from './components/dashboard/TasarimciDashboard';
import MusteriDashboard from './components/dashboard/MusteriDashboard';
import CustomerList from './components/customers/CustomerList';
import CustomerCreate from './components/customers/CustomerCreate';
import CustomerDetail from './components/customers/CustomerDetail';
import DesignList from './components/design/DesignList';
import DesignNew from './components/design/DesignNew';
import DesignDetail from './components/design/DesignDetail';
import CompanyInfo from './components/company/CompanyInfo';
import ContractCreate from './components/contracts/ContractCreate';
import ContractList from './components/contracts/ContractList';
import ContractDetail from './components/contracts/ContractDetail';
import PaymentList from './components/payments/PaymentList';
import PaymentEntry from './components/payments/PaymentEntry';
import FinanceDashboard from './components/payments/FinanceDashboard';
import CustomerPaymentNotification from './components/payments/CustomerPaymentNotification';
import CustomerContract from './components/customer-portal/CustomerContract';
import CustomerStatus from './components/customer-portal/CustomerStatus';

// Auth Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    const authToken = localStorage.getItem('authToken');

    if (storedUser && authToken) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('authToken', userData.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <AppLayout user={user}>{children}</AppLayout>;
};

// Placeholder Component for Routes Not Yet Built
const ComingSoon = () => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <div className="mb-6">
      <div className="text-6xl mb-4">🏗️</div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Yakında...</h2>
      <p className="text-gray-600 text-lg">Bu sayfa yakında hazır olacaktır.</p>
    </div>
  </div>
);

// Login Page
const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('patron');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const supabaseReady = isConfigured();

  const roles = [
    { value: 'patron', label: 'Patron (İşletme Sahibi)' },
    { value: 'tasarimci', label: 'Tasarımcı' },
    { value: 'muhasebeci', label: 'Muhasebeci' },
    { value: 'kalite_kontrolcu', label: 'Kalite Kontrolcü' },
    { value: 'usta', label: 'Usta' },
    { value: 'musteri', label: 'Müşteri' },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Lütfen e-mail ve şifreyi girin');
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();

      if (supabase) {
        // Gercek Supabase auth
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError('Giriş başarısız: ' + authError.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          // Profil tablosundan rol bilgisini al
          let profileRole = 'patron';
          let profileName = data.user.email.split('@')[0];

          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('full_name, role')
              .eq('id', data.user.id)
              .single();

            if (profile && !profileError) {
              profileRole = profile.role || 'patron';
              profileName = profile.full_name || profileName;
            }
          } catch (profileErr) {
            console.warn('Profil okunamadi, varsayilan rol kullaniliyor:', profileErr);
          }

          const userData = {
            id: data.user.id,
            name: profileName,
            email: data.user.email,
            role: profileRole,
            token: data.session.access_token,
          };

          login(userData);
        }
      } else {
        // Demo mod - Supabase baglantisi yok
        const userData = {
          id: 'demo-' + Date.now(),
          name: email.split('@')[0],
          email: email,
          role: selectedRole,
          token: 'demo-token-' + Date.now(),
        };

        login(userData);
      }
    } catch (err) {
      setError('Bağlantı hatası: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <span className="text-3xl font-bold text-amber-700">TK</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Tokyay Kereste</h1>
          <p className="text-amber-100">Tinyhouse Yönetim Sistemi</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Giriş Yapın</h2>

          {/* Baglanti durumu */}
          <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${supabaseReady ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
            <span className={`w-2 h-2 rounded-full ${supabaseReady ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            {supabaseReady ? 'Veritabanı bağlantısı aktif' : 'Demo mod - Veritabanı bağlantısı yok'}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Rol secimi sadece demo modda gosterilir */}
            {!supabaseReady && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol Seçin (Demo)
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@tokyaykereste.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-700 text-white py-2 rounded-lg hover:bg-amber-800 transition-colors font-semibold mt-6 disabled:opacity-50"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          {!supabaseReady && (
            <p className="text-xs text-gray-500 text-center mt-6">
              Demo modu aktif. Herhangi bir e-mail ve şifre ile giriş yapabilirsiniz.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Dashboard Router Component
const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'patron':
      return <PatronDashboard />;
    case 'tasarimci':
      return <TasarimciDashboard />;
    case 'muhasebeci':
      return <ComingSoon />;
    case 'kalite_kontrolcu':
      return <ComingSoon />;
    case 'usta':
      return <ComingSoon />;
    case 'musteri':
      return <MusteriDashboard />;
    default:
      return <ComingSoon />;
  }
};

// Unauthorized Page
const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">403</h1>
      <p className="text-gray-600 mb-6">Bu sayfaya erişim izni yok</p>
      <a href="/dashboard" className="text-amber-700 hover:text-amber-800 font-semibold">
        Dashboard'a Dön →
      </a>
    </div>
  </div>
);

// Main App Component
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Root - Redirect to Dashboard or Login */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />

          {/* Customers */}
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <CustomerList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/new"
            element={
              <ProtectedRoute>
                <CustomerCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute>
                <CustomerDetail />
              </ProtectedRoute>
            }
          />

          {/* Designs */}
          <Route
            path="/designs"
            element={
              <ProtectedRoute>
                <DesignList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/designs/new"
            element={
              <ProtectedRoute>
                <DesignNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/designs/:id"
            element={
              <ProtectedRoute>
                <DesignDetail />
              </ProtectedRoute>
            }
          />

          {/* Contracts */}
          <Route
            path="/contracts"
            element={
              <ProtectedRoute>
                <ContractList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts/new/:designId"
            element={
              <ProtectedRoute>
                <ContractCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts/:id"
            element={
              <ProtectedRoute>
                <ContractDetail />
              </ProtectedRoute>
            }
          />

          {/* Payments */}
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <PaymentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/entry"
            element={
              <ProtectedRoute>
                <PaymentEntry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/entry/:paymentId"
            element={
              <ProtectedRoute>
                <PaymentEntry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <ProtectedRoute>
                <FinanceDashboard />
              </ProtectedRoute>
            }
          />

          {/* Production */}
          <Route
            path="/production"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />

          {/* Quality */}
          <Route
            path="/quality"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />

          {/* Company Info */}
          <Route
            path="/company"
            element={
              <ProtectedRoute>
                <CompanyInfo />
              </ProtectedRoute>
            }
          />

          {/* Customer Routes */}
          <Route
            path="/my-contract"
            element={
              <ProtectedRoute requiredRole="musteri">
                <CustomerContract />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-payments"
            element={
              <ProtectedRoute requiredRole="musteri">
                <CustomerPaymentNotification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-status"
            element={
              <ProtectedRoute requiredRole="musteri">
                <CustomerStatus />
              </ProtectedRoute>
            }
          />

          {/* Craftsman Routes */}
          <Route
            path="/my-works"
            element={
              <ProtectedRoute requiredRole="usta">
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute requiredRole="usta">
                <ComingSoon />
              </ProtectedRoute>
            }
          />

          {/* 404 - Not Found */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
                  <p className="text-gray-600 mb-6">Sayfa bulunamadı</p>
                  <a href="/dashboard" className="text-amber-700 hover:text-amber-800 font-semibold">
                    Dashboard'a Dön →
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
