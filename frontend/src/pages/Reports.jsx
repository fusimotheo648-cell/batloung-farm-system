import { useState } from 'react';
import {
  getAvailableStockReport, getSalesByFruit, getSalesByBoxSize,
  getSalesByVendor, getPurchasesByProvince, getPendingOrdersReport,
  getCompletedOrdersReport, getSalesByDate,
  getTopFiveFruits, getTotalSalesReport, getTopVendorByBoxes, getStockByPackaging
} from '../services/api';
import PageHeader from '../components/PageHeader';

const REPORTS = [
  { id: 'stock', label: 'Available Stock Report', fn: getAvailableStockReport },
  { id: 'sales-fruit', label: 'Sales by Fruit', fn: getSalesByFruit },
  { id: 'sales-box', label: 'Sales by Box Size', fn: getSalesByBoxSize },
  { id: 'sales-vendor', label: 'Sales by Street Vendor', fn: getSalesByVendor },
  { id: 'purchases-province', label: 'Purchases by Province', fn: getPurchasesByProvince },
  { id: 'pending', label: 'Pending Orders', fn: getPendingOrdersReport },
  { id: 'completed', label: 'Completed Orders', fn: getCompletedOrdersReport },
  { id: 'sales-date', label: 'Total Sales by Date', fn: getSalesByDate },
  { id: 'required-top-fruits', label: 'Required: Five Most Frequently Sold Fruits', fn: getTopFiveFruits },
  { id: 'required-top-vendor', label: 'Required: Vendor with Most Boxes', fn: getTopVendorByBoxes },
  { id: 'required-stock-packaging', label: 'Required: Stock by Fruit & Packaging', fn: getStockByPackaging },
];

const Reports = () => {
  const [active, setActive] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [fromDate, setFromDate] = useState('2026-11-01');
  const [toDate, setToDate] = useState('2026-11-15');
  const [summary, setSummary] = useState(null);

  const runReport = async (report) => {
    setLoading(true);
    setActive(report.id);
    setTitle(report.label);
    setSummary(null);
    try {
      const res = await report.fn();
      const payload = res.data;
      setData(Array.isArray(payload.data) ? payload : { ...payload, data: payload.data ? [payload.data] : [] });
    } catch (e) {
      console.error(e);
      setData(null);
    }
    setLoading(false);
  };

  const runRevenue = async () => {
    setLoading(true); setActive('required-revenue'); setTitle('Required: Total Sales Revenue for Date Range'); setSummary(null);
    try { const res = await getTotalSalesReport({ from_date: fromDate, to_date: toDate }); setSummary(res.data.data); setData({ data: [] }); }
    catch (e) { setData(null); setSummary(null); alert(e.response?.data?.message || 'Could not generate revenue report.'); }
    finally { setLoading(false); }
  };

  const renderTable = () => {
    if (!data?.data?.length) return <div className="empty-state">No data available for this report</div>;

    const keys = Object.keys(data.data[0]).filter(k => k !== 'id');
    return (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>{keys.map(k => <th key={k}>{k.replace(/_/g, ' ')}</th>)}</tr>
          </thead>
          <tbody>
            {data.data.map((row, i) => (
              <tr key={i}>
                {keys.map(k => (
                  <td key={k}>
                    {typeof row[k] === 'number' && k.toLowerCase().includes('sales') || k.toLowerCase().includes('amount') || k.toLowerCase().includes('value') || k.toLowerCase().includes('price')
                      ? `M${Number(row[k]).toLocaleString()}`
                      : row[k] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <PageHeader kicker="Numbers that grow" title="Reports" subtitle="Pick a report to run." />

      <div className="card" style={{marginBottom:'1rem'}}>
        <div className="card-header"><h2>Required revenue report</h2></div>
        <div className="form-grid">
          <div className="form-group"><label>From date</label><input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}/></div>
          <div className="form-group"><label>To date</label><input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}/></div>
          <div className="form-group" style={{justifyContent:'end'}}><button className="btn btn-primary" onClick={runRevenue}>Generate total revenue</button></div>
        </div>
      </div>
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {REPORTS.map(r => (
          <button
            key={r.id}
            className={`stat-card ${active === r.id ? 'green' : ''}`}
            style={{ cursor: 'pointer', textAlign: 'left', border: active === r.id ? '2px solid var(--primary)' : undefined }}
            onClick={() => runReport(r)}
          >
            <div className="label">{r.label}</div>
          </button>
        ))}
      </div>

      {active && (
        <div className="card">
          <div className="card-header">
            <h2>{title}</h2>
            {data && <span className="badge badge-blue">{data.count} records</span>}
          </div>
          {loading ? <div className="loading">Generating report...</div> : <>{summary && <div className="stats-grid"><div className="stat-card green"><div className="label">Total revenue</div><div className="value">M{Number(summary.total_revenue).toFixed(2)}</div></div><div className="stat-card"><div className="label">Completed sales</div><div className="value">{summary.sales_count}</div></div></div>}{renderTable()}</>}
        </div>
      )}
    </div>
  );
};

export default Reports;
