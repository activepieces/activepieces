import { useEffect, useMemo } from 'react';
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
import { AcceptInvitation } from '@/features/team/component/accept-invitation';
import { authenticationSession } from '@/lib/authentication-session';
import { combinePaths, parentWindow } from '@/lib/utils';
import { Permission } from '@activepieces/shared';
import {
  ActivepiecesClientEventName,
  ActivepiecesVendorEventName,
  ActivepiecesVendorRouteChanged,
} from 'ee-embed-sdk';

import { ApTableStateProvider } from '../../features/tables/components/ap-table-state-provider';
import { DashboardContainer } from '../components/dashboard-container';
import { PlatformAdminContainer } from '../components/platform-admin-container';
import ProjectSettingsLayout from '../components/project-settings-layout';
import NotFoundPage from '../routes/404-page';
import { ApTablesPage } from '../routes/ap-tables';
import { ApTableEditorPage } from '../routes/ap-tables/id';
import AuthenticatePage from '../routes/authenticate';
import { ChangePasswordPage } from '../routes/change-password';
import { AppConnectionsPage } from '../routes/connections';
import { EmbeddedConnectionDialog } from '../routes/embed/embedded-connection-dialog';
import { FlowsPage } from '../routes/flows';
import { FlowBuilderPage } from '../routes/flows/id';
import { ResetPasswordPage } from '../routes/forget-password';
import { FormPage } from '../routes/forms';
import McpPage from '../routes/mcp';
import SettingsBilling from '../routes/platform/billing';
import SettingsHealthPage from '../routes/platform/infra/health';
import SettingsWorkersPage from '../routes/platform/infra/workers';
import { PlatformMessages } from '../routes/platform/notifications/platform-messages';
import ProjectsPage from '../routes/platform/projects';
import AuditLogsPage from '../routes/platform/security/audit-logs';
import { ProjectRolePage } from '../routes/platform/security/project-role';
import { ProjectRoleUsersTable } from '../routes/platform/security/project-role/project-role-users-table';
import { GlobalConnectionsTable } from '../routes/platform/setup/connections';
import { LicenseKeyPage } from '../routes/platform/setup/license-key';
import TemplatesPage from '../routes/platform/setup/templates';
import UsersPage from '../routes/platform/users';
import { ProjectReleasesPage } from '../routes/project-release';
import ViewRelease from '../routes/project-release/view-release';
import { FlowRunPage } from '../routes/runs/id';
import AlertsPage from '../routes/settings/alerts';
import AppearancePage from '../routes/settings/appearance';
import { EnvironmentPage } from '../routes/settings/environment';
import GeneralPage from '../routes/settings/general';
import TeamPage from '../routes/settings/team';
import { SignInPage } from '../routes/sign-in';
import { SignUpPage } from '../routes/sign-up';
import { ShareTemplatePage } from '../routes/templates/share-template';
import { TodosPage } from '../routes/todos';
import { TodoTestingPage } from '../routes/todos/id';

import { AfterImportFlowRedirect } from './after-import-flow-redirect';
import { DefaultRoute } from './default-route';
import { RoutePermissionGuard } from './permission-guard';
import {
  ProjectRouterWrapper,
  TokenCheckerWrapper,
} from './project-route-wrapper';

const SettingsRerouter = () => {
  const { hash } = useLocation();
  const fragmentWithoutHash = hash.slice(1).toLowerCase();
  return fragmentWithoutHash ? (
    <Navigate to={`/settings/${fragmentWithoutHash}`} replace />
  ) : (
    <Navigate to="/settings/general" replace />
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
    path: '/releases/:releaseId',
    element: (
      <DashboardContainer>
        <PageTitle title="Releases">
          <ViewRelease />
        </PageTitle>
      </DashboardContainer>
    ),
  }),
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
      <DashboardContainer removeGutters removeBottomPadding>
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
    path: '/releases',
    element: (
      <DashboardContainer>
        <PageTitle title="Releases">
          <ProjectReleasesPage />
        </PageTitle>
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
  ...ProjectRouterWrapper({
    path: '/settings/alerts',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_ALERT}>
          <PageTitle title="Alerts">
            <ProjectSettingsLayout>
              <AlertsPage />
            </ProjectSettingsLayout>
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/settings/appearance',
    element: (
      <DashboardContainer>
        <PageTitle title="Appearance">
          <ProjectSettingsLayout>
            <AppearancePage />
          </ProjectSettingsLayout>
        </PageTitle>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/settings/general',
    element: (
      <DashboardContainer>
        <PageTitle title="General">
          <ProjectSettingsLayout>
            <GeneralPage />
          </ProjectSettingsLayout>
        </PageTitle>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/settings/pieces',
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
    path: '/settings/team',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_PROJECT_MEMBER}>
          <PageTitle title="Team">
            <ProjectSettingsLayout>
              <TeamPage />
            </ProjectSettingsLayout>
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),
  {
    path: '/team',
    element: <Navigate to="/settings/team" replace></Navigate>,
  },

  ...ProjectRouterWrapper({
    path: '/settings/environments',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_PROJECT_RELEASE}>
          <PageTitle title="Environments">
            <ProjectSettingsLayout>
              <EnvironmentPage />
            </ProjectSettingsLayout>
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),

  ...ProjectRouterWrapper({
    path: '/mcp',
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
    path: '/platform/security/audit-logs',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Audit Logs">
          <AuditLogsPage />
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
    path: '/platform/setup/license-key',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="License Key">
          <LicenseKeyPage />
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

const ApRouter = () => {
  const { embedState } = useEmbedding();
  const projectId = authenticationSession.getProjectId();
  const router = useMemo(() => {
    return embedState.isEmbedded
      ? createMemoryRouter(routes, {
          initialEntries: [window.location.pathname],
        })
      : createBrowserRouter(routes);
  }, [embedState.isEmbedded]);

  useEffect(() => {
    if (!embedState.isEmbedded) {
      return;
    }

    const handleVendorRouteChange = (
      event: MessageEvent<ActivepiecesVendorRouteChanged>,
    ) => {
      if (
        event.source === parentWindow &&
        event.data.type === ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED
      ) {
        const targetRoute = event.data.data.vendorRoute;
        const targetRouteRequiresProjectId =
          targetRoute.includes('/runs') ||
          targetRoute.includes('/flows') ||
          targetRoute.includes('/connections');
        if (!targetRouteRequiresProjectId) {
          router.navigate(targetRoute);
        } else {
          router.navigate(
            combinePaths({
              secondPath: targetRoute,
              firstPath: `/projects/${projectId}`,
            }),
          );
        }
      }
    };

    window.addEventListener('message', handleVendorRouteChange);

    return () => {
      window.removeEventListener('message', handleVendorRouteChange);
    };
  }, [embedState.isEmbedded, router.navigate]);

  useEffect(() => {
    if (!embedState.isEmbedded) {
      return;
    }
    router.subscribe((state) => {
      const pathNameWithoutProjectOrProjectId = state.location.pathname.replace(
        /\/projects\/[^/]+/,
        '',
      );
      parentWindow.postMessage(
        {
          type: ActivepiecesClientEventName.CLIENT_ROUTE_CHANGED,
          data: {
            route: pathNameWithoutProjectOrProjectId + state.location.search,
          },
        },
        '*',
      );
    });
  }, [router, embedState.isEmbedded]);

  return <RouterProvider router={router}></RouterProvider>;
};

export { ApRouter };
