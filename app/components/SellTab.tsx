'use client';

import { useState, useEffect, useMemo } from 'react';
import { realApi, InventoryItemWithProduct } from '@/lib/api';

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
  const [cartOpen, setCartOpen] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

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
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      saveCartToStorage(scannedItems);
    }
  }, [scannedItems, isHydrated]);

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

  const clearCart = () => {
    setScannedItems([]);
    saveCartToStorage([]);
  };

  const handleSellBatch = async () => {
    if (scannedItems.length === 0) return;
    
    setLoading(true);
    try {
      const itemsToSell = scannedItems.map(s => ({
        barcode: s.item.barcode,
        discountAmount: s.discountAmount || 0,
        notes: s.notes || undefined,
      }));

      const result = await realApi.sellBatchItems(itemsToSell);
      
      showMessage('success', `Successfully sold ${result.length} item(s)`);
      onSuccess(result);
      setScannedItems([]);
      saveCartToStorage([]);
      setCartOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sell items';
      showMessage('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        .cart-panel-enter {
          animation: slideIn 0.3s ease-out forwards;
        }
        .cart-panel-exit {
          animation: slideOut 0.3s ease-in forwards;
        }
      `}</style>

      <div className="flex-1 p-6">
        <div className="card p-6 ">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Scan Items</h2>
            <button
              onClick={() => setCartOpen(!cartOpen)}
              className={`px-3 py-1 text-sm font-medium rounded-full transition-colors cursor-pointer ${cartOpen ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
            >
              {cartOpen ? 'Hide Cart' : `${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`}
            </button>
          </div>
          
          <form onSubmit={handleScanBarcode} className="flex gap-3">
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

          <p className="text-sm text-slate-500 mt-2 mb-4">
            Scan multiple barcodes to add them to the sale batch
          </p>

          {totalItems > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-slate-900 mb-3">Scanned Items ({totalItems})</h3>
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
                className="w-full btn btn-primary mt-3"
                disabled={loading}
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
            </div>
          )}

          {totalItems === 0 && (
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

      {cartOpen && (
        <div className={`w-96 bg-white border-l border-slate-200 shadow-xl ${totalItems > 0 ? 'cart-panel-enter' : ''}`}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-slate-900">Cart</h2>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {totalItems}
                </span>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {totalItems === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scannedItems.map((scanned) => (
                    <div 
                      key={scanned.item.id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900 truncate text-sm">
                              {scanned.item.product?.name}
                            </span>
                            <span className="badge bg-green-100 text-green-700 text-xs">
                              In Stock
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono">
                            {scanned.item.barcode}
                          </p>
                          <p className="text-xs font-medium text-slate-700">
                            ${Number(scanned.item.product?.basePrice || 0).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(scanned.item.barcode)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={scanned.discountAmount || ''}
                            onChange={(e) => updateItemDiscount(scanned.item.barcode, e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="input text-xs"
                            placeholder="Discount ($)"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={scanned.notes}
                            onChange={(e) => updateItemNotes(scanned.item.barcode, e.target.value)}
                            className="input text-xs"
                            placeholder="Notes (optional)"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}