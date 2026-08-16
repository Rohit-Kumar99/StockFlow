import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/suppliers', label: 'Suppliers', icon: '🏢', admin: true },
  { to: '/purchase-orders', label: 'Purchase Orders', icon: '🛒' },
  { to: '/sales', label: 'Sales', icon: '💰' },
  { to: '/inventory', label: 'Inventory History', icon: '📋' },
];

export default function Sidebar() {
  const { isAdmin } = useAuth();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white">
      <nav className="space-y-1 p-4">
        {links
          .filter((link) => !link.admin || isAdmin)
          .map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <span>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
}
