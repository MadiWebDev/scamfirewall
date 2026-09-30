import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: {
    email: string;
    password: string;
    fullName: string;
    ageBand?: string;
    language?: string;
    country?: string;
  }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  requestPasswordReset: async (email: string) => {
    const response = await apiClient.post('/auth/password-reset', { email });
    return response.data;
  },
};

// Scam Check API
export const checkApi = {
  submitCheck: async (data: {
    channel: string;
    content?: string;
    imageBase64?: string;
    metadata?: Record<string, unknown>;
  }) => {
    const response = await apiClient.post('/scam-events', data);
    return response.data;
  },

  getResult: async (eventId: string) => {
    const response = await apiClient.get(`/scam-events/${eventId}`);
    return response.data;
  },

  getHistory: async (limit?: number) => {
    const response = await apiClient.get('/scam-events', {
      params: { limit },
    });
    return response.data;
  },

  submitFeedback: async (
    eventId: string,
    feedback: { helpful: boolean; correct?: boolean; notes?: string }
  ) => {
    const response = await apiClient.post(`/scam-events/${eventId}/feedback`, feedback);
    return response.data;
  },
};

// Family API
export const familyApi = {
  getFamily: async () => {
    const response = await apiClient.get('/family');
    return response.data;
  },

  createFamily: async (name: string) => {
    const response = await apiClient.post('/family', { name });
    return response.data;
  },

  addMember: async (data: {
    displayName: string;
    relationship?: string;
    elderMode?: boolean;
  }) => {
    const response = await apiClient.post('/family/members', data);
    return response.data;
  },

  getTrustedContacts: async () => {
    const response = await apiClient.get('/trusted-contacts');
    return response.data;
  },

  addTrustedContact: async (data: {
    displayName: string;
    phone?: string;
    email?: string;
    channelPref?: string;
  }) => {
    const response = await apiClient.post('/trusted-contacts', data);
    return response.data;
  },

  removeTrustedContact: async (contactId: string) => {
    const response = await apiClient.delete(`/trusted-contacts/${contactId}`);
    return response.data;
  },
};

// Recovery API
export const recoveryApi = {
  getChecklist: async (eventId: string) => {
    const response = await apiClient.get(`/recovery/${eventId}`);
    return response.data;
  },

  updateTask: async (taskId: string, status: string) => {
    const response = await apiClient.patch(`/recovery/tasks/${taskId}`, { status });
    return response.data;
  },

  getRecoveryHistory: async () => {
    const response = await apiClient.get('/recovery');
    return response.data;
  },
};

// Settings API
export const settingsApi = {
  getPolicy: async () => {
    const response = await apiClient.get('/policy');
    return response.data;
  },

  updatePolicy: async (updates: Record<string, unknown>) => {
    const response = await apiClient.put('/policy', updates);
    return response.data;
  },

  getUserProfile: async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  updateUserProfile: async (updates: Record<string, unknown>) => {
    const response = await apiClient.patch('/users/me', updates);
    return response.data;
  },

  deleteAccount: async () => {
    const response = await apiClient.delete('/users/me');
    return response.data;
  },

  exportData: async () => {
    const response = await apiClient.post('/users/export');
    return response.data;
  },
};

// Analytics API
export const analyticsApi = {
  getTrends: async (days?: number) => {
    const response = await apiClient.get('/analytics/trends', {
      params: { days },
    });
    return response.data;
  },

  getEffectiveness: async () => {
    const response = await apiClient.get('/analytics/effectiveness');
    return response.data;
  },

  getHotspots: async (limit?: number) => {
    const response = await apiClient.get('/analytics/hotspots', {
      params: { limit },
    });
    return response.data;
  },
};

// Notifications API
export const notificationsApi = {
  getNotifications: async (limit?: number) => {
    const response = await apiClient.get('/notifications', {
      params: { limit },
    });
    return response.data;
  },

  getUnread: async () => {
    const response = await apiClient.get('/notifications/unread');
    return response.data;
  },

  markAsRead: async (notificationId: string) => {
    const response = await apiClient.post(`/notifications/${notificationId}/read`);
    return response.data;
  },
};

export default apiClient;
