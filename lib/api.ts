const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://217.217.249.227:3001';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function requestText(endpoint: string): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  let authHeader: string | undefined;
  if (token) {
    authHeader = token.startsWith('Bearer ') || token.startsWith('Token ') || token.startsWith('bearer ')
      ? token
      : `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      ...(authHeader && { Authorization: authHeader }),
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message || 'Request failed');
  }
  return response.text();
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  let authHeader: string | undefined;
  if (token) {
    // Normalize token: if it already includes a scheme (Bearer, Token), use as-is; otherwise prepend Bearer
    if (token.startsWith('Bearer ') || token.startsWith('Token ') || token.startsWith('bearer ')) {
      authHeader = token;
    } else {
      authHeader = `Bearer ${token}`;
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authHeader && { Authorization: authHeader }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string>) => {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params)}` 
      : endpoint;
    return request<T>(url);
  },
  post: <T>(endpoint: string, data: unknown) => 
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data: unknown) => 
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(endpoint: string, data: unknown) => 
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => 
    request<T>(endpoint, { method: 'DELETE' }),
};

// Real API client methods matching mock API interface
export const realApi = {
  // Auth methods
  signup: (data: { email: string; password: string; role: string }) =>
    api.post<AuthResponse>('/auth/signup', data),
  
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  // Category methods
  getCategories: () =>
    api.get<Category[]>('/products/categories'),
  
  getCategory: (id: number) =>
    api.get<Category>(`/products/categories/${id}`),
  
  createCategory: (data: { name: string; description?: string; parentId?: number }) =>
    api.post<Category>('/products/categories', data),
  
  updateCategory: (id: number, data: Partial<{ name: string; description: string; parentId: number }>) =>
    api.put<Category>(`/products/categories/${id}`, data),
  
  deleteCategory: (id: number) =>
    api.delete(`/products/categories/${id}`),
  
  getCategoryChildren: (id: number) =>
    api.get<Category[]>(`/products/categories/${id}/children`),
  
  getCategoryPath: (id: number) =>
    api.get<Category[]>(`/products/categories/${id}/path`),

  // Attribute methods
  getAttributes: (categoryId: number) =>
    api.get<Attribute[]>(`/products/categories/${categoryId}/attributes`),
  
  getAttribute: (categoryId: number, id: number) =>
    api.get<Attribute>(`/products/categories/${categoryId}/attributes/${id}`),
  
  createAttribute: (categoryId: number, data: { name: string; type: string; options?: string[]; required: boolean; unit?: string }) =>
    api.post<Attribute>(`/products/categories/${categoryId}/attributes`, data),
  
  updateAttribute: (categoryId: number, id: number, data: Partial<{ name: string; type: string; options: string[]; required: boolean; unit: string }>) =>
    api.put<Attribute>(`/products/categories/${categoryId}/attributes/${id}`, data),
  
  deleteAttribute: (categoryId: number, id: number) =>
    api.delete(`/products/categories/${categoryId}/attributes/${id}`),

  // Product methods
  getProducts: (params?: { limit?: number; page?: number }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return api.get<PaginatedResponse<Product>>(`/products${query}`);
  },
  
  getProduct: (id: number) =>
    api.get<Product>(`/products/${id}`),
  
  createProduct: (data: { name: string; description?: string; basePrice: number; categoryId: number; supplierId: number; attributes: Record<string, string>[] }) =>
    api.post<Product>('/products', data),
  
  updateProduct: (id: number, data: Partial<{ name: string; description: string; basePrice: number; categoryId: number; attributes: Record<string, string>; active: boolean }>) =>
    api.put<Product>(`/products/${id}`, data),
  
  deleteProduct: (id: number) =>
    api.delete(`/products/${id}`),
  
  // Supplier methods
  getSuppliers: () =>
    api.get<Supplier[]>('/suppliers'),
  
  createSupplier: (data: { name: string; phone: string; description?: string; contactEmail: string }) =>
    api.post<Supplier>('/suppliers', data),
  
  updateSupplier: (id: number, data: { name?: string; phone?: string; description?: string | null; contactEmail?: string }) =>
    api.put<Supplier>(`/suppliers/${id}`, data),
  
  deleteSupplier: (id: number) =>
    api.delete(`/suppliers/${id}`),

  // Customer methods
  getCustomers: () =>
    api.get<Customer[]>('/customers'),

  createCustomer: (data: { name: string; phone: string; email: string; address: string }) =>
    api.post<Customer>('/customers', data),

  // Inventory methods
  getInventory: (params?: { page?: number; limit?: number; lotNumber?: string }) => {
    const q: Record<string, string> = {};
    if (params?.page != null) q.page = String(params.page);
    if (params?.limit != null) q.limit = String(params.limit);
    if (params?.lotNumber) q.lotNumber = params.lotNumber;
    return api.get<InventoryPaginatedResponse>('/inventory/items', Object.keys(q).length ? q : undefined);
  },
  
  receiveBatchInventory: (data: { productId: number; quantity: number; supplierId: number; unitCost: number; notes?: string }) =>
    api.post<InventoryItem[]>('/inventory/receive-batch', data),
  
  scanBarcode: (barcode: string) =>
    api.get<InventoryItemWithProduct>('/inventory/scan', { barcode }),
  
  sellItem: (data: { barcode: string; notes?: string }) =>
    api.patch<InventoryItem>('/inventory/sell', data),
  
  sellBatchItems: (data: { items: { barcode: string; discountAmount?: number; notes?: string }[]; paymentMethod: string; customerId: number }) =>
    api.patch<InventoryItem[]>('/inventory/sell', data),
  
  adjustItem: (data: { barcode: string; status: 'damaged' | 'returned'; notes?: string }) =>
    api.patch<InventoryItem>('/inventory/adjust', data),

  createReturn: (data: {
    type: 'supplier_return';
    lotNumber?: string;
    items?: { barcode: string; notes?: string }[];
    notes?: string;
  }) => api.post<unknown>('/inventory/returns', data),
  
  getDailyStock: (date: string, productId: number) =>
    api.get<DailyStockResponse>('/inventory/daily-stock', { date, productId: productId.toString() }),
  
  getBarcodeImage: async (barcode: string): Promise<BarcodeImageResponse> => {
    const svg = await requestText(`/inventory/barcode/${barcode}/image`);
    return { svg };
  },
  
  getBarcodeImages: (barcodes: string[]) =>
    api.get<BarcodeImagesResponse>('/inventory/barcode-images', { barcodes: barcodes.join(',') }),

  getLots: (params?: { page?: number; limit?: number }) => {
    const q: Record<string, string> = {};
    if (params?.page != null) q.page = String(params.page);
    if (params?.limit != null) q.limit = String(params.limit);
    return api.get<LotsResponse>('/inventory/lots', Object.keys(q).length ? q : undefined);
  },

  // Accounting methods
  createSupplierPayment: (data: { supplierId: number; amount: number; description?: string }) =>
    api.post<SupplierPayment>('/accounting/supplier-payments', data),

  getSupplierLedger: (supplierId: number) =>
    api.get<LedgerEntry[]>(`/accounting/ledger/suppliers/${supplierId}`),

  getAllSupplierLedgers: () =>
    api.get<SupplierLedgerSummary[]>('/accounting/ledger/suppliers/'),

  // Expense methods
  getExpenses: () =>
    api.get<Expense[]>('/accounting/expenses'),

  getExpenseSummary: (params: { from: string; to: string }) =>
    api.get<ExpenseSummary>('/accounting/expenses/summary', params as Record<string, string>),

  createExpense: (data: { amount: number; description?: string; accountId?: number }) =>
    api.post<Expense>('/accounting/expenses', data),

  // Sales history methods
  getSales: (params?: { page?: number; limit?: number }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return api.get<SalesListResponse>(`/sales${query}`);
  },

  getSale: (id: number) =>
    api.get<SaleRecord>(`/sales/${id}`),

  getSalesByCustomer: (customerId: number, params?: { page?: number; limit?: number }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return api.get<SalesListResponse>(`/sales/customers/${customerId}${query}`);
  },
};

export interface User {
  id: number;
  email: string;
  role: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  parent?: Category;
  attributes: Attribute[];
  products: Product[];
  active: boolean;
}

export interface Attribute {
  id: number;
  name: string;
  type: string;
  unit: string | null;
  options: string[];
  required: boolean;
  categoryId: number;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  basePrice: number;
  sku?: string | null;
  attributes: Record<string, string>[];
  categoryId: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchResponse<T> {
  data: T[];
  total: number;
}

export interface InventoryItem {
  id: number;
  tenantId: number;
  productId: number;
  supplierId: number | null;
  barcode: string;
  lotId: number | null;
  lotNumber: string | null;
  status: 'in_stock' | 'sold' | 'damaged' | 'returned';
  acquiredDate: string;
  soldDate: string | null;
  adjustedDate: string | null;
  notes: string | null;
  adjustmentReason: string | null;
  discountAmount: string;
  acquisitionCost: string | null;
  salePrice: string | null;
  updatedAt: string;
}

export interface InventoryPaginatedResponse {
  page: string;
  limit: string;
  total: number;
  pageCount: number;
  hasNext: boolean;
  items: InventoryItemWithProduct[];
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  contactEmail: string;
  description?: string | null;
  createdAt?: string;
}

export interface InventoryItemWithProduct extends InventoryItem {
  product: Product;
  supplier?: Supplier | null;
}

export interface DailyStockResponse {
  opening: number;
  closing: number;
}

export interface BarcodeImageResponse {
  svg: string;
}

export interface BarcodeImagesResponse {
  images: string[];
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  parent?: Category;
  attributes: Attribute[];
  products: Product[];
  active: boolean;
}

export interface Attribute {
  id: number;
  name: string;
  type: string;
  unit: string | null;
  options: string[];
  required: boolean;
  categoryId: number;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  basePrice: number;
  sku?: string | null;
  attributes: Record<string, string>[];
  categoryId: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Add new interfaces for API responses
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchResponse<T> {
  data: T[];
  total: number;
}

export interface SupplierPayment {
  id: number;
  supplierId: number;
  amount: number;
  description: string | null;
  createdAt: string;
}

export interface LedgerEntry {
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface SupplierLedgerSummary {
  supplierId: number;
  supplierName: string;
  balance: number;
  totalCredit: number;
  totalDebit: number;
}

export interface SaleLine {
  id: number;
  tenantId: number;
  salesRecordId: number;
  inventoryItemId: number;
  productId: number;
  product: Product;
  barcode: string;
  salePrice: string;
  discountAmount: string;
  netAmount: string;
  acquisitionCost: string;
}

export interface JournalEntry {
  id: number;
  tenantId?: number;
  date: string;
  reference: string;
  description: string;
  eventType: string;
  createdAt: string;
}

export interface SaleRecord {
  id: number;
  tenantId: number;
  saleNumber: string;
  customerId: number | null;
  customer: Customer | null;
  paymentMethod: string;
  grossAmount: string;
  discountAmount: string;
  netAmount: string;
  totalCost: string;
  status: string;
  soldAt: string;
  journalEntryId: number | null;
  journalEntry?: JournalEntry | null;
  lines: SaleLine[];
  createdAt: string;
  updatedAt: string;
}

export interface SalesListResponse {
  items: SaleRecord[];
  page: number;
  limit: number;
  total: number;
  pageCount: number;
  hasNext: boolean;
}

export interface Expense {
  id: number;
  date: string;
  reference: string;
  amount: number;
  description: string | null;
  accountId: number | null;
}

export interface ExpenseSummary {
  totalAmount: number;
  count: number;
}

export interface LotBarcodeItem {
  id: number;
  status: string;
  barcode: string;
}

export interface Lot {
  id: number;
  lotNumber: string;
  productId: number;
  productName: string;
  sku: string;
  supplierId: number;
  supplierName: string;
  quantityReceived: number;
  totalCost: number;
  unitCost: number;
  notes: string | null;
  journalEntryId: number;
  receivedAt: string;
  updatedAt: string;
  itemCount: number;
  items: LotBarcodeItem[];
}

export interface LotsResponse {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
  hasNext: boolean;
  items: Lot[];
}