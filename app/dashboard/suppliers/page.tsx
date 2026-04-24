'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { realApi, Supplier } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function SuppliersPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    description: '',
    contactEmail: '',
  });

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace('/login');
    }
  }, [token, authLoading, router]);

  const loadSuppliers = () => {
    setLoading(true);
    realApi.getSuppliers()
      .then((data) => {
        setSuppliers(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) {
      loadSuppliers();
    }
  }, [token]);

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
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
          description: formData.description ,
          contactEmail: formData.contactEmail,
        });
      }

      setShowModal(false);
      setFormData({ name: '', phone: '', description: '', contactEmail: '' });
      setEditingSupplier(null);
      loadSuppliers();
    } catch (err) {
      const message = err instanceof Error ? err.message : editingSupplier ? 'Failed to update supplier' : 'Failed to create supplier';
      alert(message);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone,
      description: supplier.description || '',
      contactEmail: supplier.contactEmail,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) {
      return;
    }
    try {
      await realApi.deleteSupplier(id);
      loadSuppliers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete supplier';
      alert(message);
    }
  };

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
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">Manage your supplier relationships</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(supplier)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit supplier"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(supplier.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete supplier"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1 truncate">{supplier.name}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-slate-600">
                <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="truncate">{supplier.phone}</span>
              </div>
              <div className="flex items-center text-slate-600">
                <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{supplier.contactEmail}</span>
              </div>
              {supplier.description && (
                <p className="text-slate-500 text-xs line-clamp-2 pt-1 border-t border-slate-100 mt-2">
                  {supplier.description}
                </p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  Added {new Date(supplier.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {suppliers.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="font-medium text-slate-900">No suppliers yet</p>
          <p className="text-sm text-slate-500 mt-1">Create your first supplier to get started</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
            <form onSubmit={handleCreateSupplier}>
              <div className="mb-4">
                <label className="label">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., ABC Supplies Inc."
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="+1234567890"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="input"
                  placeholder="supplier@example.com"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input resize-none"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="btn btn-primary">{editingSupplier ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setShowModal(false); setFormData({ name: '', phone: '', description: '', contactEmail: '' }); setEditingSupplier(null); }} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
