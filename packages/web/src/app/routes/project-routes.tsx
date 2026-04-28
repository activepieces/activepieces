import { Permission } from '@activepieces/shared';
import React, { Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { ApTableStateProvider } from '@/features/tables';
import { routesThatRequireProjectId } from '@/lib/route-utils';

import { BuilderLayout } from '../components/builder-layout';
import { ProjectDashboardLayout } from '../components/project-layout';
import { AfterImportFlowRedirect } from '../guards/after-import-flow-redirect';
import { RoutePermissionGuard } from '../guards/permission-guard';
import { ProjectRouterWrapper } from '../guards/project-route-wrapper';

import { AutomationsPage } from './automations';
import { ChatWithAIPage } from './chat-with-ai';

const FlowBuilderPage = React.lazy(() =>
  import('./flows/id').then((m) => ({ default: m.FlowBuilderPage })),
);
const AnalyticsPage = React.lazy(() => import('./impact'));
const LeaderboardPage = React.lazy(() => import('./leaderboard'));
const UserSettingsLayout = React.lazy(() => import('./user-settings/layout'));
const ProfileSettingsPage = React.lazy(() => import('./user-settings/profile'));
const PreferencesSettingsPage = React.lazy(() => import('./user-settings/preferences'));
const ContactSettingsPage = React.lazy(() => import('./user-settings/contact'));
const ConnectionsSettingsPage = React.lazy(() => import('./user-settings/connections'));
const SecuritySettingsPage = React.lazy(() => import('./user-settings/security'));
const WorkspaceGeneralPage = React.lazy(() => import('./user-settings/workspace/general'));
const WorkspaceAlertsPage = React.lazy(() => import('./user-settings/workspace/alerts'));
const WorkspaceMcpPage = React.lazy(() => import('./user-settings/workspace/mcp'));
const WorkspacePiecesPage = React.lazy(() => import('./user-settings/workspace/pieces'));
const WorkspaceEnvironmentPage = React.lazy(() => import('./user-settings/workspace/environment'));
const WorkspaceMembersPage = React.lazy(() => import('./user-settings/workspace/members'));
const ProjectReleasesPage = React.lazy(() =>
  import('./project-release').then((m) => ({
    default: m.ProjectReleasesPage,
  })),
);
const ViewRelease = React.lazy(() => import('./project-release/view-release'));
const RunsPage = React.lazy(() =>
  import('./runs').then((m) => ({ default: m.RunsPage })),
);
const FlowRunPage = React.lazy(() =>
  import('./runs/id').then((m) => ({ default: m.FlowRunPage })),
);
const AppConnectionsPage = React.lazy(() =>
  import('./connections').then((m) => ({ default: m.AppConnectionsPage })),
);
const ApTableEditorPage = React.lazy(() =>
  import('./tables/id').then((m) => ({ default: m.ApTableEditorPage })),
);

const SettingsRerouter = () => {
  const { hash } = useLocation();
  const fragmentWithoutHash = hash.slice(1).toLowerCase();
  return fragmentWithoutHash ? (
    <Navigate to={`/settings/${fragmentWithoutHash}`} replace />
  ) : (
    <Navigate to="/settings/team" replace />
  );
};

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteLoadingBar />}>{children}</Suspense>;
}

function HideTablesGuard({ children }: { children: React.ReactNode }) {
  const { embedState } = useEmbedding();
  if (embedState.hideTables) {
    return <Navigate to={routesThatRequireProjectId.automations} replace />;
  }
  return <>{children}</>;
}

const automationsPagePermissions = [
  Permission.READ_FLOW,
  Permission.READ_TABLE,
  Permission.READ_FOLDER,
];

export const projectRoutes = [
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.automations,
    element: (
      <ProjectDashboardLayout>
        <RoutePermissionGuard requiredPermissions={automationsPagePermissions}>
          <PageTitle title="Flows">
            <SuspenseWrapper>
              <AutomationsPage />
            </SuspenseWrapper>
          </PageTitle>
        </RoutePermissionGuard>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/chat',
    element: (
      <ProjectDashboardLayout>
        <PageTitle title="Chat">
          <SuspenseWrapper>
            <ChatWithAIPage />
          </SuspenseWrapper>
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/chat/:conversationId',
    element: (
      <ProjectDashboardLayout>
        <PageTitle title="Chat">
          <SuspenseWrapper>
            <ChatWithAIPage />
          </SuspenseWrapper>
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.flows,
    element: <Navigate to={routesThatRequireProjectId.automations} replace />,
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleFlow,
    element: (
      <RoutePermissionGuard requiredPermissions={Permission.READ_FLOW}>
        <PageTitle title="Builder">
          <BuilderLayout>
            <SuspenseWrapper>
              <FlowBuilderPage />
            </SuspenseWrapper>
          </BuilderLayout>
        </PageTitle>
      </RoutePermissionGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/flow-import-redirect/:flowId',
    element: <AfterImportFlowRedirect></AfterImportFlowRedirect>,
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleRun,
    element: (
      <RoutePermissionGuard requiredPermissions={Permission.READ_RUN}>
        <PageTitle title="Flow Run">
          <BuilderLayout>
            <SuspenseWrapper>
              <FlowRunPage />
            </SuspenseWrapper>
          </BuilderLayout>
        </PageTitle>
      </RoutePermissionGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.runs,
    element: (
      <ProjectDashboardLayout>
        <RoutePermissionGuard requiredPermissions={Permission.READ_RUN}>
          <PageTitle title="Runs">
            <SuspenseWrapper>
              <RunsPage />
            </SuspenseWrapper>
          </PageTitle>
        </RoutePermissionGuard>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleRelease,
    element: (
      <ProjectDashboardLayout>
        <PageTitle title="Releases">
          <SuspenseWrapper>
            <ViewRelease />
          </SuspenseWrapper>
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.tables,
    element: <Navigate to={routesThatRequireProjectId.automations} replace />,
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleTable,
    element: (
      <HideTablesGuard>
        <RoutePermissionGuard requiredPermissions={Permission.READ_TABLE}>
          <PageTitle title="Table">
            <BuilderLayout>
              <ApTableStateProvider>
                <SuspenseWrapper>
                  <ApTableEditorPage />
                </SuspenseWrapper>
              </ApTableStateProvider>
            </BuilderLayout>
          </PageTitle>
        </RoutePermissionGuard>
      </HideTablesGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.connections,
    element: (
      <ProjectDashboardLayout>
        <RoutePermissionGuard
          requiredPermissions={Permission.READ_APP_CONNECTION}
        >
          <PageTitle title="Connections">
            <SuspenseWrapper>
              <AppConnectionsPage />
            </SuspenseWrapper>
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
          <SuspenseWrapper>
            <ProjectReleasesPage />
          </SuspenseWrapper>
        </PageTitle>
      </ProjectDashboardLayout>
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
    path: '/impact',
    element: (
      <ProjectDashboardLayout>
        <PageTitle title="Impact">
          <SuspenseWrapper>
            <AnalyticsPage />
          </SuspenseWrapper>
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  },
  {
    path: '/leaderboard',
    element: (
      <ProjectDashboardLayout>
        <PageTitle title="Leaderboard">
          <SuspenseWrapper>
            <LeaderboardPage />
          </SuspenseWrapper>
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  },
  {
    path: '/user-settings',
    element: (
      <ProjectDashboardLayout>
        <PageTitle title="Settings">
          <SuspenseWrapper>
            <UserSettingsLayout />
          </SuspenseWrapper>
        </PageTitle>
      </ProjectDashboardLayout>
    ),
    children: [
      { index: true, element: <Navigate to="/user-settings/profile" replace /> },
      {
        path: 'profile',
        element: (
          <SuspenseWrapper>
            <ProfileSettingsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'contact',
        element: (
          <SuspenseWrapper>
            <ContactSettingsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'connections',
        element: (
          <SuspenseWrapper>
            <ConnectionsSettingsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'security',
        element: (
          <SuspenseWrapper>
            <SecuritySettingsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'preferences',
        element: (
          <SuspenseWrapper>
            <PreferencesSettingsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'workspace/general',
        element: <SuspenseWrapper><WorkspaceGeneralPage /></SuspenseWrapper>,
      },
      {
        path: 'workspace/alerts',
        element: <SuspenseWrapper><WorkspaceAlertsPage /></SuspenseWrapper>,
      },
      {
        path: 'workspace/mcp',
        element: <SuspenseWrapper><WorkspaceMcpPage /></SuspenseWrapper>,
      },
      {
        path: 'workspace/pieces',
        element: <SuspenseWrapper><WorkspacePiecesPage /></SuspenseWrapper>,
      },
      {
        path: 'workspace/environment',
        element: <SuspenseWrapper><WorkspaceEnvironmentPage /></SuspenseWrapper>,
      },
      {
        path: 'workspace/members',
        element: <SuspenseWrapper><WorkspaceMembersPage /></SuspenseWrapper>,
      },
    ],
  },
];
