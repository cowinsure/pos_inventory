'use client';

import { useState, useMemo } from 'react';
import { InventoryItemWithProduct } from '@/lib/api';

interface InventoryListTabProps {
  inventory: InventoryItemWithProduct[];
  onRefresh: () => void;
}

type StatusFilter = 'all' | 'in_stock' | 'sold' | 'damaged' | 'returned';

export default function InventoryListTab({ inventory, onRefresh }: InventoryListTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch = searchQuery === '' || 
        item.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [inventory, searchQuery, statusFilter]);

  return (
    <div className="card p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        {/* <h2 className="text-lg font-semibold text-slate-900">Inventory Items</h2> */}
      
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative ">
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10  "
            placeholder="Search by barcode or product name..."
          />
        </div>
        <div className="relative w-40">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            {/* <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 12a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 20a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
            </svg> */}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="input pl-10 pr-8 w-full cursor-pointer"
          >
            <option value="all">All</option>
            <option value="in_stock">In Stock</option>
            <option value="sold">Sold</option>
            <option value="damaged">Damaged</option>
            <option value="returned">Returned</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {/* <svg className="h-3 w-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg> */}
          </div>
        </div>
      </div>

      {filteredInventory.length > 0 ? (
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
              {filteredInventory.map((item) => (
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
          <p className="font-medium text-slate-900">No inventory items found</p>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter' 
              : 'Receive inventory to get started'}
          </p>
        </div>
      )}
    </div>
  );
}