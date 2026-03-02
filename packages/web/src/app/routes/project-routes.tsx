import { Permission } from '@activepieces/shared';
import { Navigate, useLocation } from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { routesThatRequireProjectId } from '@/lib/route-utils';

import { ApTableStateProvider } from '../../features/tables/components/ap-table-state-provider';
import { BuilderLayout } from '../components/builder-layout';
import { ProjectDashboardLayout } from '../components/project-layout';
import { AfterImportFlowRedirect } from '../guards/after-import-flow-redirect';
import { RoutePermissionGuard } from '../guards/permission-guard';
import { ProjectRouterWrapper } from '../guards/project-route-wrapper';

import { AppConnectionsPage } from './connections';
import { FlowsPage } from './flows';
import { FlowBuilderPage } from './flows/id';
import AnalyticsPage from './impact';
import LeaderboardPage from './leaderboard';
import { ProjectReleasesPage } from './project-release';
import ViewRelease from './project-release/view-release';
import { RunsPage } from './runs';
import { FlowRunPage } from './runs/id';
import { ApTablesPage } from './tables';
import { ApTableEditorPage } from './tables/id';

const SettingsRerouter = () => {
  const { hash } = useLocation();
  const fragmentWithoutHash = hash.slice(1).toLowerCase();
  return fragmentWithoutHash ? (
    <Navigate to={`/settings/${fragmentWithoutHash}`} replace />
  ) : (
    <Navigate to="/settings/team" replace />
  );
};

export const projectRoutes = [
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
          <BuilderLayout>
            <FlowBuilderPage />
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
      <RoutePermissionGuard permission={Permission.READ_RUN}>
        <PageTitle title="Flow Run">
          <BuilderLayout>
            <FlowRunPage />
          </BuilderLayout>
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
          <BuilderLayout>
            <ApTableStateProvider>
              <ApTableEditorPage />
            </ApTableStateProvider>
          </BuilderLayout>
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
];
