import React, { useState, useEffect } from 'react';
import {
  Loader2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  Send,
} from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

const FinanceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingReminder, setSendingReminder] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Summary data
  const [summary, setSummary] = useState({
    toplamSozlesmeDeğeri: 0,
    toplamTahsilat: 0,
    kalanAlacak: 0,
    buAyBeklenen: 0,
    tahsilatOrani: 0,
  });

  const [monthlyData, setMonthlyData] = useState([
    { month: 'Oca', value: 0 },
    { month: 'Şub', value: 0 },
    { month: 'Mar', value: 0 },
    { month: 'Nis', value: 0 },
    { month: 'May', value: 0 },
    { month: 'Haz', value: 0 },
  ]);

  const [customerPayments, setCustomerPayments] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = getSupabase();

      if (!supabase) {
        // Placeholder data
        setSummary({
          toplamSozlesmeDeğeri: 500000,
          toplamTahsilat: 320000,
          kalanAlacak: 180000,
          buAyBeklenen: 80000,
          tahsilatOrani: 64,
        });

        setMonthlyData([
          { month: 'Oca', value: 45000 },
          { month: 'Şub', value: 52000 },
          { month: 'Mar', value: 48000 },
          { month: 'Nis', value: 55000 },
          { month: 'May', value: 60000 },
          { month: 'Haz', value: 60000 },
        ]);

        setCustomerPayments([
          {
            id: 1,
            musteri_adi: 'Ahmet Yılmaz',
            sozlesme_tutari: 200000,
            odenen: 150000,
            kalan: 50000,
            sonraki_vade: '2024-06-15',
            durum: 'iyi',
          },
          {
            id: 2,
            musteri_adi: 'Fatma Kaya',
            sozlesme_tutari: 150000,
            odenen: 80000,
            kalan: 70000,
            sonraki_vade: '2024-05-20',
            durum: 'uyari',
          },
        ]);

        setUpcomingPayments([
          {
            id: 1,
            musteri_adi: 'İbrahim Demir',
            tutar: 40000,
            vade: '2024-05-15',
            gun_kaldi: 12,
          },
          {
            id: 2,
            musteri_adi: 'Zeki Kaya',
            tutar: 35000,
            vade: '2024-05-22',
            gun_kaldi: 19,
          },
        ]);

        setOverduePayments([
          {
            id: 1,
            musteri_adi: 'Mehmet Şahin',
            tutar: 25000,
            vade: '2024-04-10',
            gun_gecikti: 23,
          },
        ]);

        return;
      }

      // Fetch contracts
      const { data: contractsData } = await supabase
        .from('contracts')
        .select('id, toplam_tutar');

      let totalContractValue = 0;
      if (contractsData) {
        totalContractValue = contractsData.reduce(
          (sum, c) => sum + (c.toplam_tutar || 0),
          0
        );
      }

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select(
          `
          id,
          musteri_id,
          sozlesme_id,
          tutar,
          odenen_tutar,
          vade,
          durum,
          odeme_tarihi,
          customers(ad, soyad),
          contracts(sozlesme_no, toplam_tutar)
        `
        )
        .order('vade', { ascending: true });

      if (!paymentsData) {
        throw new Error('Ödeme verileri yüklenemedi');
      }

      // Calculate totals
      const totalReceived = paymentsData.reduce(
        (sum, p) => sum + (p.odenen_tutar || 0),
        0
      );
      const remainingAmount = totalContractValue - totalReceived;
      const collectionRate = totalContractValue
        ? Math.round((totalReceived / totalContractValue) * 100)
        : 0;

      // Calculate this month's expected payments
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const thisMonthPayments = paymentsData.filter((p) => {
        const dueDate = new Date(p.vade);
        return dueDate >= thisMonthStart && dueDate <= thisMonthEnd;
      });

      const expectedThisMonth = thisMonthPayments.reduce(
        (sum, p) => sum + (p.tutar - (p.odenen_tutar || 0)),
        0
      );

      setSummary({
        toplamSozlesmeDeğeri: totalContractValue,
        toplamTahsilat: totalReceived,
        kalanAlacak: remainingAmount,
        buAyBeklenen: expectedThisMonth,
        tahsilatOrani: collectionRate,
      });

      // Calculate monthly data (last 6 months)
      const monthlyMap = {};
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap[monthKey] = 0;
        last6Months.push({
          month: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][d.getMonth()],
          key: monthKey,
        });
      }

      paymentsData.forEach((p) => {
        if (p.odeme_tarihi) {
          const payDate = new Date(p.odeme_tarihi);
          const monthKey = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}`;
          if (monthlyMap.hasOwnProperty(monthKey)) {
            monthlyMap[monthKey] += p.odenen_tutar || 0;
          }
        }
      });

      const monthlyChartData = last6Months.map((m) => ({
        month: m.month,
        value: monthlyMap[m.key] || 0,
      }));

      setMonthlyData(monthlyChartData);

      // Customer payment status
      const customerPaymentMap = {};
      paymentsData.forEach((p) => {
        const key = p.musteri_id;
        if (!customerPaymentMap[key]) {
          customerPaymentMap[key] = {
            id: p.musteri_id,
            musteri_adi: `${p.customers?.ad} ${p.customers?.soyad}`,
            sozlesme_tutari: 0,
            odenen: 0,
            kalan: 0,
            sonraki_vade: null,
            durum: 'iyi',
          };
        }
        customerPaymentMap[key].sozlesme_tutari += p.tutar;
        customerPaymentMap[key].odenen += p.odenen_tutar || 0;

        if (!customerPaymentMap[key].sonraki_vade || p.vade < customerPaymentMap[key].sonraki_vade) {
          customerPaymentMap[key].sonraki_vade = p.vade;
        }
      });

      const customerPaymentsList = Object.values(customerPaymentMap).map((c) => {
        c.kalan = c.sozlesme_tutari - c.odenen;
        const nextDue = new Date(c.sonraki_vade);
        const daysUntilDue = Math.ceil(
          (nextDue - new Date()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilDue < 0) {
          c.durum = 'kotu';
        } else if (daysUntilDue < 7) {
          c.durum = 'uyari';
        }

        return c;
      });

      setCustomerPayments(customerPaymentsList);

      // Upcoming payments (next 30 days)
      const upcoming = paymentsData.filter((p) => {
        const dueDate = new Date(p.vade);
        const now = new Date();
        const diffTime = dueDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 30 && p.durum === 'bekliyor';
      });

      setUpcomingPayments(
        upcoming.map((p) => {
          const dueDate = new Date(p.vade);
          const now = new Date();
          const daysLeft = Math.ceil(
            (dueDate - now) / (1000 * 60 * 60 * 24)
          );
          return {
            id: p.id,
            musteri_adi: `${p.customers?.ad} ${p.customers?.soyad}`,
            tutar: p.tutar - (p.odenen_tutar || 0),
            vade: p.vade,
            gun_kaldi: daysLeft,
          };
        })
      );

      // Overdue payments
      const overdue = paymentsData.filter((p) => {
        const dueDate = new Date(p.vade);
        return dueDate < new Date() && p.durum === 'bekliyor';
      });

      setOverduePayments(
        overdue.map((p) => {
          const dueDate = new Date(p.vade);
          const now = new Date();
          const daysOverdue = Math.ceil(
            (now - dueDate) / (1000 * 60 * 60 * 24)
          );
          return {
            id: p.id,
            musteri_adi: `${p.customers?.ad} ${p.customers?.soyad}`,
            tutar: p.tutar - (p.odenen_tutar || 0),
            vade: p.vade,
            gun_gecikti: daysOverdue,
          };
        })
      );
    } catch (err) {
      setError(err.message || 'Veri yüklenirken hata oluştu');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (paymentId) => {
    setSendingReminder(paymentId);
    setSuccessMessage('');

    try {
      const supabase = getSupabase();

      if (!supabase) {
        setSuccessMessage('Hatırlatma mesajı gönderildi!');
        setSendingReminder(null);
        return;
      }

      // Get payment details
      const { data: payment } = await supabase
        .from('payments')
        .select('musteri_id, vade, tutar')
        .eq('id', paymentId)
        .single();

      if (payment) {
        // Create notification
        await supabase.from('notifications').insert({
          musteri_id: payment.musteri_id,
          baslik: 'Ödeme Hatırlatması',
          mesaj: `${payment.tutar} TL ödemenizin vade tarihi ${new Date(payment.vade).toLocaleDateString('tr-TR')} olarak belirlenmiştir. Lütfen ödemenizi yapınız.`,
          tur: 'odeme_hatirlatmasi',
          okundu: false,
          created_at: new Date().toISOString(),
        });

        setSuccessMessage('Hatırlatma mesajı başarıyla gönderildi!');
      }
    } catch (err) {
      console.error('Send reminder error:', err);
    } finally {
      setSendingReminder(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  const maxMonthlyValue = Math.max(...monthlyData.map((d) => d.value), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Finansal Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Ödeme ve tahsilat özeti</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold">Hata</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 font-semibold">{successMessage}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-semibold">
              Toplam Sözleşme Değeri
            </p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {formatCurrency(summary.toplamSozlesmeDeğeri)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-semibold">
              Toplam Tahsilat
            </p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatCurrency(summary.toplamTahsilat)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-semibold">Kalan Alacak</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {formatCurrency(summary.kalanAlacak)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <p className="text-gray-600 text-sm font-semibold">
              Bu Ay Beklenen
            </p>
            <p className="text-2xl font-bold text-orange-600 mt-2">
              {formatCurrency(summary.buAyBeklenen)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
            <p className="text-gray-600 text-sm font-semibold">Tahsilat Oranı</p>
            <p className="text-2xl font-bold text-indigo-600 mt-2">
              %{summary.tahsilatOrani}
            </p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${summary.tahsilatOrani}%` }}
              />
            </div>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Aylık Gelir Grafiği (Son 6 Ay)
          </h2>
          <div className="flex items-end justify-between gap-2 h-64">
            {monthlyData.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-100 rounded-t-lg flex items-end justify-center relative group">
                  <div
                    className="w-3/4 bg-gradient-to-t from-amber-500 to-orange-500 rounded-t-lg transition-all duration-300 hover:from-amber-600 hover:to-orange-600"
                    style={{
                      height: `${maxMonthlyValue > 0 ? (data.value / maxMonthlyValue) * 100 : 0}%`,
                    }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatCurrency(data.value)}
                    </div>
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-700 mt-3">
                  {data.month}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Customer Payment Status */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Müşteri Bazlı Ödeme Durumu
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-amber-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">
                      Müşteri
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-700">
                      Sözleşme
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-700">
                      Ödenen
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-700">
                      Kalan
                    </th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-700">
                      Durum
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customerPayments.slice(0, 5).map((customer) => (
                    <tr key={customer.id} className="hover:bg-amber-50">
                      <td className="px-4 py-3 text-gray-900 font-semibold">
                        {customer.musteri_adi}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatCurrency(customer.sozlesme_tutari)}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 font-semibold">
                        {formatCurrency(customer.odenen)}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                        {formatCurrency(customer.kalan)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            customer.durum === 'iyi'
                              ? 'bg-green-100 text-green-700'
                              : customer.durum === 'uyari'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {customer.durum === 'iyi'
                            ? 'İyi'
                            : customer.durum === 'uyari'
                            ? 'Uyarı'
                            : 'Kötü'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Payments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Yaklaşan Vadeler (30 Gün)
            </h2>
            <div className="space-y-3">
              {upcomingPayments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {payment.musteri_adi}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(payment.vade)} -{' '}
                      <span className="text-blue-600 font-semibold">
                        {payment.gun_kaldi} gün kaldı
                      </span>
                    </p>
                  </div>
                  <p className="font-bold text-blue-600 text-lg">
                    {formatCurrency(payment.tutar)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Overdue Payments */}
        {overduePayments.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              Geciken Ödemeler ({overduePayments.length})
            </h2>
            <div className="space-y-3">
              {overduePayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {payment.musteri_adi}
                    </p>
                    <p className="text-sm text-gray-600">
                      Vade: {formatDate(payment.vade)} -{' '}
                      <span className="text-red-600 font-semibold">
                        {payment.gun_gecikti} gün gecikti
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-red-600 text-lg">
                      {formatCurrency(payment.tutar)}
                    </p>
                    <button
                      onClick={() => sendReminder(payment.id)}
                      disabled={sendingReminder === payment.id}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                      title="Hatırlatma Gönder"
                    >
                      {sendingReminder === payment.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceDashboard;
