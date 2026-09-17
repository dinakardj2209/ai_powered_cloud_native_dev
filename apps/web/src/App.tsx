import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { ProjectWorkspace } from './components/layout/ProjectWorkspace';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LandingPage } from './pages/LandingPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectOverviewPage, ProjectTasksPage } from './pages/project/OverviewAndTasks';
import { ProjectRepositoryPage } from './pages/project/RepositoryPage';
import { ProjectAiPage } from './pages/project/AiPage';
import { ProjectDeploymentsPage } from './pages/project/DeploymentsPage';
import { ProjectMonitoringPage } from './pages/project/MonitoringPage';
import { ProjectTeamPage, ProjectSettingsPage } from './pages/project/TeamSettingsPages';
import { FirstProjectRedirect } from './pages/FirstProjectRedirect';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectWorkspace />}>
                  <Route index element={<ProjectOverviewPage />} />
                  <Route path="tasks" element={<ProjectTasksPage />} />
                  <Route path="repository" element={<ProjectRepositoryPage />} />
                  <Route path="ai" element={<ProjectAiPage />} />
                  <Route path="deployments" element={<ProjectDeploymentsPage />} />
                  <Route path="monitoring" element={<ProjectMonitoringPage />} />
                  <Route path="team" element={<ProjectTeamPage />} />
                  <Route path="settings" element={<ProjectSettingsPage />} />
                </Route>
                <Route path="/repository" element={<FirstProjectRedirect tab="repository" />} />
                <Route path="/ai-assistant" element={<FirstProjectRedirect tab="ai" />} />
                <Route path="/deployments" element={<FirstProjectRedirect tab="deployments" />} />
                <Route path="/monitoring" element={<FirstProjectRedirect tab="monitoring" />} />
                <Route path="/team" element={<FirstProjectRedirect tab="team" />} />
                <Route path="/settings" element={<FirstProjectRedirect tab="settings" />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
