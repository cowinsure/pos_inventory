export interface Tenant {
  id: number;
  name: string;
  apiKey: string;
  createdAt: Date;
}

export interface User {
  id: number;
  tenantId: number;
  email: string;
  passwordHash: string;
  role: 'admin' | 'manager' | 'cashier';
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: number;
  tenantId: number;
  name: string;
  description: string | null;
  parentId: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attribute {
  id: number;
  tenantId: number;
  categoryId: number;
  name: string;
  type: 'select' | 'number' | 'text';
  unit: string | null;
  options: string[];
  required: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  tenantId: number;
  name: string;
  description: string | null;
  basePrice: number;
  categoryId: number;
  attributes: Record<string, string>;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: number;
  tenantId: number;
  productId: number;
  barcode: string;
  status: 'in_stock' | 'sold' | 'damaged' | 'returned';
  acquiredDate: Date;
  soldDate: Date | null;
  adjustedDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

class Database {
  tenants: Map<number, Tenant> = new Map();
  users: Map<number, User> = new Map();
  categories: Map<number, Category> = new Map();
  attributes: Map<number, Attribute> = new Map();
  products: Map<number, Product> = new Map();
  inventory: Map<number, InventoryItem> = new Map();

  nextTenantId = 1;
  nextUserId = 1;
  nextCategoryId = 1;
  nextAttributeId = 1;
  nextProductId = 1;
  nextInventoryId = 1;

  initialize() {
    const tenant: Tenant = {
      id: this.nextTenantId++,
      name: 'Default Tenant',
      apiKey: '74ee381d-c4f1-4889-87e9-37b2306f98b4',
      createdAt: new Date(),
    };
    this.tenants.set(tenant.id, tenant);

    const adminUser: User = {
      id: this.nextUserId++,
      tenantId: tenant.id,
      email: 'aaa006bd@gmail.com',
      passwordHash: 'password123',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    const category: Category = {
      id: this.nextCategoryId++,
      tenantId: tenant.id,
      name: 'Clothing',
      description: 'Apparel and accessories',
      parentId: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.categories.set(category.id, category);

    const sizeAttr: Attribute = {
      id: this.nextAttributeId++,
      tenantId: tenant.id,
      categoryId: category.id,
      name: 'Size',
      type: 'select',
      unit: null,
      options: ['S', 'M', 'L', 'XL'],
      required: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.attributes.set(sizeAttr.id, sizeAttr);

    const colorAttr: Attribute = {
      id: this.nextAttributeId++,
      tenantId: tenant.id,
      categoryId: category.id,
      name: 'Color',
      type: 'select',
      unit: null,
      options: ['Red', 'Blue', 'Black', 'White'],
      required: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.attributes.set(colorAttr.id, colorAttr);

    const product: Product = {
      id: this.nextProductId++,
      tenantId: tenant.id,
      name: 'Cotton T-Shirt',
      description: null,
      basePrice: 19.99,
      categoryId: category.id,
      attributes: { Size: 'M', Color: 'Blue' },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(product.id, product);
  }
}

export const db = new Database();
db.initialize();

export function getDb() {
  return db;
}