import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider, useTenant } from './contexts/TenantContext';

// Layouts
import PanelLayout from './components/layout/PanelLayout';
import AdminLayout from './components/layout/AdminLayout';

// Public pages
import LandingPage from './components/landing/LandingPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';

// Panel pages (firma)
import PanelDashboard from './components/panel/dashboard/PanelDashboard';
import CustomerList from './components/panel/customers/CustomerList';
import CustomerCreate from './components/panel/customers/CustomerCreate';
import CustomerDetail from './components/panel/customers/CustomerDetail';
import DesignList from './components/panel/design/DesignList';
import DesignNew from './components/panel/design/DesignNew';
import DesignDetail from './components/panel/design/DesignDetail';
import DesignEditor from './components/panel/design/DesignEditor';
import ContractList from './components/panel/contracts/ContractList';
import ContractCreate from './components/panel/contracts/ContractCreate';
import ContractDetail from './components/panel/contracts/ContractDetail';
import ContractPDF from './components/panel/contracts/ContractPDF';
import PaymentList from './components/panel/payments/PaymentList';
import PaymentEntry from './components/panel/payments/PaymentEntry';
import FinanceDashboard from './components/panel/payments/FinanceDashboard';
import CompanyInfo from './components/panel/settings/CompanyInfo';
import TeamManagement from './components/panel/team/TeamManagement';
import SubscriptionPage from './components/panel/subscription/SubscriptionPage';

// Admin pages (super admin)
import AdminDashboard from './components/admin/AdminDashboard';
import TenantList from './components/admin/TenantList';
import TenantDetail from './components/admin/TenantDetail';
import PlanManager from './components/admin/PlanManager';

// Portal pages (müşteri)
import PortalDashboard from './components/portal/PortalDashboard';

// Route guards
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/giris" replace />;
  return children;
}

function RequireTenant({ children }) {
  const { isAuthenticated, loading: authLoading, isSuperAdmin } = useAuth();
  const { tenant, loading: tenantLoading } = useTenant();

  if (authLoading || tenantLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/giris" replace />;
  if (isSuperAdmin && !tenant) return <Navigate to="/admin" replace />;
  if (!tenant) return <Navigate to="/kayit?step=tenant" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { isAuthenticated, loading, isSuperAdmin } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/giris" replace />;
  if (!isSuperAdmin) return <Navigate to="/panel" replace />;
  return children;
}

function AuthRedirect() {
  const { isAuthenticated, loading: authLoading, isSuperAdmin } = useAuth();
  const { tenant, loading: tenantLoading, role } = useTenant();

  // Her iki context de yüklenene kadar bekle
  if (authLoading || tenantLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/giris" replace />;
  if (isSuperAdmin) return <Navigate to="/admin" replace />;
  if (!tenant) return <Navigate to="/kayit?step=tenant" replace />;
  if (role === 'customer') return <Navigate to="/portal" replace />;
  return <Navigate to="/panel" replace />;
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto mb-3"></div>
        <p className="text-gray-500 text-sm">Yükleniyor...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/giris" element={<LoginPage />} />
      <Route path="/kayit" element={<RegisterPage />} />

      {/* Auth redirect */}
      <Route path="/dashboard" element={<AuthRedirect />} />

      {/* Panel — Firma (tenant required) */}
      <Route path="/panel" element={<RequireTenant><PanelLayout /></RequireTenant>}>
        <Route index element={<PanelDashboard />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/new" element={<CustomerCreate />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="designs" element={<DesignList />} />
        <Route path="designs/new" element={<DesignNew />} />
        <Route path="designs/:id" element={<DesignDetail />} />
        <Route path="contracts" element={<ContractList />} />
        <Route path="contracts/new" element={<ContractCreate />} />
        <Route path="contracts/new/:designId" element={<ContractCreate />} />
        <Route path="contracts/:id" element={<ContractDetail />} />
        <Route path="payments" element={<PaymentList />} />
        <Route path="payments/entry" element={<PaymentEntry />} />
        <Route path="payments/entry/:paymentId" element={<PaymentEntry />} />
        <Route path="finance" element={<FinanceDashboard />} />
        <Route path="team" element={<TeamManagement />} />
        <Route path="settings" element={<CompanyInfo />} />
        <Route path="subscription" element={<SubscriptionPage />} />
      </Route>

      {/* Design editor — full screen, no sidebar */}
      <Route path="/panel/designs/:id/editor" element={
        <RequireTenant><DesignEditor /></RequireTenant>
      } />
      <Route path="/panel/designs/new/editor" element={
        <RequireTenant><DesignEditor /></RequireTenant>
      } />

      {/* Contract PDF — full screen for printing */}
      <Route path="/panel/contracts/:id/pdf" element={
        <RequireTenant><ContractPDF /></RequireTenant>
      } />

      {/* Admin — Super Admin */}
      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<AdminDashboard />} />
        <Route path="tenants" element={<TenantList />} />
        <Route path="tenants/:id" element={<TenantDetail />} />
        <Route path="plans" element={<PlanManager />} />
      </Route>

      {/* Portal — Müşteri */}
      <Route path="/portal" element={<RequireAuth><PortalDashboard /></RequireAuth>} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <TenantProvider>
          <AppRoutes />
        </TenantProvider>
      </AuthProvider>
    </Router>
  );
}
