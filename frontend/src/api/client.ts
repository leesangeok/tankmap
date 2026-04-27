import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export const client = axios.create({
  baseURL: API_BASE,
});

export const getMediaUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  return import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${url}` : url;
};

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
