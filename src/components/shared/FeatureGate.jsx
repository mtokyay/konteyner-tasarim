import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import UpgradeModal from './UpgradeModal';

// Wrap content that requires a specific feature
// Usage: <FeatureGate feature="save_design" message="Kaydetmek için plan yükseltin">
//          <SaveButton />
//        </FeatureGate>
const FeatureGate = ({ feature, allowed, message, requiredPlan, children, fallback }) => {
  const [showModal, setShowModal] = useState(false);

  // If allowed prop is explicitly passed, use it. Otherwise feature is required.
  const isAllowed = allowed !== undefined ? allowed : true;

  if (isAllowed) return children;

  // Show fallback or locked state
  return (
    <>
      <div onClick={() => setShowModal(true)} className="cursor-pointer relative group">
        {fallback || (
          <div className="relative">
            <div className="opacity-50 pointer-events-none">{children}</div>
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
              <div className="flex items-center gap-1.5 text-amber-600 font-medium text-sm bg-white px-3 py-1.5 rounded-full shadow">
                <Lock className="w-3.5 h-3.5" />
                Pro
              </div>
            </div>
          </div>
        )}
      </div>
      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        message={message}
        requiredPlan={requiredPlan || 'starter'}
      />
    </>
  );
};

export default FeatureGate;
