'use client';

import { useEffect, useState, useCallback } from 'react';
import { realApi, Product, InventoryItemWithProduct } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import ReceiveTab from '@/app/components/ReceiveTab';

export default function InventoryReceivePage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const fetchProducts = async () => {
    try {
      const prodsRes = await realApi.getProducts();
      const prods = prodsRes.data || prodsRes;
      setProducts(prods);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  const handleSuccess = (newItems: InventoryItemWithProduct[]) => {
    setMessage({ type: 'success', text: `Received ${newItems.length} items successfully` });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Receive Inventory</h1>
          <p className="page-subtitle">Receive new inventory items</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <ReceiveTab 
        products={products}
        onSuccess={handleSuccess}
        showMessage={showMessage}
      />
    </div>
  );
}