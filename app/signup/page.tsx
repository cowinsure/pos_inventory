'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { realApi, type AuthResponse } from '@/lib/api';

type SignupResponse = AuthResponse & {
  access_token?: string;
  data?: {
    token?: string;
  };
};

const roleOptions = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access to products, stock, and reporting.',
  },
  {
    value: 'user',
    label: 'User',
    description: 'Day-to-day access for inventory and sales tasks.',
  },
];

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signup: setAuth, token, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && token) {
      router.replace('/dashboard');
    }
  }, [token, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = (await realApi.signup({ email, password, role })) as SignupResponse;
      const token = res.token || res.access_token || res.data?.token;
      if (!token) {
        throw new Error('Invalid response: missing token');
      }
      setAuth(token);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_32%),linear-gradient(160deg,#f8fafc_0%,#eef6ff_48%,#fff7ed_100%)] dark:bg-none dark:bg-slate-950 px-6">
        <div className="flex flex-col items-center gap-4 text-slate-600 dark:text-slate-300">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/70 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-sky-500 border-t-transparent" />
          </div>
          <p className="text-sm font-medium">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_32%),linear-gradient(160deg,#f8fafc_0%,#eef6ff_48%,#fff7ed_100%)] dark:bg-none dark:bg-slate-950 px-6">
        <div className="rounded-3xl border border-white/70 dark:border-slate-700/50 bg-white/85 dark:bg-slate-800/85 px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
          Redirecting to dashboard...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.14),transparent_28%),linear-gradient(160deg,#f8fafc_0%,#eef6ff_42%,#fff7ed_100%)] dark:bg-none dark:bg-slate-950 px-6 py-8 text-slate-900 dark:text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="order-2 space-y-8 lg:order-1">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-white/75 dark:bg-slate-800/75 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 shadow-[0_10px_35px_-22px_rgba(15,23,42,0.4)] backdrop-blur">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 dark:bg-slate-100 text-xs font-semibold text-white dark:text-slate-900">
              IP
            </span>
            Inventory &amp; POS
          </div>

          <div className="max-w-xl space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-400">
              Start with a steady foundation
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              Create your workspace and get inventory, sales, and team access aligned from day one.
            </h1>
            <p className="max-w-lg text-base leading-7 text-slate-600 dark:text-slate-400 sm:text-lg">
              Set up an account that gives your store a cleaner starting point for stock control,
              faster checkout, and clearer reporting across the whole operation.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['Quick onboarding', 'Open the workspace and start organizing products right away.'],
              ['Role-based setup', 'Choose how the account enters your inventory workflow.'],
              ['Built for daily use', 'Move from setup to real operations without friction.'],
            ].map(([title, copy]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/80 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/50 p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.45)] backdrop-blur"
              >
                <div className="mb-3 h-1.5 w-10 rounded-full bg-linear-to-r from-sky-500 to-orange-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="order-1 lg:order-2">
          <div className="mx-auto w-full max-w-md rounded-[28px] border border-white/80 dark:border-slate-700/70 bg-white/88 dark:bg-slate-800/90 p-7 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.38)] backdrop-blur sm:p-8">
            <div className="mb-8 space-y-3">
              <div className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                New workspace
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Create account
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Add your credentials and choose the role for this first session.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-700/50 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/50"
                  required
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-xs font-semibold text-sky-700 dark:text-sky-400 transition hover:text-sky-800 dark:hover:text-sky-300"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-700/50 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/50"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Role
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {roleOptions.map((option) => {
                    const isSelected = role === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRole(option.value)}
                        className={`rounded-2xl border px-4 py-4 text-left transition ${
                          isSelected
                            ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/30 shadow-[0_16px_36px_-28px_rgba(14,165,233,0.8)]'
                            : 'border-slate-200 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-700/50 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-white dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {option.label}
                          </span>
                          <span
                            className={`h-3 w-3 rounded-full ${
                              isSelected ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          />
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-2xl bg-slate-950 dark:bg-white px-4 py-3 text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-600 dark:disabled:text-slate-400"
              >
                {loading ? 'Creating account...' : 'Create workspace'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-sky-700 dark:text-sky-400 transition hover:text-sky-800 dark:hover:text-sky-300"
              >
                Log in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
