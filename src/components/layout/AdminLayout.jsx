import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Building2, Crown, LogOut, Shield, Settings, ArrowRightLeft } from 'lucide-react';

const AdminLayout = () => {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/giris');
  };

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { path: '/admin/tenants', icon: Building2, label: 'Firmalar' },
    { path: '/admin/plans', icon: Crown, label: 'Planlar' },
    { path: '/admin/settings', icon: Settings, label: 'Ayarlar' },
  ];

  return (
    <div className="h-screen flex bg-gray-50">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <div>
              <h1 className="font-bold text-sm">Super Admin</h1>
              <p className="text-xs text-gray-400">Platform Yönetimi</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium ${
                  isActive ? 'bg-amber-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-700 space-y-1">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-white">{profile?.full_name}</p>
            <p className="text-xs text-gray-400">Super Admin</p>
          </div>
          <button onClick={()=>navigate('/panel')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-900/30 w-full transition">
            <ArrowRightLeft className="w-5 h-5" />
            Panele Geç
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/30 w-full transition">
            <LogOut className="w-5 h-5" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
