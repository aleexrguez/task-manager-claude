import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  TaskDashboardContainer,
  TaskDetailContainer,
} from '@/features/task-manager/containers';
import { LoginContainer, RegisterContainer } from '@/features/auth';
import { LandingPage } from '@/features/landing';
import { AppShellContainer } from '@/shared/components/app-shell';
import { RecurrencesPlaceholder } from '@/features/recurrences';
import { SettingsPlaceholder } from '@/features/settings';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <LandingPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginContainer />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterContainer />
            </PublicOnlyRoute>
          }
        />

        {/* Protected routes with App Shell */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShellContainer />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="tasks" replace />} />
          <Route path="tasks" element={<TaskDashboardContainer />} />
          <Route path="tasks/:id" element={<TaskDetailContainer />} />
          <Route path="recurrences" element={<RecurrencesPlaceholder />} />
          <Route path="settings" element={<SettingsPlaceholder />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
