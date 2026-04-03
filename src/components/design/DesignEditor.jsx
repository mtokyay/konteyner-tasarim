import React, { useState, useRef, useEffect } from 'react';
import { Save, Download, X, Loader } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

const DesignEditor = ({
  customerId,
  customerName,
  designId = null,
  initialData = null,
  onSave = null,
  onCancel = null,
}) => {
  const iframeRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentDesignData, setCurrentDesignData] = useState(
    initialData || null
  );
  const [iframeReady, setIframeReady] = useState(false);

  // Get the path to the designer app
  const designerPath = '/app/index.html';

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      const { type, data } = event.data;

      switch (type) {
        case 'DESIGNER_READY':
          setIframeReady(true);
          // Send initial data if editing
          if (initialData && iframeRef.current) {
            iframeRef.current.contentWindow.postMessage(
              {
                type: 'LOAD_DESIGN',
                data: initialData,
              },
              '*'
            );
          }
          break;

        case 'DESIGN_UPDATED':
          setCurrentDesignData(data);
          break;

        case 'ERROR':
          setError(data.message || 'Designer error occurred');
          break;

        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [initialData]);

  const handleSave = async () => {
    if (!currentDesignData) {
      setError('Tasarım verisi bulunamadı');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = getSupabase();

      if (!supabase) {
        // Mock save
        console.log('Mock saving design:', {
          customerId,
          designData: currentDesignData,
        });

        // Generate a mock design ID
        const mockDesignId = Math.random().toString(36).substr(2, 9);

        // Call callback
        if (onSave) {
          onSave(mockDesignId);
        }

        setSaving(false);
        return;
      }

      let result;

      if (designId) {
        // Update existing design
        const { data, error: updateError } = await supabase
          .from('designs')
          .update({
            design_data: currentDesignData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', designId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }
        result = data;
      } else {
        // Create new design
        const refNo = `TK-${new Date().getFullYear()}-${String(
          Math.floor(Math.random() * 10000)
        ).padStart(4, '0')}`;

        const { data, error: insertError } = await supabase
          .from('designs')
          .insert([
            {
              customer_id: customerId,
              ref_no: refNo,
              design_data: currentDesignData,
              status: 'taslak',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }
        result = data;
      }

      // Call callback with design ID
      if (onSave) {
        onSave(result.id);
      }
    } catch (err) {
      console.error('Error saving design:', err);
      setError('Tasarım kaydedilirken hata oluştu: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePdfDownload = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'EXPORT_PDF',
        },
        '*'
      );
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Customer Info Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Müşteri</p>
            <p className="text-lg font-semibold text-gray-900">{customerName}</p>
          </div>
          <div className="text-xs text-gray-500">
            {designId ? `Tasarım ID: ${designId}` : 'Yeni Tasarım'}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Editor Container */}
      <div className="flex-1 relative bg-gray-100">
        {/* Loading Overlay */}
        {!iframeReady && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="text-center">
              <Loader className="animate-spin text-amber-700 mx-auto mb-4" size={32} />
              <p className="text-gray-700">Tasarım editörü yükleniyor...</p>
            </div>
          </div>
        )}

        {/* Iframe for Designer */}
        <iframe
          ref={iframeRef}
          src={designerPath}
          className="w-full h-full border-none"
          title="Design Editor"
          sandbox="allow-same-origin allow-scripts allow-forms allow-pointer-lock"
        />
      </div>

      {/* Action Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <X size={20} />
            İptal
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePdfDownload}
              disabled={!iframeReady}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="PDF olarak indir"
            >
              <Download size={20} />
              PDF İndir
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !iframeReady}
              className="flex items-center gap-2 px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {saving ? 'Kaydediliyor...' : designId ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignEditor;
