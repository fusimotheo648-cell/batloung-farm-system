import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Apple, Users, ShoppingCart, Package,
  BarChart3, LogOut, Menu, X, ChevronRight, CircleUserRound, Wallet, Truck
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Overview & activity' },
  { to: '/inventory', icon: Apple, label: 'Fruits & Products', description: 'Catalog management' },
  { to: '/stock', icon: Package, label: 'Stock Management', description: 'Inventory levels' },
  { to: '/purchases', icon: Truck, label: 'Purchases', description: 'Multi-item supplier purchases' },
  { to: '/stakeholders', icon: Users, label: 'Suppliers & Vendors', description: 'Business partners' },
  { to: '/orders', icon: ShoppingCart, label: 'Sales', description: 'Vendor sales & fulfilment' },
  { to: '/payments', icon: Wallet, label: 'Payments', description: 'Receipts & outstanding credit' },
  { to: '/reports', icon: BarChart3, label: 'Reports', description: 'Business insights' },
];

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNavItems = navItems.filter(item => (['/purchases','/payments'].includes(item.to) ? isAdmin : true));

  const activeItem = visibleNavItems.find((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
  ) || navItems[0];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-layout">
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-mark" aria-hidden="true">
            <Apple size={21} strokeWidth={2.2} />
          </div>
          <div className="brand-copy">
            <h1>Batloung Farm</h1>
            <span>Distribution Management</span>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-section-label">Workspace</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon"><Icon size={18} strokeWidth={2} /></span>
                <span className="nav-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <ChevronRight className="nav-arrow" size={15} />
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="avatar">
              {user?.full_name ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'PB'}
            </div>
            <div className="sidebar-user-copy">
              <strong>{user?.full_name || 'Public Visitor'}</strong>
              <span>{user?.role || 'Dashboard access'}</span>
            </div>
          </div>

          {user ? (
            <button onClick={handleLogout} className="logout-button">
              <LogOut size={17} />
              <span>Sign out</span>
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="logout-button">
              <CircleUserRound size={17} />
              <span>Sign in</span>
            </button>
          )}
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div>
              <span className="topbar-script">Batloung Farm</span>
              <div className="topbar-title">{activeItem.label}</div>
            </div>
          </div>

          <div className="topbar-right">
            <div className="status-indicator">
              <span className="status-dot" />
              System online
            </div>
            <div className="role-pill">
              <span>{user?.role || 'Public'}</span>
            </div>
            <div className="three-dots" aria-hidden="true"><i /><i /><i /></div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
