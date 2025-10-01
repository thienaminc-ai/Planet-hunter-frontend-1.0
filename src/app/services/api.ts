// src/services/api.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Tạo Axios instance với base URL (dễ thay đổi môi trường: dev/prod)
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', // Dùng env var cho linh hoạt
  timeout: 10000, // 10s timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor cho request (thêm token nếu có auth sau này)
api.interceptors.request.use(
  (config) => {
    // Ví dụ: const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor cho response (xử lý error global)
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    console.error('API Error:', error);
    // Có thể redirect nếu 401 (unauthorized)
    return Promise.reject(error);
  }
);

// Định nghĩa các endpoints (gọi API như service methods)
export const exoplanetAPI = {
  // POST /preprocess
  preprocessData: async (payload: { action: string }): Promise<any> => {
    const response = await api.post('/preprocess', payload);
    return response.data;
  },

  // POST /train
  trainModel: async (payload: { action: string }): Promise<any> => {
    const response = await api.post('/train', payload);
    return response.data;
  },

  // POST /test
  testModel: async (payload: { action: string }): Promise<any> => {
    const response = await api.post('/test', payload);
    return response.data;
  },

  // GET /data (ví dụ thêm sau, nếu cần)
  getData: async (): Promise<any> => {
    const response = await api.get('/data');
    return response.data;
  },
};

export default api;