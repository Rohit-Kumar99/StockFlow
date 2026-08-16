import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Alert from '../components/ui/Alert';

const typeColors = {
  purchase: 'bg-green-100 text-green-800',
  sale: 'bg-blue-100 text-blue-800',
  damage: 'bg-red-100 text-red-800',
  return: 'bg-purple-100 text-purple-800',
  adjustment: 'bg-slate-100 text-slate-800',
};

export default function InventoryHistory() {
  const { isAdmin } = useAuth();
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ product: '', type: '', dateFrom: '', dateTo: '' });
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ product: '', quantity: '', reason: '', type: 'adjustment' });

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.product) params.product = filters.product;
      if (filters.type) params.type = filters.type;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      const { data } = await api.get('/inventory/movements', { params });
      setMovements(data.movements);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load movements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
    api.get('/products', { params: { limit: 100 } }).then((r) => setProducts(r.data.products)).catch(() => {});
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchMovements();
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    
    // Validate adjustment form
    if (!adjustForm.product) {
      setError('Product is required');
      return;
    }
    const quantity = parseInt(adjustForm.quantity, 10);
    if (!adjustForm.quantity || quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }
    if (!adjustForm.reason.trim()) {
      setError('Reason is required');
      return;
    }

    try {
      await api.post('/inventory/adjustments', {
        ...adjustForm,
        quantity: parseInt(adjustForm.quantity, 10),
      });
      setShowAdjust(false);
      setAdjustForm({ product: '', quantity: '', reason: '', type: 'adjustment' });
      fetchMovements();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create adjustment');
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/inventory/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err.response?.data?.message || 'Export failed');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Inventory History</h2>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowAdjust(!showAdjust)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Adjust Stock
              </button>
              <button
                onClick={handleExport}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Export CSV
              </button>
            </>
          )}
        </div>
      </div>

      <Alert message={error} />

      {showAdjust && isAdmin && (
        <form onSubmit={handleAdjust} className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={adjustForm.product}
            onChange={(e) => setAdjustForm({ ...adjustForm, product: e.target.value })}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Product...</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Quantity (+/-)"
            value={adjustForm.quantity}
            onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={adjustForm.type}
            onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="adjustment">Adjustment</option>
            <option value="damage">Damage</option>
            <option value="return">Return</option>
          </select>
          <input
            placeholder="Reason"
            value={adjustForm.reason}
            onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white sm:col-span-2 lg:col-span-4">
            Save Adjustment
          </button>
        </form>
      )}

      <form onSubmit={handleFilter} className="mb-4 flex flex-wrap gap-3">
        <select
          value={filters.product}
          onChange={(e) => setFilters({ ...filters, product: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          {['purchase', 'sale', 'damage', 'return', 'adjustment'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white">
          Filter
        </button>
      </form>

      {loading ? (
        <LoadingSpinner />
      ) : movements.length === 0 ? (
        <EmptyState title="No movements" message="Inventory changes will appear here as audit trail." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="px-4 py-3 font-medium text-slate-600">Product</th>
                <th className="px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="px-4 py-3 font-medium text-slate-600">Qty</th>
                <th className="px-4 py-3 font-medium text-slate-600">Reference</th>
                <th className="px-4 py-3 font-medium text-slate-600">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{new Date(m.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{m.product?.name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[m.type]}`}>
                      {m.type}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-medium ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{m.reference || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{m.performedBy?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
