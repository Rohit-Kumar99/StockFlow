import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axiosInstance';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Alert from '../components/ui/Alert';

const typeColors = {
  purchase: 'bg-green-100 text-green-800',
  sale: 'bg-blue-100 text-blue-800',
  damage: 'bg-red-100 text-red-800',
  return: 'bg-purple-100 text-purple-800',
  adjustment: 'bg-slate-100 text-slate-800',
};

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, stockRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/products/${id}/stock`),
        ]);
        setProduct(productRes.data);
        setStockData(stockRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!product) return <Alert message={error || 'Product not found'} />;

  return (
    <div>
      <Link to="/products" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">
        ← Back to Products
      </Link>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{product.name}</h2>
            <p className="text-slate-500">SKU: {product.sku}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-indigo-600">{stockData?.currentStock ?? product.currentStock}</p>
            <p className="text-sm text-slate-500">units in stock</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Category</p>
            <p className="font-medium">{product.category?.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Supplier</p>
            <p className="font-medium">{product.supplier?.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Unit Price</p>
            <p className="font-medium">${product.unitPrice?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Min Stock Level</p>
            <p className="font-medium">{product.minStockLevel}</p>
          </div>
        </div>
      </div>

      <h3 className="mb-4 text-lg font-semibold text-slate-800">Recent Inventory Movements</h3>
      {!stockData?.recentMovements?.length ? (
        <p className="text-sm text-slate-500">No movements recorded yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="px-4 py-3 font-medium text-slate-600">Qty</th>
                <th className="px-4 py-3 font-medium text-slate-600">Reference</th>
                <th className="px-4 py-3 font-medium text-slate-600">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockData.recentMovements.map((m) => (
                <tr key={m._id}>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
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
