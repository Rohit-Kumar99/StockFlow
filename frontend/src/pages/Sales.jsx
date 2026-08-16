import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Alert from '../components/ui/Alert';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ items: [{ product: '', quantity: 1, unitPrice: '' }] });

  const fetchSales = async () => {
    try {
      const { data } = await api.get('/sales');
      setSales(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    api.get('/products', { params: { limit: 100 } }).then((r) => setProducts(r.data.products)).catch(() => {});
  }, []);

  const addItem = () => {
    setForm({ items: [...form.items, { product: '', quantity: 1, unitPrice: '' }] });
  };

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    if (field === 'product') {
      const product = products.find((p) => p._id === value);
      if (product) items[index].unitPrice = product.unitPrice;
    }
    setForm({ items });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sales', {
        items: form.items.map((i) => ({
          product: i.product,
          quantity: parseInt(i.quantity, 10),
          unitPrice: parseFloat(i.unitPrice),
        })),
      });
      setShowForm(false);
      setForm({ items: [{ product: '', quantity: 1, unitPrice: '' }] });
      fetchSales();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create sale');
    }
  };

  const totalPreview = form.items.reduce(
    (sum, i) => sum + (parseFloat(i.unitPrice) || 0) * (parseInt(i.quantity, 10) || 0),
    0
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Sales</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : '+ Record Sale'}
        </button>
      </div>

      <Alert message={error} />

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Sale Items</p>
          {form.items.map((item, idx) => (
            <div key={idx} className="mb-2 flex flex-wrap gap-2">
              <select
                value={item.product}
                onChange={(e) => updateItem(idx, 'product', e.target.value)}
                required
                className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Product...</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (stock: {p.currentStock})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                placeholder="Price"
                required
                className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div className="mt-3 flex items-center justify-between">
            <button type="button" onClick={addItem} className="text-sm text-indigo-600 hover:underline">
              + Add item
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700">Total: ${totalPreview.toFixed(2)}</span>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">
                Complete Sale
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : sales.length === 0 ? (
        <EmptyState title="No sales recorded" message="Record a sale to decrease inventory." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Sale #</th>
                <th className="px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="px-4 py-3 font-medium text-slate-600">Items</th>
                <th className="px-4 py-3 font-medium text-slate-600">Total</th>
                <th className="px-4 py-3 font-medium text-slate-600">Sold By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.saleNumber}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {s.items.map((i) => `${i.product?.name} ×${i.quantity}`).join(', ')}
                  </td>
                  <td className="px-4 py-3 font-medium text-green-600">${s.totalAmount?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-500">{s.soldBy?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
