'use client';

import { useState, useCallback } from 'react';
import BarcodeTab from '@/app/components/BarcodeTab';

export default function InventoryBarcodePage() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Generate Barcode</h1>
          <p className="page-subtitle">Generate barcode images</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <BarcodeTab showMessage={showMessage} />
    </div>
  );
}