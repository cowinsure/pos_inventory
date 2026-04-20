'use client';

import { useState } from 'react';
import { realApi } from '@/lib/api';
import { Product, DailyStockResponse } from '@/lib/api';

interface DailyStockFormData {
  date: string;
  productId: string;
}

interface DailyStockTabProps {
  products: Product[];
  showMessage: (type: 'success' | 'error', text: string) => void;
}

export default function DailyStockTab({ products, showMessage }: DailyStockTabProps) {
  const [form, setForm] = useState<DailyStockFormData>({ 
    date: new Date().toISOString().split('T')[0], 
    productId: '' 
  });
  const [stock, setStock] = useState<DailyStockResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId) return;

    setLoading(true);
    try {
      const result = await realApi.getDailyStock(form.date, Number(form.productId));
      setStock(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get daily stock';
      showMessage('error', message);
      setStock(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Daily Stock Report</h2>
      <form onSubmit={handleSubmit} className="flex gap-4 items-end max-w-lg">
        <div className="flex-1">
          <label className="label">Product</label>
          <select
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
            className="input"
            required
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="label">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="input"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || !form.productId}>
          {loading ? 'Loading...' : 'Get Stock'}
        </button>
      </form>
      {stock && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="stat-card">
            <div className="stat-value">{stock.opening}</div>
            <div className="stat-label">Opening Stock</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stock.closing}</div>
            <div className="stat-label">Closing Stock</div>
          </div>
        </div>
      )}
    </div>
  );
}