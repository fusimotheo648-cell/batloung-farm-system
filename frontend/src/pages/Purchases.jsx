import { useEffect, useMemo, useState } from 'react';
import { createPurchase, getProducts, getSuppliers, getPurchases } from '../services/api';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const emptyItem = { product_id:'', quantity:'', unit_cost:'' };
export default function Purchases() {
  const [suppliers,setSuppliers]=useState([]);
  const [products,setProducts]=useState([]);
  const [rows,setRows]=useState([]);
  const [supplierId,setSupplierId]=useState('');
  const [purchaseDate,setPurchaseDate]=useState(new Date().toISOString().slice(0,10));
  const [items,setItems]=useState([{...emptyItem}]);
  const [notes,setNotes]=useState('');
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');
  const [busy,setBusy]=useState(false);
  const total=useMemo(()=>items.reduce((sum,x)=>sum+(Number(x.quantity)||0)*(Number(x.unit_cost)||0),0),[items]);
  const load=async()=>{try{const [s,p,h]=await Promise.all([getSuppliers({is_active:'true'}),getProducts({is_active:'true'}),getPurchases({})]);setSuppliers(s.data.data);setProducts(p.data.data);setRows(h.data.data);}catch(e){setError(e.response?.data?.message||'Unable to load purchase data.');}};
  useEffect(()=>{load();},[]);
  const change=(i,key,value)=>setItems(old=>old.map((x,n)=>n===i?{...x,[key]:value}:x));
  const submit=async(e)=>{e.preventDefault();setError('');setSuccess('');setBusy(true);
    try{
      await createPurchase({supplier_id:Number(supplierId),purchase_date:purchaseDate,notes,items:items.map(x=>({product_id:Number(x.product_id),quantity:Number(x.quantity),unit_cost:Number(x.unit_cost)}))});
      setSuccess('Purchase saved successfully. All matching stock balances have been increased.');
      setItems([{...emptyItem}]);setNotes('');await load();
    }catch(err){setError(err.response?.data?.message||'Purchase could not be saved.');}
    finally{setBusy(false);}
  };
  return <div>
    <PageHeader kicker="Picked with care" title="Purchase Management" subtitle="Record one supplier purchase containing multiple fruit and packaging items." />
    <div className="card">
      <div className="card-header"><h2>Record a purchase</h2></div>
      <form onSubmit={submit}>
        <div className="modal-body">
          {error&&<div className="alert alert-error">{error}</div>}{success&&<div className="alert alert-success">{success}</div>}
          <div className="form-grid">
            <div className="form-group"><label>Supplier *</label><select required value={supplierId} onChange={e=>setSupplierId(e.target.value)}><option value="">Select supplier</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div className="form-group"><label>Purchase date *</label><input type="date" required value={purchaseDate} onChange={e=>setPurchaseDate(e.target.value)}/></div>
          </div>
          <h3>Purchase items</h3>
          {items.map((item,i)=><div className="form-grid" key={i} style={{alignItems:'end',marginBottom:'1rem'}}>
            <div className="form-group"><label>Fruit / packaging *</label><select required value={item.product_id} onChange={e=>change(i,'product_id',e.target.value)}><option value="">Select product</option>{products.map(p=><option key={p.id} value={p.id}>{p.product_name}</option>)}</select></div>
            <div className="form-group"><label>Boxes *</label><input type="number" min="1" step="1" required value={item.quantity} onChange={e=>change(i,'quantity',e.target.value)}/></div>
            <div className="form-group"><label>Unit cost (M) *</label><input type="number" min="0" step="0.01" required value={item.unit_cost} onChange={e=>change(i,'unit_cost',e.target.value)}/></div>
            <button type="button" className="btn btn-danger btn-sm" disabled={items.length===1} onClick={()=>setItems(old=>old.filter((_,n)=>n!==i))}><Trash2 size={15}/></button>
          </div>)}
          <button type="button" className="btn btn-secondary btn-sm" onClick={()=>setItems(old=>[...old,{...emptyItem}])}><Plus size={15}/> Add another item</button>
          <div className="form-group" style={{marginTop:'1rem'}}><label>Notes</label><textarea rows="2" value={notes} onChange={e=>setNotes(e.target.value)}/></div>
          <h3 style={{textAlign:'right'}}>Automatically calculated total: M{total.toFixed(2)}</h3>
        </div>
        <div className="modal-footer"><button className="btn btn-primary" disabled={busy}>{busy?'Saving...':'Save purchase and update stock'}</button></div>
      </form>
    </div>
    <div className="card" style={{marginTop:'1.25rem'}}><div className="card-header"><h2>Purchase history</h2></div><div className="table-wrapper"><table><thead><tr><th>Date</th><th>Supplier</th><th>Province</th><th>Fruit / box</th><th>Boxes</th><th>Unit cost</th><th>Purchase total</th></tr></thead><tbody>{rows.map(r=><tr key={r.purchase_detail_id}><td>{new Date(r.purchase_date).toLocaleDateString()}</td><td>{r.supplier_name}</td><td>{r.province_name}</td><td>{r.fruit_name} – {r.box_size_name}</td><td>{r.quantity}</td><td>M{Number(r.purchase_price).toFixed(2)}</td><td>M{Number(r.purchase_total).toFixed(2)}</td></tr>)}</tbody></table></div></div>
  </div>;
}
