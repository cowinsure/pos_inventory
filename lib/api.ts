const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
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
  
  createProduct: (data: { name: string; description?: string; basePrice: number; categoryId: number; attributes: Record<string, string> }) =>
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
  getInventory: () =>
    api.get<InventoryItemWithProduct[]>('/inventory/items'),
  
  receiveBatchInventory: (data: { productId: number; quantity: number; supplierId: number; notes?: string }) =>
    api.post<InventoryItem[]>('/inventory/receive-batch', data),
  
  scanBarcode: (barcode: string) =>
    api.get<InventoryItemWithProduct>('/inventory/scan', { barcode }),
  
  sellItem: (data: { barcode: string; notes?: string }) =>
    api.patch<InventoryItem>('/inventory/sell', data),
  
  sellBatchItems: (items: { barcode: string; discountAmount?: number; notes?: string; customerId?: number }[]) =>
    api.patch<InventoryItem[]>('/inventory/sell', { items }),
  
  adjustItem: (data: { barcode: string; status: 'damaged' | 'returned'; notes?: string }) =>
    api.patch<InventoryItem>('/inventory/adjust', data),
  
  getDailyStock: (date: string, productId: number) =>
    api.get<DailyStockResponse>('/inventory/daily-stock', { date, productId: productId.toString() }),
  
  getBarcodeImage: (barcode: string) =>
    api.get<BarcodeImageResponse>(`/inventory/barcode/${barcode}/image`),
  
  getBarcodeImages: (barcodes: string[]) =>
    api.get<BarcodeImagesResponse>('/inventory/barcode-images', { barcodes: barcodes.join(',') }),
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
  attributes: Record<string, string>;
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
  barcode: string;
  status: 'in_stock' | 'sold' | 'damaged' | 'returned';
  acquiredDate: string;
  soldDate: string | null;
  adjustedDate: string | null;
  notes: string | null;
  updatedAt: string;
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
  attributes: Record<string, string>;
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