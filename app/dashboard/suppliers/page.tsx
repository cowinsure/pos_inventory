'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { realApi, Supplier } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const EMPTY_FORM = { name: '', phone: '', description: '', contactEmail: '' };

export default function SuppliersPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !token) router.replace('/login');
  }, [token, authLoading, router]);

  const loadSuppliers = () => {
    setLoading(true);
    realApi.getSuppliers()
      .then(data => setSuppliers(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (token) loadSuppliers(); }, [token]);

  const openCreate = () => {
    setEditingSupplier(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({ name: s.name, phone: s.phone, description: s.description || '', contactEmail: s.contactEmail });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    setFormData(EMPTY_FORM);
    setFormError('');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFormError('');
    try {
      if (editingSupplier) {
        await realApi.updateSupplier(editingSupplier.id, {
          name: formData.name,
          phone: formData.phone,
          description: formData.description || null,
          contactEmail: formData.contactEmail,
        });
      } else {
        await realApi.createSupplier({
          name: formData.name,
          phone: formData.phone,
          description: formData.description,
          contactEmail: formData.contactEmail,
        });
      }
      closeModal();
      loadSuppliers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : editingSupplier ? 'Failed to update supplier' : 'Failed to create supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this supplier? This cannot be undone.')) return;
    try {
      await realApi.deleteSupplier(id);
      loadSuppliers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete supplier');
    }
  };

  const Spinner = () => (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/70 bg-white/80 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.45)] backdrop-blur">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-sky-500 border-t-transparent" />
      </div>
    </div>
  );

  if (authLoading) return <Spinner />;

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.08),transparent_30%),linear-gradient(160deg,#f8fafc_0%,#eef6ff_50%,#fff7ed_100%)] p-6">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-sm text-slate-600 shadow-[0_10px_35px_-22px_rgba(15,23,42,0.4)] backdrop-blur">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              Suppliers
            </div>
            {!loading && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-700">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Supplier
          </button>
        </div>

        {loading ? <Spinner /> : suppliers.length === 0 ? (
          /* Empty state */
          <div className="rounded-[28px] border border-white/80 bg-white/88 p-14 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.30)] backdrop-blur text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">No suppliers yet</p>
            <p className="mt-2 text-sm text-slate-400">Add your first supplier to start receiving inventory</p>
            <button
              onClick={openCreate}
              className="mt-5 rounded-2xl bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add Supplier
            </button>
          </div>
        ) : (
          /* Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {suppliers.map(supplier => (
              <div
                key={supplier.id}
                className="group rounded-[24px] border border-white/80 bg-white/88 p-6 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.22)] backdrop-blur transition hover:shadow-[0_28px_70px_-28px_rgba(15,23,42,0.30)]"
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-lg font-bold text-orange-700">
                      {supplier.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 h-0.5 w-6 rounded-full bg-linear-to-r from-orange-400 to-sky-500" />
                      <h3 className="text-base font-semibold text-slate-900 truncate leading-snug">{supplier.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(supplier)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Contact details */}
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="truncate">{supplier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{supplier.contactEmail}</span>
                  </div>
                  {supplier.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 pt-2.5 border-t border-slate-100">
                      {supplier.description}
                    </p>
                  )}
                  {supplier.createdAt && (
                    <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                      Added {new Date(supplier.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-[28px] border border-white/80 bg-white/95 p-7 shadow-[0_40px_100px_-32px_rgba(15,23,42,0.45)] backdrop-blur"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-1.5 h-1 w-10 rounded-full bg-linear-to-r from-sky-500 to-orange-400" />
            <div className="mb-6">
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 mb-2">
                {editingSupplier ? 'Edit supplier' : 'New supplier'}
              </div>
              <h2 className="text-xl font-semibold text-slate-950">
                {editingSupplier ? `Edit ${editingSupplier.name}` : 'Add a supplier'}
              </h2>
            </div>

            {formError && (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
              {[
                { field: 'name', label: 'Name', type: 'text', placeholder: 'e.g. ABC Supplies Inc.', required: true, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                { field: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 234 567 8900', required: true, icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
                { field: 'contactEmail', label: 'Contact Email', type: 'email', placeholder: 'supplier@example.com', required: true, icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
              ].map(({ field, label, type, placeholder, required, icon }) => (
                <div key={field}>
                  <label className="mb-2 block text-sm font-medium text-slate-700">{label}{required && ' *'}</label>
                  <div className="relative">
                    <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                    <input
                      type={type}
                      value={formData[field as keyof typeof formData]}
                      onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                      placeholder={placeholder}
                      required={required}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </div>
                </div>
              ))}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Notes about this supplier..."
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
