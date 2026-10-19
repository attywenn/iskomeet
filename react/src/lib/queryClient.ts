import { QueryClient } from '@tanstack/react-query'

/**
 * Shared TanStack QueryClient with optimized caching tiers:
 * - Lookup/Static reference data: 24h stale time
 * - Match feed / Candidate lists: 1 minute stale time
 * - User profiles: 5 minutes stale time
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute default stale time
      gcTime: 10 * 60 * 1000, // 10 minutes cache garbage collection time
      refetchOnWindowFocus: false, // Avoid excessive refetches on mobile/desktop focus
      retry: 1,
    },
  },
})
