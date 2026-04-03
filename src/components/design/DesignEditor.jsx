import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Check, AlertCircle } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../App';

const DesignEditor = () => {
  const { id: designId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const iframeRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [designerReady, setDesignerReady] = useState(false);
  const [message, setMessage] = useState(null);
  const [design, setDesign] = useState(null);
  const [customerName, setCustomerName] = useState('');

  // Get customer info from location state (for new designs)
  const customerId = location.state?.customerId;
  const customerInfo = location.state?.customerInfo;

  useEffect(() => {
    if (customerInfo) {
      setCustomerName(`${customerInfo.ad} ${customerInfo.soyad}`);
    }
    if (designId && designId !== 'new') {
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
        .select('*, customers(ad, soyad)')
        .eq('id', designId)
        .single();

      if (error) throw error;
      setDesign(data);
      if (data.customers) {
        setCustomerName(`${data.customers.ad} ${data.customers.soyad}`);
      }
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
        // Save design data to Supabase
        saveDesign(event.data.designData);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [design]);

  const saveDesign = async (designData) => {
    setSaving(true);
    setMessage(null);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        setMessage({ type: 'success', text: 'Demo modda kaydedildi' });
        setSaving(false);
        return;
      }

      const containerInfo = designData?.container || {};
      const genislik = containerInfo.width ? containerInfo.width / 100 : null;
      const uzunluk = containerInfo.length ? containerInfo.length / 100 : null;
      const yukseklik = containerInfo.height ? containerInfo.height / 100 : null;
      const alan = genislik && uzunluk ? parseFloat((genislik * uzunluk).toFixed(2)) : null;

      // Generate a name from container dimensions
      const designName = `Konteyner ${containerInfo.width || ''}x${containerInfo.length || ''}x${containerInfo.height || ''}cm`;

      if (designId && designId !== 'new' && design) {
        // Update existing design
        const { error } = await supabase
          .from('designs')
          .update({
            design_data: designData,
            ad: design.ad || designName,
            genislik,
            yukseklik,
            uzunluk,
            alan,
            ozellikler: {
              panelType: containerInfo.panelType,
              roofType: containerInfo.roofType,
              roofColor: containerInfo.roofColor,
              hasVeranda: designData.veranda?.enabled || false,
              isCombo: designData.combo?.enabled || false,
              itemCount: designData.items?.length || 0,
              partitionCount: designData.partitions?.length || 0,
              wcZoneCount: designData.wcZones?.length || 0,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', designId);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Tasarım kaydedildi!' });
      } else {
        // Create new design
        const refNo = 'TH-' + Date.now().toString().slice(-6);
        const { data: newDesign, error } = await supabase
          .from('designs')
          .insert({
            customer_id: customerId,
            ref_no: refNo,
            ad: designName,
            design_data: designData,
            status: 'taslak',
            genislik,
            yukseklik,
            uzunluk,
            alan,
            ozellikler: {
              panelType: containerInfo.panelType,
              roofType: containerInfo.roofType,
              roofColor: containerInfo.roofColor,
              hasVeranda: designData.veranda?.enabled || false,
              isCombo: designData.combo?.enabled || false,
              itemCount: designData.items?.length || 0,
              partitionCount: designData.partitions?.length || 0,
              wcZoneCount: designData.wcZones?.length || 0,
            },
            created_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        setDesign(newDesign);
        setMessage({ type: 'success', text: 'Tasarım oluşturuldu!' });
        // Update URL to reflect the new design ID
        window.history.replaceState(null, '', `/designs/${newDesign.id}/editor`);
      }
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
      navigate(`/designs/${design.id}`);
    } else if (customerId) {
      navigate(`/customers/${customerId}`);
    } else {
      navigate('/designs');
    }
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
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-7 h-7 bg-amber-700 rounded flex items-center justify-center text-white text-xs font-bold">TK</div>
          <div>
            <span className="font-semibold text-gray-800 text-sm">
              {design?.ad || 'Yeni Tasarım'}
            </span>
            {customerName && (
              <span className="text-xs text-gray-500 ml-2">
                - {customerName}
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
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
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
    </div>
  );
};

export default DesignEditor;
