import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Products ────────────────────────────────────────────────────────────
export const fetchProducts = () => api.get('/products');

// ─── Orders ──────────────────────────────────────────────────────────────
export const createOrder = (orderData, idempotencyKey) =>
  api.post('/orders', orderData, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });

export const fetchOrder = (orderId) => api.get(`/orders/${orderId}`);

export const processPayment = (orderId, result) =>
  api.post(`/orders/${orderId}/payment`, { result });

// ─── Admin ────────────────────────────────────────────────────────────────
export const fetchAdminOrders = (params) => api.get('/admin/orders', { params });

export const updateOrderStatus = (orderId, status) =>
  api.patch(`/admin/orders/${orderId}/status`, { status });

export const fetchPossibleDuplicates = () => api.get('/admin/orders/possible-duplicates');

export default api;
