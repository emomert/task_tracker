import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Small team, infrequent changes — modest caching, no aggressive refetch.
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Centralized query keys so invalidation stays consistent across the app.
export const qk = {
  profiles: ['profiles'] as const,
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  tasks: (projectId: string) => ['tasks', projectId] as const,
  task: (id: string) => ['task', id] as const,
}
