import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

// React cache() ensures one QueryClient per request on the server
export const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
        },
      },
    }),
);
