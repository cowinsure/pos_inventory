'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { realApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Category } from '@/lib/api';

interface CategoryFormData {
  name: string;
  description: string;
  parentId: string;
}

interface AttrFormData {
  name: string;
  type: string;
  options: string;
  required: boolean;
}

export default function CategoriesPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({ name: '', description: '', parentId: '' });
  const [attrData, setAttrData] = useState<AttrFormData>({ name: '', type: 'select', options: '', required: true });

  const loadCategories = useCallback(() => {
    setLoading(true);
    realApi.getCategories()
      .then(async (categories) => {
        // Fetch attributes for each category
        const categoriesWithAttrs = await Promise.all(
          categories.map(async (cat) => {
            try {
              const attrs = await realApi.getAttributes(cat.id);
              return { ...cat, attributes: attrs };
            } catch {
              return { ...cat, attributes: [] };
            }
          })
        );
        setCategories(categoriesWithAttrs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace('/login');
    }
  }, [token, authLoading, router]);

  useEffect(() => {
    if (token) {
      loadCategories();
    }
  }, [token, loadCategories]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
   }

  const rootCategories = categories.filter((c) => !c.parent);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: Record<string, unknown> = { name: formData.name, description: formData.description };
      if (formData.parentId) data.parentId = Number(formData.parentId);
      await realApi.createCategory(data as { name: string; description?: string; parentId?: number });
      setShowModal(false);
      setFormData({ name: '', description: '', parentId: '' });
      loadCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create category';
      alert(message);
    }
  };

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    try {
      await realApi.createAttribute(selectedCategory.id, {
        name: attrData.name,
        type: attrData.type,
        options: attrData.options.split(',').map((s) => s.trim()),
        required: attrData.required,
      });
      setShowAttrModal(false);
      setAttrData({ name: '', type: 'select', options: '', required: true });
      loadCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create attribute';
      alert(message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Manage product categories and attributes</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rootCategories.map((cat) => (
          <div key={cat.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{cat.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{cat.description}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory(cat);
                  setShowAttrModal(true);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Attribute
              </button>
            </div>
            {cat.attributes?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {cat.attributes.map((attr) => (
                  <span key={attr.id} className="attribute-tag">
                    {attr.name}
                    {attr.options.length > 0 && (
                      <span className="ml-1 text-slate-400">
                        ({attr.options.join(', ')})
                      </span>
                    )}
                    {/* <span className="ml-1 text-slate-400">({attr.type})</span> */}
                  </span>
                ))}
              </div>
            )}
            {cat.attributes?.length === 0 && (
              <p className="mt-4 text-sm text-slate-400">No attributes yet</p>
            )}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">{cat.products?.length || 0} products</span>
            </div>
          </div>
        ))}
      </div>

      {rootCategories.length === 0 && (
        <div className="empty-state card">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="font-medium text-slate-900">No categories yet</p>
          <p className="text-sm text-slate-500 mt-1">Create your first category to get started</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Category</h2>
            <form onSubmit={handleCreateCategory}>
              <div className="mb-4">
                <label className="label">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Clothing"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  placeholder="e.g., Apparel and accessories"
                />
              </div>
              <div className="mb-6">
                <label className="label">Parent Category (optional)</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="input"
                >
                  <option value="">None</option>
                  {rootCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAttrModal && (
        <div className="modal-overlay" onClick={() => setShowAttrModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Attribute to {selectedCategory?.name}</h2>
            <form onSubmit={handleCreateAttribute}>
              <div className="mb-4">
                <label className="label">Name</label>
                <input
                  type="text"
                  value={attrData.name}
                  onChange={(e) => setAttrData({ ...attrData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Size"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">Type</label>
                <select
                  value={attrData.type}
                  onChange={(e) => setAttrData({ ...attrData, type: e.target.value })}
                  className="input"
                >
                  <option value="select">Select</option>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="label">Options (comma separated)</label>
                <input
                  type="text"
                  value={attrData.options}
                  onChange={(e) => setAttrData({ ...attrData, options: e.target.value })}
                  className="input"
                  placeholder="S, M, L, XL"
                />
              </div>
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={attrData.required}
                    onChange={(e) => setAttrData({ ...attrData, required: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  Required
                </label>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary">Create</button>
                <button type="button" onClick={() => setShowAttrModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}