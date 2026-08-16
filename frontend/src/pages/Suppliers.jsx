import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Alert from '../components/ui/Alert';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [form, setForm] = useState({ name: '', contactPerson: '', email: '', phone: '', address: '' });
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  const fetchSuppliers = async () => {
    try {
      const { data } = await api.get('/suppliers');
      setSuppliers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/suppliers', form);
      setForm({ name: '', contactPerson: '', email: '', phone: '', address: '' });
      setShowForm(false);
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create supplier');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', catForm);
      setCatForm({ name: '', description: '' });
      setShowCatForm(false);
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete supplier');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Suppliers & Categories</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCatForm(!showCatForm)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            + Category
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Supplier
          </button>
        </div>
      </div>

      <Alert message={error} />

      {showCatForm && (
        <form onSubmit={handleCreateCategory} className="mb-4 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <input
            placeholder="Category name"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Description"
            value={catForm.description}
            onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">Save</button>
        </form>
      )}

      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c._id} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
              {c.name}
            </span>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
          {Object.keys(form).map((key) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium capitalize text-slate-600">
                {key.replace(/([A-Z])/g, ' $1')}
              </label>
              <input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={key === 'name'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">Save Supplier</button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : suppliers.length === 0 ? (
        <EmptyState title="No suppliers" message="Add suppliers to link with products and purchase orders." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <div key={s._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-slate-800">{s.name}</h3>
                <button onClick={() => handleDelete(s._id)} className="text-xs text-red-500 hover:underline">
                  Delete
                </button>
              </div>
              {s.contactPerson && <p className="mt-2 text-sm text-slate-600">{s.contactPerson}</p>}
              {s.email && <p className="text-sm text-slate-500">{s.email}</p>}
              {s.phone && <p className="text-sm text-slate-500">{s.phone}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
