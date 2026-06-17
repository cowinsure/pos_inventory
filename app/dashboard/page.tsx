'use client';

import { useEffect, useState } from 'react';
import { realApi } from '@/lib/api';
import { Category, Product } from '@/lib/api';

export default function DashboardHome() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <svg className="animate-spin h-8 w-8 text-sky-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const activeProducts = products.filter((p: Product) => p.active);

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.08),transparent_30%),linear-gradient(160deg,#f8fafc_0%,#eef6ff_50%,#fff7ed_100%)] dark:bg-none dark:bg-slate-950 p-6">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/80 dark:border-slate-700/70 bg-white/75 dark:bg-slate-800/75 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 shadow-[0_10px_35px_-22px_rgba(15,23,42,0.4)] backdrop-blur">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 dark:bg-slate-100 text-xs font-semibold text-white dark:text-slate-900">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </span>
          Dashboard
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Categories',
              value: categories.length,
              color: 'from-sky-500 to-blue-600',
              text: 'text-sky-700 dark:text-sky-300',
              bg: 'bg-sky-50 dark:bg-sky-900/30',
              icon: (
                <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              ),
            },
            {
              label: 'Total Products',
              value: products.length,
              color: 'from-emerald-500 to-teal-500',
              text: 'text-emerald-700 dark:text-emerald-300',
              bg: 'bg-emerald-50 dark:bg-emerald-900/30',
              icon: (
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              ),
            },
            {
              label: 'Active Products',
              value: activeProducts.length,
              color: 'from-orange-400 to-amber-500',
              text: 'text-orange-700 dark:text-orange-300',
              bg: 'bg-orange-50 dark:bg-orange-900/30',
              icon: (
                <svg className="w-5 h-5 text-orange-500 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
          ].map(({ label, value, color, text, bg, icon }) => (
            <div key={label} className="rounded-[28px] border border-white/80 dark:border-slate-700/70 bg-white/88 dark:bg-slate-800/90 p-6 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.30)] backdrop-blur">
              <div className={`mb-3 h-0.5 w-8 rounded-full bg-linear-to-r ${color}`} />
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-4xl font-semibold ${text}`}>{value}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${bg}`}>
                  {icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-[28px] border border-white/80 dark:border-slate-700/70 bg-white/88 dark:bg-slate-800/90 p-7 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.30)] backdrop-blur">
            <div className="mb-1.5 h-1 w-10 rounded-full bg-linear-to-r from-sky-500 to-orange-400" />
            <div className="mb-5">
              <div className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300 mb-1">
                Recent Categories
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Latest product categories</p>
            </div>
            <div className="space-y-2">
              {categories.slice(0, 5).map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/50 px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/40 text-xs font-bold text-sky-700 dark:text-sky-300">
                    {cat.name[0].toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{cat.name}</p>
                    <p className="text-xs text-slate-400">{cat.attributes?.length || 0} attributes</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
                    {cat.products?.length || 0}
                  </span>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">No categories yet</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/80 dark:border-slate-700/70 bg-white/88 dark:bg-slate-800/90 p-7 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.30)] backdrop-blur">
            <div className="mb-1.5 h-1 w-10 rounded-full bg-linear-to-r from-orange-400 to-sky-500" />
            <div className="mb-5">
              <div className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300 mb-1">
                Recent Products
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Latest added products</p>
            </div>
            <div className="space-y-2">
              {products.slice(0, 5).map((prod) => (
                <div key={prod.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/50 px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {prod.name[0].toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{prod.name}</p>
                    <p className="text-xs text-slate-400">৳{prod.basePrice.toFixed(2)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${prod.active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    {prod.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
              {products.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">No products yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-100 dark:border-emerald-700/30 bg-emerald-50/60 dark:bg-emerald-900/20 px-5 py-3.5">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Connected to live Inventory POS API</p>
        </div>
      </div>
    </div>
  );
}
