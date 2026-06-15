import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/queryClient'
import { createProject, listProjects } from '../lib/api/projects'
import { LoadingArea } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/ErrorState'
import { PlusIcon } from '../components/ui/Icon'
import { ProjectFormModal } from '../components/layout/ProjectFormModal'

export function ProjectsHome() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const projectsQuery = useQuery({ queryKey: qk.projects, queryFn: listProjects })
  const [createOpen, setCreateOpen] = useState(false)

  const createMut = useMutation({
    mutationFn: (values: { name: string; emoji: string }) => createProject(values),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: qk.projects })
      navigate(`/project/${project.id}`)
    },
  })

  if (projectsQuery.isLoading) return <LoadingArea />
  if (projectsQuery.isError) return <ErrorState onRetry={() => projectsQuery.refetch()} />

  const projects = projectsQuery.data ?? []
  const hasProjects = projects.length > 0

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-display font-semibold text-ink">
          {hasProjects ? 'Pick a project' : 'Nothing here yet.'}
        </h1>
        <p className="mt-2 text-ui text-muted">
          {hasProjects
            ? 'Choose a project from the sidebar, or start a new one.'
            : 'Create your first project to start tracking work.'}
        </p>
        <button type="button" className="btn-primary mt-6" onClick={() => setCreateOpen(true)}>
          <PlusIcon size={16} /> New project
        </button>
      </div>

      <ProjectFormModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSubmit={async (values) => {
          await createMut.mutateAsync(values)
        }}
      />
    </div>
  )
}
