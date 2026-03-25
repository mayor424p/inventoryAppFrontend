import axios from 'axios';

// ---------------------------
// API Base URL
// ---------------------------
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------
// Request Interceptor
// ---------------------------
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------
// Auth Endpoints
// ---------------------------

// ✅ LOGIN — cleaned up: send plain JSON { username, password }
export const login = (credentials) =>
  apiClient.post('/auth/login/', credentials, {
    headers: { 'Content-Type': 'application/json' },
  });

// ✅ REGISTER — now supports role field (manager or staff)
export const register = (userData) =>
  apiClient.post('/auth/register/', userData, {
    headers: { 'Content-Type': 'application/json' },
  });

// ---------------------------
// Product Endpoints
// ---------------------------
export const getProducts = () => apiClient.get('/products/');
export const createProduct = (productData) => apiClient.post('/products/', productData);
export const updateProduct = (id, productData) => apiClient.put(`/products/${id}/`, productData);
export const deleteProduct = (id) => apiClient.delete(`/products/${id}/`);

// ---------------------------
// Category & Location Endpoints
// ---------------------------
export const getCategories = () => apiClient.get('/categories/');
export const createCategory = (categoryData) => apiClient.post('/categories/', categoryData);
export const getLocations = () => apiClient.get('/locations/');

// ---------------------------
// Inventory Endpoints
// ---------------------------
export const getInventory = () => apiClient.get('/inventory/');

// ---------------------------
// Staff Endpoints
// ---------------------------
export const getStaff = () => apiClient.get('/staff/');
export const addStaff = (data) => apiClient.post('/staff/', data);
export const updateStaff = (id, data) => apiClient.put(`/staff/${id}/`, data);
export const deleteStaff = (id) => apiClient.delete(`/staff/${id}/`);

// ---------------------------
// Supplier Endpoints
// ---------------------------
export const getSuppliers = () => apiClient.get('/suppliers/');

// ---------------------------
// Transaction & POS
// ---------------------------
export const getTransactions = () => apiClient.get('/transactions/');
export const processSale = (saleData) =>
  apiClient.post('/transactions/create_sales/', saleData);

// ---------------------------
export default apiClient;
