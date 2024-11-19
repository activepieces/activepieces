import { useEffect, useMemo } from 'react';
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  createMemoryRouter,
  useLocation,
} from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import PlatformSettingsLayout from '@/app/components/platform-settings-layout';
import ProjectSettingsLayout from '@/app/components/project-settings-layout';
import { ChatPage } from '@/app/routes/chat';
import { EmbedPage } from '@/app/routes/embed';
import AIProvidersPage from '@/app/routes/platform/ai-providers';
import AnalyticsPage from '@/app/routes/platform/analytics';
import { PlatformPiecesPage } from '@/app/routes/platform/pieces';
import { ApiKeysPage } from '@/app/routes/platform/settings/api-keys';
import { BrandingPage } from '@/app/routes/platform/settings/branding';
import { SigningKeysPage } from '@/app/routes/platform/settings/signing-keys';
import { SSOPage } from '@/app/routes/platform/settings/sso';
import { RedirectPage } from '@/app/routes/redirect';
import { FlowRunsPage } from '@/app/routes/runs';
import { ProjectPiecesPage } from '@/app/routes/settings/pieces';
import { useEmbedding } from '@/components/embed-provider';
import { VerifyEmail } from '@/features/authentication/components/verify-email';
import { AcceptInvitation } from '@/features/team/component/accept-invitation';
import { ApFlagId } from '@activepieces/shared';
import {
  ActivepiecesClientEventName,
  ActivepiecesVendorEventName,
  ActivepiecesVendorRouteChanged,
} from 'ee-embed-sdk';

import { AllowOnlyLoggedInUserOnlyGuard } from '../components/allow-logged-in-user-only-guard';
import { DashboardContainer } from '../components/dashboard-container';
import { PlatformAdminContainer } from '../components/platform-admin-container';
import NotFoundPage from '../routes/404-page';
import AuthenticatePage from '../routes/authenticate';
import { ChangePasswordPage } from '../routes/change-password';
import { AppConnectionsPage } from '../routes/connections';
import { EmbeddedConnectionDialog } from '../routes/embed/embedded-connection-dialog';
import { FlowsPage } from '../routes/flows';
import { FlowBuilderPage } from '../routes/flows/id';
import { ResetPasswordPage } from '../routes/forget-password';
import { FormPage } from '../routes/forms';
import IssuesPage from '../routes/issues';
import PlansPage from '../routes/plans';
import AuditLogsPage from '../routes/platform/audit-logs';
import { GlobalConnectionsTable } from '../routes/platform/connections';
import { AINotification } from '../routes/platform/notifications/ai-notification';
import ProjectsPage from '../routes/platform/projects';
import { LicenseKeyPage } from '../routes/platform/settings/license-key';
import TemplatesPage from '../routes/platform/templates';
import UsersPage from '../routes/platform/users';
import { FlowRunPage } from '../routes/runs/id';
import AlertsPage from '../routes/settings/alerts';
import AppearancePage from '../routes/settings/appearance';
import GeneralPage from '../routes/settings/general';
import { GitSyncPage } from '../routes/settings/git-sync';
import TeamPage from '../routes/settings/team';
import { SignInPage } from '../routes/sign-in';
import { SignUpPage } from '../routes/sign-up';
import { ShareTemplatePage } from '../routes/templates/share-template';

import { AfterImportFlowRedirect } from './after-import-flow-redirect';
import { FlagRouteGuard } from './flag-route-guard';
import { ProjectRouterWrapper } from './project-route-wrapper';

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
        <PageTitle title="Flows">
          <FlowsPage />
        </PageTitle>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/flows/:flowId',
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <PageTitle title="Builder">
          <FlowBuilderPage />
        </PageTitle>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/flow-import-redirect/:flowId',
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <AfterImportFlowRedirect></AfterImportFlowRedirect>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
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
      <AllowOnlyLoggedInUserOnlyGuard>
        <PageTitle title="Flow Run">
          <FlowRunPage />
        </PageTitle>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  }),
  {
    path: '/templates/:templateId',
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <PageTitle title="Share Template">
          <ShareTemplatePage />
        </PageTitle>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  },
  ...ProjectRouterWrapper({
    path: '/runs',
    element: (
      <DashboardContainer>
        <PageTitle title="Runs">
          <FlowRunsPage />
        </PageTitle>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/issues',
    element: (
      <DashboardContainer>
        <PageTitle title="Issues">
          <IssuesPage />
        </PageTitle>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/connections',
    element: (
      <DashboardContainer>
        <PageTitle title="Connections">
          <AppConnectionsPage />
        </PageTitle>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/plans',
    element: (
      <FlagRouteGuard flag={ApFlagId.SHOW_BILLING}>
        <DashboardContainer>
          <PageTitle title="Plans">
            <PlansPage />
          </PageTitle>
        </DashboardContainer>
      </FlagRouteGuard>
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
        <ProjectSettingsLayout>
          <PageTitle title="Alerts">
            <AlertsPage />
          </PageTitle>
        </ProjectSettingsLayout>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/settings/appearance',
    element: (
      <DashboardContainer>
        <ProjectSettingsLayout>
          <PageTitle title="Appearance">
            <AppearancePage />
          </PageTitle>
        </ProjectSettingsLayout>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/settings/general',
    element: (
      <DashboardContainer>
        <ProjectSettingsLayout>
          <PageTitle title="General">
            <GeneralPage />
          </PageTitle>
        </ProjectSettingsLayout>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/settings/pieces',
    element: (
      <DashboardContainer>
        <ProjectSettingsLayout>
          <PageTitle title="Pieces">
            <ProjectPiecesPage />
          </PageTitle>
        </ProjectSettingsLayout>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/settings/team',
    element: (
      <DashboardContainer>
        <ProjectSettingsLayout>
          <PageTitle title="Team">
            <TeamPage />
          </PageTitle>
        </ProjectSettingsLayout>
      </DashboardContainer>
    ),
  }),
  {
    path: '/team',
    element: <Navigate to="/settings/team" replace></Navigate>,
  },

  ...ProjectRouterWrapper({
    path: '/settings/git-sync',
    element: (
      <DashboardContainer>
        <ProjectSettingsLayout>
          <PageTitle title="Git Sync">
            <GitSyncPage />
          </PageTitle>
        </ProjectSettingsLayout>
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
    path: '/platform/pieces',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Platform Pieces">
          <PlatformPiecesPage />
        </PageTitle>
      </PlatformAdminContainer>
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
    path: '/platform/connections',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Connections">
          <GlobalConnectionsTable />
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
            <AINotification />
            <AnalyticsPage />
          </div>
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/templates',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Templates">
          <TemplatesPage />
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
    path: '/platform/settings/branding',
    element: (
      <PlatformAdminContainer>
        <PlatformSettingsLayout>
          <PageTitle title="Branding">
            <BrandingPage />
          </PageTitle>
        </PlatformSettingsLayout>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/settings/users',
    element: (
      <PlatformAdminContainer>
        <PlatformSettingsLayout>
          <PageTitle title="Users">
            <UsersPage />
          </PageTitle>
        </PlatformSettingsLayout>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/settings/ai',
    element: (
      <PlatformAdminContainer>
        <PlatformSettingsLayout>
          <PageTitle title="Universal AI">
            <AIProvidersPage />
          </PageTitle>
        </PlatformSettingsLayout>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/settings/api-keys',
    element: (
      <PlatformAdminContainer>
        <PlatformSettingsLayout>
          <PageTitle title="API Keys">
            <ApiKeysPage />
          </PageTitle>
        </PlatformSettingsLayout>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/settings/audit-logs',
    element: (
      <PlatformAdminContainer>
        <PlatformSettingsLayout>
          <PageTitle title="Audit Logs">
            <AuditLogsPage />
          </PageTitle>
        </PlatformSettingsLayout>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/settings/signing-keys',
    element: (
      <PlatformAdminContainer>
        <PlatformSettingsLayout>
          <PageTitle title="Signing Keys">
            <SigningKeysPage />
          </PageTitle>
        </PlatformSettingsLayout>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/settings/sso',
    element: (
      <PlatformAdminContainer>
        <PlatformSettingsLayout>
          <PageTitle title="SSO">
            <SSOPage />
          </PageTitle>
        </PlatformSettingsLayout>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/settings/license-key',
    element: (
      <PlatformAdminContainer>
        <PlatformSettingsLayout>
          <PageTitle title="LicenseKey">
            <LicenseKeyPage />
          </PageTitle>
        </PlatformSettingsLayout>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/platform/settings',
    element: (
      <PlatformAdminContainer>
        <PageTitle title="Platform Settings">
          <Navigate to="/platform/settings/branding" replace />
        </PageTitle>
      </PlatformAdminContainer>
    ),
  },
  {
    path: '/redirect',
    element: <RedirectPage></RedirectPage>,
  },
  {
    path: '/*',
    element: (
      <PageTitle title="Redirect">
        <Navigate to="/flows" replace />
      </PageTitle>
    ),
  },
];
const ApRouter = () => {
  const { embedState } = useEmbedding();

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
        event.source === window.parent &&
        event.data.type === ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED
      ) {
        const targetRoute = event.data.data.vendorRoute;
        router.navigate(targetRoute);
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
      window.parent.postMessage(
        {
          type: ActivepiecesClientEventName.CLIENT_ROUTE_CHANGED,
          data: {
            route: state.location.pathname,
          },
        },
        '*',
      );
    });
  }, [router, embedState.isEmbedded]);

  return <RouterProvider router={router}></RouterProvider>;
};

export { ApRouter };
