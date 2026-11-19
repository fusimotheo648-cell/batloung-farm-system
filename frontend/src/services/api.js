import axios from 'axios';

// VITE_API_URL is the backend address. A trailing slash is removed and "/api"
// is added if it was left off, so both "https://x.vercel.app" and
// "https://x.vercel.app/api" work.
const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const publicPaths = ['/', '/login'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (credentials) => api.post('/auth/login', credentials);
export const getMe = () => api.get('/auth/me');

// Dashboard
export const getDashboard = () => api.get('/dashboard');

// Fruits
export const getFruits = (params) => api.get('/fruits', { params });
export const getFruit = (id) => api.get(`/fruits/${id}`);
export const createFruit = (data) => api.post('/fruits', data);
export const updateFruit = (id, data) => api.put(`/fruits/${id}`, data);
export const deleteFruit = (id) => api.delete(`/fruits/${id}`);

// Box Sizes
export const getBoxSizes = (params) => api.get('/box-sizes', { params });
export const getBoxSize = (id) => api.get(`/box-sizes/${id}`);
export const createBoxSize = (data) => api.post('/box-sizes', data);
export const updateBoxSize = (id, data) => api.put(`/box-sizes/${id}`, data);
export const deleteBoxSize = (id) => api.delete(`/box-sizes/${id}`);

// Products
export const getProducts = (params) => api.get('/products', { params });
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);

// Suppliers
export const getSuppliers = (params) => api.get('/suppliers', { params });
export const getSupplier = (id) => api.get(`/suppliers/${id}`);
export const createSupplier = (data) => api.post('/suppliers', data);
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`);
export const getProvinces = () => api.get('/suppliers/provinces/list');

// Vendors
export const getVendors = (params) => api.get('/vendors', { params });
export const searchVendors = (params) => api.get('/vendors/search', { params });
export const getVendor = (id) => api.get(`/vendors/${id}`);
export const createVendor = (data) => api.post('/vendors', data);
export const updateVendor = (id, data) => api.put(`/vendors/${id}`, data);
export const deleteVendor = (id) => api.delete(`/vendors/${id}`);

// Stock
export const getStock = (params) => api.get('/stock', { params });
export const getLowStock = (params) => api.get('/stock/low', { params });
export const getStockPivot = () => api.get('/stock/by-packaging');
export const recordStock = (data) => api.post('/stock', data);
export const createPurchase = (data) => api.post('/purchases', data);
export const getPaymentSummary = () => api.get('/payments/outstanding');
export const getPayments = () => api.get('/payments');
export const recordPayment = (saleId, data) => api.post(`/payments/sales/${saleId}`, data);
export const getVendorBalances = () => api.get('/payments/vendors/balances');
export const updateStock = (id, data) => api.put(`/stock/${id}`, data);
export const getPurchases = (params) => api.get('/stock/purchases', { params });

// Orders
export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);

// Reports
export const getAvailableStockReport = () => api.get('/reports/available-stock');
export const getSalesByFruit = () => api.get('/reports/sales-by-fruit');
export const getSalesByBoxSize = () => api.get('/reports/sales-by-box-size');
export const getSalesByVendor = () => api.get('/reports/sales-by-vendor');
export const getPurchasesByProvince = () => api.get('/reports/purchases-by-province');
export const getPendingOrdersReport = () => api.get('/reports/pending-orders');
export const getCompletedOrdersReport = () => api.get('/reports/completed-orders');
export const getSalesByDate = (params) => api.get('/reports/sales-by-date', { params });
export const getTopFiveFruits = () => api.get('/reports/top-five-fruits');
export const getTotalSalesReport = (params) => api.get('/reports/total-sales', { params });
export const getTopVendorByBoxes = () => api.get('/reports/top-vendor-by-boxes');
export const getStockByPackaging = () => api.get('/reports/stock-by-packaging');

export default api;
