import axios from 'axios';
import type { Dataset, IndicatorDefinition, Ranking, Stats, Collaborator } from '../types';

// Token management
const TOKEN_KEY = 'ovb_auth_token';

export const tokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  }
};

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors globally (token expired or invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired, remove it
      tokenManager.removeToken();
      // Optionally redirect to login
      console.log('🔒 Token invalid or expired, please login again');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (password: string) => {
    const response = await api.post('/auth/login', { password });
    // Store token if login successful
    if (response.data.token) {
      tokenManager.setToken(response.data.token);
      console.log('✅ Token stored successfully');
    }
    return response;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    // Remove token on logout
    tokenManager.removeToken();
    console.log('👋 Token removed');
    return response;
  },
  getStatus: () => api.get('/auth/status')
};

// Dataset API
export const datasetAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  getAll: () => api.get<{ datasets: Dataset[] }>('/datasets'),
  getOne: (id: string) => api.get<{ dataset: Dataset }>(`/datasets/${id}`),
  getStats: (id: string) => api.get<{ stats: Stats }>(`/datasets/${id}/stats`),
  delete: (id: string) => api.delete(`/datasets/${id}`)
};

// Mapping API
export const mappingAPI = {
  get: (datasetId: string) => api.get(`/mappings/${datasetId}`),
  update: (datasetId: string, mappings: any[]) => 
    api.put(`/mappings/${datasetId}`, { mappings }),
  getAvailableFields: () => api.get('/mappings/fields/available')
};

// Indicator API
export const indicatorAPI = {
  getAll: () => api.get<{ indicators: IndicatorDefinition[] }>('/indicators'),
  getOne: (id: string) => api.get<{ indicator: IndicatorDefinition }>(`/indicators/${id}`),
  create: (data: Partial<IndicatorDefinition>) => api.post('/indicators', data),
  update: (id: string, data: Partial<IndicatorDefinition>) => api.put(`/indicators/${id}`, data),
  delete: (id: string) => api.delete(`/indicators/${id}`),
  duplicate: (id: string) => api.post(`/indicators/${id}/duplicate`)
};

// Ranking API
export const rankingAPI = {
  compute: (indicatorId: string, datasetId: string) => 
    api.post<{ success: boolean; ranking: Ranking }>('/rankings/compute', { indicatorId, datasetId }),
  getLatest: (indicatorId: string) => api.get(`/rankings/latest/${indicatorId}`),
  exportPDF: (id: string, title?: string, companyName?: string) => 
    api.post(`/rankings/${id}/export-pdf`, { title, companyName }, { responseType: 'blob' }),
  exportPDFDirect: (rankingData: any[], indicatorName: string, description?: string, companyName?: string, datasetName?: string) =>
    api.post('/rankings/export-pdf-direct', {
      rankingData,
      indicatorName,
      description,
      companyName,
      datasetName
    }, { responseType: 'blob' })
};

// Collaborator API
export const collaboratorAPI = {
  search: (datasetId: string, rankCategory?: string, search?: string) => 
    api.get<{ success: boolean; collaborators: Collaborator[]; total: number }>('/collaborators', {
      params: { datasetId, rankCategory, search }
    }),
  getRanks: (datasetId: string) => 
    api.get<{ success: boolean; ranks: string[] }>('/collaborators/ranks', {
      params: { datasetId }
    })
};

export default api;

