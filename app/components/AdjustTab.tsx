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

export default function AdjustTab({ onSuccess, showMessage }: AdjustTabProps) {
  const [form, setForm] = useState<AdjustFormData>({ barcode: '', status: 'damaged', notes: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.barcode) return;

    setLoading(true);
    try {
      const updated = await realApi.adjustItem({
        barcode: form.barcode,
        status: form.status,
        notes: form.notes || "",
      });
      showMessage('success', `Item marked as ${form.status}`);
      setForm({ barcode: '', status: 'damaged', notes: '' });
      onSuccess(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to adjust item';
      showMessage('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Adjust Inventory</h2>
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label className="label">Barcode</label>
          <input
            type="text"
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            className="input"
            placeholder="Enter barcode"
            required
          />
        </div>
        <div className="mb-4">
          <label className="label">Adjustment Type</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as 'damaged' | 'returned' })}
            className="input"
          >
            <option value="damaged">Damaged</option>
            <option value="returned">Returned</option>
          </select>
        </div>
        <div className="mb-6">
          <label className="label">Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="input min-h-[80px]"
            placeholder="Reason for adjustment..."
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || !form.barcode}>
          {loading ? 'Applying...' : 'Apply Adjustment'}
        </button>
      </form>
    </div>
  );
}