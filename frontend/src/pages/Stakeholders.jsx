import { useState, useEffect, useMemo } from 'react';
import {
  getSuppliers, createSupplier, updateSupplier, deleteSupplier, getProvinces,
  getVendors, createVendor, updateVendor, deleteVendor
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit2, Trash2, MapPin, ExternalLink, Eye, X, LocateFixed, Navigation } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const toRadians = (degrees) => degrees * Math.PI / 180;
const distanceMeters = (aLat, aLng, bLat, bLng) => {
  const dLat = toRadians(bLat - aLat), dLng = toRadians(bLng - aLng);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(aLat)) * Math.cos(toRadians(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};
const formatDistance = (meters, unit = 'm') => {
  if (meters == null) return '—';
  const value = unit === 'km' ? meters / 1000 : meters;
  return `${unit === 'km' ? value.toFixed(2) : Math.round(value)} ${unit}`;
};
const formatDuration = (seconds, unit = 's') => {
  if (seconds == null) return 'Unavailable';
  const divisors = { s: 1, min: 60, hr: 3600 };
  const value = seconds / divisors[unit];
  return `${unit === 's' ? Math.round(value) : value.toFixed(2)} ${unit}`;
};

const Stakeholders = () => {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('suppliers');
  const [suppliers, setSuppliers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [search, setSearch] = useState('');
  const [vendorSearchExpanded, setVendorSearchExpanded] = useState(false);
  const [filterProvince, setFilterProvince] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [viewRecord, setViewRecord] = useState(null);
  const [sortBy, setSortBy] = useState('distance');
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [timeUnit, setTimeUnit] = useState('min');
  const [travelMode, setTravelMode] = useState('driving');
  const [origin, setOrigin] = useState(null);
  const [startLocation, setStartLocation] = useState('');
  const [locationMessage, setLocationMessage] = useState('Choose your current location or enter a starting place to calculate distance and travel time.');
  const [routeMetrics, setRouteMetrics] = useState({});
  const [calculatingRoutes, setCalculatingRoutes] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, v, p] = await Promise.all([
        getSuppliers({ search, province: filterProvince || undefined }),
        getVendors({ search, status: filterStatus || undefined }),
        getProvinces()
      ]);
      setSuppliers(s.data.data);
      setVendors(v.data.data);
      setProvinces(p.data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    if (!modal || modal.type !== 'vendor') return;
    let cancelled = false;
    const setup = () => {
      if (cancelled || !window.L || !document.getElementById('vendor-map-picker')) return;
      const L = window.L;
      const lat = Number(form.latitude) || -29.3158;
      const lng = Number(form.longitude) || 27.4860;
      const map = L.map('vendor-map-picker').setView([lat, lng], form.latitude && form.longitude ? 16 : 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
      const marker = L.marker([lat, lng]).addTo(map);
      map.on('click', async e => {
        const latitude = e.latlng.lat, longitude = e.latlng.lng;
        marker.setLatLng([latitude, longitude]);
        setForm(prev => ({ ...prev, latitude: latitude.toFixed(7), longitude: longitude.toFixed(7) }));
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          const address = await response.json();
          if (address.display_name) setForm(prev => ({ ...prev, location: address.display_name, latitude: latitude.toFixed(7), longitude: longitude.toFixed(7) }));
        } catch (_) {}
      });
      setTimeout(() => map.invalidateSize(), 150);
      return () => map.remove();
    };
    if (!document.querySelector('link[data-leaflet-css]')) {
      const link = document.createElement('link'); link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; link.dataset.leafletCss = 'true'; document.head.appendChild(link);
    }
    let cleanup;
    if (window.L) cleanup = setup();
    else {
      let script = document.querySelector('script[data-leaflet-js]');
      if (!script) {
        script = document.createElement('script'); script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.dataset.leafletJs = 'true'; document.body.appendChild(script);
      }
      script.addEventListener('load', () => { cleanup = setup(); }, { once: true });
    }
    return () => { cancelled = true; cleanup?.(); };
  }, [modal?.type, modal?.item?.id]);

  useEffect(() => { load(); }, [search, filterProvince, filterStatus, tab]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationMessage('This browser does not support location access. Enter a starting place instead.'); return; }
    setLocationMessage('Requesting your location permission…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setOrigin({ latitude: coords.latitude, longitude: coords.longitude }); setStartLocation('Current location'); setLocationMessage('Using your current location.'); },
      () => setLocationMessage('Location permission was denied or unavailable. Enter a starting place below.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const useManualLocation = async () => {
    const query = startLocation.trim();
    if (!query || query === 'Current location') { setLocationMessage('Enter a starting address, area or landmark first.'); return; }
    setLocationMessage('Finding starting location…');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Location lookup failed');
      const results = await response.json();
      if (!results.length) { setLocationMessage('Could not find that place. Try a more specific address or landmark.'); return; }
      setOrigin({ latitude: Number(results[0].lat), longitude: Number(results[0].lon) });
      setLocationMessage(`Starting point set to ${results[0].display_name}.`);
    } catch (_) { setLocationMessage('Could not look up that location. Check your internet connection or try another place.'); }
  };

  useEffect(() => {
    let cancelled = false;
    const locatedVendors = vendors.filter(v => Number.isFinite(Number(v.latitude)) && Number.isFinite(Number(v.longitude)) && v.latitude !== null && v.longitude !== null);
    if (!origin || tab !== 'vendors' || locatedVendors.length === 0) { setRouteMetrics({}); return undefined; }
    const calculate = async () => {
      setCalculatingRoutes(true);
      const entries = await Promise.all(locatedVendors.map(async vendor => {
        const meters = distanceMeters(origin.latitude, origin.longitude, Number(vendor.latitude), Number(vendor.longitude));
        // 1.25 m/s is an approximate walking speed (4.5 km/h).
        let seconds = travelMode === 'walking' ? meters / 1.25 : null;
        if (travelMode === 'driving') {
          try {
            const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${Number(vendor.longitude)},${Number(vendor.latitude)}?overview=false`;
            const response = await fetch(url);
            const data = await response.json();
            if (response.ok && data.code === 'Ok' && data.routes?.[0]) seconds = data.routes[0].duration;
          } catch (_) { /* retain unavailable route time if the service cannot be reached */ }
        }
        return [vendor.id, { distanceMeters: meters, travelSeconds: seconds }];
      }));
      if (!cancelled) { setRouteMetrics(Object.fromEntries(entries)); setCalculatingRoutes(false); }
    };
    calculate();
    return () => { cancelled = true; };
  }, [vendors, origin, travelMode, tab]);

  const sortedVendors = useMemo(() => [...vendors].map(v => ({ ...v, ...(routeMetrics[v.id] || {}) })).sort((a, b) => {
    const aValue = sortBy.includes('time') ? a.travelSeconds : a.distanceMeters;
    const bValue = sortBy.includes('time') ? b.travelSeconds : b.distanceMeters;
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    return sortBy === 'farthest' || sortBy === 'longest-time' ? bValue - aValue : aValue - bValue;
  }), [vendors, routeMetrics, sortBy]);

  const openModal = (type, item = null) => {
    setError('');
    if (type === 'supplier') {
      setForm(item || { name: '', province_id: '', contact_person: '', telephone: '', email: '', physical_address: '' });
    } else {
      setForm(item || { vendor_name: '', business_name: '', telephone: '', location: '', latitude: '', longitude: '', status: 'Active' });
    }
    setModal({ type, item });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (modal.type === 'supplier') {
        if (modal.item) await updateSupplier(modal.item.id, form);
        else await createSupplier(form);
      } else {
        if (modal.item) await updateVendor(modal.item.id, form);
        else await createVendor(form);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm(type === 'supplier'
      ? 'Delete this supplier? (A supplier that already has purchases cannot be deleted and can be deactivated instead.)'
      : 'Deactivate this vendor?')) return;
    try {
      if (type === 'supplier') await deleteSupplier(id);
      else await deleteVendor(id);
      load();
    } catch (err) {
      const message = err.response?.data?.message || 'Delete failed';
      // Business rule: suppliers with purchase history are kept, so offer to deactivate them.
      if (type === 'supplier' && err.response?.status === 409 && confirm(`${message}\n\nDeactivate this supplier instead?`)) {
        try { await updateSupplier(id, { is_active: false }); load(); } catch (e2) { alert(e2.response?.data?.message || 'Deactivation failed'); }
      } else if (!(type === 'supplier' && err.response?.status === 409)) {
        alert(message);
      }
    }
  };

  return (
    <div>
      <PageHeader kicker="Partners we grow with" title="Suppliers & Street Vendors" subtitle="Your suppliers and street vendors in one place." />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button className={`btn ${tab === 'suppliers' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('suppliers')}>Suppliers</button>
        <button className={`btn ${tab === 'vendors' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('vendors')}>Street Vendors</button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>{tab === 'suppliers' ? 'Suppliers' : 'Street Vendors'}</h2>
          <div className="search-bar">
            {tab === 'vendors' && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                aria-expanded={vendorSearchExpanded}
                aria-controls="vendor-search-panel"
                onClick={() => setVendorSearchExpanded(open => !open)}
              >
                <Search size={16} /> {vendorSearchExpanded ? 'Hide Search & Filters' : 'Search & Filters'}
              </button>
            )}
            {(tab === 'suppliers' || vendorSearchExpanded) && (
              <input placeholder={tab === 'vendors' ? 'Search vendors by name or location...' : 'Search suppliers...'} value={search} onChange={(e) => setSearch(e.target.value)} />
            )}
            {tab === 'suppliers' && (
              <select value={filterProvince} onChange={(e) => setFilterProvince(e.target.value)}>
                <option value="">All Provinces</option>
                {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            )}
            {tab === 'vendors' && vendorSearchExpanded && (
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            )}
            {(isAdmin || tab === 'vendors') && (
              <button className="btn btn-primary btn-sm" onClick={() => openModal(tab === 'suppliers' ? 'supplier' : 'vendor')}>
                <Plus size={16} /> Add {tab === 'suppliers' ? 'Supplier' : 'Vendor'}
              </button>
            )}
          </div>
          {tab === 'vendors' && vendorSearchExpanded && (
            <div id="vendor-search-panel" className="vendor-search-panel">
              <div className="vendor-filter-grid">
                <label className="vendor-filter-field">
                  <span>Sort vendors by</span>
                  <select aria-label="Sort vendors by distance or travel time" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="distance">Nearest Distance (shortest to longest)</option>
                  <option value="farthest">Farthest Distance (longest to shortest)</option>
                  <option value="time">Shortest Travel Time (shortest to longest)</option>
                  <option value="longest-time">Longest Travel Time (longest to shortest)</option>
                  </select>
                </label>
                <label className="vendor-filter-field">
                  <span>Travel mode</span>
                  <select aria-label="Travel mode" value={travelMode} onChange={e => setTravelMode(e.target.value)}>
                  <option value="driving">Driving</option>
                  <option value="walking">Walking (estimated)</option>
                  </select>
                </label>
                <label className="vendor-filter-field">
                  <span>Distance unit</span>
                  <select aria-label="Distance unit" value={distanceUnit} onChange={e => setDistanceUnit(e.target.value)}>
                    <option value="km">Kilometres (km)</option>
                    <option value="m">Metres (m)</option>
                  </select>
                </label>
                <label className="vendor-filter-field">
                  <span>Travelling time unit</span>
                  <select aria-label="Travelling time unit" value={timeUnit} onChange={e => setTimeUnit(e.target.value)}>
                    <option value="s">Seconds (s)</option>
                    <option value="min">Minutes (min)</option>
                    <option value="hr">Hours (h)</option>
                  </select>
                </label>
                <div className="vendor-filter-actions">
                  <button type="button" className="btn btn-secondary" onClick={useCurrentLocation}><LocateFixed size={15} /> Use my location</button>
                </div>
              </div>
              <div className="vendor-origin-row">
                <label className="vendor-filter-field vendor-origin-field">
                  <span>Starting location</span>
                  <input aria-label="Starting location" placeholder="Enter a place, e.g. Maseru Mall" value={startLocation === 'Current location' ? '' : startLocation} onChange={e => setStartLocation(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); useManualLocation(); } }} />
                </label>
                <button type="button" className="btn btn-primary" onClick={useManualLocation}><Navigation size={15} /> Set starting place</button>
              </div>
              <small className="vendor-filter-help">{locationMessage} {origin && 'Distance is straight-line distance; driving time uses route estimates and walking time is approximate.'} {calculatingRoutes && 'Calculating vendor routes…'}</small>
            </div>
          )}
        </div>

        {loading ? <div className="loading">Loading...</div> : (
          <div className="table-wrapper">
            {tab === 'suppliers' ? (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Province</th>
                    <th>Contact</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.province_name}</td>
                      <td>{s.contact_person}</td>
                      <td>{s.email || '—'}</td>
                      <td><span className={`badge ${s.is_active ? 'badge-green' : 'badge-gray'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => setViewRecord({ type: 'supplier', item: s })}><Eye size={14} /> View</button>{' '}
                        {isAdmin && <><button className="btn btn-secondary btn-sm btn-icon" title="Edit supplier" onClick={() => openModal('supplier', s)}><Edit2 size={14} /></button>{' '}
                        <button className="btn btn-danger btn-sm btn-icon" title="Delete / deactivate supplier" onClick={() => handleDelete('supplier', s.id)}><Trash2 size={14} /></button></>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Vendor ID</th>
                    <th>Name</th>
                    <th>Business</th>
                    <th>Location</th>
                    <th>Distance</th>
                    <th>Travel Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVendors.map(v => (
                    <tr key={v.id}>
                      <td><strong>{v.vendor_id}</strong></td>
                      <td>{v.vendor_name}</td>
                      <td>{v.business_name || '—'}</td>
                      <td>{v.location}{v.latitude != null && v.longitude != null && <div style={{ marginTop: 4 }}><a href={`https://www.google.com/maps?q=${v.latitude},${v.longitude}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary, #2563eb)', fontSize: 12 }}><MapPin size={12} style={{ verticalAlign: 'middle' }} /> View map</a></div>}</td>
                      <td>{origin ? formatDistance(v.distanceMeters, distanceUnit) : 'Set starting point'}</td>
                      <td>{origin ? formatDuration(v.travelSeconds, timeUnit) : 'Set starting point'}</td>
                      <td><span className={`badge ${v.status === 'Active' ? 'badge-green' : v.status === 'Suspended' ? 'badge-red' : 'badge-gray'}`}>{v.status}</span></td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => setViewRecord({ type: 'vendor', item: v })}><Eye size={14} /> View</button>{' '}
                        <button className="btn btn-secondary btn-sm btn-icon" title="Edit vendor" onClick={() => openModal('vendor', v)}><Edit2 size={14} /></button>
                        {isAdmin && <>{' '}<button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete('vendor', v.id)}><Trash2 size={14} /></button></>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {viewRecord && (
        <div className="modal-overlay" onClick={() => setViewRecord(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{viewRecord.type === 'supplier' ? 'Supplier Details' : 'Street Vendor Details'}</h3><button className="btn btn-secondary btn-sm" onClick={() => setViewRecord(null)}><X size={16} /></button></div>
            <div className="modal-body">
              {viewRecord.type === 'vendor' && (
                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label htmlFor="vendor-distance-unit">Distance unit</label>
                    <select id="vendor-distance-unit" value={distanceUnit} onChange={e => setDistanceUnit(e.target.value)}>
                      <option value="km">Kilometres (km)</option>
                      <option value="m">Metres (m)</option>
                    </select>
                    <div style={{ marginTop: 6, fontWeight: 600 }}>{origin ? formatDistance(viewRecord.item.distanceMeters, distanceUnit) : 'Set a starting point to calculate'}</div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="vendor-time-unit">Travelling time unit</label>
                    <select id="vendor-time-unit" value={timeUnit} onChange={e => setTimeUnit(e.target.value)}>
                      <option value="s">Seconds (s)</option>
                      <option value="min">Minutes (min)</option>
                      <option value="hr">Hours (h)</option>
                    </select>
                    <div style={{ marginTop: 6, fontWeight: 600 }}>{origin ? formatDuration(viewRecord.item.travelSeconds, timeUnit) : 'Set a starting point to calculate'}</div>
                  </div>
                </div>
              )}
              <div className="form-grid">
                {Object.entries(viewRecord.item).filter(([key, value]) => value !== null && value !== undefined && value !== '' && !['distanceMeters', 'travelSeconds'].includes(key)).map(([key, value]) => (
                  <div className="form-group" key={key}><label>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label><div style={{ overflowWrap: 'anywhere' }}>{String(value)}</div></div>
                ))}
              </div>
              {viewRecord.type === 'vendor' && viewRecord.item.latitude != null && viewRecord.item.longitude != null && <a className="btn btn-primary" style={{ marginTop: 12 }} href={`https://www.google.com/maps?q=${viewRecord.item.latitude},${viewRecord.item.longitude}`} target="_blank" rel="noreferrer"><MapPin size={15} /> View location in Google Maps</a>}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setViewRecord(null)}>Close</button></div>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal.item ? 'Edit' : 'Add'} {modal.type === 'supplier' ? 'Supplier' : 'Street Vendor'}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                {modal.type === 'supplier' ? (
                  <div className="form-grid">
                    <div className="form-group"><label>Name *</label><input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                    <div className="form-group">
                      <label>Province *</label>
                      <select value={form.province_id || ''} onChange={e => setForm({...form, province_id: e.target.value})} required>
                        <option value="">Select province</option>
                        {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label>Contact Person *</label><input value={form.contact_person || ''} onChange={e => setForm({...form, contact_person: e.target.value})} required /></div>
                    <div className="form-group"><label>Telephone *</label><input value={form.telephone || ''} onChange={e => setForm({...form, telephone: e.target.value})} required /></div>
                    <div className="form-group"><label>Email</label><input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} /></div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Physical Address *</label><textarea value={form.physical_address || ''} onChange={e => setForm({...form, physical_address: e.target.value})} required rows={2} /></div>
                  </div>
                ) : (
                  <div className="form-grid">
                    <div className="form-group"><label>Vendor Name *</label><input value={form.vendor_name || ''} onChange={e => setForm({...form, vendor_name: e.target.value})} required /></div>
                    <div className="form-group"><label>Business Name</label><input value={form.business_name || ''} onChange={e => setForm({...form, business_name: e.target.value})} /></div>
                    <div className="form-group"><label>Telephone *</label><input value={form.telephone || ''} onChange={e => setForm({...form, telephone: e.target.value})} required /></div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label><MapPin size={14} style={{ verticalAlign: 'middle' }} /> Street address / area / landmark *</label>
                      <input placeholder="e.g. Main North 1, Maseru or Pitso Ground" value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})} required />
                      <small style={{ display: 'block', color: '#64748b', marginTop: 5 }}>Enter the vendor's street, area or nearby landmark. The map preview updates as you type.</small>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                        <label style={{ margin: 0 }}>Pin vendor location on map</label>
                        {form.latitude && form.longitude && <a href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><ExternalLink size={14} /> Open pin in Google Maps</a>}
                      </div>
                      <div id="vendor-map-picker" style={{ height: 280, width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, zIndex: 0 }} />
                      <small style={{ display: 'block', color: '#64748b', marginTop: 6 }}>Click the map to place the pin. Latitude and longitude will fill automatically. The selected coordinates can then be opened in Google Maps.</small>
                    </div>
                    <div className="form-group"><label>Latitude</label><input type="number" step="any" min="-90" max="90" placeholder="e.g. -29.3158" value={form.latitude ?? ''} onChange={e => setForm({...form, latitude: e.target.value})} /></div>
                    <div className="form-group"><label>Longitude</label><input type="number" step="any" min="-180" max="180" placeholder="e.g. 27.4860" value={form.longitude ?? ''} onChange={e => setForm({...form, longitude: e.target.value})} /></div>
                    {modal.item && (
                      <div className="form-group">
                        <label>Status</label>
                        <select value={form.status || 'Active'} onChange={e => setForm({...form, status: e.target.value})}>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>
                    )}
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

export default Stakeholders;
