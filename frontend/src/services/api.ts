let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiBase = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
  const url = endpoint.startsWith('http') ? endpoint : `${apiBase}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (inMemoryAccessToken) {
    headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Includes HttpOnly cookies
  };

  let response = await fetch(url, fetchOptions);

  // If 401, attempt automatic refresh token exchange
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/auth/refresh` : '/api/auth/refresh';
        const refreshRes = await fetch(refreshUrl, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const newToken = data.data.accessToken;
          setAccessToken(newToken);
          isRefreshing = false;
          onRefreshed(newToken);
        } else {
          setAccessToken(null);
          isRefreshing = false;
          throw new Error('Session expired. Please log in again.');
        }
      } catch (err) {
        setAccessToken(null);
        isRefreshing = false;
        throw err;
      }
    } else {
      // Wait for ongoing refresh
      await new Promise<void>((resolve) => {
        addRefreshSubscriber(() => resolve());
      });
    }

    // Retry original request with updated access token
    const retryHeaders = new Headers(options.headers || {});
    if (!retryHeaders.has('Content-Type') && !(options.body instanceof FormData)) {
      retryHeaders.set('Content-Type', 'application/json');
    }
    if (inMemoryAccessToken) {
      retryHeaders.set('Authorization', `Bearer ${inMemoryAccessToken}`);
    }

    response = await fetch(url, {
      ...options,
      headers: retryHeaders,
      credentials: 'include',
    });
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = result.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return result.data !== undefined ? result.data : result;
}
