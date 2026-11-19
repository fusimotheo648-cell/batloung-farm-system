import { useState, useEffect } from 'react';
import { getOrders, getOrder, createOrder, updateOrder, getVendors, getProducts } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Eye } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Ready for Collection/Delivery', 'Completed', 'Cancelled'];

const statusBadge = (s) => {
  const map = {
    Pending: 'badge-yellow', Confirmed: 'badge-blue', Processing: 'badge-purple',
    'Ready for Collection/Delivery': 'badge-orange', Completed: 'badge-green', Cancelled: 'badge-red'
  };
  return map[s] || 'badge-gray';
};

const Orders = () => {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'create' | 'view' | 'status'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ vendor_id: '', items: [{ product_id: '', quantity: 1 }], notes: '' });
  const [error, setError] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [o, v, p] = await Promise.all([
        getOrders({ search, status: statusFilter || undefined }),
        getVendors({ status: 'Active' }),
        getProducts({ is_active: 'true' })
      ]);
      setOrders(o.data.data);
      setVendors(v.data.data);
      setProducts(p.data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const openCreate = () => {
    setError('');
    setForm({ vendor_id: '', items: [{ product_id: '', quantity: 1 }], notes: '' });
    setModal('create');
  };

  const openView = async (id) => {
    try {
      const res = await getOrder(id);
      setSelected(res.data.data);
      setModal('view');
    } catch (e) { alert('Failed to load order'); }
  };

  const openStatus = (order) => {
    setSelected(order);
    setNewStatus(order.status);
    setModal('status');
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', quantity: 1 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createOrder({
        vendor_id: form.vendor_id,
        items: form.items.map(it => ({ product_id: Number(it.product_id), quantity: Number(it.quantity) })),
        notes: form.notes
      });
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order');
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await updateOrder(selected.id, { status: newStatus });
      setModal(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div>
      <PageHeader kicker="Ready to deliver" title="Order Management" subtitle="Create and track vendor sales." />

      <div className="card">
        <div className="card-header">
          <h2>Orders</h2>
          <div className="search-bar">
            <input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={16} /> New Order</button>
          </div>
        </div>

        {loading ? <div className="loading">Loading...</div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state">No orders found</td></tr>
                ) : orders.map(o => (
                  <tr key={o.id}>
                    <td><strong>{o.order_number}</strong></td>
                    <td>{o.vendor_name}</td>
                    <td>{new Date(o.order_date).toLocaleDateString()}</td>
                    <td>M{Number(o.total_amount).toLocaleString()}</td>
                    <td><span className={`badge ${statusBadge(o.status)}`}>{o.status}</span></td>
                    <td>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openView(o.id)} title="View"><Eye size={14} /></button>{' '}
                      <button className="btn btn-secondary btn-sm" onClick={() => openStatus(o)}>Status</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {modal === 'create' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Order</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Street Vendor *</label>
                  <select value={form.vendor_id} onChange={e => setForm({...form, vendor_id: e.target.value})} required>
                    <option value="">Select vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.vendor_id} — {v.vendor_name}</option>)}
                  </select>
                </div>

                <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Order Items *</label>
                {form.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 2 }}>
                      <label>Product</label>
                      <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)} required>
                        <option value="">Select product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.product_name} — M{Number(p.selling_price).toFixed(2)} (Stock: {p.quantity_available})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Qty</label>
                      <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} required />
                    </div>
                    {form.items.length > 1 && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem} style={{ marginBottom: '1rem' }}>+ Add Item</button>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {modal === 'view' && selected && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order {selected.order_number}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>Vendor:</strong> {selected.vendor_name} ({selected.vendor_code})</p>
              <p><strong>Date:</strong> {new Date(selected.order_date).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span className={`badge ${statusBadge(selected.status)}`}>{selected.status}</span></p>
              <p><strong>Total:</strong> M{Number(selected.total_amount).toLocaleString()}</p>
              <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />
              <table>
                <thead>
                  <tr><th>Fruit</th><th>Box Size</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                  {selected.items?.map(it => (
                    <tr key={it.id}>
                      <td>{it.fruit_name}</td>
                      <td>{it.box_size_name}</td>
                      <td>{it.quantity}</td>
                      <td>M{Number(it.unit_price).toFixed(2)}</td>
                      <td>M{Number(it.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {modal === 'status' && selected && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Status — {selected.order_number}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>New Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                Note: Stock is deducted atomically when the sale is created. Cancelling an uncompleted order restores the reserved stock.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStatusUpdate}>Update Status</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
