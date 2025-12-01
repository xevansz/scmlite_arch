// API helper with automatic Bearer token attachment
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = false, headers = {}, ...fetchOptions } = options;

  const config: RequestInit = {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  // Attach Bearer token if auth is required
  if (requiresAuth) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API calls
export const authApi = {
  signup: (data: { full_name: string; email: string; password: string; recaptchaToken: string }) =>
    apiRequest<{ message: string; user_id: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        recaptcha_token: data.recaptchaToken,
      }),
    }),

  login: (data: { email: string; password: string; recaptchaToken: string }) =>
    apiRequest<{ access_token: string; token_type: string; expires_in: number }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        recaptcha_token: data.recaptchaToken,
      }),
    }),
};

// Shipment API calls
export const shipmentApi = {
  getAll: () =>
    apiRequest<any[]>('/shipments/all', {
      requiresAuth: true,
    }),

  create: (data: any) =>
    apiRequest<{ message: string; shipment_id: string }>('/shipments/create', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    }),

  getByDeviceId: (deviceId: string) =>
    apiRequest<any[]>(`/shipments/device/${deviceId}`, {
      requiresAuth: true,
    }),
};

// Device data API calls
export const deviceApi = {
  getAll: (page: number = 1, limit: number = 10) =>
    apiRequest<{ data: any[]; total: number; page: number; limit: number; total_pages: number }>(
      `/data/all?page=${page}&limit=${limit}`,
      {
        requiresAuth: true,
      }
    ),

  getDeviceData: (deviceId: string, page: number = 1, limit: number = 10) =>
    apiRequest<{ data: any[]; total: number; page: number; limit: number; total_pages: number }>(
      `/data/device/${deviceId}?page=${page}&limit=${limit}`,
      {
        requiresAuth: true,
      }
    ),

  getLatestData: () =>
    apiRequest<any>('/data/latest', {
      requiresAuth: true,
    }),
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('auth_token');
};

export const logout = (): void => {
  localStorage.removeItem('auth_token');
};
