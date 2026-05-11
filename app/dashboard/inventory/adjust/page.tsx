'use client';

import { useState, useCallback } from 'react';
import { InventoryItemWithProduct } from '@/lib/api';
import AdjustTab from '@/app/components/AdjustTab';

export default function InventoryAdjustPage() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const handleSuccess = useCallback((updatedItem: InventoryItemWithProduct) => {
    setMessage({ type: 'success', text: `Item adjusted successfully` });
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Adjust Inventory</h1>
          <p className="page-subtitle">Adjust item status (damaged/returned)</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
          {message.text}
        </div>
      )}

      <AdjustTab onSuccess={handleSuccess} showMessage={showMessage} />
    </div>
  );
}