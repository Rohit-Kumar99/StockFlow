import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axiosInstance';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Alert from '../components/ui/Alert';

function StatCard({ title, value, subtitle, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {subtitle && <p className="mt-1 text-xs opacity-70">{subtitle}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, lowStockRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/inventory/low-stock'),
        ]);
        setSummary(summaryRes.data);
        // Handle both old format (array) and new format (object with pagination)
        const lowStockData = Array.isArray(lowStockRes.data) 
          ? lowStockRes.data 
          : lowStockRes.data.lowStock || [];
        setLowStock(lowStockData.slice(0, 5));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-slate-800">Dashboard</h2>
      <Alert message={error} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={summary?.totalProducts ?? 0} color="indigo" />
        <StatCard title="Low Stock Items" value={summary?.lowStockCount ?? 0} color="amber" />
        <StatCard title="Pending POs" value={summary?.pendingPOs ?? 0} color="rose" />
        <StatCard
          title="Sales Today"
          value={summary?.salesToday ?? 0}
          subtitle={`$${(summary?.salesTodayTotal ?? 0).toFixed(2)} revenue`}
          color="emerald"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-semibold text-slate-800">Recent Sales Trend</h3>
          {summary?.chartData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={summary.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Sales']} />
                <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No sales data yet</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Low Stock Alerts</h3>
            <Link to="/products?stockStatus=low" className="text-sm text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">All products are well stocked</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lowStock.map((p) => (
                <li key={p._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.sku}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                    {p.currentStock} / {p.minStockLevel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
