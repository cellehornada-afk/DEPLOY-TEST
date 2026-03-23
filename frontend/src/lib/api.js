import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  res => res,
  err => {
    // Don't redirect for /auth/me (logged-out browsing) or /auth/login (failed login must not hard-navigate — that resets UI e.g. role picker)
    const reqUrl = err.config?.url || '';
    const skip401Redirect = reqUrl.includes('auth/me') || reqUrl.includes('auth/login');
    if (err.response?.status === 401 && !skip401Redirect) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
