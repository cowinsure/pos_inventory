'use client';

import { useEffect, useState } from 'react';
import mockApi from '@/lib/mock-api';
import { Category, Product } from '@/lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    basePrice: '',
    categoryId: '',
    attributes: {} as Record<string, string>,
  });

  useEffect(() => {
    Promise.all([
      mockApi.getCategories(),
      mockApi.getProducts(),
    ])
      .then(([cats, prods]) => {
        setCategories(cats);
        setProducts(prods);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mockApi.createProduct({
        name: formData.name,
        basePrice: Number(formData.basePrice),
        categoryId: Number(formData.categoryId),
        attributes: formData.attributes,
      });
      setShowModal(false);
      setFormData({ name: '', basePrice: '', categoryId: '', attributes: {} });
      const prods = await mockApi.getProducts();
      setProducts(prods);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create product';
      alert(message);
    }
  };

  const handleAttrChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      attributes: { ...formData.attributes, [name]: value },
    });
  };

  const selectedCategory = categories.find((c) => c.id === Number(formData.categoryId));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product inventory</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Attributes</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const cat = categories.find((c) => c.id === product.categoryId);
              return (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="font-medium text-slate-900">{product.name}</td>
                  <td className="text-slate-600">{cat?.name}</td>
                  <td className="font-medium text-slate-900">${product.basePrice.toFixed(2)}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(product.attributes).map(([k, v]) => (
                        <span key={k} className="attribute-tag">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`text-sm font-medium ${product.active ? 'status-active' : 'status-inactive'}`}>
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="empty-state card">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="font-medium text-slate-900">No products yet</p>
          <p className="text-sm text-slate-500 mt-1">Create your first product to get started</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Product</h2>
            <form onSubmit={handleCreateProduct}>
              <div className="mb-4">
                <label className="label">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Cotton T-Shirt"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  className="input"
                  placeholder="19.99"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, attributes: {} })}
                  className="input"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              {(selectedCategory?.attributes?.length ?? 0) > 0 && (
                <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700 mb-3">Product Attributes</p>
                  {selectedCategory?.attributes?.map((attr) => (
                    <div key={attr.id} className="mb-3">
                      <label className="label">
                        {attr.name} {attr.required && <span className="text-red-500">*</span>}
                      </label>
                      {attr.type === 'select' ? (
                        <select
                          value={formData.attributes[attr.name] || ''}
                          onChange={(e) => handleAttrChange(attr.name, e.target.value)}
                          className="input"
                          required={attr.required}
                        >
                          <option value="">Select</option>
                          {attr.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={attr.type}
                          value={formData.attributes[attr.name] || ''}
                          onChange={(e) => handleAttrChange(attr.name, e.target.value)}
                          className="input"
                          required={attr.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-3 mt-6">
                <button type="submit" className="btn btn-primary">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}