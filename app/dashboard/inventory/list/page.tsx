'use client';

import { useEffect, useState } from 'react';
import { realApi, InventoryItemWithProduct } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import InventoryListTab from '@/app/components/InventoryListTab';

export default function InventoryListPage() {
  const { token } = useAuth();
  const [inventory, setInventory] = useState<InventoryItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const invRes = await realApi.getInventory();
      setInventory(invRes.data || invRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInventory();
    }
  }, [token]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory List</h1>
          <p className="page-subtitle">View all inventory items</p>
        </div>
      </div>

      <InventoryListTab inventory={inventory} onRefresh={fetchInventory} />
    </div>
  );
}