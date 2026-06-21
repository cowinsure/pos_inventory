'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { realApi } from '@/lib/api';

type Step = 1 | 2 | 3;

const STEP_LABELS = ['Organization', 'Verify OTP', 'Set Password'];

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="mb-8 flex items-center gap-0">
      {STEP_LABELS.map((label, i) => {
        const num = i + 1;
        const done = step > num;
        const active = step === num;
        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                  done
                    ? 'bg-sky-500 text-white'
                    : active
                    ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {done ? (
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  num
                )}
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  active ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`mx-2 mb-4 h-px flex-1 transition ${
                  done ? 'bg-sky-400' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const inputCls =
  'w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-700/50 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/50';

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminMobile, setAdminMobile] = useState('');

  // Step 2
  const [otp, setOtp] = useState('');

  // Step 3
  const [setupOtp, setSetupOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signup: setAuth, token, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && token) {
      router.replace('/dashboard');
    }
  }, [token, authLoading, router]);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await realApi.requestSignupOtp({
        organization: {
          name: orgName,
          description: orgDescription,
          email: orgEmail,
          phone: orgPhone,
          address: orgAddress,
          taxId,
        },
        admin: { email: adminEmail, mobile: adminMobile },
      });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await realApi.verifySignupOtp({ email: adminEmail, otp });
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await realApi.setupPassword({ email: adminEmail, otp: setupOtp, password });
      const tok = res?.token || res?.access_token || res?.data?.token;
      if (tok) {
        setAuth(tok);
      } else {
        router.push('/login?registered=1');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password setup failed');
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
        {/* Hero */}
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

        {/* Form card */}
        <section className="order-1 lg:order-2">
          <div className="mx-auto w-full max-w-md rounded-[28px] border border-white/80 dark:border-slate-700/70 bg-white/88 dark:bg-slate-800/90 p-7 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.38)] backdrop-blur sm:p-8">
            <StepIndicator step={step} />

            {error && (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {/* Step 1 — Organization details */}
            {step === 1 && (
              <>
                <div className="mb-6 space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    Organization details
                  </h2>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Tell us about your organization and the admin contact.
                  </p>
                </div>

                <form onSubmit={handleStep1} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Organization name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Acme Retail"
                        className={inputCls}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Tax ID
                      </label>
                      <input
                        type="text"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        placeholder="TAX-12345"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Description
                    </label>
                    <input
                      type="text"
                      value={orgDescription}
                      onChange={(e) => setOrgDescription(e.target.value)}
                      placeholder="Main store"
                      className={inputCls}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Org email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={orgEmail}
                        onChange={(e) => setOrgEmail(e.target.value)}
                        placeholder="store@company.com"
                        className={inputCls}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Phone <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={orgPhone}
                        onChange={(e) => setOrgPhone(e.target.value)}
                        placeholder="+1234567890"
                        className={inputCls}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={orgAddress}
                      onChange={(e) => setOrgAddress(e.target.value)}
                      placeholder="123 Market Street"
                      className={inputCls}
                      required
                    />
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Admin contact
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Admin email <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="admin@company.com"
                          className={inputCls}
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Mobile <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={adminMobile}
                          onChange={(e) => setAdminMobile(e.target.value)}
                          placeholder="+1234567890"
                          className={inputCls}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-2xl bg-slate-950 dark:bg-white px-4 py-3 text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-600 dark:disabled:text-slate-400"
                  >
                    {loading ? 'Sending OTP...' : 'Send verification code'}
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
              </>
            )}

            {/* Step 2 — OTP verification */}
            {step === 2 && (
              <>
                <div className="mb-6 space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    Verify your email
                  </h2>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                    We sent a 6-digit code to{' '}
                    <span className="font-medium text-slate-800 dark:text-slate-200">{adminEmail}</span>.
                  </p>
                </div>

                <form onSubmit={handleStep2} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Verification code
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

                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="flex w-full items-center justify-center rounded-2xl bg-slate-950 dark:bg-white px-4 py-3 text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-600 dark:disabled:text-slate-400"
                  >
                    {loading ? 'Verifying...' : 'Verify code'}
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

            {/* Step 3 — Set password */}
            {step === 3 && (
              <>
                <div className="mb-6 space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    Set your password
                  </h2>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                    A password setup code was sent to{' '}
                    <span className="font-medium text-slate-800 dark:text-slate-200">{adminEmail}</span>.
                  </p>
                </div>

                <form onSubmit={handleStep3} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Setup code
                    </label>
                    <input
                      type="text"
                      value={setupOtp}
                      onChange={(e) => setSetupOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                        Password
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
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
                      placeholder="Repeat your password"
                      className={inputCls}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-2xl bg-slate-950 dark:bg-white px-4 py-3 text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-600 dark:disabled:text-slate-400"
                  >
                    {loading ? 'Setting up...' : 'Activate account'}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
