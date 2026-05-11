'use client';

import { useState, useMemo } from 'react';
import { InventoryItemWithProduct } from '@/lib/api';

interface InventoryListTabProps {
  inventory: InventoryItemWithProduct[];
  onRefresh: () => void;
}

type StatusFilter = 'all' | 'in_stock' | 'sold' | 'damaged' | 'returned';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'sold', label: 'Sold' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'returned', label: 'Returned' },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    in_stock: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    sold: 'bg-sky-50 text-sky-700 border border-sky-200',
    damaged: 'bg-rose-50 text-rose-700 border border-rose-200',
    returned: 'bg-amber-50 text-amber-700 border border-amber-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${map[status] ?? 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        status === 'in_stock' ? 'bg-emerald-500' :
        status === 'sold' ? 'bg-sky-500' :
        status === 'damaged' ? 'bg-rose-500' : 'bg-amber-500'
      }`} />
      {status.replace('_', ' ')}
    </span>
  );
}

export default function InventoryListTab({ inventory, onRefresh }: InventoryListTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredInventory = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return inventory.filter((item) => {
      const matchesSearch =
        q === '' ||
        item.barcode.toLowerCase().includes(q) ||
        item.product?.name?.toLowerCase().includes(q) ||
        item.supplier?.name?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [inventory, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { in_stock: 0, sold: 0, damaged: 0, returned: 0 };
    inventory.forEach(i => { if (i.status in c) c[i.status]++; });
    return c;
  }, [inventory]);

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.08),transparent_30%),linear-gradient(160deg,#f8fafc_0%,#eef6ff_50%,#fff7ed_100%)] p-6">
      <div className="mx-auto max-w-6xl space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-sm text-slate-600 shadow-[0_10px_35px_-22px_rgba(15,23,42,0.4)] backdrop-blur">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              Inventory
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-700">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              {inventory.length} total items
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:border-slate-300 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'In Stock', value: counts.in_stock, color: 'from-emerald-500 to-sky-500', text: 'text-emerald-700' },
            { label: 'Sold', value: counts.sold, color: 'from-sky-500 to-blue-600', text: 'text-sky-700' },
            { label: 'Damaged', value: counts.damaged, color: 'from-rose-500 to-orange-400', text: 'text-rose-700' },
            { label: 'Returned', value: counts.returned, color: 'from-amber-400 to-orange-400', text: 'text-amber-700' },
          ].map(({ label, value, color, text }) => (
            <div key={label} className="rounded-2xl border border-white/80 bg-white/88 px-5 py-4 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.20)] backdrop-blur">
              <div className={`mb-2 h-0.5 w-8 rounded-full bg-linear-to-r ${color}`} />
              <p className={`text-2xl font-semibold ${text}`}>{value}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Search + filter card */}
        <div className="rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.30)] backdrop-blur">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by barcode, product or supplier..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>

            {/* Status filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                    statusFilter === f.value
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {(searchQuery || statusFilter !== 'all') && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-500">{filteredInventory.length} result{filteredInventory.length !== 1 ? 's' : ''}</span>
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                className="text-xs font-semibold text-sky-700 hover:text-sky-800 transition"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Table card */}
        {filteredInventory.length > 0 ? (
          <div className="rounded-[28px] border border-white/80 bg-white/88 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.30)] backdrop-blur overflow-hidden">
            <div className="px-7 pt-6 pb-4 border-b border-slate-100">
              <div className="mb-1.5 h-1 w-10 rounded-full bg-linear-to-r from-sky-500 to-orange-400" />
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                Items &mdash; {filteredInventory.length}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 border-b border-slate-100">Barcode</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 border-b border-slate-100">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 border-b border-slate-100">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 border-b border-slate-100">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 border-b border-slate-100">Acquired</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 border-b border-slate-100">Sold / Adjusted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-sky-50/40 ${idx !== filteredInventory.length - 1 ? 'border-b border-slate-100' : ''}`}
                    >
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.barcode}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{item.product?.name ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.supplier?.name ?? <span className="text-slate-300">—</span>}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(item.acquiredDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {item.soldDate
                          ? new Date(item.soldDate).toLocaleDateString()
                          : item.adjustedDate
                          ? new Date(item.adjustedDate).toLocaleDateString()
                          : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-white/80 bg-white/88 p-12 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.30)] backdrop-blur text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">No items found</p>
            <p className="mt-2 text-sm text-slate-400">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Receive inventory to get started'}
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                className="mt-4 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
