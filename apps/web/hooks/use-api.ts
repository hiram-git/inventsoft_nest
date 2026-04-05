'use client';

import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Hook genérico para queries GET autenticadas con Clerk
export function useApiQuery<T>(
  queryKey: unknown[],
  endpoint: string,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>,
) {
  const { getToken } = useAuth();

  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      const token = await getToken();
      return apiClient<T>(endpoint, { token: token ?? undefined });
    },
    ...options,
  });
}

// Hook genérico para mutations POST/DELETE autenticadas
export function useApiMutation<TData, TBody>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST',
  invalidateKeys?: unknown[][],
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TBody>({
    mutationFn: async (body: TBody) => {
      const token = await getToken();
      return apiClient<TData>(endpoint, {
        method,
        token: token ?? undefined,
        body: method !== 'DELETE' ? JSON.stringify(body) : undefined,
      });
    },
    onSuccess: () => {
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          void queryClient.invalidateQueries({ queryKey: key });
        });
      }
    },
  });
}
