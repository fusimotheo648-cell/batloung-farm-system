import { useState, useEffect } from 'react';
import { getFruits, createFruit, updateFruit, deleteFruit, getProducts, getBoxSizes, createBoxSize, updateBoxSize, deleteBoxSize, createProduct, updateProduct } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const Inventory = () => {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('fruits');
  const [fruits, setFruits] = useState([]);
  const [products, setProducts] = useState([]);
  const [boxSizes, setBoxSizes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [f, p, b] = await Promise.all([
        getFruits({ search }),
        getProducts({ search }),
        getBoxSizes({ search })
      ]);
      setFruits(f.data.data);
      setProducts(p.data.data);
      setBoxSizes(b.data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const openModal = (type, item = null) => {
    setError('');
    if (type === 'fruit') {
      setForm(item || { name: '', description: '' });
    } else {
      setForm(item || (type === 'boxsize' ? { name: '', description: '' } : { fruit_id: '', box_size_id: '', selling_price: '', quantity_per_box: 1 }));
    }
    setModal({ type, item });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (modal.type === 'fruit') {
        if (modal.item) await updateFruit(modal.item.id, form);
        else await createFruit(form);
      } else if (modal.type === 'boxsize') {
        if (modal.item) await updateBoxSize(modal.item.id, form);
        else await createBoxSize(form);
      } else {
        if (modal.item) await updateProduct(modal.item.id, form);
        else await createProduct(form);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this fruit?')) return;
    try {
      await deleteFruit(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleDeleteBoxSize = async (id) => {
    if (!confirm('Delete/deactivate this box size?')) return;
    try {
      await deleteBoxSize(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <PageHeader kicker="Fresh and healthy" title="Fruits & Products" subtitle="Fruits, box sizes and the products they make up." />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button className={`btn ${tab === 'fruits' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('fruits')}>Fruits</button>
        <button className={`btn ${tab === 'products' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('products')}>Products (Fruit + Box Size)</button>
        <button className={`btn ${tab === 'boxsizes' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('boxsizes')}>Box Sizes</button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>{tab === 'fruits' ? 'Fruits' : tab === 'products' ? 'Products' : 'Box Sizes'}</h2>
          <div className="search-bar">
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
              <input
                style={{ paddingLeft: 32 }}
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {isAdmin && tab === 'fruits' && (
              <button className="btn btn-primary btn-sm" onClick={() => openModal('fruit')}>
                <Plus size={16} /> Add Fruit
              </button>
            )}
            {isAdmin && tab === 'products' && (
              <button className="btn btn-primary btn-sm" onClick={() => openModal('product')}>
                <Plus size={16} /> Add Product
              </button>
            )}
            {isAdmin && tab === 'boxsizes' && (
              <button className="btn btn-primary btn-sm" onClick={() => openModal('boxsize')}>
                <Plus size={16} /> Add Box Size
              </button>
            )}
          </div>
        </div>

        {loading ? <div className="loading">Loading...</div> : (
          <div className="table-wrapper">
            {tab === 'fruits' && (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {fruits.map((f) => (
                    <tr key={f.id}>
                      <td><strong>{f.name}</strong></td>
                      <td>{f.description || '—'}</td>
                      <td><span className={`badge ${f.is_active ? 'badge-green' : 'badge-gray'}`}>{f.is_active ? 'Active' : 'Inactive'}</span></td>
                      {isAdmin && (
                        <td>
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openModal('fruit', f)}><Edit2 size={14} /></button>
                          {' '}
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(f.id)}><Trash2 size={14} /></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'products' && (
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Fruit</th>
                    <th>Box Size</th>
                    <th>Price (M)</th>
                    <th>Stock</th>
                    <th>Status</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.product_name}</strong></td>
                      <td>{p.fruit_name}</td>
                      <td>{p.box_size_name}</td>
                      <td>M{Number(p.selling_price).toFixed(2)}</td>
                      <td>{p.quantity_available ?? 0}</td>
                      <td><span className={`badge ${p.is_active ? 'badge-green' : 'badge-gray'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                      {isAdmin && (
                        <td>
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openModal('product', p)}><Edit2 size={14} /></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'boxsizes' && (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {boxSizes.map((b) => (
                    <tr key={b.id}>
                      <td><strong>{b.name}</strong></td>
                      <td>{b.description}</td>
                      <td><span className={`badge ${b.is_active ? 'badge-green' : 'badge-gray'}`}>{b.is_active ? 'Active' : 'Inactive'}</span></td>
                      {isAdmin && (
                        <td>
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openModal('boxsize', b)}><Edit2 size={14} /></button>{' '}
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteBoxSize(b.id)}><Trash2 size={14} /></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal.item ? 'Edit' : 'Add'} {modal.type === 'fruit' ? 'Fruit' : modal.type === 'boxsize' ? 'Box Size' : 'Product'}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                {modal.type === 'fruit' ? (
                  <>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>Name *</label>
                      <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                    </div>
                  </>
                ) : modal.type === 'boxsize' ? (
                  <>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>Name *</label>
                      <select value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required>
                        <option value="">Select box size</option>
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                    </div>
                  </>
                ) : (
                  <div className="form-grid">
                    {!modal.item && (
                      <>
                        <div className="form-group">
                          <label>Fruit *</label>
                          <select value={form.fruit_id || ''} onChange={(e) => setForm({ ...form, fruit_id: e.target.value })} required>
                            <option value="">Select fruit</option>
                            {fruits.filter(f => f.is_active).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Box Size *</label>
                          <select value={form.box_size_id || ''} onChange={(e) => setForm({ ...form, box_size_id: e.target.value })} required>
                            <option value="">Select size</option>
                            {boxSizes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                    <div className="form-group">
                      <label>Selling Price (M) *</label>
                      <input type="number" step="0.01" min="0.01" value={form.selling_price || ''} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Qty per Box</label>
                      <input type="number" min="1" value={form.quantity_per_box || 1} onChange={(e) => setForm({ ...form, quantity_per_box: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
