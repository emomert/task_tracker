import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './components/layout/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { SettingsPage } from './pages/SettingsPage'
import { PeoplePage } from './pages/PeoplePage'
import { TeamsPage } from './pages/TeamsPage'
import { MyWorkPage } from './pages/MyWorkPage'
import { ProjectPage } from './pages/ProjectPage'
import { TaskDetailPanel } from './components/tasks/TaskDetailPanel'

export default function App() {
  return (
    <Routes>
      {/* Auth pages — redirect to the app if already signed in. */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Everything else requires a session. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<MyWorkPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/project/:projectId" element={<ProjectPage />}>
            {/* Task detail opens as an overlay panel on top of the project. */}
            <Route path="task/:taskId" element={<TaskDetailPanel />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
