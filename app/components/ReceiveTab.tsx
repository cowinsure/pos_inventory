'use client';

import { useState } from 'react';
import { realApi } from '@/lib/api';
import { Product, InventoryItemWithProduct } from '@/lib/api';

interface ReceiveFormData {
  productId: string;
  quantity: string;
  notes: string;
}

interface ReceiveTabProps {
  products: Product[];
  onSuccess: (items: InventoryItemWithProduct[]) => void;
  showMessage: (type: 'success' | 'error', text: string) => void;
}

export default function ReceiveTab({ products, onSuccess, showMessage }: ReceiveTabProps) {
  const [form, setForm] = useState<ReceiveFormData>({ productId: '', quantity: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.quantity) return;

    setLoading(true);
    try {
      const items = await realApi.receiveBatchInventory({
        productId: Number(form.productId),
        quantity: Number(form.quantity),
        notes: form.notes || undefined,
      });
      showMessage('success', `Received ${items.length} items successfully`);
      setForm({ productId: '', quantity: '', notes: '' });
      
      const product = products.find(p => p.id === Number(form.productId));
      if (product) {
        const itemsWithProduct: InventoryItemWithProduct[] = items.map(item => ({
          ...item,
          product,
        }));
        onSuccess(itemsWithProduct);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to receive inventory';
      showMessage('error', message);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === Number(form.productId));

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Receive Batch Inventory</h2>
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
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
        <div className="mb-4">
          <label className="label">Quantity</label>
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="input"
            placeholder="Number of items received"
            required
          />
        </div>
        <div className="mb-6">
          <label className="label">Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="input min-h-[80px]"
            placeholder="Batch details..."
          />
        </div>
        {selectedProduct && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Receiving <strong>{form.quantity || 0}</strong> units of <strong>{selectedProduct.name}</strong>
              {selectedProduct.basePrice && ` at ${selectedProduct.basePrice} each`}
            </p>
          </div>
        )}
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={!form.productId || !form.quantity || loading}
        >
          {loading ? 'Receiving...' : 'Receive Inventory'}
        </button>
      </form>
    </div>
  );
}