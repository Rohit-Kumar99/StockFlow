import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Alert from '../components/ui/Alert';

const STATUS_FLOW = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'cancelled'],
  approved: ['received', 'cancelled'],
};

const statusColors = {
  draft: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ supplier: '', items: [{ product: '', quantity: 1, unitCost: '' }] });

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/purchase-orders');
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    api.get('/suppliers').then((r) => setSuppliers(r.data)).catch(() => {});
    api.get('/products', { params: { limit: 100 } }).then((r) => setProducts(r.data.products)).catch(() => {});
  }, []);

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { product: '', quantity: 1, unitCost: '' }] });
  };

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    setForm({ ...form, items });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/purchase-orders', {
        supplier: form.supplier,
        items: form.items.map((i) => ({
          product: i.product,
          quantity: parseInt(i.quantity, 10),
          unitCost: parseFloat(i.unitCost),
        })),
      });
      setShowForm(false);
      setForm({ supplier: '', items: [{ product: '', quantity: 1, unitCost: '' }] });
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create purchase order');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/purchase-orders/${id}/status`, { status });
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Purchase Orders</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : '+ New PO'}
        </button>
      </div>

      <Alert message={error} />

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">Supplier</label>
            <select
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              required
              className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select supplier...</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <p className="mb-2 text-sm font-medium text-slate-700">Line Items</p>
          {form.items.map((item, idx) => (
            <div key={idx} className="mb-2 flex flex-wrap gap-2">
              <select
                value={item.product}
                onChange={(e) => updateItem(idx, 'product', e.target.value)}
                required
                className="min-w-50 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Product...</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                placeholder="Qty"
                className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                step="0.01"
                value={item.unitCost}
                onChange={(e) => updateItem(idx, 'unitCost', e.target.value)}
                placeholder="Unit cost"
                required
                className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={addItem} className="text-sm text-indigo-600 hover:underline">
              + Add line item
            </button>
            <button type="submit" className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">
              Create Draft PO
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <EmptyState title="No purchase orders" message="Create a purchase order to restock inventory." />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{order.poNumber}</p>
                  <p className="text-sm text-slate-500">{order.supplier?.name} · {order.createdBy?.name}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusColors[order.status]}`}>
                  {order.status}
                </span>
              </div>

              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between py-2">
                    <span>{item.product?.name} × {item.quantity}</span>
                    <span className="text-slate-500">${item.unitCost?.toFixed(2)}/unit</span>
                  </li>
                ))}
              </ul>

              {STATUS_FLOW[order.status] && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {STATUS_FLOW[order.status].map((next) => (
                    <button
                      key={next}
                      onClick={() => updateStatus(order._id, next)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                        next === 'cancelled'
                          ? 'border border-red-200 text-red-600 hover:bg-red-50'
                          : next === 'received'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      Mark as {next}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
