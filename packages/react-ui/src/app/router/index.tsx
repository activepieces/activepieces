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
import AnalyticsPage from '@/app/routes/platform/analytics';
import { ApiKeysPage } from '@/app/routes/platform/security/api-keys';
import { SigningKeysPage } from '@/app/routes/platform/security/signing-keys';
import { SSOPage } from '@/app/routes/platform/security/sso';
import AIProvidersPage from '@/app/routes/platform/setup/ai';
import { BrandingPage } from '@/app/routes/platform/setup/branding';
import { PlatformPiecesPage } from '@/app/routes/platform/setup/pieces';
import { RedirectPage } from '@/app/routes/redirect';
import { ProjectPiecesPage } from '@/app/routes/settings/pieces';
import { useEmbedding } from '@/components/embed-provider';
import { VerifyEmail } from '@/features/authentication/components/verify-email';
import { Error } from '@/features/billing/components/error';
import { Success } from '@/features/billing/components/success';
import { AcceptInvitation } from '@/features/team/component/accept-invitation';
import { Permission } from '@activepieces/shared';

import { ApTableStateProvider } from '../../features/tables/components/ap-table-state-provider';
import { DashboardContainer } from '../components/dashboard-container';
import { PlatformAdminContainer } from '../components/platform-admin-container';
import ProjectSettingsLayout from '../components/project-settings-layout';
import NotFoundPage from '../routes/404-page';
import { AgentsPage } from '../routes/agents';
import AuthenticatePage from '../routes/authenticate';
import { AppConnectionsPage } from '../routes/connections';
import { EmbeddedConnectionDialog } from '../routes/embed/embedded-connection-dialog';
import { FlowsPage } from '../routes/flows';
import { FlowBuilderPage } from '../routes/flows/id';
import { FormPage } from '../routes/forms';
import McpServersPage from '../routes/mcp-servers';
import McpPage from '../routes/mcp-servers/id';
import SettingsBilling from '../routes/platform/billing';
import SettingsHealthPage from '../routes/platform/infra/health';
import TriggerHealthPage from '../routes/platform/infra/triggers';
import SettingsWorkersPage from '../routes/platform/infra/workers';
import { PlatformMessages } from '../routes/platform/notifications/platform-messages';
import ProjectsPage from '../routes/platform/projects';
import { ProjectRolePage } from '../routes/platform/security/project-role';
import { ProjectRoleUsersTable } from '../routes/platform/security/project-role/project-role-users-table';
import { GlobalConnectionsTable } from '../routes/platform/setup/connections';
import TemplatesPage from '../routes/platform/setup/templates';
import UsersPage from '../routes/platform/users';
import { FlowRunPage } from '../routes/runs/id';
import ProjectMembersPage from '../routes/settings/project-members';
import { SignInPage } from '../routes/sign-in';
import { SignUpPage } from '../routes/sign-up';
import { ApTablesPage } from '../routes/tables';
import { ApTableEditorPage } from '../routes/tables/id';
import { ShareTemplatePage } from '../routes/templates/share-template';
import { TodosPage } from '../routes/todos';
import { TodoTestingPage } from '../routes/todos/id';

import { AfterImportFlowRedirect } from './after-import-flow-redirect';
import { DefaultRoute } from './default-route';
import { RoutePermissionGuard } from './permission-guard';
import {
  ProjectRouterWrapper,
  projectSettingsRoutes,
  TokenCheckerWrapper,
} from './project-route-wrapper';

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
  ...ProjectRouterWrapper({
    path: '/flows',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_FLOW}>
          <PageTitle title="Flows">
            <FlowsPage />
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/flows/:flowId',
    element: (
      <RoutePermissionGuard permission={Permission.READ_FLOW}>
        <PageTitle title="Builder">
          <FlowBuilderPage />
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
  ...ProjectRouterWrapper({
    path: '/agents',
    element: (
      <DashboardContainer>
        <PageTitle title="Agents">
          <AgentsPage />
        </PageTitle>
      </DashboardContainer>
    ),
  }),
  {
    path: '/chats/:flowId',
    element: (
      <PageTitle title="Chats">
        <ChatPage />
      </PageTitle>
    ),
  },
  ...ProjectRouterWrapper({
    path: '/runs/:runId',
    element: (
      <RoutePermissionGuard permission={Permission.READ_RUN}>
        <PageTitle title="Flow Run">
          <FlowRunPage />
        </PageTitle>
      </RoutePermissionGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/runs',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_RUN}>
          <PageTitle title="Runs">
            <FlowsPage />
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/issues',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_RUN}>
          <PageTitle title="Issues">
            <FlowsPage />
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),
  {
    path: '/templates/:templateId',
    element: (
      <PageTitle title="Share Template">
        <ShareTemplatePage />
      </PageTitle>
    ),
  },
  ...ProjectRouterWrapper({
    path: '/tables',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_TABLE}>
          <PageTitle title="Tables">
            <ApTablesPage />
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/tables/:tableId',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_TABLE}>
          <PageTitle title="Table">
            <ApTableStateProvider>
              <ApTableEditorPage />
            </ApTableStateProvider>
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/connections',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_APP_CONNECTION}>
          <PageTitle title="Connections">
            <AppConnectionsPage />
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/todos',
    element: (
      <DashboardContainer>
        <PageTitle title="Todos">
          <TodosPage />
        </PageTitle>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/todos/:todoId',
    element: (
      <PageTitle title="Todo Testing">
        <TodoTestingPage />
      </PageTitle>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/settings',
    element: (
      <DashboardContainer>
        <SettingsRerouter></SettingsRerouter>
      </DashboardContainer>
    ),
  }),
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

  ...ProjectRouterWrapper({
    path: projectSettingsRoutes.pieces,
    element: (
      <DashboardContainer>
        <PageTitle title="Pieces">
          <ProjectSettingsLayout>
            <ProjectPiecesPage />
          </ProjectSettingsLayout>
        </PageTitle>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: projectSettingsRoutes.team,
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_PROJECT_MEMBER}>
          <PageTitle title="Team">
            <ProjectSettingsLayout>
              <ProjectMembersPage />
            </ProjectSettingsLayout>
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),
  {
    path: '/team',
    element: <Navigate to={projectSettingsRoutes.team} replace></Navigate>,
  },

  ...ProjectRouterWrapper({
    path: '/mcps',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_MCP}>
          <PageTitle title="MCP">
            <McpServersPage />
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/mcps/:mcpId',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_MCP}>
          <PageTitle title="MCP">
            <McpPage />
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),

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
      <PlatformAdminContainer>
        <PageTitle title="Projects">
          <ProjectsPage />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/setup/pieces',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Pieces">
          <PlatformPiecesPage />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/analytics',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Analytics">
          <div className="flex flex-col gap-4 w-full">
            <PlatformMessages />
            <AnalyticsPage />
          </div>
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Platform">
          <Navigate to="/platform/analytics" />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/setup/connections',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Connections">
          <GlobalConnectionsTable />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/setup/templates',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Templates">
          <TemplatesPage />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/setup/branding',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Branding">
          <BrandingPage />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/users',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Users">
          <UsersPage />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/setup/ai',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="AI">
          <AIProvidersPage />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/security/api-keys',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="API Keys">
          <ApiKeysPage />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/infrastructure/workers',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Workers">
          <SettingsWorkersPage />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/infrastructure/health',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="System Health">
          <SettingsHealthPage />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/infrastructure/triggers',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Trigger Health">
          <TriggerHealthPage />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/setup/billing',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Billing">
          <SettingsBilling />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/setup/billing/success',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Billing">
          <Success />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/setup/billing/error',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Billing">
          <Error />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/security/signing-keys',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Signing Keys">
          <SigningKeysPage />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/security/sso',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="SSO">
          <SSOPage />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/security/project-roles',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Project Roles">
          <ProjectRolePage />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/security/project-roles/:projectRoleId',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Project Role Users">
          <ProjectRoleUsersTable />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/setup',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Platform Setup">
          <Navigate to="/platform/setup/ai" replace />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/infrastructure',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Platform Infrastructure">
          <Navigate to="/platform/infrastructure/workers" replace />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/security',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Platform Security">
          <Navigate to="/platform/security/audit-logs" replace />
        </PageTitle>
      </PlatformAdminContainer>
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
