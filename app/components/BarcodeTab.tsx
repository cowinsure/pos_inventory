'use client';

import { useState } from 'react';
import { realApi, BarcodeImageResponse } from '@/lib/api';

interface BarcodeFormData {
  barcode: string;
}

interface BarcodeTabProps {
  showMessage: (type: 'success' | 'error', text: string) => void;
}

export default function BarcodeTab({ showMessage }: BarcodeTabProps) {
  const [form, setForm] = useState<BarcodeFormData>({ barcode: '' });
  const [barcodeImage, setBarcodeImage] = useState<BarcodeImageResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.barcode) return;

    setLoading(true);
    try {
      const img = await realApi.getBarcodeImage(form.barcode);
      setBarcodeImage(img);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate barcode';
      showMessage('error', message);
      setBarcodeImage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!barcodeImage) return;
    const blob = new Blob([barcodeImage.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barcode-${form.barcode}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Generate Barcode</h2>
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label className="label">Barcode Value</label>
          <input
            type="text"
            value={form.barcode}
            onChange={(e) => setForm({ barcode: e.target.value })}
            className="input"
            placeholder="Enter barcode string"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || !form.barcode}>
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </form>
      {barcodeImage && (
        <div className="mt-6">
          <h3 className="font-medium text-slate-900 mb-2">Barcode Preview</h3>
          <div className="p-4 bg-white border border-slate-200 rounded-lg inline-block">
            <div dangerouslySetInnerHTML={{ __html: barcodeImage.svg }} />
          </div>
          <div className="mt-4">
            <button onClick={handleDownload} className="btn btn-secondary">
              Download SVG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}