'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { realApi } from '@/lib/api';

type Step = 1 | 2;

const inputCls =
  'w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-700/50 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/50';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await realApi.requestPasswordResetOtp({ email });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await realApi.confirmPasswordReset({ email, otp, newPassword });
      router.push('/login?reset=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.14),transparent_28%),linear-gradient(160deg,#f8fafc_0%,#eef6ff_42%,#fff7ed_100%)] dark:bg-none dark:bg-slate-950 px-6 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-[28px] border border-white/80 dark:border-slate-700/70 bg-white/88 dark:bg-slate-800/90 p-7 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.38)] backdrop-blur sm:p-8">
          {/* Step pip */}
          <div className="mb-7 flex items-center gap-2">
            <div className={`h-1.5 flex-1 rounded-full transition ${step >= 1 ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition ${step === 2 ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <div className="mb-7 space-y-1">
                <div className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                  Password reset
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Forgot your password?
                </h1>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Enter your account email and we&apos;ll send you a reset code.
                </p>
              </div>

              <form onSubmit={handleStep1} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className={inputCls}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-2xl bg-slate-950 dark:bg-white px-4 py-3 text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-600 dark:disabled:text-slate-400"
                >
                  {loading ? 'Sending code...' : 'Send reset code'}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-7 space-y-1">
                <div className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                  Set new password
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Enter your reset code
                </h1>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  We sent a 6-digit code to{' '}
                  <span className="font-medium text-slate-800 dark:text-slate-200">{email}</span>.
                </p>
              </div>

              <form onSubmit={handleStep2} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Reset code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className={`${inputCls} text-center text-2xl tracking-[0.5em] font-semibold`}
                    required
                    maxLength={6}
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      New password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-xs font-semibold text-sky-700 dark:text-sky-400 transition hover:text-sky-800 dark:hover:text-sky-300"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create a new password"
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Confirm password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    className={inputCls}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="flex w-full items-center justify-center rounded-2xl bg-slate-950 dark:bg-white px-4 py-3 text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-600 dark:disabled:text-slate-400"
                >
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setOtp(''); }}
                  className="flex w-full items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Back
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Remember your password?{' '}
            <Link
              href="/login"
              className="font-semibold text-sky-700 dark:text-sky-400 transition hover:text-sky-800 dark:hover:text-sky-300"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
