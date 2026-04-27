'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: 'home' },
  { href: '/dashboard/categories', label: 'Categories', icon: 'folder' },
  { href: '/dashboard/products', label: 'Products', icon: 'box' },
  { href: '/dashboard/inventory/list', label: 'Inventory List', icon: 'inventory' },
  { href: '/dashboard/inventory/receive', label: 'Receive', icon: 'receive' },
  { href: '/dashboard/inventory/sell', label: 'Sell', icon: 'sell' },
  { href: '/dashboard/inventory/adjust', label: 'Adjust', icon: 'adjust' },
  { href: '/dashboard/inventory/daily-stock', label: 'Daily Stock', icon: 'stock' },
  { href: '/dashboard/inventory/barcode', label: 'Barcode', icon: 'barcode' },
  { href: '/dashboard/suppliers', label: 'Suppliers', icon: 'folder' },
];

const icons: Record<string, ReactNode> = {
  home: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2 7-7 7 7 2 2M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6"
      />
    </svg>
  ),
  folder: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
      />
    </svg>
  ),
  box: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  ),
  inventory: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    </svg>
  ),
  receive: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 5v10m0 0l-4-4m4 4l4-4M5 19h14"
      />
    </svg>
  ),
  sell: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  adjust: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h5M20 20v-5h-5M5.5 9A8 8 0 0119 12m-.5 3A8 8 0 015 12"
      />
    </svg>
  ),
  stock: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 19V9m7 10V5m7 14v-7M3 19h18"
      />
    </svg>
  ),
  barcode: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 5v14M9 5v14M12 7v10M15 5v14M19 5v14"
      />
    </svg>
  ),
};

function isItemActive(pathname: string, href: string) {
  if (href === '/dashboard') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/dashboard';
  const { token, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.replace('/login');
    }
  }, [loading, router, token]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(160deg,#f8fafc_0%,#eef6ff_48%,#fff7ed_100%)] px-6">
        <div className="flex flex-col items-center gap-4 text-slate-600">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/70 bg-white/80 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-sky-500 border-t-transparent" />
          </div>
          <p className="text-sm font-medium">Preparing your dashboard...</p>
        </div>
      </div>
    );
  }

  const segments = pathname.split('/').filter(Boolean);
  const rawTitle = segments.length ? segments[segments.length - 1] : 'dashboard';
  const pageTitle = rawTitle.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const activeItem = navItems.find((item) => isItemActive(pathname, item.href)) ?? navItems[0];
  const userEmail = 'owner@example.com';
  const userLabel = 'Workspace Owner';
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(249,115,22,0.12),_transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_48%,#fffaf5_100%)] text-slate-900">
      <aside className="fixed inset-y-4 left-4 z-30 hidden w-80 flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/80 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.38)] backdrop-blur lg:flex">
        <div className="border-b border-slate-100/90 px-6 py-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-[0_10px_35px_-22px_rgba(15,23,42,0.35)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
              IP
            </span>
            Inventory &amp; POS
          </div>
          <div className="mt-5 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Operations dashboard
            </h1>
            <p className="max-w-xs text-sm leading-6 text-slate-600">
              A focused workspace for stock movement, products, suppliers, and checkout flow.
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-auto px-4 py-5">
          <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Navigation
          </div>
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = isItemActive(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-slate-950 text-white shadow-[0_18px_35px_-22px_rgba(15,23,42,0.75)]'
                        : 'text-slate-700 hover:bg-white hover:text-slate-950 hover:shadow-[0_14px_32px_-26px_rgba(15,23,42,0.35)]'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                        isActive
                          ? 'bg-white/14 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-sky-50 group-hover:text-sky-700'
                      }`}
                    >
                      {icons[item.icon]}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {isActive ? (
                      <span className="ml-auto h-2.5 w-2.5 rounded-full bg-sky-300" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-100/90 bg-white/75 p-4">
          <div className="rounded-3xl border border-slate-100 bg-white/85 p-4 shadow-[0_20px_45px_-34px_rgba(15,23,42,0.4)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-orange-100 text-sm font-semibold text-slate-900">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-900">{userLabel}</div>
                <div className="truncate text-xs text-slate-500">{userEmail}</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-slate-50/90 px-3 py-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Environment
                </div>
                <div className="mt-1 text-sm font-medium text-slate-700">v1.0 Production</div>
              </div>
              <button
                onClick={handleLogout}
                aria-label="Logout"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:hidden">
        <header className="border-b border-white/70 bg-white/80 px-5 py-4 shadow-[0_16px_35px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Inventory &amp; POS
              </div>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
                {pageTitle}
              </h2>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Logout"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
            >
              Logout
            </button>
          </div>
        </header>
      </div>

      <div className="min-h-screen lg:ml-[22rem]">
        <header className="sticky top-0 z-20 hidden px-6 pt-4 lg:block">
          <div className="rounded-[24px] border border-white/80 bg-white/72 px-6 py-4 shadow-[0_20px_55px_-36px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-orange-100 text-slate-900">
                {icons[activeItem.icon]}
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Inventory Workspace
                </div>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  {pageTitle}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Manage products, stock movement, and reporting from one place.
                </p>
              </div>
              <div className="hidden items-center gap-3 xl:flex">
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
                  Live workspace
                </div>
                <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white">
                  {userEmail}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-3 pb-3 pt-3 lg:px-6 lg:pb-6">
          <div className="mx-auto max-w-full">
            <div className="rounded-[28px] border border-white/70 bg-white/35 p-1 shadow-[0_20px_55px_-42px_rgba(15,23,42,0.35)] backdrop-blur">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
