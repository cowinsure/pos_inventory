'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { realApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Category, Product, Attribute } from '@/lib/api';

export default function ProductsPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [categoryAttributes, setCategoryAttributes] = useState<Attribute[]>([]);
  const [attrLoading, setAttrLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    basePrice: '',
    categoryId: '',
    attributes: {} as Record<string, string>,
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Category dropdown
  const [catOpen, setCatOpen] = useState(false);
  const [catQuery, setCatQuery] = useState('');
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node))
        setCatOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace('/login');
    }
  }, [token, authLoading, router]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      realApi.getCategories(),
      realApi.getProducts(),
    ])
      .then(([cats, prodsRes]) => {
        const prods = prodsRes.data || prodsRes;
        const normalizedProducts = Array.isArray(prods) ? prods.map(p => ({
          ...p,
          basePrice: Number(p.basePrice),
        })) : [];
        setCategories(cats);
        setProducts(normalizedProducts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <svg className="animate-spin h-8 w-8 text-sky-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await realApi.createProduct({
        name: formData.name,
        basePrice: Number(formData.basePrice),
        categoryId: Number(formData.categoryId),
        attributes: { ...formData.attributes },
      });
      setShowModal(false);
      setFormData({ name: '', basePrice: '', categoryId: '', attributes: {} });
      setCategoryAttributes([]);
      const prodsRes = await realApi.getProducts();
      const prods = prodsRes.data || prodsRes;
      setProducts(Array.isArray(prods) ? prods.map(p => ({ ...p, basePrice: Number(p.basePrice) })) : []);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttrChange = (name: string, value: string) => {
    setFormData({ ...formData, attributes: { ...formData.attributes, [name]: value } });
  };

  const handleCategorySelect = async (categoryId: string) => {
    setFormData({ ...formData, categoryId, attributes: {} });
    setCatOpen(false);
    setCatQuery('');
    if (categoryId) {
      setAttrLoading(true);
      try {
        const attrs = await realApi.getAttributes(Number(categoryId));
        setCategoryAttributes(attrs);
      } catch {
        setCategoryAttributes([]);
      } finally {
        setAttrLoading(false);
      }
    } else {
      setCategoryAttributes([]);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = products.filter(p => p.active).length;
  const selectedCat = categories.find(c => c.id === Number(formData.categoryId));
  const filteredCats = categories.filter(c =>
    c.name.toLowerCase().includes(catQuery.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.08),transparent_30%),linear-gradient(160deg,#f8fafc_0%,#eef6ff_50%,#fff7ed_100%)] p-6">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-sm text-slate-600 shadow-[0_10px_35px_-22px_rgba(15,23,42,0.4)] backdrop-blur">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
            Products
          </div>
          <button
            onClick={() => {
              setShowModal(true);
              setFormError('');
              setFormData({ name: '', basePrice: '', categoryId: '', attributes: {} });
              setCategoryAttributes([]);
              setCatOpen(false);
              setCatQuery('');
            }}
            className="flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: products.length, color: 'from-sky-500 to-blue-600', text: 'text-sky-700' },
            { label: 'Active', value: activeCount, color: 'from-emerald-500 to-teal-500', text: 'text-emerald-700' },
            { label: 'Inactive', value: products.length - activeCount, color: 'from-slate-400 to-slate-500', text: 'text-slate-600' },
          ].map(({ label, value, color, text }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 backdrop-blur">
              <div className={`mb-2 h-0.5 w-7 rounded-full bg-linear-to-r ${color}`} />
              <p className={`text-2xl font-semibold ${text}`}>{value}</p>
              <p className="text-xs font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Product list card */}
        <div className="rounded-[28px] border border-white/80 bg-white/88 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.30)] backdrop-blur overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-4">
            <div className="relative flex-1">
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="shrink-0 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white"
              >
                Clear
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="font-semibold text-slate-900">{search ? 'No products found' : 'No products yet'}</p>
              <p className="text-sm text-slate-400 mt-1">{search ? 'Try a different search term' : 'Add your first product to get started'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((product) => {
                const cat = categories.find((c) => c.id === product.categoryId);
                return (
                  <div key={product.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700">
                      {product.name[0].toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 truncate">{product.name}</p>
                      <p className="text-xs text-slate-400">{cat?.name || '—'}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-slate-900">${product.basePrice.toFixed(2)}</p>
                    <div className="hidden md:flex shrink-0 flex-wrap gap-1 max-w-44">
                      {Object.entries(product.attributes).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${product.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Product modal
          Outer div has NO overflow so the category dropdown panel can freely overflow the modal bounds.
          Only the attributes section has its own bounded scroll. */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-lg rounded-[28px] border border-white/80 bg-white/95 p-7 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.40)] backdrop-blur"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-1.5 h-1 w-10 rounded-full bg-linear-to-r from-sky-500 to-orange-400" />
            <div className="mb-6">
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 mb-1">
                New Product
              </div>
              <p className="text-sm text-slate-500">Fill in the details to create a product</p>
            </div>

            {formError && (
              <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{formError}</div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Cotton T-Shirt"
                  required
                  autoFocus
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Price *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    placeholder="19.99"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-8 pr-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>

              {/* Category — custom searchable dropdown */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Category *</label>
                <div className="relative" ref={catRef}>
                  <button
                    type="button"
                    onClick={() => setCatOpen(o => !o)}
                    className="w-full flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-none transition hover:border-slate-300 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  >
                    {selectedCat ? (
                      <span className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-xs font-bold text-sky-700">
                          {selectedCat.name[0].toUpperCase()}
                        </span>
                        <span className="font-medium text-slate-900">{selectedCat.name}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Select a category...</span>
                    )}
                    <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${catOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {catOpen && (
                    <div className="absolute z-20 w-full mt-2 rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.30)] overflow-hidden">
                      <div className="p-2 border-b border-slate-100 bg-slate-50/80">
                        <div className="relative">
                          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <input
                            type="text"
                            value={catQuery}
                            onChange={e => setCatQuery(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            placeholder="Search categories..."
                            autoFocus
                            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                      </div>
                      <div className="max-h-52 overflow-y-auto">
                        {filteredCats.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-slate-400">No categories found</p>
                        ) : filteredCats.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleCategorySelect(c.id.toString())}
                            className={`w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-sky-50/60 ${formData.categoryId === c.id.toString() ? 'bg-sky-50' : ''}`}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-xs font-bold text-sky-700">
                              {c.name[0].toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-slate-900 truncate">{c.name}</div>
                              {c.description && <div className="text-xs text-slate-400 truncate">{c.description}</div>}
                            </div>
                            {formData.categoryId === c.id.toString() && (
                              <svg className="w-4 h-4 text-sky-500 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Attributes — own bounded scroll so modal stays compact */}
              {(attrLoading || categoryAttributes.length > 0) && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  {attrLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <svg className="animate-spin h-4 w-4 text-sky-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading attributes...
                    </div>
                  ) : (
                    <>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Product Attributes</p>
                      <div className="max-h-52 overflow-y-auto space-y-4 pr-1">
                        {categoryAttributes.map((attr) => (
                          <div key={attr.id}>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              {attr.name} {attr.required && <span className="text-rose-500">*</span>}
                            </label>
                            {attr.type === 'select' ? (
                              <select
                                value={formData.attributes[attr.name] || ''}
                                onChange={(e) => handleAttrChange(attr.name, e.target.value)}
                                required={attr.required}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
                                required={attr.required}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
                >
                  {submitting ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-2xl border border-slate-200 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
