'use client';

import { useState, useCallback } from 'react';
import { InventoryItemWithProduct } from '@/lib/api';
import SellTab from '@/app/components/SellTab';

export default function InventorySellPage() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sellKey, setSellKey] = useState(0);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const handleSuccess = useCallback((soldItems: InventoryItemWithProduct[]) => {
    setMessage({ type: 'success', text: `Successfully sold ${soldItems.length} item(s)` });
    setSellKey(prev => prev + 1);
  }, []);

  return (
    <div>
      <div className="page-header">
        {/* <div>
          <h1 className="page-title">Sell Inventory</h1>
          <p className="page-subtitle">Sell items from inventory</p>
        </div> */}
      </div>

      {message && (
        <div className={` p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
          {message.text}
        </div>
      )}

      <SellTab key={sellKey} onSuccess={handleSuccess} showMessage={showMessage} />
    </div>
  );
}