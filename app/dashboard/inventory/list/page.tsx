'use client';

import { useCallback, useEffect, useState } from 'react';
import { realApi, InventoryItemWithProduct } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import InventoryListTab from '@/app/components/InventoryListTab';

const LIMIT_OPTIONS = [10, 20, 30, 40] as const;
type LimitOption = typeof LIMIT_OPTIONS[number] | 'all';

export default function InventoryListPage() {
  const { token } = useAuth();
  const [inventory, setInventory] = useState<InventoryItemWithProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limitOption, setLimitOption] = useState<LimitOption>(20);
  const [loading, setLoading] = useState(true);

  const resolvedLimit = limitOption === 'all' ? 10000 : limitOption;

  const fetchInventory = useCallback(async (p: number, lim: number) => {
    setLoading(true);
    try {
      const res = await realApi.getInventory({ page: p, limit: lim });
      setInventory(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchInventory(page, resolvedLimit);
  }, [token, page, resolvedLimit, fetchInventory]);

  const pageCount = limitOption === 'all' ? 1 : Math.ceil(total / resolvedLimit);

  const handleLimitChange = (opt: LimitOption) => {
    setLimitOption(opt);
    setPage(1);
  };

  return (
    <>
      <InventoryListTab
        inventory={inventory}
        onRefresh={() => fetchInventory(page, resolvedLimit)}
        total={total}
      />

      <div className="flex items-center justify-between gap-4 px-6 pb-6 max-w-6xl mx-auto">
        {/* Limit selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Rows per page:</span>
          <div className="flex items-center gap-1">
            {(['all', ...LIMIT_OPTIONS] as LimitOption[]).map(opt => (
              <button
                key={opt}
                onClick={() => handleLimitChange(opt)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  limitOption === opt
                    ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {opt === 'all' ? 'All' : opt}
              </button>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center gap-3">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => p - 1)}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 transition hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Page {page} of {pageCount}
            </span>
            <button
              disabled={page >= pageCount || loading}
              onClick={() => setPage(p => p + 1)}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 transition hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
