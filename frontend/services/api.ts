/**
 * API service for communicating with the NeuroSense backend.
 */
import axios from 'axios';

// For development - adjust based on your local setup
const API_BASE = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Auth APIs
export const authAPI = {
  register: async (email: string, password: string, displayName?: string) => {
    const res = await api.post('/auth/register', { email, password, display_name: displayName });
    return res.data;
  },
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

// Health Data APIs
export const healthAPI = {
  submitData: async (data: any) => {
    const res = await api.post('/health/data', data);
    return res.data;
  },
  getData: async (days = 7) => {
    const res = await api.get(`/health/data?days=${days}`);
    return res.data;
  },
  getSummary: async (days = 7) => {
    const res = await api.get(`/health/summary?days=${days}`);
    return res.data;
  },
};

// Stress APIs
export const stressAPI = {
  analyze: async () => {
    const res = await api.post('/stress/analyze');
    return res.data;
  },
  getLatest: async () => {
    const res = await api.get('/stress/latest');
    return res.data;
  },
  getTrend: async (days = 7) => {
    const res = await api.get(`/stress/trend?days=${days}`);
    return res.data;
  },
  getDashboard: async () => {
    const res = await api.get('/stress/dashboard');
    return res.data;
  },
};

// Mood APIs
export const moodAPI = {
  create: async (mood: string, notes?: string) => {
    const res = await api.post('/mood/', { mood, notes });
    return res.data;
  },
  getEntries: async (days = 30) => {
    const res = await api.get(`/mood/?days=${days}`);
    return res.data;
  },
  getTimeline: async (days = 30) => {
    const res = await api.get(`/mood/timeline?days=${days}`);
    return res.data;
  },
};

// Device APIs
export const deviceAPI = {
  getSupported: async () => {
    const res = await api.get('/devices/supported');
    return res.data;
  },
  connect: async (
    deviceType: string,
    deviceName?: string,
    manufacturer?: string,
    provider?: string,
    integrationType?: string,
    metadata?: Record<string, unknown>
  ) => {
    const res = await api.post('/devices/connect', {
      device_type: deviceType,
      device_name: deviceName,
      manufacturer,
      provider,
      integration_type: integrationType,
      metadata,
    });
    return res.data;
  },
  list: async () => {
    const res = await api.get('/devices/');
    return res.data;
  },
  getCapabilities: async () => {
    const res = await api.get('/devices/capabilities');
    return res.data;
  },
  sync: async (deviceId: string) => {
    const res = await api.post(`/devices/${deviceId}/sync`);
    return res.data;
  },
  disconnect: async (deviceId: string) => {
    await api.delete(`/devices/${deviceId}`);
  },
};

export default api;
