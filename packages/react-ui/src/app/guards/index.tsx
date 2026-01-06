import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  createMemoryRouter,
  useLocation,
} from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { ChatPage } from '@/app/routes/chat';
import { EmbedPage } from '@/app/routes/embed';
import AnalyticsPage from '@/app/routes/impact';
import { ApiKeysPage } from '@/app/routes/platform/security/api-keys';
import { SigningKeysPage } from '@/app/routes/platform/security/signing-keys';
import { SSOPage } from '@/app/routes/platform/security/sso';
import AIProvidersPage from '@/app/routes/platform/setup/ai';
import { BrandingPage } from '@/app/routes/platform/setup/branding';
import { PlatformPiecesPage } from '@/app/routes/platform/setup/pieces';
import { RedirectPage } from '@/app/routes/redirect';
import { useEmbedding } from '@/components/embed-provider';
import { VerifyEmail } from '@/features/authentication/components/verify-email';
import { Error } from '@/features/billing/components/error';
import { Success } from '@/features/billing/components/success';
import { AcceptInvitation } from '@/features/members/component/accept-invitation';
import { routesThatRequireProjectId } from '@/lib/utils';
import { Permission } from '@activepieces/shared';

import { ApTableStateProvider } from '../../features/tables/components/ap-table-state-provider';
import { PlatformLayout } from '../components/platform-layout';
import { ProjectDashboardLayout } from '../components/project-layout';
import { BuilderNavigationSidebar } from '../components/sidebar/builder';
import NotFoundPage from '../routes/404-page';
import AuthenticatePage from '../routes/authenticate';
import { ChangePasswordPage } from '../routes/change-password';
import { AppConnectionsPage } from '../routes/connections';
import { EmbeddedConnectionDialog } from '../routes/embed/embedded-connection-dialog';
import { FlowsPage } from '../routes/flows';
import { FlowBuilderPage } from '../routes/flows/id';
import { ResetPasswordPage } from '../routes/forget-password';
import { FormPage } from '../routes/forms';
import LeaderboardPage from '../routes/leaderboard';
import SettingsBilling from '../routes/platform/billing';
import SettingsHealthPage from '../routes/platform/infra/health';
import TriggerHealthPage from '../routes/platform/infra/triggers';
import SettingsWorkersPage from '../routes/platform/infra/workers';
import ProjectsPage from '../routes/platform/projects';
import AuditLogsPage from '../routes/platform/security/audit-logs';
import { ProjectRolePage } from '../routes/platform/security/project-role';
import { ProjectRoleUsersTable } from '../routes/platform/security/project-role/project-role-users-table';
import { GlobalConnectionsTable } from '../routes/platform/setup/connections';
import { PlatformTemplatesPage } from '../routes/platform/setup/templates';
import UsersPage from '../routes/platform/users';
import { ProjectReleasesPage } from '../routes/project-release';
import ViewRelease from '../routes/project-release/view-release';
import { RunsPage } from '../routes/runs';
import { FlowRunPage } from '../routes/runs/id';
import { SignInPage } from '../routes/sign-in';
import { SignUpPage } from '../routes/sign-up';
import { ApTablesPage } from '../routes/tables';
import { ApTableEditorPage } from '../routes/tables/id';
import { TemplatesPage } from '../routes/templates';
import { TodosPage } from '../routes/todos';
import { TodoTestingPage } from '../routes/todos/id';

import { AfterImportFlowRedirect } from './after-import-flow-redirect';
import { DefaultRoute } from './default-route';
import { RoutePermissionGuard } from './permission-guard';
import {
  ProjectRouterWrapper,
  TokenCheckerWrapper,
} from './project-route-wrapper';
import { TemplateDetailsWrapper } from './template-details-wrapper';

const SettingsRerouter = () => {
  const { hash } = useLocation();
  const fragmentWithoutHash = hash.slice(1).toLowerCase();
  return fragmentWithoutHash ? (
    <Navigate to={`/settings/${fragmentWithoutHash}`} replace />
  ) : (
    <Navigate to="/settings/team" replace />
  );
};

const routes = [
  {
    path: '/embed',
    element: <EmbedPage></EmbedPage>,
  },
  {
    path: '/embed/connections',
    element: <EmbeddedConnectionDialog></EmbeddedConnectionDialog>,
  },
  {
    path: '/authenticate',
    element: <AuthenticatePage />,
  },
  {
    path: '/templates',
    element: (
      <ProjectDashboardLayout>
        <PageTitle title="Templates">
          <TemplatesPage />
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  },
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.flows,
    element: (
      <ProjectDashboardLayout>
        <RoutePermissionGuard permission={Permission.READ_FLOW}>
          <PageTitle title="Flows">
            <FlowsPage />
          </PageTitle>
        </RoutePermissionGuard>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleFlow,
    element: (
      <RoutePermissionGuard permission={Permission.READ_FLOW}>
        <PageTitle title="Builder">
          <BuilderNavigationSidebar>
            <FlowBuilderPage />
          </BuilderNavigationSidebar>
        </PageTitle>
      </RoutePermissionGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/flow-import-redirect/:flowId',
    element: <AfterImportFlowRedirect></AfterImportFlowRedirect>,
  }),
  {
    path: '/forms/:flowId',
    element: (
      <PageTitle title="Forms">
        <FormPage />
      </PageTitle>
    ),
  },
  {
    path: '/chats/:flowId',
    element: (
      <PageTitle title="Chats">
        <ChatPage />
      </PageTitle>
    ),
  },
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleRun,
    element: (
      <RoutePermissionGuard permission={Permission.READ_RUN}>
        <PageTitle title="Flow Run">
          <BuilderNavigationSidebar>
            <FlowRunPage />
          </BuilderNavigationSidebar>
        </PageTitle>
      </RoutePermissionGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.runs,
    element: (
      <ProjectDashboardLayout>
        <RoutePermissionGuard permission={Permission.READ_RUN}>
          <PageTitle title="Runs">
            <RunsPage />
          </PageTitle>
        </RoutePermissionGuard>
      </ProjectDashboardLayout>
    ),
  }),
  {
    path: '/templates/:templateId',
    element: <TemplateDetailsWrapper />,
  },
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleRelease,
    element: (
      <ProjectDashboardLayout>
        <PageTitle title="Releases">
          <ViewRelease />
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.tables,
    element: (
      <ProjectDashboardLayout>
        <RoutePermissionGuard permission={Permission.READ_TABLE}>
          <PageTitle title="Tables">
            <ApTablesPage />
          </PageTitle>
        </RoutePermissionGuard>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleTable,
    element: (
      <RoutePermissionGuard permission={Permission.READ_TABLE}>
        <PageTitle title="Table">
          <BuilderNavigationSidebar>
            <ApTableStateProvider>
              <ApTableEditorPage />
            </ApTableStateProvider>
          </BuilderNavigationSidebar>
        </PageTitle>
      </RoutePermissionGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.connections,
    element: (
      <ProjectDashboardLayout>
        <RoutePermissionGuard permission={Permission.READ_APP_CONNECTION}>
          <PageTitle title="Connections">
            <AppConnectionsPage />
          </PageTitle>
        </RoutePermissionGuard>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.releases,
    element: (
      <ProjectDashboardLayout>
        <PageTitle title="Releases">
          <ProjectReleasesPage />
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.todos,
    element: (
      <ProjectDashboardLayout>
        <PageTitle title="Todos">
          <TodosPage />
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleTodo,
    element: (
      <PageTitle title="Todo Testing">
        <TodoTestingPage />
      </PageTitle>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.settings,
    element: (
      <ProjectDashboardLayout>
        <SettingsRerouter></SettingsRerouter>
      </ProjectDashboardLayout>
    ),
  }),
  {
    path: '/forget-password',
    element: (
      <PageTitle title="Forget Password">
        <ResetPasswordPage />
      </PageTitle>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <PageTitle title="Reset Password">
        <ChangePasswordPage />
      </PageTitle>
    ),
  },
  {
    path: '/sign-in',
    element: (
      <PageTitle title="Sign In">
        <SignInPage />
      </PageTitle>
    ),
  },
  {
    path: '/verify-email',
    element: (
      <PageTitle title="Verify Email">
        <VerifyEmail />
      </PageTitle>
    ),
  },
  {
    path: '/sign-up',
    element: (
      <PageTitle title="Sign Up">
        <SignUpPage />
      </PageTitle>
    ),
  },

  {
    path: '/invitation',
    element: (
      <PageTitle title="Accept Invitation">
        <AcceptInvitation />
      </PageTitle>
    ),
  },
  {
    path: '/404',
    element: (
      <PageTitle title="Not Found">
        <NotFoundPage />
      </PageTitle>
    ),
  },
  {
    path: '/platform/projects',
    element: (
      <PlatformLayout>
        <PageTitle title="Projects">
          <ProjectsPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/pieces',
    element: (
      <PlatformLayout>
        <PageTitle title="Pieces">
          <PlatformPiecesPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/impact',
    element: (
      <ProjectDashboardLayout>
        <PageTitle title="Impact">
          <AnalyticsPage />
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  },
  {
    path: '/leaderboard',
    element: (
      <ProjectDashboardLayout>
        <PageTitle title="Leaderboard">
          <LeaderboardPage />
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  },
  {
    path: '/platform',
    element: (
      <PlatformLayout>
        <PageTitle title="Platform">
          <Navigate to="/platform/projects" />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/connections',
    element: (
      <PlatformLayout>
        <PageTitle title="Connections">
          <GlobalConnectionsTable />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/templates',
    element: (
      <PlatformLayout>
        <PageTitle title="Templates">
          <PlatformTemplatesPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/branding',
    element: (
      <PlatformLayout>
        <PageTitle title="Branding">
          <BrandingPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/users',
    element: (
      <PlatformLayout>
        <PageTitle title="Users">
          <UsersPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/ai',
    element: (
      <PlatformLayout>
        <PageTitle title="AI">
          <AIProvidersPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/api-keys',
    element: (
      <PlatformLayout>
        <PageTitle title="API Keys">
          <ApiKeysPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/audit-logs',
    element: (
      <PlatformLayout>
        <PageTitle title="Audit Logs">
          <AuditLogsPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/workers',
    element: (
      <PlatformLayout>
        <PageTitle title="Workers">
          <SettingsWorkersPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/health',
    element: (
      <PlatformLayout>
        <PageTitle title="System Health">
          <SettingsHealthPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/triggers',
    element: (
      <PlatformLayout>
        <PageTitle title="Trigger Health">
          <TriggerHealthPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/billing',
    element: (
      <PlatformLayout>
        <PageTitle title="Billing">
          <SettingsBilling />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/billing/success',
    element: (
      <PlatformLayout>
        <PageTitle title="Billing">
          <Success />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/billing/error',
    element: (
      <PlatformLayout>
        <PageTitle title="Billing">
          <Error />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/signing-keys',
    element: (
      <PlatformLayout>
        <PageTitle title="Signing Keys">
          <SigningKeysPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/sso',
    element: (
      <PlatformLayout>
        <PageTitle title="SSO">
          <SSOPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/project-roles',
    element: (
      <PlatformLayout>
        <PageTitle title="Project Roles">
          <ProjectRolePage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/project-roles/:projectRoleId',
    element: (
      <PlatformLayout>
        <PageTitle title="Project Role Users">
          <ProjectRoleUsersTable />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup',
    element: (
      <PlatformLayout>
        <PageTitle title="Platform Setup">
          <Navigate to="/platform/setup/ai" replace />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure',
    element: (
      <PlatformLayout>
        <PageTitle title="Platform Infrastructure">
          <Navigate to="/platform/infrastructure/workers" replace />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security',
    element: (
      <PlatformLayout>
        <PageTitle title="Platform Security">
          <Navigate to="/platform/security/audit-logs" replace />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/redirect',
    element: <RedirectPage></RedirectPage>,
  },
  {
    path: '/projects/:projectId',
    element: (
      <TokenCheckerWrapper>
        <DefaultRoute></DefaultRoute>
      </TokenCheckerWrapper>
    ),
  },
  {
    path: '/*',
    element: (
      <PageTitle title="Redirect">
        <DefaultRoute></DefaultRoute>
      </PageTitle>
    ),
  },
];

export const memoryRouter = createMemoryRouter(routes);
const browserRouter = createBrowserRouter(routes);

const ApRouter = () => {
  const { embedState } = useEmbedding();
  const router = embedState.isEmbedded ? memoryRouter : browserRouter;
  return <RouterProvider router={router}></RouterProvider>;
};

export { ApRouter };
