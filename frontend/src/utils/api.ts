// API helper with automatic Bearer token attachment
// @ts-ignore - Vite environment variables
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

interface JwtPayload {
  exp: number;
  iat: number;
  sub: string;
  email: string;
  [key: string]: any;
}

export class ApiError extends Error {
  status?: number;
  details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

function extractErrorMessage(errorData: any, status: number): string {
  // Handle FastAPI validation errors (422)
  if (status === 422 && Array.isArray(errorData.detail)) {
    return errorData.detail
      .map((err: any) => {
        const field = err.loc?.join('.') || 'field';
        return `${field}: ${err.msg || err.message || 'Invalid value'}`;
      })
      .join('; ');
  }

  // Handle string detail
  if (typeof errorData.detail === 'string') {
    return errorData.detail;
  }

  // Handle object detail
  if (typeof errorData.detail === 'object' && errorData.detail !== null) {
    return Object.entries(errorData.detail)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
  }

  // Handle array of error messages
  if (Array.isArray(errorData.detail)) {
    return errorData.detail.map((err: any) => err.msg || String(err)).join('; ');
  }

  // Fallback to status text or generic message
  return errorData.message || `Request failed with status ${status}`;
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

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorData: any;
      
      try {
        errorData = isJson ? await response.json() : { message: await response.text() };
      } catch (e) {
        errorData = { message: `HTTP ${response.status} ${response.statusText}` };
      }

      const errorMessage = extractErrorMessage(errorData, response.status);
      throw new ApiError(errorMessage, response.status, errorData.detail || errorData);
    }

    const result = isJson ? await response.json() : await response.text();
    return result as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof TypeError) {
      throw new ApiError('Unable to connect to the server. Please check your connection.', 0);
    }
    
    throw new ApiError(error instanceof Error ? error.message : 'An unknown error occurred', 0);
  }
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

export const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    const currentTime = Math.floor(Date.now() / 1000);
    return exp < currentTime;
  } catch (error) {
    return true; // If there's an error decoding, treat as expired
  }
};

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('auth_token');
  if (!token) return false;
  
  if (isTokenExpired(token)) {
    logout();
    return false;
  }
  
  return true;
};

export const logout = (): void => {
  localStorage.removeItem('auth_token');
  // Redirect to login page if we're not already there
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
};

// Check token expiration every minute
const CHECK_INTERVAL = 60 * 2000; // 2 minute

// Set up the token expiration check when the app loads
if (typeof window !== 'undefined') {
  setInterval(() => {
    const token = localStorage.getItem('auth_token');
    if (token && isTokenExpired(token)) {
      logout();
    }
  }, CHECK_INTERVAL);
}
