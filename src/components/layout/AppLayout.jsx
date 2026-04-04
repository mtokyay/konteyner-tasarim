import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  Palette,
  FileText,
  DollarSign,
  Factory,
  CheckSquare,
  Building,
  MessageSquare,
  CheckCircle,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../App';

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const roleItems = {
    patron: [
      { label: 'Dashboard', icon: Home, path: '/dashboard' },
      { label: 'Müşteriler', icon: Users, path: '/customers' },
      { label: 'Tasarımlar', icon: Palette, path: '/designs' },
      { label: 'Sözleşmeler', icon: FileText, path: '/contracts' },
      { label: 'Ödemeler', icon: DollarSign, path: '/payments' },
      { label: 'Finans', icon: DollarSign, path: '/finance' },
      { label: 'Firma Bilgileri', icon: Building, path: '/company' },
    ],
    tasarimci: [
      { label: 'Dashboard', icon: Home, path: '/dashboard' },
      { label: 'Müşteriler', icon: Users, path: '/customers' },
      { label: 'Tasarımlar', icon: Palette, path: '/designs' },
    ],
    muhasebeci: [
      { label: 'Dashboard', icon: Home, path: '/dashboard' },
      { label: 'Ödemeler', icon: DollarSign, path: '/payments' },
      { label: 'Finans', icon: DollarSign, path: '/finance' },
      { label: 'Sözleşmeler', icon: FileText, path: '/contracts' },
      { label: 'Müşteriler', icon: Users, path: '/customers' },
    ],
    kalite_kontrolcu: [
      { label: 'Dashboard', icon: Home, path: '/dashboard' },
      { label: 'Kalite Kontrol', icon: CheckSquare, path: '/quality' },
    ],
    usta: [
      { label: 'Dashboard', icon: Home, path: '/dashboard' },
      { label: 'İşlerim', icon: Factory, path: '/my-works' },
      { label: 'Mesajlar', icon: MessageSquare, path: '/messages' },
    ],
    musteri: [
      { label: 'Dashboard', icon: Home, path: '/dashboard' },
      { label: 'Sözleşmem', icon: FileText, path: '/my-contract' },
      { label: 'Ödemelerim', icon: DollarSign, path: '/my-payments' },
      { label: 'Durumum', icon: CheckCircle, path: '/my-status' },
    ],
  };

  const menuItems = roleItems[user?.role] || roleItems.musteri;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleLabel = (role) => {
    const labels = {
      patron: 'Patron',
      tasarimci: 'Tasarımcı',
      muhasebeci: 'Muhasebeci',
      kalite_kontrolcu: 'Kalite Kontrolcü',
      usta: 'Usta',
      musteri: 'Müşteri',
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-gradient-to-b from-amber-800 to-amber-900 text-white transform transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Logo */}
        <div className={`border-b border-amber-700 ${collapsed ? 'p-3' : 'p-6'}`}>
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-xl font-bold truncate">Tokyay Kereste</h1>
                <p className="text-amber-300 text-sm">Konteyner Portalı</p>
              </div>
            )}
            {collapsed && (
              <div className="w-10 h-10 bg-amber-700 rounded-lg flex items-center justify-center font-bold text-sm mx-auto">
                TK
              </div>
            )}
            <button
              className="lg:hidden text-amber-300 hover:text-white flex-shrink-0"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* User info */}
        {!collapsed && (
          <div className="p-4 border-b border-amber-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{user?.name || 'Kullanıcı'}</p>
                <p className="text-amber-300 text-xs">{getRoleLabel(user?.role)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto ${collapsed ? 'p-2' : 'p-4'}`}>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    title={collapsed ? item.label : ''}
                    className={`flex items-center gap-3 rounded-lg transition-colors ${
                      collapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3'
                    } ${
                      isActive
                        ? 'bg-amber-700 text-white'
                        : 'text-amber-200 hover:bg-amber-700/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                    {!collapsed && isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:block border-t border-amber-700 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full px-3 py-2 text-amber-300 hover:bg-amber-700/50 hover:text-white rounded-lg transition-colors"
            title={collapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
          >
            {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            {!collapsed && <span className="ml-2 text-sm font-medium">Daralt</span>}
          </button>
        </div>

        {/* Logout */}
        <div className={`border-t border-amber-700 ${collapsed ? 'p-2' : 'p-4'}`}>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Çıkış Yap' : ''}
            className={`flex items-center gap-3 w-full text-amber-200 hover:bg-amber-700/50 hover:text-white rounded-lg transition-colors ${
              collapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3'
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-gray-900">Tokyay Kereste</h1>
          <div className="w-10" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
