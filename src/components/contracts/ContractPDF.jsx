import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

const ContractPDF = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [payments, setPayments] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);
  const supabase = getSupabase();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [contractRes, companyRes, paymentsRes] = await Promise.all([
        supabase
          .from('contracts')
          .select('*, customers:customer_id(ad, soyad, telefon, eposta, adres), designs:design_id(ad, ref_no, genislik, uzunluk, yukseklik, alan, teslim_tarihi, net_fiyat)')
          .eq('id', id)
          .single(),
        supabase
          .from('company_info')
          .select('*')
          .single(),
        supabase
          .from('payments')
          .select('*')
          .eq('sozlesme_id', id)
          .order('vade', { ascending: true }),
      ]);

      if (contractRes.error) throw contractRes.error;
      setContract(contractRes.data);

      if (!companyRes.error) setCompanyInfo(companyRes.data);

      if (!paymentsRes.error) setPayments(paymentsRes.data || []);
    } catch (err) {
      console.error('PDF veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Sözleşme bulunamadı</p>
      </div>
    );
  }

  const totalPaid = payments.reduce((sum, p) => sum + (p.odenen_tutar || 0), 0);

  return (
    <>
      {/* Print controls - hidden when printing */}
      <div className="print:hidden bg-gray-100 p-4 flex items-center justify-between sticky top-0 z-10 border-b">
        <button
          onClick={() => navigate(`/contracts/${id}`)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Geri Dön
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-medium transition"
        >
          <Printer size={20} />
          Yazdır / PDF Kaydet
        </button>
      </div>

      {/* Printable content */}
      <div ref={printRef} className="max-w-[210mm] mx-auto bg-white p-8 print:p-6 print:max-w-none">
        {/* Header */}
        <div className="border-b-2 border-amber-600 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              {companyInfo?.logo_url && (
                <img src={companyInfo.logo_url} alt="Logo" className="h-16 mb-2" />
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {companyInfo?.name || 'Tokyay Kereste'}
              </h1>
              <p className="text-sm text-gray-600">{companyInfo?.address}</p>
              <p className="text-sm text-gray-600">Tel: {companyInfo?.phone}</p>
              <p className="text-sm text-gray-600">E-posta: {companyInfo?.email}</p>
              {companyInfo?.tax_office && (
                <p className="text-sm text-gray-600">
                  Vergi Dairesi: {companyInfo.tax_office} / {companyInfo.tax_number}
                </p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-amber-600">SÖZLEŞME</h2>
              <p className="text-sm text-gray-600 mt-1">
                Sözleşme No: <span className="font-semibold">{contract.sozlesme_no}</span>
              </p>
              <p className="text-sm text-gray-600">
                Tarih: <span className="font-semibold">{formatDate(contract.tarih)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
            Müşteri Bilgileri
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-gray-500">Ad Soyad:</span>{' '}
              <span className="font-medium">{contract.customers?.ad} {contract.customers?.soyad}</span>
            </div>
            <div>
              <span className="text-gray-500">Telefon:</span>{' '}
              <span className="font-medium">{contract.customers?.telefon}</span>
            </div>
            <div>
              <span className="text-gray-500">E-posta:</span>{' '}
              <span className="font-medium">{contract.customers?.eposta}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Adres:</span>{' '}
              <span className="font-medium">{contract.customers?.adres}</span>
            </div>
          </div>
        </div>

        {/* Design Info */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
            Tasarım Bilgileri
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-gray-500">Tasarım Adı:</span>{' '}
              <span className="font-medium">{contract.designs?.ad}</span>
            </div>
            <div>
              <span className="text-gray-500">Referans No:</span>{' '}
              <span className="font-medium">{contract.designs?.ref_no}</span>
            </div>
            <div>
              <span className="text-gray-500">Boyutlar:</span>{' '}
              <span className="font-medium">
                {contract.designs?.genislik} x {contract.designs?.uzunluk} x {contract.designs?.yukseklik} m
              </span>
            </div>
            <div>
              <span className="text-gray-500">Alan:</span>{' '}
              <span className="font-medium">{contract.designs?.alan} m²</span>
            </div>
            <div>
              <span className="text-gray-500">Teslim Tarihi:</span>{' '}
              <span className="font-medium">{formatDate(contract.designs?.teslim_tarihi)}</span>
            </div>
          </div>
        </div>

        {/* Contract Amount */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Toplam Sözleşme Tutarı:</span>
            <span className="text-2xl font-bold text-amber-600">{formatCurrency(contract.toplam_tutar)}</span>
          </div>
        </div>

        {/* Payment Schedule */}
        {payments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Ödeme Takvimi
            </h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Tür</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Tutar</th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Vade Tarihi</th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Durum</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="border border-gray-300 px-3 py-2">
                      {payment.tur === 'pesinat' ? 'Peşinat' : 'Taksit'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                      {formatCurrency(payment.tutar)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {formatDate(payment.vade)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {payment.durum === 'odendi' ? 'Ödendi' : payment.durum === 'gecikli' ? 'Gecikli' : 'Bekliyor'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="border border-gray-300 px-3 py-2">Toplam</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    {formatCurrency(contract.toplam_tutar)}
                  </td>
                  <td colSpan={2} className="border border-gray-300 px-3 py-2 text-center text-sm">
                    Ödenen: {formatCurrency(totalPaid)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Contract Terms */}
        {contract.terms && contract.terms.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Sözleşme Şartları
            </h3>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              {contract.terms.map((term, idx) => (
                <li key={idx} className="text-gray-700 leading-relaxed">
                  {term}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Bank Info */}
        {companyInfo && (companyInfo.bank_name || companyInfo.iban) && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Banka Bilgileri</h3>
            <div className="text-sm space-y-1">
              {companyInfo.bank_name && <p><span className="text-gray-500">Banka:</span> {companyInfo.bank_name}</p>}
              {companyInfo.bank_branch && <p><span className="text-gray-500">Şube:</span> {companyInfo.bank_branch}</p>}
              {companyInfo.iban && <p><span className="text-gray-500">IBAN:</span> {companyInfo.iban}</p>}
              {companyInfo.bank_iban && !companyInfo.iban && <p><span className="text-gray-500">IBAN:</span> {companyInfo.bank_iban}</p>}
              {companyInfo.bank_account_no && <p><span className="text-gray-500">Hesap No:</span> {companyInfo.bank_account_no}</p>}
            </div>
          </div>
        )}

        {/* Signature Area */}
        <div className="mt-12 pt-6 border-t border-gray-300">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <p className="font-semibold text-gray-900 mb-16">Firma Yetkilisi</p>
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm text-gray-600">{companyInfo?.name || 'Tokyay Kereste'}</p>
                <p className="text-xs text-gray-500">İmza / Kaşe</p>
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900 mb-16">Müşteri</p>
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm text-gray-600">
                  {contract.customers?.ad} {contract.customers?.soyad}
                </p>
                <p className="text-xs text-gray-500">İmza</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {companyInfo?.proforma_footer_note && (
          <div className="mt-8 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">{companyInfo.proforma_footer_note}</p>
          </div>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:p-6 { padding: 1.5rem; }
          .print\\:max-w-none { max-width: none; }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>
    </>
  );
};

export default ContractPDF;
