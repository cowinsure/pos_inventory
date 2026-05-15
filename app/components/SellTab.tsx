'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { realApi, InventoryItemWithProduct, Customer } from '@/lib/api';

interface ScannedItem {
  item: InventoryItemWithProduct;
  notes: string;
  discountAmount?: number;
}

interface SellTabProps {
  onSuccess: (items: InventoryItemWithProduct[]) => void;
  showMessage: (type: 'success' | 'error', text: string) => void;
}

const CART_STORAGE_KEY = 'sell_cart_items';

function loadCartFromStorage(): ScannedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: ScannedItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export default function SellTab({ onSuccess, showMessage }: SellTabProps) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerFilter, setCustomerFilter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalItems = scannedItems.length;

  const cartTotals = useMemo(() => {
    const totalPrice = scannedItems.reduce((sum, item) => {
      const price = item.item.product?.basePrice ? Number(item.item.product.basePrice) : 0;
      return sum + price;
    }, 0);
    const totalDiscount = scannedItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    return { totalPrice, totalDiscount, subtotal: totalPrice - totalDiscount };
  }, [scannedItems]);

  useEffect(() => { setScannedItems(loadCartFromStorage()); }, []);
  useEffect(() => { saveCartToStorage(scannedItems); }, [scannedItems]);
  useEffect(() => {
    realApi.getCustomers().then(d => setCustomers(Array.isArray(d) ? d : [])).catch(console.error);
  }, []);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setCustomerDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const createCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone || !newCustomer.email) {
      showMessage('error', 'Please fill in name, phone, and email');
      return;
    }
    try {
      const customer = await realApi.createCustomer(newCustomer);
      setCustomers(prev => [...prev, customer]);
      setCustomerId(customer.id.toString());
      setShowCustomerForm(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      showMessage('success', 'Customer created successfully');
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to create customer');
    }
  };

  const handleScanBarcode = async () => {
    if (!barcodeInput.trim()) return;
    setSearching(true);
    try {
      const item = await realApi.scanBarcode(barcodeInput.trim());
      if (item.status !== 'in_stock') {
        showMessage('error', `Item not available (status: ${item.status})`);
        setBarcodeInput('');
        return;
      }
      if (scannedItems.find(s => s.item.barcode === item.barcode)) {
        showMessage('error', 'Item already in cart');
        setBarcodeInput('');
        return;
      }
      setScannedItems(prev => {
        showMessage('success', `Added: ${item.product?.name || item.barcode}`);
        return [...prev, { item, notes: '' }];
      });
      setBarcodeInput('');
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Item not found');
    } finally {
      setSearching(false);
    }
  };

  const updateItemNotes = (barcode: string, notes: string) =>
    setScannedItems(prev => prev.map(s => s.item.barcode === barcode ? { ...s, notes } : s));

  const updateItemDiscount = (barcode: string, discountAmount: number | undefined) =>
    setScannedItems(prev => prev.map(s => s.item.barcode === barcode ? { ...s, discountAmount } : s));

  const removeItem = (barcode: string) =>
    setScannedItems(prev => prev.filter(s => s.item.barcode !== barcode));

  const handleSellBatch = async () => {
    if (scannedItems.length === 0 || !customerId) return;
    setLoading(true);
    try {
      const result = await realApi.sellBatchItems({
        items: scannedItems.map(s => ({
          barcode: s.item.barcode,
          salePrice: s.item.product?.basePrice ? Number(s.item.product.basePrice) : 0,
          discountAmount: s.discountAmount || 0,
          notes: s.notes || undefined,
        })),
        paymentMethod,
        customerId: Number(customerId),
      });
      showMessage('success', `Successfully sold ${result.length} item(s)`);
      onSuccess(result as unknown as InventoryItemWithProduct[]);
      setScannedItems([]);
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to sell items');
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(c => c.id === Number(customerId));
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerFilter.toLowerCase()) || c.phone.includes(customerFilter)
  );

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.08),transparent_30%),linear-gradient(160deg,#f8fafc_0%,#eef6ff_50%,#fff7ed_100%)] dark:bg-none dark:bg-slate-950 p-6">
      <div className="mx-auto max-w-4xl space-y-5">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/80 dark:border-slate-700/70 bg-white/75 dark:bg-slate-800/75 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 shadow-[0_10px_35px_-22px_rgba(15,23,42,0.4)] backdrop-blur">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 dark:bg-slate-100 text-xs font-semibold text-white dark:text-slate-900">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </span>
            Point of Sale
          </div>
          {totalItems > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700/50 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              {totalItems} item{totalItems !== 1 ? 's' : ''} in cart
            </div>
          )}
        </div>

        {/* Scan card */}
        <div className="rounded-[28px] border border-white/80 dark:border-slate-700/70 bg-white/88 dark:bg-slate-800/90 p-7 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.30)] backdrop-blur">
          <div className="mb-1.5 h-1 w-10 rounded-full bg-linear-to-r from-sky-500 to-orange-400" />
          <div className="mb-5">
            <div className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300 mb-2">
              Scan barcode
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Scan or type a barcode to add items to this sale</p>
          </div>

          <form onSubmit={e => { e.preventDefault(); handleScanBarcode(); }} className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                placeholder="Scan or enter barcode..."
                disabled={searching}
                autoFocus
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-700/50 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/50 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={!barcodeInput.trim() || searching}
              className="flex items-center gap-2 rounded-2xl bg-slate-950 dark:bg-white px-5 py-3 text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-600 dark:disabled:text-slate-400"
            >
              {searching ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scanning
                </>
              ) : 'Add Item'}
            </button>
          </form>
        </div>

        {/* Customer card */}
        <div className="relative z-10 rounded-[28px] border border-white/80 dark:border-slate-700/70 bg-white/88 dark:bg-slate-800/90 p-7 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.30)] backdrop-blur">
          <div className="mb-1.5 h-1 w-10 rounded-full bg-linear-to-r from-orange-400 to-sky-500" />
          <div className="mb-5">
            <div className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300 mb-2">
              Customer
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Select an existing customer or create a new one</p>
          </div>

          {/* Customer dropdown */}
          <div className="relative mb-3" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-700/50 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition hover:border-slate-300 dark:hover:border-slate-500 focus:border-sky-400 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/50 flex items-center justify-between"
            >
              <span className={selectedCustomer ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}>
                {selectedCustomer ? (
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/40 text-xs font-semibold text-sky-700 dark:text-sky-300">
                      {selectedCustomer.name[0].toUpperCase()}
                    </span>
                    {selectedCustomer.name}
                  </span>
                ) : 'Select customer...'}
              </span>
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${customerDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {customerDropdownOpen && (
              <div className="absolute z-20 w-full mt-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)] overflow-hidden">
                <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
                  <div className="relative">
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={customerFilter}
                      onChange={e => setCustomerFilter(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      placeholder="Search by name or phone..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-sky-400 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50"
                    />
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-slate-400">No customers found</p>
                  ) : filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setCustomerId(c.id.toString()); setCustomerDropdownOpen(false); setCustomerFilter(''); }}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-slate-700/60 transition-colors"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {c.name[0].toUpperCase()}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{c.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{c.phone}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowCustomerForm(!showCustomerForm)}
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white/70 dark:bg-slate-700/50 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500"
          >
            {showCustomerForm ? 'Cancel' : '+ New Customer'}
          </button>

          {showCustomerForm && (
            <div className="mt-4 rounded-2xl border border-white/80 dark:border-slate-700/50 bg-slate-50/70 dark:bg-slate-800/50 p-5 space-y-3">
              <div className="mb-1 h-0.5 w-8 rounded-full bg-linear-to-r from-sky-500 to-orange-400" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mb-3">New customer details</p>
              {[
                { type: 'text', field: 'name', placeholder: 'Full name *', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                { type: 'tel', field: 'phone', placeholder: 'Phone number *', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
                { type: 'email', field: 'email', placeholder: 'Email address *', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                { type: 'text', field: 'address', placeholder: 'Address (optional)', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
              ].map(({ type, field, placeholder, icon }) => (
                <div key={field} className="relative">
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                  <input
                    type={type}
                    value={newCustomer[field as keyof typeof newCustomer]}
                    onChange={e => setNewCustomer({ ...newCustomer, [field]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/50"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={createCustomer}
                className="w-full rounded-2xl bg-slate-950 dark:bg-white py-2.5 text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-slate-100"
              >
                Create Customer
              </button>
            </div>
          )}
        </div>

        {/* Cart */}
        {totalItems > 0 ? (
          <div className="rounded-[28px] border border-white/80 dark:border-slate-700/70 bg-white/88 dark:bg-slate-800/90 p-7 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.30)] backdrop-blur">
            <div className="mb-1.5 h-1 w-10 rounded-full bg-linear-to-r from-sky-500 to-orange-400" />
            <div className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300 mb-5">
              Cart &mdash; {totalItems} item{totalItems !== 1 ? 's' : ''}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Barcode</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Discount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Notes</th>
                    <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700" />
                  </tr>
                </thead>
                <tbody>
                  {scannedItems.map((scanned, idx) => (
                    <tr key={scanned.item.id} className={`transition-colors hover:bg-sky-50/40 dark:hover:bg-sky-900/10 ${idx !== scannedItems.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/50' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{scanned.item.barcode}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{scanned.item.product?.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">${Number(scanned.item.product?.basePrice || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={scanned.discountAmount || ''}
                          onChange={e => updateItemDiscount(scanned.item.barcode, e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="0.00"
                          className="w-24 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-700/50 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-sky-400 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={scanned.notes}
                          onChange={e => updateItemNotes(scanned.item.barcode, e.target.value)}
                          placeholder="Notes..."
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-700/50 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-sky-400 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => removeItem(scanned.item.barcode)}
                          className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 p-5 space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">${cartTotals.totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Discount</span>
                <span className="font-medium text-rose-600 dark:text-rose-400">−${cartTotals.totalDiscount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-3 mt-1">
                <span className="text-base font-semibold text-slate-900 dark:text-slate-100">Total</span>
                <span className="text-lg font-semibold text-slate-950 dark:text-white">${cartTotals.subtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="mt-5">
              <p className="mb-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">Payment Method *</p>
              <div className="grid grid-cols-3 gap-2">
                {['CASH', 'CREDIT'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-2xl border py-2.5 text-sm font-semibold transition ${
                      paymentMethod === method
                        ? 'border-slate-900 dark:border-white bg-slate-950 dark:bg-white text-white dark:text-slate-900'
                        : 'border-slate-200 dark:border-slate-600 bg-white/70 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {!customerId && (
              <div className="mt-4 rounded-2xl border border-amber-200 dark:border-amber-700/50 bg-amber-50/80 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                Select a customer above to complete the sale.
              </div>
            )}

            <button
              onClick={handleSellBatch}
              disabled={loading || !customerId}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 dark:bg-white py-3.5 text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-600 dark:disabled:text-slate-400"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing sale...
                </>
              ) : `Complete Sale — ${totalItems} Item${totalItems !== 1 ? 's' : ''}`}
            </button>
          </div>
        ) : (
          <div className="rounded-[28px] border border-white/80 dark:border-slate-700/70 bg-white/88 dark:bg-slate-800/90 p-12 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.30)] backdrop-blur text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Cart is empty</p>
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">Scan a barcode above to start adding items</p>
          </div>
        )}
      </div>
    </div>
  );
}
