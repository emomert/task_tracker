import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { ThemeProvider } from './theme/ThemeContext'
import { ToastProvider } from './components/ui/Toast'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
import { queryClient } from './lib/queryClient'
// Self-hosted Inter (bundled by BlockNote) — no external font request needed.
import '@blocknote/core/fonts/inter.css'
import './index.css'

// Last-resort observability for a deployed static app: log otherwise-invisible
// runtime errors and unhandled promise rejections so failures leave a trail.
window.addEventListener('error', (e) => {
  console.error('Uncaught error:', e.error ?? e.message)
})
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason)
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
