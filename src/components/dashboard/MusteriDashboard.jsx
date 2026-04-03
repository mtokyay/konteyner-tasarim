import React, { useState, useEffect } from 'react';
import { ShoppingCart, CreditCard, MessageSquare, CheckCircle, Clock, Package } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

export default function MusteriDashboard() {
  const [customerData, setCustomerData] = useState({
    orders: [],
    totalSpent: 0,
    pendingPayments: 0,
    completedOrders: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    try {
      const supabase = getSupabase();

      // Get current customer ID (this would typically come from auth context)
      // For now, we'll fetch the first customer as placeholder
      const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .limit(1);

      if (!customers || customers.length === 0) {
        setLoading(false);
        return;
      }

      const customerId = customers[0].id;

      // Fetch customer orders
      const { data: orders } = await supabase
        .from('production_orders')
        .select('id, durum, created_at')
        .eq('musteri_id', customerId)
        .order('created_at', { ascending: false });

      // Fetch customer payments
      const { data: payments } = await supabase
        .from('payments')
        .select('tutar, durum')
        .eq('musteri_id', customerId);

      // Calculate stats
      const totalSpent = payments
        ?.filter((p) => p.durum === 'odendi')
        .reduce((sum, p) => sum + (p.tutar || 0), 0) || 0;

      const pendingPayments = payments
        ?.filter((p) => p.durum === 'bekliyor')
        .length || 0;

      const completedOrders = orders?.filter((o) => o.durum === 'completed').length || 0;

      setCustomerData({
        orders: orders || [],
        totalSpent,
        pendingPayments,
        completedOrders,
        unreadMessages: 0, // Placeholder
      });

      setLoading(false);
    } catch (error) {
      console.error('Müşteri verileri yükleme hatası:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className="ml-4" style={{ color }}>
          <Icon className="w-10 h-10 opacity-70" />
        </div>
      </div>
    </div>
  );

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusLabel = (status) => {
    const labels = {
      pending: 'Beklemede',
      processing: 'İşlemde',
      completed: 'Tamamlandı',
      cancelled: 'İptal Edildi',
    };
    return labels[status] || status;
  };

  const getOrderStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <Package className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <Clock className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Müşteri Paneli</h1>
        <p className="text-gray-600 mt-2">Tokyay Kereste - Siparişlerinizi Takip Edin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Aktif Siparişler"
          value={customerData.orders.filter((o) => o.durum !== 'completed').length}
          icon={ShoppingCart}
          color="#10b981"
          subtext={`Toplam ${customerData.orders.length} sipariş`}
        />
        <StatCard
          title="Beklemede Ödemeler"
          value={customerData.pendingPayments}
          icon={CreditCard}
          color="#f59e0b"
          subtext="Ödenmesi beklenen"
        />
        <StatCard
          title="Tamamlanan Siparişler"
          value={customerData.completedOrders}
          icon={CheckCircle}
          color="#8b5cf6"
          subtext="Başarıyla tamamlanan"
        />
        <StatCard
          title="Toplam Harcama"
          value={`₺${customerData.totalSpent.toLocaleString('tr-TR')}`}
          icon={CreditCard}
          color="#3b82f6"
          subtext="Ödenen toplam tutar"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Orders List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Siparişlerim</h2>

          {customerData.orders.length > 0 ? (
            <div className="space-y-4">
              {customerData.orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        Sipariş #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getOrderStatusColor(
                          order.durum
                        )}`}
                      >
                        {getOrderStatusIcon(order.durum)}
                        {getOrderStatusLabel(order.durum)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        order.durum === 'completed'
                          ? 'bg-green-500 w-full'
                          : order.durum === 'processing'
                          ? 'bg-blue-500 w-2/3'
                          : 'bg-yellow-500 w-1/3'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Henüz bir sipariş yok</p>
              <p className="text-gray-400 text-sm mt-1">
                İlk tasarımınızı oluşturarak başlayın
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions & Info */}
        <div className="space-y-6">
          {/* Messages */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Mesajlar</h3>
                <p className="text-sm text-gray-500">
                  {customerData.unreadMessages} okunmamış
                </p>
              </div>
            </div>
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition">
              Destek ile İletişime Geç
            </button>
          </div>

          {/* Payment Info */}
          {customerData.pendingPayments > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Ödeme Uyarısı</h3>
                  <p className="text-sm text-gray-500">
                    {customerData.pendingPayments} beklemede ödeme
                  </p>
                </div>
              </div>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition">
                Ödemeleri Görüntüle
              </button>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Yardım Merkezi</h3>
            <ul className="space-y-2">
              <li>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Sıkça Sorulan Sorular
                </button>
              </li>
              <li>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Ödeme Yöntemleri
                </button>
              </li>
              <li>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Teslimat Bilgisi
                </button>
              </li>
              <li>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Geri İade Politikası
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
