import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-xl font-bold text-indigo-600">StockFlow</h1>
        <p className="text-xs text-slate-500">Inventory & Purchase Management</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-600">
          {user?.name}{' '}
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
            {user?.role}
          </span>
        </span>
        <button
          onClick={logout}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
