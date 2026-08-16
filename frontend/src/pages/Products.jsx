import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Alert from '../components/ui/Alert';

export default function Products() {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    supplier: '',
    unitPrice: '',
    costPrice: '',
    minStockLevel: '5',
  });

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const stockStatus = searchParams.get('stockStatus') || '';

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (search) params.search = search;
      if (category) params.category = category;
      if (stockStatus) params.stockStatus = stockStatus;
      const { data } = await api.get('/products', { params });
      setProducts(data.products);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
    if (isAdmin) api.get('/suppliers').then((r) => setSuppliers(r.data)).catch(() => {});
  }, [search, category, stockStatus, isAdmin]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        ...form,
        unitPrice: parseFloat(form.unitPrice),
        costPrice: parseFloat(form.costPrice),
        minStockLevel: parseInt(form.minStockLevel, 10),
      });
      setShowForm(false);
      setForm({ name: '', sku: '', category: '', supplier: '', unitPrice: '', costPrice: '', minStockLevel: '5' });
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Products</h2>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        )}
      </div>

      <Alert message={error} />

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search name or SKU..."
          defaultValue={search}
          onChange={(e) => {
            const p = new URLSearchParams(searchParams);
            if (e.target.value) p.set('search', e.target.value);
            else p.delete('search');
            setSearchParams(p);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => {
            const p = new URLSearchParams(searchParams);
            if (e.target.value) p.set('category', e.target.value);
            else p.delete('category');
            setSearchParams(p);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select
          value={stockStatus}
          onChange={(e) => {
            const p = new URLSearchParams(searchParams);
            if (e.target.value) p.set('stockStatus', e.target.value);
            else p.delete('stockStatus');
            setSearchParams(p);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All Stock Levels</option>
          <option value="low">Low Stock</option>
          <option value="ok">In Stock</option>
        </select>
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleCreate} className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'sku', label: 'SKU', type: 'text' },
            { key: 'unitPrice', label: 'Unit Price', type: 'number' },
            { key: 'costPrice', label: 'Cost Price', type: 'number' },
            { key: 'minStockLevel', label: 'Min Stock', type: 'number' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select...</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Supplier</label>
            <select
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select...</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
              Save Product
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : products.length === 0 ? (
        <EmptyState title="No products found" message="Add your first product to get started." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Product</th>
                <th className="px-4 py-3 font-medium text-slate-600">SKU</th>
                <th className="px-4 py-3 font-medium text-slate-600">Category</th>
                <th className="px-4 py-3 font-medium text-slate-600">Stock</th>
                <th className="px-4 py-3 font-medium text-slate-600">Price</th>
                <th className="px-4 py-3 font-medium text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.sku}</td>
                  <td className="px-4 py-3 text-slate-500">{p.category?.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.currentStock <= p.minStockLevel
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {p.currentStock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">${p.unitPrice?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/products/${p._id}`} className="text-indigo-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
