'use client';

import { InventoryItemWithProduct } from '@/lib/api';

interface InventoryListTabProps {
  inventory: InventoryItemWithProduct[];
  onRefresh: () => void;
}

export default function InventoryListTab({ inventory, onRefresh }: InventoryListTabProps) {
  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Inventory Items</h2>
        <button onClick={onRefresh} className="btn btn-secondary">
          Refresh
        </button>
      </div>
      {inventory.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Product</th>
                <th>Status</th>
                <th>Acquired</th>
                <th>Sold/Adjusted</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="font-mono text-sm text-slate-600">{item.barcode}</td>
                  <td className="font-medium text-slate-900">{item.product?.name}</td>
                  <td>
                    <span className={`badge ${item.status === 'in_stock' ? 'bg-green-100 text-green-700' : item.status === 'sold' ? 'bg-blue-100 text-blue-700' : item.status === 'damaged' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-slate-600">{new Date(item.acquiredDate).toLocaleDateString()}</td>
                  <td className="text-slate-600">
                    {item.soldDate ? new Date(item.soldDate).toLocaleDateString() : item.adjustedDate ? new Date(item.adjustedDate).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="font-medium text-slate-900">No inventory items yet</p>
          <p className="text-sm text-slate-500 mt-1">Receive inventory to get started</p>
        </div>
      )}
    </div>
  );
}