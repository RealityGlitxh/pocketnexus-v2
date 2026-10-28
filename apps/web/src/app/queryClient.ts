import { QueryClient } from '@tanstack/react-query';

/**
 * Query cache defaults. User-scoped keys MUST start with ['user', userId, …]
 * so AuthProvider can purge them on sign-out.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) =>
          failureCount < 2 &&
          !(error instanceof Error && /permission|not found/i.test(error.message)),
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  });
}
