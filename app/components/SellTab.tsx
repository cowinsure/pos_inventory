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
    // Ignore storage errors
  }
}

export default function SellTab({ onSuccess, showMessage }: SellTabProps) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerFilter, setCustomerFilter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalItems = scannedItems.length;

  const cartTotals = useMemo(() => {
    const totalPrice = scannedItems.reduce((sum, item) => {
      const price = item.item.product?.basePrice ? parseFloat(item.item.product.basePrice) : 0;
      return sum + price;
    }, 0);
    const totalDiscount = scannedItems.reduce((sum, item) => {
      return sum + (item.discountAmount || 0);
    }, 0);
    const subtotal = totalPrice - totalDiscount;
    return { totalPrice, totalDiscount, subtotal };
  }, [scannedItems]);

  useEffect(() => {
    const storedItems = loadCartFromStorage();
    setScannedItems(storedItems);
  }, []);

  useEffect(() => {
    saveCartToStorage(scannedItems);
  }, [scannedItems]);

  useEffect(() => {
    realApi.getCustomers()
      .then((data) => {
        setCustomers(Array.isArray(data) ? data : []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      const message = err instanceof Error ? err.message : 'Failed to create customer';
      showMessage('error', message);
    }
  };

  const handleScanBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    setSearching(true);
    try {
      const item = await realApi.scanBarcode(barcodeInput.trim());
      
      if (item.status !== 'in_stock') {
        showMessage('error', `Item is not available for sale (status: ${item.status})`);
        setBarcodeInput('');
        return;
      }

      const existingIndex = scannedItems.findIndex(s => s.item.barcode === item.barcode);
      if (existingIndex >= 0) {
        showMessage('error', 'Item already in cart');
        setBarcodeInput('');
        return;
      }

      setScannedItems(prev => {
        const newItems = [...prev, { item, notes: '' }];
        showMessage('success', `Added: ${item.product?.name || item.barcode}`);
        return newItems;
      });
      setBarcodeInput('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Item not found';
      showMessage('error', message);
    } finally {
      setSearching(false);
    }
  };

  const updateItemNotes = (barcode: string, notes: string) => {
    setScannedItems(prev => 
      prev.map(s => s.item.barcode === barcode ? { ...s, notes } : s)
    );
  };

  const updateItemDiscount = (barcode: string, discountAmount: number | undefined) => {
    setScannedItems(prev => 
      prev.map(s => s.item.barcode === barcode ? { ...s, discountAmount } : s)
    );
  };

  const removeItem = (barcode: string) => {
    setScannedItems(prev => prev.filter(s => s.item.barcode !== barcode));
  };

  const handleSellBatch = async () => {
    if (scannedItems.length === 0 || !customerId) return;
    
    setLoading(true);
    try {
      const itemsToSell = scannedItems.map(s => ({
        barcode: s.item.barcode,
        discountAmount: s.discountAmount || 0,
        notes: s.notes || undefined,
        customerId: Number(customerId),
      }));

      const result = await realApi.sellBatchItems(itemsToSell);
      
      showMessage('success', `Successfully sold ${result.length} item(s)`);
      onSuccess(result);
      setScannedItems([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sell items';
      showMessage('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <div className="p-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Scan & Sell Items</h2>
          </div>
          
          <form onSubmit={handleScanBarcode} className="flex gap-3 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="input"
                placeholder="Scan or enter barcode..."
                disabled={searching}
                autoFocus
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary px-6"
              disabled={!barcodeInput.trim() || searching}
            >
              {searching ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scanning...
                </span>
              ) : 'Add'}
            </button>
          </form>

          <p className="text-sm text-slate-500 mb-6">
            Scan multiple barcodes to add items to your sale
          </p>

          <div className="mb-6">
            <label className="label">Customer *</label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className="input w-full text-left flex items-center justify-between"
                onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
              >
                <span className="truncate">
                  {customerId ? customers.find(c => c.id === Number(customerId))?.name || 'Select customer' : 'Select customer'}
                </span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${customerDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {customerDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="sticky top-0 p-2 border-b border-slate-100 bg-slate-50">
                    <input
                      type="text"
                      value={customerFilter}
                      onChange={(e) => setCustomerFilter(e.target.value)}
                      className="input text-sm py-1 w-full pr-3 pl-10"
                      placeholder="Search customers..."
                      onClick={(e) => e.stopPropagation()}
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {customers
                      .filter((c) =>
                        c.name.toLowerCase().includes(customerFilter.toLowerCase()) ||
                        c.phone.includes(customerFilter)
                      )
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 text-sm"
                          onClick={() => {
                            setCustomerId(c.id.toString());
                            setCustomerDropdownOpen(false);
                            setCustomerFilter('');
                          }}
                        >
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-slate-500">{c.phone}</div>
                        </button>
                      ))}
                    {customers.filter((c) =>
                      c.name.toLowerCase().includes(customerFilter.toLowerCase()) ||
                      c.phone.includes(customerFilter)
                    ).length === 0 && (
                      <div className="px-3 py-2 text-sm text-slate-500">No customers found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowCustomerForm(!showCustomerForm)}
              className="mt-2 w-full btn btn-secondary text-sm py-2"
            >
              {showCustomerForm ? 'Cancel' : '+ Add New Customer'}
            </button>
            {showCustomerForm && (
              <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Create Customer</h4>
                <div className="space-y-2">
                  <div className="relative">
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className="input text-sm py-2 pl-10 pr-3"
                      placeholder="Name *"
                      required
                    />
                  </div>
                  <div className="relative">
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <input
                      type="tel"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className="input text-sm py-2 pl-10 pr-3"
                      placeholder="Phone *"
                      required
                    />
                  </div>
                  <div className="relative">
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      className="input text-sm py-2 pl-10 pr-3"
                      placeholder="Email *"
                      required
                    />
                  </div>
                  <div className="relative">
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="text"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      className="input text-sm py-2 pl-10 pr-3"
                      placeholder="Address (optional)"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={createCustomer}
                    className="w-full btn btn-primary text-sm py-2"
                  >
                    Create Customer
                  </button>
                </div>
              </div>
            )}
          </div>

          {totalItems > 0 ? (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Barcode</th>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Notes</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scannedItems.map((scanned) => (
                      <tr key={scanned.item.id} className="hover:bg-slate-50">
                        <td className="font-mono text-sm text-slate-600">{scanned.item.barcode}</td>
                        <td className="font-medium text-slate-900">{scanned.item.product?.name}</td>
                        <td className="text-slate-900">${Number(scanned.item.product?.basePrice || 0).toFixed(2)}</td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={scanned.discountAmount || ''}
                            onChange={(e) => updateItemDiscount(scanned.item.barcode, e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="input text-xs py-1"
                            placeholder="0.00"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={scanned.notes}
                            onChange={(e) => updateItemNotes(scanned.item.barcode, e.target.value)}
                            className="input text-xs py-1"
                            placeholder="Notes..."
                          />
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => removeItem(scanned.item.barcode)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove item"
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

              <div className="mt-4 p-4 border-t border-slate-200 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Total ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
                  <span className="text-slate-900 font-medium">${cartTotals.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Discount</span>
                  <span className="text-red-600 font-medium">-${cartTotals.totalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-semibold border-t border-slate-200 pt-2">
                  <span className="text-slate-900">Subtotal</span>
                  <span className="text-slate-900">${cartTotals.subtotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleSellBatch}
                className="w-full btn btn-primary mt-4"
                disabled={loading || !customerId}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Selling...
                  </span>
                ) : (
                  `Sell ${totalItems > 1 ? `${totalItems} Items` : 'Item'}`
                )}
              </button>
            </>
          ) : (
            <div className="empty-state">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <p className="font-medium text-slate-900">No items scanned yet</p>
              <p className="text-sm text-slate-500 mt-1">Scan barcodes to add items to your sale</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
