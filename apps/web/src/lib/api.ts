const API_BASE = '/api/v1';

export interface ApiFetchOptions extends RequestInit {
  data?: any;
}

export async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const { data, headers, ...customConfig } = options;

  const authHeaders: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ns_access_token');
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const isFormData = data instanceof FormData;
  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    credentials: 'include',
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

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: { message: response.statusText || 'Network request failed' } };
    }
    const message = errorData?.error?.message || errorData?.message || 'API request failed';
    const error: any = new Error(message);
    error.status = response.status;
    error.code = errorData?.error?.code || `HTTP_${response.status}`;
    error.details = errorData?.error?.details;
    throw error;
  }

  // If endpoint is a file download/stream
  const contentType = response.headers.get('content-type');
  if (contentType && (contentType.includes('application/pdf') || contentType.includes('application/octet-stream'))) {
    return response.blob() as unknown as T;
  }

  const json = await response.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { method: 'GET', ...options }),
  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    apiFetch<T>(endpoint, { method: 'POST', data, ...options }),
  patch: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    apiFetch<T>(endpoint, { method: 'PATCH', data, ...options }),
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { method: 'DELETE', ...options }),
};
