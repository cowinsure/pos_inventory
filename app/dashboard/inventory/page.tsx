'use client';

import { useEffect, useState, useCallback } from 'react';
import { realApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { InventoryItem, InventoryItemWithProduct, Product, DailyStockResponse, BarcodeImageResponse } from '@/lib/api';

type TabType = 'list' | 'receive' | 'sell' | 'adjust' | 'daily-stock' | 'barcode';

interface ReceiveFormData {
  productId: string;
  quantity: string;
  notes: string;
}

interface SellFormData {
  barcode: string;
  notes: string;
}

interface AdjustFormData {
  barcode: string;
  status: 'damaged' | 'returned';
  notes: string;
}

interface DailyStockFormData {
  date: string;
  productId: string;
}

interface BarcodeFormData {
  barcode: string;
}

export default function InventoryPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [inventory, setInventory] = useState<InventoryItemWithProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithProduct | null>(null);
  const [dailyStock, setDailyStock] = useState<DailyStockResponse | null>(null);
  const [barcodeImage, setBarcodeImage] = useState<BarcodeImageResponse | null>(null);
  const [scannedItem, setScannedItem] = useState<InventoryItemWithProduct | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [receiveForm, setReceiveForm] = useState<ReceiveFormData>({ productId: '', quantity: '', notes: '' });
  const [sellForm, setSellForm] = useState<SellFormData>({ barcode: '', notes: '' });
  const [adjustForm, setAdjustForm] = useState<AdjustFormData>({ barcode: '', status: 'damaged', notes: '' });
  const [dailyStockForm, setDailyStockForm] = useState<DailyStockFormData>({ date: new Date().toISOString().split('T')[0], productId: '' });
  const [barcodeForm, setBarcodeForm] = useState<BarcodeFormData>({ barcode: '' });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const prodsRes = await realApi.getProducts();
      const prods = prodsRes.data || prodsRes;
      setProducts(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleReceiveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const items = await realApi.receiveBatchInventory({
        productId: Number(receiveForm.productId),
        quantity: Number(receiveForm.quantity),
        notes: receiveForm.notes || undefined,
      });
      showMessage('success', `Received ${items.length} items successfully`);
      setReceiveForm({ productId: '', quantity: '', notes: '' });
      // Refresh inventory for selected product - map items to include product info
      const product = products.find(p => p.id === Number(receiveForm.productId));
      if (product) {
        const itemsWithProduct: InventoryItemWithProduct[] = items.map(item => ({
          ...item,
          product,
        }));
        setInventory(prev => [...itemsWithProduct, ...prev]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to receive inventory';
      showMessage('error', message);
    }
  };

  const handleScanBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const item = await realApi.scanBarcode(sellForm.barcode);
      setScannedItem(item);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Item not found';
      showMessage('error', message);
      setScannedItem(null);
    }
  };

  const handleSellItem = async () => {
    if (!scannedItem) return;
    try {
      const updated = await realApi.sellItem({ barcode: scannedItem.barcode, notes: sellForm.notes });
      showMessage('success', 'Item sold successfully');
      setScannedItem(null);
      setSellForm({ barcode: '', notes: '' });
      setInventory(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated, product: scannedItem.product } : i));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sell item';
      showMessage('error', message);
    }
  };

  const handleAdjustItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await realApi.adjustItem({
        barcode: adjustForm.barcode,
        status: adjustForm.status,
        notes: adjustForm.notes || undefined,
      });
      showMessage('success', `Item marked as ${adjustForm.status}`);
      setAdjustForm({ barcode: '', status: 'damaged', notes: '' });
      setInventory(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to adjust item';
      showMessage('error', message);
    }
  };

  const handleGetDailyStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const stock = await realApi.getDailyStock(dailyStockForm.date, Number(dailyStockForm.productId));
      setDailyStock(stock);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get daily stock';
      showMessage('error', message);
    }
  };

  const handleGetBarcodeImage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const img = await realApi.getBarcodeImage(barcodeForm.barcode);
      setBarcodeImage(img);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate barcode';
      showMessage('error', message);
      setBarcodeImage(null);
    }
  };

  const tabs = [
    { id: 'list', label: 'Inventory List' },
    { id: 'receive', label: 'Receive' },
    { id: 'sell', label: 'Sell' },
    { id: 'adjust', label: 'Adjust' },
    { id: 'daily-stock', label: 'Daily Stock' },
    { id: 'barcode', label: 'Barcode' },
  ] as const;

  const selectedProduct = products.find(p => p.id === Number(receiveForm.productId));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Track, manage, and adjust your stock</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Inventory Items</h2>
            <button onClick={fetchProducts} className="btn btn-secondary">
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
      )}

      {activeTab === 'receive' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Receive Batch Inventory</h2>
          <form onSubmit={handleReceiveBatch} className="max-w-lg">
            <div className="mb-4">
              <label className="label">Product</label>
              <select
                value={receiveForm.productId}
                onChange={(e) => setReceiveForm({ ...receiveForm, productId: e.target.value })}
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
                value={receiveForm.quantity}
                onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })}
                className="input"
                placeholder="Number of items received"
                required
              />
            </div>
            <div className="mb-6">
              <label className="label">Notes (optional)</label>
              <textarea
                value={receiveForm.notes}
                onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
                className="input min-h-[80px]"
                placeholder="Batch details..."
              />
            </div>
            {selectedProduct && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Receiving <strong>{receiveForm.quantity || 0}</strong> units of <strong>{selectedProduct.name}</strong>
                  {selectedProduct.basePrice && ` at $${selectedProduct.basePrice} each`}
                </p>
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={!receiveForm.productId || !receiveForm.quantity}>
              Receive Inventory
            </button>
          </form>
        </div>
      )}

      {activeTab === 'sell' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Sell Item</h2>
          {!scannedItem ? (
            <form onSubmit={handleScanBarcode} className="max-w-lg">
              <div className="mb-4">
                <label className="label">Scan or Enter Barcode</label>
                <input
                  type="text"
                  value={sellForm.barcode}
                  onChange={(e) => setSellForm({ ...sellForm, barcode: e.target.value })}
                  className="input"
                  placeholder="Enter barcode"
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Scan
              </button>
            </form>
          ) : (
            <div className="max-w-lg">
              <div className="p-4 bg-slate-50 rounded-lg mb-4">
                <h3 className="font-semibold text-slate-900 mb-2">Item Found</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Barcode:</strong> {scannedItem.barcode}</p>
                  <p><strong>Product:</strong> {scannedItem.product?.name}</p>
                  <p><strong>Status:</strong> <span className="badge bg-green-100 text-green-700">In Stock</span></p>
                  <p><strong>Acquired:</strong> {new Date(scannedItem.acquiredDate).toLocaleDateString()}</p>
                  {scannedItem.notes && <p><strong>Notes:</strong> {scannedItem.notes}</p>}
                </div>
              </div>
              <div className="mb-4">
                <label className="label">Sale Notes (optional)</label>
                <textarea
                  value={sellForm.notes}
                  onChange={(e) => setSellForm({ ...sellForm, notes: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Customer info, special instructions..."
                />
              </div>
              <div className="flex gap-3">
                <button onClick={handleSellItem} className="btn btn-primary">
                  Confirm Sale
                </button>
                <button onClick={() => { setScannedItem(null); setSellForm({ barcode: '', notes: '' }); }} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'adjust' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Adjust Inventory</h2>
          <form onSubmit={handleAdjustItem} className="max-w-lg">
            <div className="mb-4">
              <label className="label">Barcode</label>
              <input
                type="text"
                value={adjustForm.barcode}
                onChange={(e) => setAdjustForm({ ...adjustForm, barcode: e.target.value })}
                className="input"
                placeholder="Enter barcode"
                required
              />
            </div>
            <div className="mb-4">
              <label className="label">Adjustment Type</label>
              <select
                value={adjustForm.status}
                onChange={(e) => setAdjustForm({ ...adjustForm, status: e.target.value as 'damaged' | 'returned' })}
                className="input"
              >
                <option value="damaged">Damaged</option>
                <option value="returned">Returned</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="label">Notes (optional)</label>
              <textarea
                value={adjustForm.notes}
                onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                className="input min-h-[80px]"
                placeholder="Reason for adjustment..."
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Apply Adjustment
            </button>
          </form>
        </div>
      )}

      {activeTab === 'daily-stock' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Daily Stock Report</h2>
          <form onSubmit={handleGetDailyStock} className="flex gap-4 items-end max-w-lg">
            <div className="flex-1">
              <label className="label">Product</label>
              <select
                value={dailyStockForm.productId}
                onChange={(e) => setDailyStockForm({ ...dailyStockForm, productId: e.target.value })}
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
                value={dailyStockForm.date}
                onChange={(e) => setDailyStockForm({ ...dailyStockForm, date: e.target.value })}
                className="input"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Get Stock
            </button>
          </form>
          {dailyStock && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="stat-card">
                <div className="stat-value">{dailyStock.opening}</div>
                <div className="stat-label">Opening Stock</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dailyStock.closing}</div>
                <div className="stat-label">Closing Stock</div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'barcode' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Generate Barcode</h2>
          <form onSubmit={handleGetBarcodeImage} className="max-w-lg">
            <div className="mb-4">
              <label className="label">Barcode Value</label>
              <input
                type="text"
                value={barcodeForm.barcode}
                onChange={(e) => setBarcodeForm({ barcode: e.target.value })}
                className="input"
                placeholder="Enter barcode string"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Generate
            </button>
          </form>
          {barcodeImage && (
            <div className="mt-6">
              <h3 className="font-medium text-slate-900 mb-2">Barcode Preview</h3>
              <div className="p-4 bg-white border border-slate-200 rounded-lg inline-block">
                <div dangerouslySetInnerHTML={{ __html: barcodeImage.svg }} />
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    const blob = new Blob([barcodeImage.svg], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `barcode-${barcodeForm.barcode}.svg`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="btn btn-secondary"
                >
                  Download SVG
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
