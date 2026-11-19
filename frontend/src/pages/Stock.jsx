import { useState, useEffect } from 'react';
import { getStock, getLowStock, recordStock, getSuppliers, getProducts, getPurchases } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const Stock = () => {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('stock');
  const [stock, setStock] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ supplier_id: '', product_id: '', quantity: '', purchase_price: '', purchase_date: '', notes: '' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [s, p, sup, prod, low] = await Promise.all([
        getStock({ search }),
        getPurchases({}),
        getSuppliers({}),
        getProducts({ is_active: 'true' }),
        getLowStock({ threshold: 10 })
      ]);
      setStock(s.data.data);
      setLowStock(low.data.data);
      setPurchases(p.data.data);
      setSuppliers(sup.data.data);
      setProducts(prod.data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await recordStock({
        ...form,
        quantity: Number(form.quantity),
        purchase_price: Number(form.purchase_price) || 0
      });
      setModal(false);
      setForm({ supplier_id: '', product_id: '', quantity: '', purchase_price: '', purchase_date: '', notes: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record stock');
    }
  };

  return (
    <div>
      <PageHeader kicker="Always fresh" title="Stock Management" subtitle="Current stock levels for every product." />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button className={`btn ${tab === 'stock' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('stock')}>Available Stock</button>
        <button className={`btn ${tab === 'purchases' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('purchases')}>Purchase History</button>
      </div>

      {tab === 'stock' && lowStock.length > 0 && (
        <div className="alert alert-error" role="alert" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Low stock (fewer than 10 boxes):</strong>{' '}
            {lowStock.map((l) => `${l.fruit_name} ${l.packaging_size} (${l.quantity_available})`).join(', ')}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>{tab === 'stock' ? 'Current Stock Levels' : 'Incoming Stock / Purchases'}</h2>
          <div className="search-bar">
            {tab === 'stock' && <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />}
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => { setError(''); setModal(true); }}>
                <Plus size={16} /> Record Incoming Stock
              </button>
            )}
          </div>
        </div>

        {loading ? <div className="loading">Loading...</div> : (
          <div className="table-wrapper">
            {tab === 'stock' ? (
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Fruit</th>
                    <th>Box Size</th>
                    <th>Available Qty</th>
                    <th>Unit Price</th>
                    <th>Stock Value</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.product_name}</strong></td>
                      <td>{s.fruit_name}</td>
                      <td>{s.box_size_name}</td>
                      <td>
                        <span className={`badge ${s.quantity_available < 10 ? 'badge-red' : s.quantity_available < 30 ? 'badge-yellow' : 'badge-green'}`}>
                          {s.quantity_available}
                        </span>
                      </td>
                      <td>M{Number(s.selling_price).toFixed(2)}</td>
                      <td>M{(s.quantity_available * s.selling_price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>Province</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Purchase Price</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(p => (
                    <tr key={p.purchase_detail_id || p.id}>
                      <td>{new Date(p.purchase_date).toLocaleDateString()}</td>
                      <td>{p.supplier_name}</td>
                      <td>{p.province_name}</td>
                      <td>{p.fruit_name} — {p.box_size_name}</td>
                      <td>{p.quantity}</td>
                      <td>M{Number(p.purchase_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Incoming Stock</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Supplier *</label>
                    <select value={form.supplier_id} onChange={e => setForm({...form, supplier_id: e.target.value})} required>
                      <option value="">Select supplier</option>
                      {suppliers.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name} ({s.province_name})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Product *</label>
                    <select value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})} required>
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.product_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Quantity *</label>
                    <input type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Purchase Price (per box)</label>
                    <input type="number" step="0.01" min="0" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Purchase Date</label>
                    <input type="date" value={form.purchase_date} onChange={e => setForm({...form, purchase_date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;
