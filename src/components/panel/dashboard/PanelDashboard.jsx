import React from 'react';
import { Users, FileText, PenTool, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { usePlanLimits } from '../../../hooks/usePlanLimits';

export default function PanelDashboard() {
  // Mock data - in a real app these would come from the hooks
  const tenant = {
    name: 'Acme Corporation',
    plan: 'Pro',
    customersCount: 145,
    designsCount: 87,
    contractsCount: 24,
  };

  const planLimits = {
    maxUsers: 25,
    activeUsers: 12,
    maxProjects: null, // Unlimited
    activeProjects: 9,
    maxContracts: null, // Unlimited
    activeContracts: 24,
  };

  const stats = [
    {
      label: 'Total Customers',
      value: tenant.customersCount,
      icon: Users,
      color: 'amber',
      path: '/panel/customers',
    },
    {
      label: 'Designs Created',
      value: tenant.designsCount,
      icon: PenTool,
      color: 'blue',
      path: '/panel/designs',
    },
    {
      label: 'Active Contracts',
      value: tenant.contractsCount,
      icon: FileText,
      color: 'green',
      path: '/panel/contracts',
    },
    {
      label: 'Team Members',
      value: `${planLimits.activeUsers}/${planLimits.maxUsers}`,
      icon: TrendingUp,
      color: 'purple',
      path: '/panel/team',
    },
  ];

  const usageStats = [
    {
      name: 'Users',
      used: planLimits.activeUsers,
      limit: planLimits.maxUsers,
      color: 'amber',
    },
    {
      name: 'Projects',
      used: planLimits.activeProjects,
      limit: planLimits.maxProjects || 'Unlimited',
      color: 'blue',
    },
    {
      name: 'Contracts',
      used: planLimits.activeContracts,
      limit: planLimits.maxContracts || 'Unlimited',
      color: 'green',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-500' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500' },
      green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-500' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-500' },
    };
    return colors[color] || colors.amber;
  };

  const getProgressColor = (color) => {
    const colors = {
      amber: 'bg-amber-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
    };
    return colors[color] || colors.amber;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow-lg p-8 text-white mb-8">
          <h1 className="text-4xl font-bold">Welcome back, {tenant.name}!</h1>
          <p className="text-amber-100 mt-2">
            You're on the <span className="font-semibold">{tenant.plan} plan</span>
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colors = getColorClasses(stat.color);
            return (
              <div
                key={index}
                className={`${colors.bg} rounded-lg shadow p-6 border-l-4 ${colors.border} cursor-pointer hover:shadow-lg transition`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 text-sm font-medium">{stat.label}</p>
                    <p className={`${colors.text} text-3xl font-bold mt-2`}>{stat.value}</p>
                  </div>
                  <Icon className={`w-12 h-12 ${colors.text} opacity-20`} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan Usage */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-amber-600" />
              Plan Usage & Limits
            </h2>

            <div className="space-y-8">
              {usageStats.map((stat, index) => {
                const colors = getColorClasses(stat.color);
                const progressColors = getProgressColor(stat.color);
                const percentage =
                  stat.limit === 'Unlimited'
                    ? 0
                    : Math.round((stat.used / stat.limit) * 100);

                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">{stat.name}</p>
                      <p className="text-sm text-gray-600">
                        {stat.used} / {stat.limit === 'Unlimited' ? '∞' : stat.limit}
                      </p>
                    </div>

                    {stat.limit !== 'Unlimited' ? (
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`${progressColors} h-full transition-all duration-300`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <CheckCircle className="w-4 h-4" />
                        <p className="text-sm">Unlimited</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                Need more capacity? Upgrade your plan to get access to higher limits.
              </p>
              <button className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-6 rounded-lg transition">
                View Plans
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-amber-600" />
              Quick Actions
            </h2>

            <div className="space-y-3">
              <button className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold py-3 px-4 rounded-lg transition text-left">
                + Create New Contract
              </button>
              <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 px-4 rounded-lg transition text-left">
                + Add Customer
              </button>
              <button className="w-full bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-3 px-4 rounded-lg transition text-left">
                + Create Design
              </button>
              <button className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold py-3 px-4 rounded-lg transition text-left">
                + Invite Team Member
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-amber-900 font-semibold mb-2">Pro Tip</p>
              <p className="text-sm text-amber-800">
                Invite team members to collaborate and share workload. Up to {planLimits.maxUsers} team members on your plan.
              </p>
            </div>
          </div>
        </div>

        {/* Plan Info Card */}
        <div className="mt-8 bg-amber-50 border-2 border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Maximize Your Plan</h3>
              <p className="text-sm text-amber-800">
                You're currently using {Math.round((planLimits.activeUsers / planLimits.maxUsers) * 100)}% of your user limit.
                Consider upgrading when you reach 80% capacity to avoid disruptions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
