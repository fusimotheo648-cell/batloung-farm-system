import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Stakeholders from './pages/Stakeholders';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Stock from './pages/Stock';
import Purchases from './pages/Purchases';
import Payments from './pages/Payments';

function App() {
  return (
    <Routes>
      {/* Dashboard remains directly accessible as the public landing page. */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route element={<ProtectedRoute />}>
          <Route path="inventory" element={<Inventory />} />
          <Route path="stakeholders" element={<Stakeholders />} />
          <Route path="orders" element={<Orders />} />
          <Route path="stock" element={<Stock />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="payments" element={<Payments />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
