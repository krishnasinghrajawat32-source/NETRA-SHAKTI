/**
 * NETRA SHAKTI // Centralized API Client
 * Defence-grade HTTP client with environment configuration, credentials support, and binary streaming.
 */

export interface ApiFetchOptions extends RequestInit {
  data?: any;
  params?: Record<string, string | number | boolean | undefined>;
}

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  return '/api/v1';
}

export async function apiClient<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const { data, headers, params, ...customConfig } = options;

  const authHeaders: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ns_access_token');
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    credentials: 'include', // Ensures HTTP-only auth cookies are sent
    headers: {
      ...(!isFormData && data ? { 'Content-Type': 'application/json' } : {}),
      ...authHeaders,
      ...headers,
    },
    ...customConfig,
  };

  if (data) {
    config.body = isFormData ? data : JSON.stringify(data);
  }

  const baseUrl = getApiBaseUrl();
  let fullUrl: string;

  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    fullUrl = endpoint;
  } else {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    fullUrl = `${baseUrl}${cleanEndpoint}`;
  }

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
    }
  }

  const response = await fetch(fullUrl, config);

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: { message: response.statusText || 'DEFENCE network request failed' } };
    }
    const message = errorData?.error?.message || errorData?.message || 'API request failed';
    const error: any = new Error(message);
    error.status = response.status;
    error.code = errorData?.error?.code || `HTTP_${response.status}`;
    error.details = errorData?.error?.details;
    throw error;
  }

  // Handle binary streams (PDF, evidence images, Octet stream)
  const contentType = response.headers.get('content-type') || '';
  if (
    contentType.includes('application/pdf') ||
    contentType.includes('application/octet-stream') ||
    contentType.includes('image/')
  ) {
    return (await response.blob()) as unknown as T;
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  const json = await response.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  get: <T = any>(endpoint: string, options?: ApiFetchOptions) =>
    apiClient<T>(endpoint, { method: 'GET', ...options }),
  post: <T = any>(endpoint: string, data?: any, options?: ApiFetchOptions) =>
    apiClient<T>(endpoint, { method: 'POST', data, ...options }),
  patch: <T = any>(endpoint: string, data?: any, options?: ApiFetchOptions) =>
    apiClient<T>(endpoint, { method: 'PATCH', data, ...options }),
  delete: <T = any>(endpoint: string, options?: ApiFetchOptions) =>
    apiClient<T>(endpoint, { method: 'DELETE', ...options }),
  getBlob: (endpoint: string, options?: ApiFetchOptions) =>
    apiClient<Blob>(endpoint, { method: 'GET', ...options }),
};

export default api;
