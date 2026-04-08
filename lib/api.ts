const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
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
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) => 
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data: unknown) => 
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
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
  
  searchProducts: (search: string) =>
    api.get<SearchResponse<Product>>(`/products/search?search=${encodeURIComponent(search)}`),
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