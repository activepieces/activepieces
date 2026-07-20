import { Permission } from '@activepieces/core-utils';
import React, { Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { ApTableStateProvider } from '@/features/tables';
import { lazyWithRetry } from '@/lib/lazy-with-retry';
import { routesThatRequireProjectId } from '@/lib/route-utils';

import { ProjectDashboardLayout } from '../components/project-layout';
import { AfterImportFlowRedirect } from '../guards/after-import-flow-redirect';
import { DefaultRoute } from '../guards/default-route';
import { RoutePermissionGuard } from '../guards/permission-guard';
import { ProjectRouterWrapper } from '../guards/project-route-wrapper';

import { AutomationsPage } from './automations';
const FlowBuilderPage = lazyWithRetry(
  () => import('./flows/id').then((m) => ({ default: m.FlowBuilderPage })),
  'flow-builder',
);
const AnalyticsPage = lazyWithRetry(() => import('./impact'), 'analytics');
const ProjectReleasesPage = lazyWithRetry(
  () =>
    import('./project-release').then((m) => ({
      default: m.ProjectReleasesPage,
    })),
  'project-releases',
);
const ViewRelease = lazyWithRetry(
  () => import('./project-release/view-release'),
  'view-release',
);
const RunsPage = lazyWithRetry(
  () => import('./runs').then((m) => ({ default: m.RunsPage })),
  'runs',
);
const FlowRunPage = lazyWithRetry(
  () => import('./runs/id').then((m) => ({ default: m.FlowRunPage })),
  'flow-run',
);
const AppConnectionsPage = lazyWithRetry(
  () =>
    import('./connections').then((m) => ({ default: m.AppConnectionsPage })),
  'connections',
);
const VariablesPage = lazyWithRetry(
  () => import('./variables').then((m) => ({ default: m.VariablesPage })),
  'variables',
);
const ApTableEditorPage = lazyWithRetry(
  () => import('./tables/id').then((m) => ({ default: m.ApTableEditorPage })),
  'table-editor',
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

// Project-scoped child of the `/projects/:projectId` shell route. Paths are
// RELATIVE (the parent owns the prefix), and the parent already ran the auth
// guard + project switch (TokenCheckerWrapper) before the shell rendered, so
// children carry only permissions and the page itself.
const shellChild = (path: string, element: React.ReactNode) => ({
  path: path.startsWith('/') ? path.slice(1) : path,
  element,
});

// The bare `/automations` → `/projects/:id/automations` redirect half only.
const bareRedirect = (path: string) =>
  ProjectRouterWrapper({ path, element: <></> }).slice(1);

export const projectShellRoutes = [
  // Bare /projects/:projectId has no Stage resource. DefaultRoute folds the operator
  // app into the canonical chat landing (/chat, Stage closed, no project selected),
  // and folds an embed into its default surface (/automations) — an embed never lands
  // on /chat. The parent already ran TokenCheckerWrapper, so the session project is set.
  { index: true, element: <DefaultRoute /> },
  shellChild(
    routesThatRequireProjectId.automations,
    <RoutePermissionGuard requiredPermissions={automationsPagePermissions}>
      <PageTitle title="Flows">
        <SuspenseWrapper>
          <AutomationsPage />
        </SuspenseWrapper>
      </PageTitle>
    </RoutePermissionGuard>,
  ),
  shellChild(
    routesThatRequireProjectId.flows,
    <Navigate to={routesThatRequireProjectId.automations} replace />,
  ),
  shellChild(
    routesThatRequireProjectId.singleFlow,
    <RoutePermissionGuard requiredPermissions={Permission.READ_FLOW}>
      <PageTitle title="Builder">
        <SuspenseWrapper>
          <FlowBuilderPage />
        </SuspenseWrapper>
      </PageTitle>
    </RoutePermissionGuard>,
  ),
  shellChild(
    '/flow-import-redirect/:flowId',
    <AfterImportFlowRedirect></AfterImportFlowRedirect>,
  ),
  shellChild(
    routesThatRequireProjectId.singleRun,
    <RoutePermissionGuard requiredPermissions={Permission.READ_RUN}>
      <PageTitle title="Flow Run">
        <SuspenseWrapper>
          <FlowRunPage />
        </SuspenseWrapper>
      </PageTitle>
    </RoutePermissionGuard>,
  ),
  shellChild(
    routesThatRequireProjectId.runs,
    <RoutePermissionGuard requiredPermissions={Permission.READ_RUN}>
      <PageTitle title="Runs">
        <SuspenseWrapper>
          <RunsPage />
        </SuspenseWrapper>
      </PageTitle>
    </RoutePermissionGuard>,
  ),
  shellChild(
    routesThatRequireProjectId.singleRelease,
    <PageTitle title="Releases">
      <SuspenseWrapper>
        <ViewRelease />
      </SuspenseWrapper>
    </PageTitle>,
  ),
  shellChild(
    routesThatRequireProjectId.tables,
    <Navigate to={routesThatRequireProjectId.automations} replace />,
  ),
  shellChild(
    routesThatRequireProjectId.singleTable,
    <HideTablesGuard>
      <RoutePermissionGuard requiredPermissions={Permission.READ_TABLE}>
        <PageTitle title="Table">
          <ApTableStateProvider>
            <SuspenseWrapper>
              <ApTableEditorPage />
            </SuspenseWrapper>
          </ApTableStateProvider>
        </PageTitle>
      </RoutePermissionGuard>
    </HideTablesGuard>,
  ),
  shellChild(
    routesThatRequireProjectId.connections,
    <RoutePermissionGuard requiredPermissions={Permission.READ_APP_CONNECTION}>
      <PageTitle title="Connections">
        <SuspenseWrapper>
          <AppConnectionsPage />
        </SuspenseWrapper>
      </PageTitle>
    </RoutePermissionGuard>,
  ),
  shellChild(
    routesThatRequireProjectId.variables,
    <RoutePermissionGuard requiredPermissions={Permission.READ_VARIABLE}>
      <PageTitle title="Variables">
        <SuspenseWrapper>
          <VariablesPage />
        </SuspenseWrapper>
      </PageTitle>
    </RoutePermissionGuard>,
  ),
  shellChild(
    routesThatRequireProjectId.releases,
    <PageTitle title="Releases">
      <SuspenseWrapper>
        <ProjectReleasesPage />
      </SuspenseWrapper>
    </PageTitle>,
  ),
  shellChild(
    routesThatRequireProjectId.settings,
    <SettingsRerouter></SettingsRerouter>,
  ),
];

// Analytics surfaces are not project-scoped paths; keep them full-page for now.
export const projectStandaloneRoutes = [
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
];

export const projectBareRedirects = [
  ...bareRedirect(routesThatRequireProjectId.automations),
  ...bareRedirect(routesThatRequireProjectId.flows),
  ...bareRedirect(routesThatRequireProjectId.singleFlow),
  ...bareRedirect('/flow-import-redirect/:flowId'),
  ...bareRedirect(routesThatRequireProjectId.singleRun),
  ...bareRedirect(routesThatRequireProjectId.runs),
  ...bareRedirect(routesThatRequireProjectId.singleRelease),
  ...bareRedirect(routesThatRequireProjectId.tables),
  ...bareRedirect(routesThatRequireProjectId.singleTable),
  ...bareRedirect(routesThatRequireProjectId.connections),
  ...bareRedirect(routesThatRequireProjectId.variables),
  ...bareRedirect(routesThatRequireProjectId.releases),
  ...bareRedirect(routesThatRequireProjectId.settings),
];
