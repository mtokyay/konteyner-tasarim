import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Users,
  Palette,
  FileText,
  DollarSign,
  Factory,
  CheckSquare,
  Building,
  MessageSquare,
  CheckCircle,
  BarChart3,
} from 'lucide-react';

const AppLayout = ({ children, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const userRole = user?.role || 'patron';

  const getNavigationItems = () => {
    const baseItems = [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    ];

    const roleItems = {
      patron: [
        { label: 'Müşteriler', icon: Users, path: '/customers' },
        { label: 'Tasarımlar', icon: Palette, path: '/designs' },
        { label: 'Sözleşmeler', icon: FileText, path: '/contracts' },
        { label: 'Ödemeler', icon: DollarSign, path: '/payments' },
        { label: 'Finans', icon: BarChart3, path: '/finance' },
        { label: 'Üretim', icon: Factory, path: '/production' },
        { label: 'Kalite', icon: CheckSquare, path: '/quality' },
        { label: 'Firma Bilgileri', icon: Building, path: '/company' },
      ],
      tasarimci: [
        { label: 'Müşteriler', icon: Users, path: '/customers' },
        { label: 'Tasarımlar', icon: Palette, path: '/designs' },
        { label: 'Yeni Tasarım', icon: Palette, path: '/designs/new' },
      ],
      muhasebeci: [
        { label: 'Ödemeler', icon: DollarSign, path: '/payments' },
        { label: 'Sözleşmeler', icon: FileText, path: '/contracts' },
        { label: 'Müşteriler', icon: Users, path: '/customers' },
      ],
      kalite_kontrolcu: [
        { label: 'Kalite Kontrol', icon: CheckSquare, path: '/quality' },
        { label: 'Üretim', icon: Factory, path: '/production' },
      ],
      usta: [
        { label: 'İşlerim', icon: Factory, path: '/my-works' },
        { label: 'Mesajlar', icon: MessageSquare, path: '/messages' },
      ],
      musteri: [
        { label: 'Sözleşmem', icon: FileText, path: '/my-contract' },
        { label: 'Ödemelerim', icon: DollarSign, path: '/my-payments' },
        { label: 'Durumum', icon: CheckCircle, path: '/my-status' },
      ],
    };

    return [...baseItems, ...(roleItems[userRole] || [])];
  };

  const navigationItems = getNavigationItems();

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-amber-700 text-white transition-all duration-300 overflow-hidden flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-amber-600 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
            <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-amber-700">
              TK
            </div>
            {sidebarOpen && (
              <div>
                <div className="font-bold text-sm">Tokyay Kereste</div>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-amber-600 rounded"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = window.location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded transition-colors ${
                    isActive
                      ? 'bg-amber-600 text-white'
                      : 'text-amber-50 hover:bg-amber-600'
                  }`}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-amber-600 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded text-amber-50 hover:bg-amber-600 transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm font-medium">Çıkış</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800">Tinyhouse Yönetim Sistemi</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user?.name || 'Kullanıcı'}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {userRole === 'patron' && 'Patron'}
                      {userRole === 'tasarimci' && 'Tasarımcı'}
                      {userRole === 'muhasebeci' && 'Muhasebeci'}
                      {userRole === 'kalite_kontrolcu' && 'Kalite Kontrolcü'}
                      {userRole === 'usta' && 'Usta'}
                      {userRole === 'musteri' && 'Müşteri'}
                    </span>
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
                      {userRole === 'patron' && 'PATRON'}
                      {userRole === 'tasarimci' && 'TASARIMCI'}
                      {userRole === 'muhasebeci' && 'MUHASEBECI'}
                      {userRole === 'kalite_kontrolcu' && 'KALİTE'}
                      {userRole === 'usta' && 'USTA'}
                      {userRole === 'musteri' && 'MÜŞTERI'}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold">
                  {(user?.name || 'K').charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
