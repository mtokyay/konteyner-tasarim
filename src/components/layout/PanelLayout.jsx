import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import {
  LayoutDashboard, Users, PenTool, FileText, CreditCard, BarChart3,
  Settings, UserPlus, Crown, LogOut, ChevronLeft, ChevronRight, Menu, X, Shield, HelpCircle
} from 'lucide-react';

const PanelLayout = () => {
  const { logout, profile, isSuperAdmin } = useAuth();
  const { tenant, plan, role, hasFeature } = useTenant();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/giris');
  };

  const menuItems = [
    { path: '/panel', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { path: '/panel/customers', icon: Users, label: 'Müşteriler' },
    { path: '/panel/designs', icon: PenTool, label: 'Tasarımlar' },
    { path: '/panel/contracts', icon: FileText, label: 'Sözleşmeler', feature: 'contracts' },
    { path: '/panel/payments', icon: CreditCard, label: 'Ödemeler', feature: 'payments' },
    { path: '/panel/finance', icon: BarChart3, label: 'Finans', feature: 'payments' },
  ];

  const managementItems = [
    { path: '/panel/team', icon: UserPlus, label: 'Ekip', feature: 'team_management' },
    { path: '/panel/settings', icon: Settings, label: 'Ayarlar' },
    { path: '/panel/subscription', icon: Crown, label: 'Abonelik' },
    { path: '/panel/kilavuz', icon: HelpCircle, label: 'Kullanım Kılavuzu' },
  ];

  const renderNavItem = (item) => {
    if (item.feature && !hasFeature(item.feature)) return null;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.end}
        onClick={() => setMobileOpen(false)}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
            isActive
              ? 'bg-amber-100 text-amber-800'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          } ${collapsed ? 'justify-center' : ''}`
        }
        title={collapsed ? item.label : undefined}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo / Tenant */}
      <div className={`p-4 border-b border-gray-200 ${collapsed ? 'text-center' : ''}`}>
        {collapsed ? (
          <div className="w-9 h-9 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold mx-auto">
            {tenant?.name?.charAt(0) || 'K'}
          </div>
        ) : (
          <div>
            <h1 className="font-bold text-gray-900 text-sm truncate">{tenant?.name || 'Firma'}</h1>
            <span className="text-xs text-amber-600 font-medium">{plan?.name || 'Ücretsiz'}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map(renderNavItem)}

        <div className="border-t border-gray-200 my-3" />

        {managementItems.map(renderNavItem)}
      </nav>

      {/* User & Logout */}
      <div className="p-3 border-t border-gray-200">
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{role}</p>
          </div>
        )}
        {isSuperAdmin && (
          <button onClick={()=>navigate('/admin')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50 w-full transition ${collapsed ? 'justify-center' : ''}`}
            title="Admin Paneli"
          >
            <Shield className="w-5 h-5" />
            {!collapsed && <span>Admin Paneli</span>}
          </button>
        )}
        <button onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition ${collapsed ? 'justify-center' : ''}`}
          title="Çıkış Yap"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Çıkış Yap</span>}
        </button>
      </div>

      {/* Collapse toggle (desktop) */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex items-center justify-center p-2 border-t border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition">
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </>
  );

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2 bg-white rounded-lg shadow border border-gray-200">
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-xl">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PanelLayout;
