'use client';

import { useState, useCallback } from 'react';
import AdjustTab from '@/app/components/AdjustTab';

export default function InventoryAdjustPage() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  }, []);

  return (
    <div>
      {message && (
        <div className={`mx-6 mt-4 rounded-2xl px-5 py-3.5 text-sm font-medium ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50'
            : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700/50'
        }`}>
          {message.text}
        </div>
      )}
      <AdjustTab onSuccess={() => {}} showMessage={showMessage} />
    </div>
  );
}
