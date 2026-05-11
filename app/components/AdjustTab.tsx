'use client';

import { useState } from 'react';
import { realApi } from '@/lib/api';
import { InventoryItemWithProduct } from '@/lib/api';

interface AdjustFormData {
  barcode: string;
  status: 'damaged' | 'returned';
  notes: string;
}

interface AdjustTabProps {
  onSuccess: (item: InventoryItemWithProduct) => void;
  showMessage: (type: 'success' | 'error', text: string) => void;
}

const ADJUSTMENT_TYPES: { value: 'damaged' | 'returned'; label: string; description: string; color: string; darkColor: string; dot: string }[] = [
  {
    value: 'damaged',
    label: 'Damaged',
    description: 'Item is no longer sellable due to damage',
    color: 'border-rose-200 bg-rose-50/70 text-rose-700',
    darkColor: 'dark:border-rose-700/50 dark:bg-rose-900/20 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  {
    value: 'returned',
    label: 'Returned',
    description: 'Item was returned by a customer',
    color: 'border-amber-200 bg-amber-50/70 text-amber-700',
    darkColor: 'dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
];

export default function AdjustTab({ onSuccess, showMessage }: AdjustTabProps) {
  const [form, setForm] = useState<AdjustFormData>({ barcode: '', status: 'damaged', notes: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.barcode) return;
    setLoading(true);
    try {
      const updated = await realApi.adjustItem({
        barcode: form.barcode,
        status: form.status,
        notes: form.notes || '',
      });
      showMessage('success', `Item marked as ${form.status}`);
      setForm({ barcode: '', status: 'damaged', notes: '' });
      onSuccess(updated as unknown as InventoryItemWithProduct);
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to adjust item');
    } finally {
      setLoading(false);
    }
  };

  const selected = ADJUSTMENT_TYPES.find(t => t.value === form.status)!;

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.08),transparent_30%),linear-gradient(160deg,#f8fafc_0%,#eef6ff_50%,#fff7ed_100%)] dark:bg-none dark:bg-slate-950 p-6">
      <div className="mx-auto max-w-2xl space-y-5">

        {/* Header */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/80 dark:border-slate-700/70 bg-white/75 dark:bg-slate-800/75 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 shadow-[0_10px_35px_-22px_rgba(15,23,42,0.4)] backdrop-blur">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 dark:bg-slate-100 text-xs font-semibold text-white dark:text-slate-900">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </span>
          Adjust Inventory
        </div>

        {/* Form card */}
        <div className="rounded-[28px] border border-white/80 dark:border-slate-700/70 bg-white/88 dark:bg-slate-800/90 p-7 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.30)] backdrop-blur">
          <div className="mb-1.5 h-1 w-10 rounded-full bg-linear-to-r from-sky-500 to-orange-400" />
          <div className="mb-6">
            <div className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300 mb-1">
              Status adjustment
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Mark an item as damaged or returned by barcode</p>
          </div>

          <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-5">

            {/* Barcode */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Barcode *</label>
              <div className="relative">
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <input
                  type="text"
                  value={form.barcode}
                  onChange={e => setForm({ ...form, barcode: e.target.value })}
                  placeholder="Scan or enter barcode..."
                  required
                  autoFocus
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-700/50 pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/50"
                />
              </div>
            </div>

            {/* Adjustment type - card picker */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Adjustment type *</label>
              <div className="grid grid-cols-2 gap-3">
                {ADJUSTMENT_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setForm({ ...form, status: type.value })}
                    className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                      form.status === type.value
                        ? `${type.color} ${type.darkColor} border-current`
                        : 'border-slate-200 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-100/70 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`h-2 w-2 rounded-full ${form.status === type.value ? type.dot : 'bg-slate-300 dark:bg-slate-500'}`} />
                      <span className="text-sm font-semibold">{type.label}</span>
                    </div>
                    <p className="text-xs leading-5 opacity-80">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Notes <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Reason for adjustment, condition details..."
                rows={3}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-700/50 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/50 resize-none"
              />
            </div>

            {/* Preview */}
            {form.barcode && (
              <div className={`rounded-2xl border px-5 py-4 ${selected.color} ${selected.darkColor}`}>
                <div className="mb-2 h-0.5 w-6 rounded-full bg-linear-to-r from-sky-500 to-orange-400" />
                <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-1.5 opacity-70">Summary</p>
                <p className="text-sm leading-6">
                  Marking barcode{' '}
                  <span className="font-mono font-semibold">{form.barcode}</span>
                  {' '}as{' '}
                  <span className="font-semibold">{selected.label.toLowerCase()}</span>.
                  {form.notes && <> Reason: <span className="italic">{form.notes}</span></>}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !form.barcode}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 dark:bg-white py-3.5 text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-600 dark:disabled:text-slate-400"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Applying...
                </>
              ) : 'Apply Adjustment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
