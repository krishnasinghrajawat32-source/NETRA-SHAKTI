const API_BASE = '/api/v1';

export interface ApiFetchOptions extends RequestInit {
  data?: unknown;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

/**
 * NETRA SHAKTI API client
 *
 * Authentication:
 * - Secure + HttpOnly cookies
 * - No access token in localStorage
 * - Browser sends session cookie using credentials: 'include'
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const {
    data,
    headers: customHeaders,
    ...customConfig
  } = options;

  const hasData =
    data !== undefined && data !== null;

  const isFormData =
    typeof FormData !== 'undefined' &&
    data instanceof FormData;

  const headers = new Headers(customHeaders);

  if (
    hasData &&
    !isFormData &&
    !headers.has('Content-Type')
  ) {
    headers.set(
      'Content-Type',
      'application/json'
    );
  }

  const config: RequestInit = {
    ...customConfig,

    method:
      customConfig.method ||
      (hasData ? 'POST' : 'GET'),

    credentials: 'include',

    headers
  };

  if (hasData) {
    config.body = isFormData
      ? (data as FormData)
      : JSON.stringify(data);
  }

  const normalizedEndpoint =
    endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${normalizedEndpoint}`;

  let response: Response;

  try {
    response = await fetch(url, config);
  } catch {
    const error = new Error(
      'Unable to connect to the NETRA SHAKTI API.'
    ) as ApiError;

    error.status = 0;
    error.code = 'NETWORK_ERROR';

    throw error;
  }

  if (!response.ok) {
    let errorData: any = null;

    const contentType =
      response.headers.get('content-type') || '';

    try {
      if (
        contentType.includes(
          'application/json'
        )
      ) {
        errorData = await response.json();
      } else {
        const text =
          await response.text();

        errorData = {
          message:
            text ||
            response.statusText ||
            'API request failed'
        };
      }
    } catch {
      errorData = {
        message:
          response.statusText ||
          'API request failed'
      };
    }

    const message =
      errorData?.error?.message ||
      errorData?.message ||
      `Request failed with status ${response.status}`;

    const error = new Error(
      message
    ) as ApiError;

    error.status = response.status;

    error.code =
      errorData?.error?.code ||
      errorData?.code ||
      `HTTP_${response.status}`;

    error.details =
      errorData?.error?.details ||
      errorData?.details;

    throw error;
  }

  if (
    response.status === 204 ||
    response.status === 205
  ) {
    return undefined as T;
  }

  const contentType =
    response.headers.get('content-type') || '';

  if (
    contentType.includes(
      'application/pdf'
    ) ||
    contentType.includes(
      'application/octet-stream'
    )
  ) {
    const blob =
      await response.blob();

    return blob as T;
  }

  if (
    contentType.includes(
      'application/json'
    )
  ) {
    const json = await response.json();

    if (
      json &&
      typeof json === 'object' &&
      'data' in json
    ) {
      return json.data as T;
    }

    return json as T;
  }

  const text =
    await response.text();

  return text as T;
}

export const api = {
  get: <T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'GET'
    }),

  post: <T = unknown>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      data
    }),

  put: <T = unknown>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      data
    }),

  patch: <T = unknown>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      data
    }),

  delete: <T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'DELETE'
    })
};