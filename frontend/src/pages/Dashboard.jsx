import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../services/api';
import FruitBasket from '../components/FruitBasket';
import {
  Apple, Users, Store, Package, ShoppingCart, Clock,
  CheckCircle2, WalletCards, ArrowUpRight, Activity, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const CHART_COLORS = ['#0c4a28', '#2f8f3e', '#8fc84a', '#f2c230', '#b7c8b8'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <Activity size={28} />
        <h3>Dashboard unavailable</h3>
        <p>We could not load the latest operational data.</p>
      </div>
    );
  }

  const { totals, recentOrders, topFruits, stockByFruit } = data;

  const statusBadge = (status) => {
    const map = {
      Pending: 'badge-yellow',
      Confirmed: 'badge-blue',
      Processing: 'badge-purple',
      'Ready for Collection/Delivery': 'badge-orange',
      Completed: 'badge-green',
      Cancelled: 'badge-red'
    };
    return map[status] || 'badge-gray';
  };

  const stats = [
    { label: 'Total Fruits', value: totals.fruits, icon: Apple },
    { label: 'Suppliers', value: totals.suppliers, icon: Users },
    { label: 'Vendors', value: totals.vendors, icon: Store },
    { label: 'Available Stock', value: totals.availableStock, icon: Package },
    { label: 'Total Orders', value: totals.totalOrders, icon: ShoppingCart },
    { label: 'Pending Orders', value: totals.pendingOrders, icon: Clock },
    { label: 'Completed Orders', value: totals.completedOrders, icon: CheckCircle2 },
    { label: 'Sales Value', value: `M${Number(totals.salesValue).toLocaleString()}`, icon: WalletCards, highlight: true },
  ];

  return (
    <div className="dashboard-page">
      <section className="poster">
        <div className="three-dots poster-top-dots" aria-hidden="true"><i /><i /><i /></div>
        <div className="poster-grid">
          <div className="poster-copy">
            <span className="script-line">Fresh and healthy</span>
            <h1>Batloung Farm</h1>
            <p>Monitor stock, orders, partners and sales from one central workspace.</p>
            <div className="poster-callout">
              <strong>{totals.pendingOrders}</strong>
              <span>Pending orders</span>
            </div>
          </div>
          <div className="poster-art">
            <span className="poster-dots d1" aria-hidden="true" />
            <FruitBasket />
          </div>
          <span className="poster-dots d2" aria-hidden="true" />
        </div>
        <div className="poster-foot">
          <div className="poster-foot-inner">
            <Link to="/orders" className="poster-cta">New sale</Link>
            <div className="poster-contact">
              <div>
                <small>Total sales value</small>
                <strong>M{Number(totals.salesValue).toLocaleString()}</strong>
              </div>
              <span className="round"><TrendingUp size={18} /></span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {stats.map(({ label, value, icon: Icon, highlight }) => (
          <article className={`stat-card ${highlight ? 'green' : ''}`} key={label}>
            <div className="stat-top">
              <div className="stat-icon"><Icon size={18} /></div>
              <ArrowUpRight size={16} className="stat-arrow" />
            </div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
          </article>
        ))}
      </section>

      <section className="two-col dashboard-charts">
        <article className="card">
          <div className="card-header">
            <div>
              <span className="card-kicker">Inventory</span>
              <h2>Stock by fruit</h2>
            </div>
            <div className="mini-icon"><Package size={17} /></div>
          </div>
          <div className="card-body chart-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockByFruit || []} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dce6dc" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#eff4ee' }} />
                  <Bar dataKey="available" fill="#0c4a28" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <div>
              <span className="card-kicker">Sales</span>
              <h2>Top selling fruits</h2>
            </div>
            <div className="mini-icon"><Apple size={17} /></div>
          </div>
          <div className="card-body chart-body">
            {topFruits && topFruits.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topFruits}
                      dataKey="total_sold"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={94}
                      innerRadius={52}
                      paddingAngle={2}
                    >
                      {topFruits.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state compact">
                <Apple size={24} />
                <span>No completed sales yet</span>
              </div>
            )}
          </div>
        </article>
      </section>

      <article className="card orders-card">
        <div className="card-header">
          <div>
            <span className="card-kicker">Activity</span>
            <h2>Recent orders</h2>
          </div>
          <div className="mini-icon"><ShoppingCart size={17} /></div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Vendor</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders?.length > 0 ? recentOrders.map((o) => (
                <tr key={o.order_number}>
                  <td><span className="table-primary">{o.order_number}</span></td>
                  <td>{o.vendor_name}</td>
                  <td>{new Date(o.order_date).toLocaleDateString()}</td>
                  <td><strong>M{Number(o.total_amount).toLocaleString()}</strong></td>
                  <td><span className={`badge ${statusBadge(o.status)}`}>{o.status}</span></td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="empty-state">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
};

export default Dashboard;
