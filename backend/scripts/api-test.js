/**
 * End-to-end API check for the DIWA2110 take-home test.
 *   1. start the API:        npm start
 *   2. in another terminal:  npm test      (or: node scripts/api-test.js http://localhost:5000)
 * It runs against the sample data from `npm run seed` and prints PASS / FAIL for each requirement.
 */
const BASE = (process.argv[2] || process.env.API_URL || 'http://localhost:5000').replace(/\/+$/, '').replace(/\/api$/, '') + '/api';
let token = '';
let pass = 0, fail = 0;

const call = async (method, path, body, auth = token) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch (_) { /* no body */ }
  return { status: res.status, json };
};
const check = (name, ok, extra = '') => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + extra}`);
};
const stockOf = async (fruit, size) => {
  const r = await call('GET', '/stock');
  return r.json.data.find((s) => s.fruit_name === fruit && s.packaging_size === size).quantity_available;
};
const section = (t) => console.log(`\n== ${t} ==`);

(async () => {
  const stamp = Date.now().toString().slice(-6);

  section('Authentication and RBAC');
  let r = await call('POST', '/auth/login', { username: 'admin', password: 'wrong' }, '');
  check('Wrong password -> 401', r.status === 401, r.status);
  r = await call('POST', '/auth/login', { username: 'admin', password: 'admin123' }, '');
  check('Admin login -> 200 + token', r.status === 200 && !!r.json.token, r.status);
  token = r.json.token;
  r = await call('GET', '/suppliers', null, '');
  check('No token -> 401', r.status === 401, r.status);
  const sales = await call('POST', '/auth/login', { username: 'sales1', password: 'sales123' }, '');
  r = await call('POST', '/suppliers', { name: 'x' }, sales.json.token);
  check('Sales role cannot create supplier -> 403', r.status === 403, r.status);

  section('Supplier management');
  r = await call('POST', '/suppliers', { name: `Test Supplier ${stamp}`, province_id: 3, contact_person: 'Test Person', telephone: '+27 11 555 9999', email: 'test@supplier.co.za', physical_address: '1 Test Road, Gauteng' });
  check('Register supplier -> 201', r.status === 201, JSON.stringify(r.json));
  const supplierId = r.json?.data?.id;
  r = await call('POST', '/suppliers', { name: 'Incomplete' });
  check('Supplier missing fields -> 400', r.status === 400, r.status);
  r = await call('GET', '/suppliers');
  check('Retrieve all suppliers -> 200', r.status === 200 && r.json.count >= 8, r.status);
  r = await call('GET', `/suppliers/${supplierId}`);
  check('Retrieve supplier by ID -> 200', r.status === 200 && r.json.data.province_name === 'Gauteng', r.status);
  r = await call('GET', '/suppliers/999999');
  check('Unknown supplier -> 404', r.status === 404, r.status);
  r = await call('GET', '/suppliers/abc');
  check('Non-numeric id -> 400', r.status === 400, r.status);
  r = await call('PUT', `/suppliers/${supplierId}`, { contact_person: 'Updated Person' });
  check('Update supplier -> 200', r.status === 200 && r.json.data.contact_person === 'Updated Person', r.status);
  r = await call('DELETE', '/suppliers/1');
  check('Delete supplier WITH purchases is blocked -> 409', r.status === 409, r.status);
  r = await call('DELETE', `/suppliers/${supplierId}`);
  check('Delete supplier without purchases -> 200', r.status === 200, r.status);

  section('Fruit and stock management');
  r = await call('POST', '/fruits', { name: `Pears ${stamp}`, description: 'Test fruit' });
  check('Register new fruit -> 201', r.status === 201 && r.json.data.status === 'Available', JSON.stringify(r.json));
  const fruitId = r.json?.data?.id;
  r = await call('POST', '/fruits', { description: 'no name' });
  check('Fruit without name -> 400', r.status === 400, r.status);
  r = await call('PUT', `/fruits/${fruitId}`, { description: 'Updated description' });
  check('Update fruit -> 200', r.status === 200 && r.json.data.description === 'Updated description', r.status);
  r = await call('GET', '/fruits?is_active=true');
  check('Retrieve available fruits -> 200', r.status === 200 && r.json.count >= 5, r.status);
  await call('DELETE', `/fruits/${fruitId}`);
  r = await call('GET', '/stock');
  check('Stock per packaging size (15 rows)', r.status === 200 && r.json.count === 15 && ['Small', 'Medium', 'Large'].every((s) => r.json.data.some((x) => x.packaging_size === s)), r.json?.count);
  r = await call('GET', '/stock/by-packaging');
  const apples = r.json.data.find((x) => x.fruit_name === 'Apples');
  check('Stock pivot shows small/medium/large separately', r.status === 200 && 'small' in apples && 'medium' in apples && 'large' in apples, JSON.stringify(apples));
  r = await call('GET', '/stock/low?threshold=10');
  check('Low-stock fruits identified', r.status === 200 && r.json.count >= 1 && r.json.data.every((x) => x.quantity_available < 10), JSON.stringify(r.json));

  section('Vendor management');
  r = await call('POST', '/vendors', { vendor_name: `Test Vendor ${stamp}`, business_name: 'Test Stall', telephone: `+266 5999 ${stamp.slice(0, 4)}`, location: 'Maseru Central' });
  check('Register vendor -> 201', r.status === 201, JSON.stringify(r.json));
  const vendor = r.json?.data;
  r = await call('POST', '/vendors', { vendor_name: 'No phone' });
  check('Vendor missing fields -> 400', r.status === 400, r.status);
  r = await call('GET', '/vendors');
  check('Retrieve all vendors -> 200', r.status === 200 && r.json.count >= 7, r.status);
  r = await call('GET', `/vendors/search?name=${encodeURIComponent('Test Vendor ' + stamp)}`);
  check('Search vendor by name', r.status === 200 && r.json.count === 1, JSON.stringify(r.json));
  r = await call('GET', `/vendors/search?phone=${encodeURIComponent(vendor.telephone)}`);
  check('Search vendor by phone number', r.status === 200 && r.json.count === 1, JSON.stringify(r.json));
  r = await call('PUT', `/vendors/${vendor.id}`, { location: 'Thetsane' });
  check('Update vendor -> 200', r.status === 200 && r.json.data.location === 'Thetsane', r.status);

  section('Purchase management (multi-item, auto total, stock increase)');
  const before = { bs: await stockOf('Bananas', 'Small'), ml: await stockOf('Mangoes', 'Large') };
  r = await call('POST', '/purchases', { supplier_id: 2, items: [
    { fruit_id: 2, packaging_size: 'Small', quantity: 10, unit_cost: 80 },
    { fruit_id: 4, packaging_size: 'Large', quantity: 5, unit_cost: 420.5 }
  ] });
  check('Record purchase -> 201, total auto-calculated (2902.50)', r.status === 201 && r.json.data.total_amount === 2902.5, JSON.stringify(r.json));
  check('Stock increased for banana small (+10)', (await stockOf('Bananas', 'Small')) === before.bs + 10);
  check('Stock increased for mango large (+5)', (await stockOf('Mangoes', 'Large')) === before.ml + 5);
  r = await call('POST', '/purchases', { supplier_id: 2, items: [
    { fruit_id: 2, packaging_size: 'Small', quantity: 5, unit_cost: 80 },
    { fruit_id: 4, packaging_size: 'Huge', quantity: 5, unit_cost: 10 }
  ] });
  check('Purchase with bad item -> 400 and fully rolled back', r.status === 400 && (await stockOf('Bananas', 'Small')) === before.bs + 10, r.status);
  r = await call('POST', '/purchases', { supplier_id: 999999, items: [{ fruit_id: 1, packaging_size: 'Small', quantity: 1, unit_cost: 1 }] });
  check('Purchase from unknown supplier -> 400', r.status === 400, r.status);

  section('Sales management (stock check, atomic rejection)');
  const largeApples = await stockOf('Apples', 'Large');
  const smallBananas = await stockOf('Bananas', 'Small');
  r = await call('POST', '/sales', { vendor_id: vendor.id, items: [
    { fruit_id: 2, packaging_size: 'Small', quantity: 2 },
    { fruit_id: 1, packaging_size: 'Large', quantity: largeApples + 4 }
  ] });
  check(`Vendor asks ${largeApples + 4} large apples, only ${largeApples} available -> 400`, r.status === 400 && /Insufficient stock/.test(r.json.message), JSON.stringify(r.json));
  check('Whole sale rejected: banana stock NOT reduced', (await stockOf('Bananas', 'Small')) === smallBananas);
  check('Whole sale rejected: apple stock unchanged', (await stockOf('Apples', 'Large')) === largeApples);
  r = await call('GET', `/orders?vendor_id=${vendor.id}`);
  check('No incomplete sale was created', r.json.count === 0, r.json.count);
  r = await call('POST', '/sales', { vendor_id: vendor.id, items: [
    { fruit_id: 2, packaging_size: 'Small', quantity: 3 },
    { fruit_id: 1, packaging_size: 'Large', quantity: 2 },
    { fruit_id: 5, packaging_size: 'Medium', quantity: 1 }
  ] });
  check('Multi-item sale -> 201', r.status === 201, JSON.stringify(r.json));
  const sale = r.json?.data;
  check('Total auto-calculated: 3x120 + 2x500 + 1x380 = 1740', sale && Number(sale.total_amount) === 1740, sale?.total_amount);
  check('Stock reduced per packaging size', (await stockOf('Bananas', 'Small')) === smallBananas - 3 && (await stockOf('Apples', 'Large')) === largeApples - 2);
  r = await call('POST', '/sales', { vendor_id: vendor.id, items: [] });
  check('Sale without items -> 400', r.status === 400, r.status);
  r = await call('POST', '/sales', { vendor_id: vendor.id, items: [{ fruit_id: 1, packaging_size: 'Small', quantity: -2 }] });
  check('Negative quantity -> 400', r.status === 400, r.status);
  r = await call('POST', '/sales', { vendor_id: 999999, items: [{ fruit_id: 1, packaging_size: 'Small', quantity: 1 }] });
  check('Unregistered vendor -> 400', r.status === 400, r.status);
  r = await call('GET', `/sales/${sale.id}`);
  check('Retrieve sale with items -> 200', r.status === 200 && r.json.data.items.length === 3, r.status);
  r = await call('GET', '/sales/999999');
  check('Unknown sale -> 404', r.status === 404, r.status);

  section('Payments (cash, mobile money, credit) and balances');
  r = await call('POST', `/payments/sales/${sale.id}`, { payment_method: 'CASH', amount: 500 });
  check('Cash payment -> PARTIALLY_PAID, balance 1240', r.status === 201 && r.json.data.payment_status === 'PARTIALLY_PAID' && r.json.data.outstanding_balance === 1240, JSON.stringify(r.json));
  r = await call('POST', `/payments/sales/${sale.id}`, { payment_method: 'MOBILE_MONEY', amount: 5000 });
  check('Overpayment rejected -> 400', r.status === 400, r.status);
  r = await call('GET', '/payments/vendors/balances?all=true');
  const bal = r.json.data.find((v) => v.vendor_id === vendor.id);
  check('Vendor outstanding balance = 1240', r.status === 200 && Number(bal.outstanding_balance) === 1240, JSON.stringify(bal));
  r = await call('POST', `/payments/sales/${sale.id}`, { payment_method: 'MOBILE_MONEY', amount: 1240, reference_number: 'MM-TEST' });
  check('Mobile money settles sale -> PAID', r.status === 201 && r.json.data.payment_status === 'PAID', JSON.stringify(r.json));
  r = await call('POST', '/sales', { vendor_id: vendor.id, items: [{ fruit_id: 3, packaging_size: 'Small', quantity: 1 }], payment_method: 'CREDIT' });
  check('Credit sale stays UNPAID', r.status === 201 && r.json.data.payment_status === 'UNPAID', JSON.stringify(r.json));
  r = await call('GET', '/payments/outstanding');
  check('Outstanding payments list', r.status === 200 && r.json.count >= 1, r.status);

  section('SQL reports');
  r = await call('GET', '/reports/top-five-fruits');
  check('Five most frequently sold fruits', r.status === 200 && r.json.data.length === 5 && r.json.data[0].fruit_name === 'Apples', JSON.stringify(r.json.data?.[0]));
  r = await call('GET', '/reports/total-sales?from_date=2026-11-01&to_date=2026-11-15');
  check('Revenue for date range', r.status === 200 && Number(r.json.data.total_revenue) === 16430, JSON.stringify(r.json.data));
  r = await call('GET', '/reports/total-sales?from_date=bad&to_date=2026-11-15');
  check('Bad date range -> 400', r.status === 400, r.status);
  r = await call('GET', '/reports/top-vendor-by-boxes');
  check('Vendor with highest boxes', r.status === 200 && !!r.json.data.vendor_name, JSON.stringify(r.json));
  r = await call('GET', '/reports/stock-by-packaging');
  check('Stock by fruit and packaging size (15 rows)', r.status === 200 && r.json.data.length === 15, r.json.data?.length);

  section('Resilience');
  r = await fetch(BASE.replace('/api', '') + '/api/not-a-route');
  check('Unknown route -> 404 JSON', r.status === 404);
  r = await fetch(BASE + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad json' });
  check('Malformed JSON -> 400 (server stays up)', r.status === 400, r.status);
  r = await fetch(BASE + '/health');
  check('Server still healthy', r.status === 200);

  console.log(`\nResult: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('Test run crashed:', e); process.exit(1); });
