import { Navigate, createBrowserRouter } from 'react-router-dom';

import ProjectSettingsLayout from '@/app/project-dashboard/project-settings-layout';
import { AcceptInvitation } from '@/features/team/component/accept-invitation';

import { FlowsPage } from '../app/routes/flows';

import { AllowOnlyLoggedInUserOnlyGuard } from './components/allow-logged-in-user-only-guard';
import { DashboardContainer } from './components/dashboard-container';
import { PlatformAdminContainer } from './components/platform-admin-container';
import NotFoundPage from './routes/404-page';
import { ChangePasswordPage } from './routes/change-password';
import AppConnectionsPage from './routes/connections';
import { FlowBuilderPage } from './routes/flows/id';
import { ResetPasswordPage } from './routes/forget-password';
import { FormPage } from './routes/forms';
import IssuesPage from './routes/issues';
import PlansPage from './routes/plans';
import PlatformAppearancePage from './routes/platform/appearance';
import PlatformPiecesPage from './routes/platform/pieces';
import ProjectsPage from './routes/platform/projects';
import TemplatesPage from './routes/platform/templates';
import UsersPage from './routes/platform/users';
import FlowsRunPage from './routes/runs';
import { FlowRunPage } from './routes/runs/id';
import AlertsPage from './routes/settings/alerts';
import AppearancePage from './routes/settings/appearance';
import PiecesPage from './routes/settings/pieces';
import TeamPage from './routes/settings/team';
import { SignInPage } from './routes/sign-in';
import { SignUpPage } from './routes/sign-up';
import { ShareTemplatePage } from './routes/templates/share-template';
import { GitSyncPage } from './routes/settings/git-sync';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/flows" />,
  },
  {
    path: '/flows',
    element: (
      <DashboardContainer>
        <FlowsPage />
      </DashboardContainer>
    ),
  },
  {
    path: '/flows/:flowId',
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <FlowBuilderPage />
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  },
  {
    path: '/forms/:flowId',
    element: <FormPage />,
  },
  {
    path: '/runs/:runId',
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <FlowRunPage />
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  },
  {
    path: '/templates/:templateId',
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <ShareTemplatePage />
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  },
  {
    path: '/runs',
    element: (
      <DashboardContainer>
        <FlowsRunPage />
      </DashboardContainer>
    ),
  },
  {
    path: '/issues',
    element: (
      <DashboardContainer>
        <IssuesPage />
      </DashboardContainer>
    ),
  },
  {
    path: '/connections',
    element: (
      <DashboardContainer>
        <AppConnectionsPage />
      </DashboardContainer>
    ),
  },
  {
    path: '/plans',
    element: (
      <DashboardContainer>
        <PlansPage />
      </DashboardContainer>
    ),
  },
  {
    path: '/settings',
    element: (
      <DashboardContainer>
        <Navigate to="/settings/alerts" />
      </DashboardContainer>
    ),
  },
  {
    path: '/forget-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ChangePasswordPage />,
  },
  {
    path: '/sign-in',
    element: <SignInPage />,
  },
  {
    path: '/sign-up',
    element: <SignUpPage />,
  },
  {
    path: '/settings/alerts',
    element: (
      <DashboardContainer>
        <ProjectSettingsLayout>
          <AlertsPage></AlertsPage>
        </ProjectSettingsLayout>
      </DashboardContainer>
    ),
  },
  {
    path: '/settings/appearance',
    element: (
      <DashboardContainer>
        <ProjectSettingsLayout>
          <AppearancePage></AppearancePage>
        </ProjectSettingsLayout>
      </DashboardContainer>
    ),
  },
  {
    path: '/settings/pieces',
    element: (
      <DashboardContainer>
        <ProjectSettingsLayout>
          <PiecesPage></PiecesPage>
        </ProjectSettingsLayout>
      </DashboardContainer>
    ),
  },
  {
    path: '/settings/team',
    element: (
      <DashboardContainer>
        <ProjectSettingsLayout>
          <TeamPage></TeamPage>
        </ProjectSettingsLayout>
      </DashboardContainer>
    ),
  },
  {
    path: '/settings/git-sync',
    element: (
      <DashboardContainer>
        <ProjectSettingsLayout>
          <GitSyncPage></GitSyncPage>
        </ProjectSettingsLayout>
      </DashboardContainer>
    ),
  },
  {
    path: '/invitation',
    element: <AcceptInvitation />,
  },
  {
    path: '/*',
    element: (
      <DashboardContainer>
        <Navigate to="/flows" replace />
      </DashboardContainer>
    ),
  },
  {
    path: '/404',
    element: <NotFoundPage />,
  },
  {
    path: '/platform/appearance',
    element: (
      <PlatformAdminContainer>
        <PlatformAppearancePage />
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/pieces',
    element: (
      <PlatformAdminContainer>
        <PlatformPiecesPage />
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/projects',
    element: (
      <PlatformAdminContainer>
        <ProjectsPage />
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/templates',
    element: (
      <PlatformAdminContainer>
        <TemplatesPage />
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/users',
    element: (
      <PlatformAdminContainer>
        <UsersPage />
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform',
    element: (
      <PlatformAdminContainer>
        <Navigate to="/platform/projects" />
      </PlatformAdminContainer>
    ),
  },
]);
