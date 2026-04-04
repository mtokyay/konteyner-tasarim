import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Check, AlertCircle, FileText, Download } from 'lucide-react';
import { getSupabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';
import { useAuth } from '../../../contexts/AuthContext';

const DesignEditor = () => {
  const { id: designId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const iframeRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [designerReady, setDesignerReady] = useState(false);
  const [message, setMessage] = useState(null);
  const [design, setDesign] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingDesignData, setPendingDesignData] = useState(null);

  // Extra fields for saving
  const [extraFields, setExtraFields] = useState({
    ad: '',
    aciklama: '',
    toplam_fiyat: '',
    indirim: '',
    teslim_tarihi: '',
    notlar: '',
    status: 'taslak',
  });

  // Get customer info from location state (for new designs)
  const customerId = location.state?.customerId;
  const customerInfo = location.state?.customerInfo;
  const isNew = !designId;

  useEffect(() => {
    if (customerInfo) {
      setCustomerName(`${customerInfo.ad} ${customerInfo.soyad}`);
    }
    if (designId) {
      loadDesign();
    } else {
      setLoading(false);
    }
  }, [designId]);

  const loadDesign = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('designs')
        .select('*, customers:customer_id(ad, soyad)')
        .eq('id', designId)
        .eq('tenant_id', tenantId)
        .single();

      if (error) throw error;
      setDesign(data);
      if (data.customers) {
        setCustomerName(`${data.customers.ad} ${data.customers.soyad}`);
      }
      setExtraFields({
        ad: data.ad || '',
        aciklama: data.aciklama || '',
        toplam_fiyat: data.toplam_fiyat || '',
        indirim: data.indirim || '',
        teslim_tarihi: data.teslim_tarihi || '',
        notlar: data.notlar || '',
        status: data.status || 'taslak',
      });
    } catch (err) {
      console.error('Design load error:', err);
      setMessage({ type: 'error', text: 'Tasarım yüklenemedi: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.data || !event.data.type) return;

      if (event.data.type === 'DESIGNER_READY') {
        setDesignerReady(true);
        // If we have existing design data, send it to the iframe
        if (design?.design_data) {
          setTimeout(() => {
            iframeRef.current?.contentWindow?.postMessage({
              type: 'LOAD_DESIGN',
              designData: design.design_data,
            }, '*');
          }, 500);
        }
      }

      if (event.data.type === 'DESIGN_DATA') {
        // Show save modal with extra fields
        setPendingDesignData(event.data.designData);
        // Auto-generate name from container dimensions
        const c = event.data.designData?.container;
        if (c && !extraFields.ad) {
          setExtraFields(prev => ({
            ...prev,
            ad: prev.ad || `Konteyner ${c.width}x${c.length}x${c.height}cm`,
          }));
        }
        setShowSaveModal(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [design, extraFields.ad]);

  const saveDesign = async () => {
    if (!pendingDesignData) return;
    setSaving(true);
    setMessage(null);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        setMessage({ type: 'success', text: 'Demo modda kaydedildi' });
        setSaving(false);
        setShowSaveModal(false);
        return;
      }

      // Get the actual Supabase auth user for FK references
      let authUserId = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authUserId = session?.user?.id || null;
        if (!authUserId) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          authUserId = authUser?.id || null;
        }
      } catch (authErr) {
        console.warn('Auth user alınamadı:', authErr);
      }

      const containerInfo = pendingDesignData?.container || {};
      const genislik = containerInfo.width ? containerInfo.width / 100 : null;
      const uzunluk = containerInfo.length ? containerInfo.length / 100 : null;
      const yukseklik = containerInfo.height ? containerInfo.height / 100 : null;
      const alan = genislik && uzunluk ? parseFloat((genislik * uzunluk).toFixed(2)) : null;

      const netFiyat = extraFields.toplam_fiyat && extraFields.indirim
        ? parseFloat(extraFields.toplam_fiyat) - parseFloat(extraFields.indirim || 0)
        : extraFields.toplam_fiyat ? parseFloat(extraFields.toplam_fiyat) : null;

      const ozellikler = {
        panelType: containerInfo.panelType || null,
        roofType: containerInfo.roofType || null,
        roofColor: containerInfo.roofColor || null,
        roofHeight: containerInfo.roofHeight || null,
        hasVeranda: pendingDesignData.veranda?.enabled || false,
        verandaSize: pendingDesignData.veranda?.enabled ? `${pendingDesignData.veranda.width}x${pendingDesignData.veranda.depth}` : null,
        isCombo: pendingDesignData.combo?.enabled || false,
        itemCount: pendingDesignData.items?.length || 0,
        doorCount: (pendingDesignData.items || []).filter(i => i.type === 'door').length,
        windowCount: (pendingDesignData.items || []).filter(i => i.type === 'window').length,
        partitionCount: pendingDesignData.partitions?.length || 0,
        wcZoneCount: pendingDesignData.wcZones?.length || 0,
      };

      // Common fields for both insert and update
      const designFields = {
        design_data: pendingDesignData,
        ad: extraFields.ad || `Konteyner ${containerInfo.width}x${containerInfo.length}`,
        aciklama: extraFields.aciklama || null,
        genislik,
        yukseklik,
        uzunluk,
        alan,
        ozellikler,
        toplam_fiyat: extraFields.toplam_fiyat ? parseFloat(extraFields.toplam_fiyat) : null,
        indirim: extraFields.indirim ? parseFloat(extraFields.indirim) : null,
        net_fiyat: netFiyat,
        teslim_tarihi: extraFields.teslim_tarihi || null,
        notlar: extraFields.notlar || null,
        status: extraFields.status,
      };

      if (design?.id) {
        // Update existing design
        const { error } = await supabase
          .from('designs')
          .update({
            ...designFields,
            updated_at: new Date().toISOString(),
          })
          .eq('id', design.id)
          .eq('tenant_id', tenantId);

        if (error) throw error;
        setDesign(prev => ({ ...prev, ad: extraFields.ad, design_data: pendingDesignData }));
        setMessage({ type: 'success', text: 'Tasarım güncellendi!' });
      } else {
        // Create new design - customer_id is required
        const effectiveCustomerId = customerId || design?.customer_id;
        if (!effectiveCustomerId) {
          throw new Error('Müşteri bilgisi bulunamadı. Lütfen tasarım sayfasından müşteri seçerek tekrar deneyin.');
        }

        const refNo = 'TH-' + Date.now().toString().slice(-6);
        const insertData = {
          ...designFields,
          tenant_id: tenantId,
          customer_id: effectiveCustomerId,
          ref_no: refNo,
        };
        // Only include created_by if we have a valid auth user ID
        if (authUserId) {
          insertData.created_by = authUserId;
        }
        const { data: newDesign, error } = await supabase
          .from('designs')
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        setDesign(newDesign);
        setMessage({ type: 'success', text: 'Tasarım oluşturuldu!' });
        // Update URL to reflect the new design ID
        window.history.replaceState(null, '', `/panel/designs/${newDesign.id}/editor`);
      }
      setShowSaveModal(false);
    } catch (err) {
      console.error('Save error:', err);
      setMessage({ type: 'error', text: 'Kaydetme hatası: ' + err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleBack = () => {
    if (design?.id) {
      navigate(`/panel/designs/${design.id}`);
    } else if (customerId) {
      navigate(`/panel/customers/${customerId}`);
    } else {
      navigate('/panel/designs');
    }
  };

  const handleExtraChange = (field, value) => {
    setExtraFields(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Tasarım yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="h-11 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <span className="font-semibold text-gray-800 text-sm">
              {design?.ad || extraFields.ad || 'Yeni Tasarım'}
            </span>
            {customerName && (
              <span className="text-xs text-gray-500 ml-2">
                — {customerName}
              </span>
            )}
          </div>
          {design?.ref_no && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              {design.ref_no}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {message && (
            <div className={`flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {message.text}
            </div>
          )}
          {saving && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              Kaydediliyor...
            </div>
          )}
        </div>
      </div>

      {/* Iframe - full screen */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src="/konteyner-tasarim.html"
          className="w-full h-full border-0"
          title="Konteyner Tasarım"
          allow="fullscreen"
        />
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSaveModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Tasarımı Kaydet</h2>
              <p className="text-sm text-gray-500 mt-1">Tasarım bilgilerini tamamlayın</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Tasarım Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tasarım Adı *</label>
                <input
                  type="text"
                  value={extraFields.ad}
                  onChange={e => handleExtraChange('ad', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="Örn: Modern Konteyner Ev 3x7"
                />
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={extraFields.aciklama}
                  onChange={e => handleExtraChange('aciklama', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="Tasarım hakkında kısa açıklama..."
                />
              </div>

              {/* Fiyat */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Fiyat (₺)</label>
                  <input
                    type="number"
                    value={extraFields.toplam_fiyat}
                    onChange={e => handleExtraChange('toplam_fiyat', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İndirim (₺)</label>
                  <input
                    type="number"
                    value={extraFields.indirim}
                    onChange={e => handleExtraChange('indirim', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Net Fiyat (calculated) */}
              {extraFields.toplam_fiyat && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  <span className="text-amber-700 font-medium">Net Fiyat: </span>
                  <span className="text-amber-900 font-bold">
                    ₺{((parseFloat(extraFields.toplam_fiyat) || 0) - (parseFloat(extraFields.indirim) || 0)).toLocaleString('tr-TR')}
                  </span>
                </div>
              )}

              {/* Teslim Tarihi & Durum */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teslim Tarihi</label>
                  <input
                    type="date"
                    value={extraFields.teslim_tarihi}
                    onChange={e => handleExtraChange('teslim_tarihi', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <select
                    value={extraFields.status}
                    onChange={e => handleExtraChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  >
                    <option value="taslak">Taslak</option>
                    <option value="teklif">Teklif</option>
                    <option value="onaylandi">Onaylandı</option>
                    <option value="uretimde">Üretimde</option>
                    <option value="tamamlandi">Tamamlandı</option>
                    <option value="teslim_edildi">Teslim Edildi</option>
                    <option value="iptal">İptal</option>
                  </select>
                </div>
              </div>

              {/* Notlar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea
                  value={extraFields.notlar}
                  onChange={e => handleExtraChange('notlar', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="Ek notlar..."
                />
              </div>

              {/* Design Summary */}
              {pendingDesignData?.container && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                  <p className="font-medium text-gray-700">Tasarım Özeti:</p>
                  <p>Boyut: {pendingDesignData.container.width}x{pendingDesignData.container.length}x{pendingDesignData.container.height}cm ({(pendingDesignData.container.width * pendingDesignData.container.length / 10000).toFixed(1)}m²)</p>
                  <p>Kapı: {(pendingDesignData.items || []).filter(i => i.type === 'door').length} | Pencere: {(pendingDesignData.items || []).filter(i => i.type === 'window').length} | Bölüntü: {(pendingDesignData.partitions || []).length} | WC: {(pendingDesignData.wcZones || []).length}</p>
                  {pendingDesignData.veranda?.enabled && <p>Veranda: {pendingDesignData.veranda.width}x{pendingDesignData.veranda.depth}cm</p>}
                  {pendingDesignData.combo?.enabled && <p>Combo: Aktif</p>}
                </div>
              )}
            </div>

            {message && message.type === 'error' && (
              <div className="mx-5 mb-0 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{message.text}</p>
              </div>
            )}
            <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                İptal
              </button>
              <button
                onClick={saveDesign}
                disabled={saving || !extraFields.ad}
                className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {design?.id ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignEditor;
