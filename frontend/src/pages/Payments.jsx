import { useEffect, useState } from 'react';
import { getPaymentSummary, getPayments, getVendorBalances, recordPayment } from '../services/api';
import PageHeader from '../components/PageHeader';

export default function Payments() {
  const [outstanding,setOutstanding]=useState([]);
  const [history,setHistory]=useState([]);
  const [balances,setBalances]=useState([]);
  const [selected,setSelected]=useState(null);
  const [method,setMethod]=useState('CASH');
  const [amount,setAmount]=useState('');
  const [reference,setReference]=useState('');
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');
  const [busy,setBusy]=useState(false);
  const load=async()=>{try{const [a,b,c]=await Promise.all([getPaymentSummary(),getPayments(),getVendorBalances()]);setOutstanding(a.data.data);setHistory(b.data.data);setBalances(c.data.data);}catch(e){setError(e.response?.data?.message||'Could not load payments.');}};
  useEffect(()=>{load();},[]);
  const submit=async(e)=>{e.preventDefault();if(!selected)return;setError('');setSuccess('');setBusy(true);
    try{const response=await recordPayment(selected.sale_id,{payment_method:method,amount:method==='CREDIT'?0:Number(amount),reference_number:reference});
      setSuccess(`Payment recorded. Status: ${response.data.data.payment_status}; outstanding: M${Number(response.data.data.outstanding_balance).toFixed(2)}.`);
      setSelected(null);setAmount('');setReference('');await load();
    }catch(err){setError(err.response?.data?.message||'Payment could not be recorded.');}
    finally{setBusy(false);}
  };
  return <div>
    <PageHeader kicker="Fair and simple" title="Vendor Payments" subtitle="Record cash and mobile-money receipts, or mark a sale as credit (unpaid)." />
    {error&&<div className="alert alert-error">{error}</div>}{success&&<div className="alert alert-success">{success}</div>}
    <div className="card"><div className="card-header"><h2>Outstanding vendor balances</h2></div><div className="table-wrapper"><table><thead><tr><th>Sale</th><th>Vendor</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th><th></th></tr></thead><tbody>{outstanding.map(row=><tr key={row.sale_id}><td>{row.order_number}</td><td>{row.vendor_name}</td><td>M{Number(row.total_amount).toFixed(2)}</td><td>M{Number(row.amount_paid).toFixed(2)}</td><td><strong>M{Number(row.outstanding_balance).toFixed(2)}</strong></td><td><span className={`badge ${row.payment_status==='UNPAID'?'badge-red':'badge-yellow'}`}>{row.payment_status}</span></td><td><button className="btn btn-primary btn-sm" onClick={()=>{setSelected(row);setMethod('CASH');setAmount(Number(row.outstanding_balance).toFixed(2));}}>Record payment</button></td></tr>)}</tbody></table>{!outstanding.length&&<p className="empty-state">No outstanding balances.</p>}</div></div>
    <div className="card" style={{marginTop:'1rem'}}><div className="card-header"><h2>Outstanding balance by vendor</h2></div><div className="table-wrapper"><table><thead><tr><th>Vendor</th><th>Total sales</th><th>Total paid</th><th>Outstanding balance</th></tr></thead><tbody>{balances.map(v=><tr key={v.vendor_id}><td>{v.vendor_name}{v.business_name?` (${v.business_name})`:''}</td><td>M{Number(v.total_sales).toFixed(2)}</td><td>M{Number(v.total_paid).toFixed(2)}</td><td><strong>M{Number(v.outstanding_balance).toFixed(2)}</strong></td></tr>)}</tbody></table>{!balances.length&&<p className="empty-state">No vendors have outstanding balances.</p>}</div></div>
    {selected&&<div className="card" style={{marginTop:'1rem'}}><div className="card-header"><h2>Record payment – {selected.order_number}</h2></div><form onSubmit={submit}><div className="modal-body"><div className="form-grid"><div className="form-group"><label>Payment method</label><select value={method} onChange={e=>{setMethod(e.target.value);setAmount(e.target.value==='CREDIT'?'0':Number(selected.outstanding_balance).toFixed(2));}}><option value="CASH">Cash</option><option value="MOBILE_MONEY">Mobile money</option><option value="CREDIT">Outstanding / credit</option></select></div><div className="form-group"><label>Amount received (M)</label><input type="number" min="0" step="0.01" required disabled={method==='CREDIT'} value={amount} onChange={e=>setAmount(e.target.value)}/></div><div className="form-group"><label>Reference (optional)</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Mobile money reference"/></div></div>{method==='CREDIT'&&<p className="alert alert-info">No money is received. The sale remains UNPAID and the full amount stays outstanding.</p>}</div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={()=>setSelected(null)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy?'Saving...':'Save payment'}</button></div></form></div>}
    <div className="card" style={{marginTop:'1rem'}}><div className="card-header"><h2>Payment history</h2></div><div className="table-wrapper"><table><thead><tr><th>Date</th><th>Sale</th><th>Vendor</th><th>Method</th><th>Amount</th><th>Reference</th></tr></thead><tbody>{history.map(p=><tr key={p.id}><td>{new Date(p.payment_date).toLocaleString()}</td><td>{p.order_number}</td><td>{p.vendor_name}</td><td>{p.payment_method.replace('_',' ')}</td><td>M{Number(p.amount).toFixed(2)}</td><td>{p.reference_number||'—'}</td></tr>)}</tbody></table></div></div>
  </div>;
}
