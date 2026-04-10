import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { getSupabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';

const DesignPDF = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [design, setDesign] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);
  const supabase = getSupabase();
  const { tenantId } = useTenant();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (!supabase) {
        setLoading(false);
        return;
      }

      const [designRes, companyRes] = await Promise.all([
        supabase
          .from('designs')
          .select('*')
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .single(),
        supabase
          .from('company_info')
          .select('*')
          .eq('tenant_id', tenantId)
          .single(),
      ]);

      if (designRes.error) throw designRes.error;
      setDesign(designRes.data);

      if (!companyRes.error) setCompanyInfo(companyRes.data);

      // Fetch customer
      if (designRes.data?.customer_id) {
        const { data: custData } = await supabase
          .from('customers')
          .select('id, ad, soyad, telefon, eposta, adres')
          .eq('id', designRes.data.customer_id)
          .single();
        if (custData) setCustomer(custData);
      }
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

  if (!design) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Tasarım bulunamadı</p>
      </div>
    );
  }

  const ozellikler = design.ozellikler || {};
  const isObjectFeatures = typeof ozellikler === 'object' && !Array.isArray(ozellikler);
  const teklifNo = design.ref_no || `TSR-${design.id?.slice(0, 6)?.toUpperCase()}`;

  return (
    <>
      {/* Print controls - hidden when printing */}
      <div className="print:hidden bg-gray-100 p-4 flex items-center justify-between sticky top-0 z-10 border-b">
        <button
          onClick={() => navigate(`/panel/designs/${id}`)}
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
                {companyInfo?.name || 'Firma Adı'}
              </h1>
              {companyInfo?.address && <p className="text-sm text-gray-600">{companyInfo.address}</p>}
              {companyInfo?.phone && <p className="text-sm text-gray-600">Tel: {companyInfo.phone}</p>}
              {companyInfo?.email && <p className="text-sm text-gray-600">E-posta: {companyInfo.email}</p>}
              {companyInfo?.tax_office && (
                <p className="text-sm text-gray-600">
                  Vergi Dairesi: {companyInfo.tax_office} / {companyInfo.tax_number}
                </p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-amber-600">TASARIM TEKLİFİ</h2>
              <p className="text-sm text-gray-600 mt-1">
                Teklif No: <span className="font-semibold">{teklifNo}</span>
              </p>
              <p className="text-sm text-gray-600">
                Tarih: <span className="font-semibold">{formatDate(new Date().toISOString())}</span>
              </p>
              {design.teslim_tarihi && (
                <p className="text-sm text-gray-600">
                  Tahmini Teslim: <span className="font-semibold">{formatDate(design.teslim_tarihi)}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        {customer && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Müşteri Bilgileri
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div>
                <span className="text-gray-500">Ad Soyad:</span>{' '}
                <span className="font-medium">{customer.ad} {customer.soyad}</span>
              </div>
              <div>
                <span className="text-gray-500">Telefon:</span>{' '}
                <span className="font-medium">{customer.telefon}</span>
              </div>
              {customer.eposta && (
                <div>
                  <span className="text-gray-500">E-posta:</span>{' '}
                  <span className="font-medium">{customer.eposta}</span>
                </div>
              )}
              {customer.adres && (
                <div className="col-span-2">
                  <span className="text-gray-500">Adres:</span>{' '}
                  <span className="font-medium">{customer.adres}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Design Name & Description */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
            Tasarım Bilgileri
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-3">
            <div>
              <span className="text-gray-500">Tasarım Adı:</span>{' '}
              <span className="font-medium">{design.ad}</span>
            </div>
            <div>
              <span className="text-gray-500">Referans No:</span>{' '}
              <span className="font-medium">{design.ref_no || '-'}</span>
            </div>
          </div>
          {design.aciklama && (
            <p className="text-sm text-gray-700 italic">{design.aciklama}</p>
          )}
        </div>

        {/* Dimensions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
            Boyut ve Ölçüler
          </h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Ölçü</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Değer</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2">Genişlik</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-medium">{design.genislik || '-'} m</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">Uzunluk</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-medium">{design.uzunluk || '-'} m</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">Yükseklik</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-medium">{design.yukseklik || '-'} m</td>
              </tr>
              <tr className="bg-amber-50">
                <td className="border border-gray-300 px-3 py-2 font-semibold">Toplam Alan</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-bold text-amber-700">{design.alan || '-'} m²</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Container Details (object features) */}
        {isObjectFeatures && Object.keys(ozellikler).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Konteyner Detayları
            </h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Özellik</th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Değer</th>
                </tr>
              </thead>
              <tbody>
                {ozellikler.panelType && (
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">Panel Tipi</td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium">{ozellikler.panelType}</td>
                  </tr>
                )}
                {ozellikler.roofType && (
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">Çatı Tipi</td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium">{ozellikler.roofType}</td>
                  </tr>
                )}
                {ozellikler.doorCount > 0 && (
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">Kapı Sayısı</td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium">{ozellikler.doorCount} adet</td>
                  </tr>
                )}
                {ozellikler.windowCount > 0 && (
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">Pencere Sayısı</td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium">{ozellikler.windowCount} adet</td>
                  </tr>
                )}
                {ozellikler.partitionCount > 0 && (
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">Bölüntü Sayısı</td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium">{ozellikler.partitionCount} adet</td>
                  </tr>
                )}
                {ozellikler.wcZoneCount > 0 && (
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">WC Alanı</td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium">{ozellikler.wcZoneCount} adet</td>
                  </tr>
                )}
                {ozellikler.hasVeranda && (
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">Veranda</td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium">{ozellikler.verandaSize || 'Var'}</td>
                  </tr>
                )}
                {ozellikler.isCombo && (
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">Combo</td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium">Evet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Features (legacy array format) */}
        {Array.isArray(design.ozellikler) && design.ozellikler.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Özellikler
            </h3>
            <div className="text-sm">
              {design.ozellikler.map((f, i) => {
                const labels = {
                  kat: 'Çatı Sistemi', isitma: 'Isıtma Sistemi', sogucut: 'Soğutma Sistemi',
                  su: 'Su Sistemi', elektrik: 'Elektrik Sistemi', esya: 'Eşya Dahil',
                };
                return (
                  <span key={f}>
                    {labels[f] || f}{i < design.ozellikler.length - 1 ? ', ' : ''}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Fiyatlandırma</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1.5 text-gray-600">Toplam Fiyat:</td>
                <td className="py-1.5 text-right font-medium">{formatCurrency(design.toplam_fiyat)}</td>
              </tr>
              {(design.indirim > 0) && (
                <tr>
                  <td className="py-1.5 text-gray-600">İndirim:</td>
                  <td className="py-1.5 text-right font-medium text-red-600">-{formatCurrency(design.indirim)}</td>
                </tr>
              )}
              <tr className="border-t border-amber-300">
                <td className="py-2 font-bold text-gray-900 text-base">Net Fiyat:</td>
                <td className="py-2 text-right font-bold text-amber-700 text-xl">{formatCurrency(design.net_fiyat)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {design.notlar && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Notlar
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{design.notlar}</p>
          </div>
        )}

        {/* Bank Info */}
        {companyInfo && (companyInfo.bank_name || companyInfo.iban || companyInfo.bank_iban) && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Banka Bilgileri</h3>
            <div className="text-sm space-y-1">
              {companyInfo.bank_name && <p><span className="text-gray-500">Banka:</span> {companyInfo.bank_name}</p>}
              {companyInfo.bank_branch && <p><span className="text-gray-500">Şube:</span> {companyInfo.bank_branch}</p>}
              {(companyInfo.iban || companyInfo.bank_iban) && (
                <p><span className="text-gray-500">IBAN:</span> {companyInfo.iban || companyInfo.bank_iban}</p>
              )}
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
                <p className="text-sm text-gray-600">{companyInfo?.name || 'Firma Adı'}</p>
                <p className="text-xs text-gray-500">İmza / Kaşe</p>
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900 mb-16">Müşteri</p>
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm text-gray-600">
                  {customer ? `${customer.ad} ${customer.soyad}` : '-'}
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

        {/* Validity Note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Bu teklif, düzenlenme tarihinden itibaren 30 gün geçerlidir.
          </p>
        </div>
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

export default DesignPDF;
