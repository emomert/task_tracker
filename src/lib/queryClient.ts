import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Small team, infrequent changes — modest caching. Refetch on window focus
      // so teammates see each other's edits when they switch back to the tab.
      staleTime: 30_000,
      refetchOnWindowFocus: true,
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
  myTasks: (userId: string) => ['my-tasks', userId] as const,
  teams: ['teams'] as const,
  teamMembers: ['team-members'] as const,
  allTasks: ['all-tasks'] as const,
}
