import { matchPath, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  GitBranch,
  Bot,
  Rocket,
  Activity,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn, getInitials } from '@/lib/utils';
import { useState } from 'react';
import { NotificationBell } from './NotificationBell';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/repository', icon: GitBranch, label: 'Repository' },
  { to: '/ai-assistant', icon: Bot, label: 'AI Assistant' },
  { to: '/deployments', icon: Rocket, label: 'Deployments' },
  { to: '/monitoring', icon: Activity, label: 'Monitoring' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

/** Sidebar shortcuts redirect into /projects/:id/... so default prefix matching is wrong. */
const NAV_ACTIVE_PATTERNS: Record<string, string[]> = {
  '/dashboard': ['/dashboard'],
  '/projects': ['/projects', '/projects/:id', '/projects/:id/tasks'],
  '/repository': ['/repository', '/projects/:id/repository'],
  '/ai-assistant': ['/ai-assistant', '/projects/:id/ai'],
  '/deployments': ['/deployments', '/projects/:id/deployments'],
  '/monitoring': ['/monitoring', '/projects/:id/monitoring'],
  '/team': ['/team', '/projects/:id/team'],
  '/settings': ['/settings', '/projects/:id/settings'],
};

function isNavItemActive(pathname: string, to: string) {
  return (NAV_ACTIVE_PATTERNS[to] ?? [to]).some((pattern) => matchPath({ path: pattern, end: true }, pathname));
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-surface transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16',
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-white">DF</span>
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="text-sm font-bold text-text">DevFlow</h1>
              <p className="text-xs text-text-muted">Developer Platform</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={() =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isNavItemActive(pathname, item.to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-surface-hover hover:text-text',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span className="flex-1">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
              {user ? getInitials(user.name) : '?'}
            </div>
            {sidebarOpen && user && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">{user.name}</p>
                <p className="truncate text-xs text-text-muted">{user.role}</p>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover hover:text-danger"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-surface/50 px-6 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-text"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="flex-1" />
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
