import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useLocalStorageState } from '../../hooks/useLocalStorageState'
import { PanelLeftIcon } from '../ui/Icon'

export function AppLayout() {
  const [collapsed, setCollapsed] = useLocalStorageState('wt:sidebar-collapsed', false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-paper text-ink">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="wt-animate-overlay absolute inset-0 bg-black/20"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="wt-animate-drawer-left absolute left-0 top-0 h-full shadow-drag">
            <Sidebar collapsed={false} onToggleCollapse={() => setMobileOpen(false)} isDrawer />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-2 border-b border-line bg-paper px-3 py-2 md:hidden">
          <button
            type="button"
            className="btn-ghost p-1.5"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <PanelLeftIcon size={18} />
          </button>
          <span className="text-ui font-semibold">Task Tracker</span>
        </header>

        <main className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
