import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './shared/components/Layout';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/admin/pages/DashboardPage';
import { SurveyFormPage } from './features/admin/pages/SurveyFormPage';
import { ResultsPage } from './features/admin/pages/ResultsPage';
import { SurveyPublicPage } from './features/survey/pages/SurveyPublicPage';
import { SurveyListPage } from './features/survey/pages/SurveyListPage';
import './amplifyconfiguration';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/surveys" element={<SurveyListPage />} />
        <Route path="/survey/:id" element={<SurveyPublicPage />} />

        {/* Admin (protected) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout><DashboardPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/surveys/new"
          element={
            <ProtectedRoute>
              <Layout><SurveyFormPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/surveys/:id/edit"
          element={
            <ProtectedRoute>
              <Layout><SurveyFormPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/surveys/:id/results"
          element={
            <ProtectedRoute>
              <Layout><ResultsPage /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
