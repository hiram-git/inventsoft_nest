const API_URL =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(
      (error as { message?: string }).message ?? 'Request failed',
    );
  }

  return response.json() as Promise<T>;
}
