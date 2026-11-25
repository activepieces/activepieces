import { Permission } from '@activepieces/core-utils';
import React, { Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { ApTableStateProvider } from '@/features/tables';
import { lazyWithRetry } from '@/lib/lazy-with-retry';
import { routesThatRequireProjectId } from '@/lib/route-utils';
import { shellHandles } from '@/lib/shell-handle';

import { AfterImportFlowRedirect } from '../guards/after-import-flow-redirect';
import { AgentsFlagGuard } from '../guards/agents-flag-guard';
import { RoutePermissionGuard } from '../guards/permission-guard';
import { ProjectRouterWrapper } from '../guards/project-route-wrapper';

import { ApprovalsPage } from './approvals';
import { AutomationsPage } from './automations';
import { LegacyPiecesRedirect } from './mcp-server/legacy-pieces-redirect';
import { McpReachGuard } from './mcp-server/mcp-reach-guard';

const AgentEditorPage = lazyWithRetry(
  () => import('./agents/id').then((m) => ({ default: m.AgentEditorPage })),
  'agent-editor',
);
const FlowBuilderPage = lazyWithRetry(
  () => import('./flows/id').then((m) => ({ default: m.FlowBuilderPage })),
  'flow-builder',
);
const AnalyticsPage = lazyWithRetry(() => import('./impact'), 'analytics');
const McpServerPage = lazyWithRetry(() => import('./mcp-server'), 'mcp-server');
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

const agentEditorElement = (
  <AgentsFlagGuard>
    <RoutePermissionGuard requiredPermissions={[Permission.READ_AGENT]}>
      <PageTitle title="Agent">
        <SuspenseWrapper>
          <AgentEditorPage />
        </SuspenseWrapper>
      </PageTitle>
    </RoutePermissionGuard>
  </AgentsFlagGuard>
);

export const projectRoutes = [
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleAgent,
    handle: shellHandles.project,
    element: agentEditorElement,
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleAgentRuns,
    handle: shellHandles.project,
    element: agentEditorElement,
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.automations,
    handle: shellHandles.projectWithHeader,
    element: (
      <RoutePermissionGuard requiredPermissions={automationsPagePermissions}>
        <PageTitle title="Flows">
          <SuspenseWrapper>
            <AutomationsPage />
          </SuspenseWrapper>
        </PageTitle>
      </RoutePermissionGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.flows,
    handle: shellHandles.projectWithHeader,
    element: <Navigate to={routesThatRequireProjectId.automations} replace />,
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleFlow,
    handle: shellHandles.builder,
    element: (
      <RoutePermissionGuard requiredPermissions={Permission.READ_FLOW}>
        <PageTitle title="Builder">
          <SuspenseWrapper>
            <FlowBuilderPage />
          </SuspenseWrapper>
        </PageTitle>
      </RoutePermissionGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/flow-import-redirect/:flowId',
    handle: shellHandles.builder,
    element: <AfterImportFlowRedirect></AfterImportFlowRedirect>,
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleRun,
    handle: shellHandles.builder,
    element: (
      <RoutePermissionGuard requiredPermissions={Permission.READ_RUN}>
        <PageTitle title="Flow Run">
          <SuspenseWrapper>
            <FlowRunPage />
          </SuspenseWrapper>
        </PageTitle>
      </RoutePermissionGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.runs,
    handle: shellHandles.projectWithHeader,
    element: (
      <RoutePermissionGuard requiredPermissions={Permission.READ_RUN}>
        <PageTitle title="Runs">
          <SuspenseWrapper>
            <RunsPage />
          </SuspenseWrapper>
        </PageTitle>
      </RoutePermissionGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleRelease,
    handle: shellHandles.projectWithHeader,
    element: (
      <PageTitle title="Releases">
        <SuspenseWrapper>
          <ViewRelease />
        </SuspenseWrapper>
      </PageTitle>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.tables,
    handle: shellHandles.projectWithHeader,
    element: <Navigate to={routesThatRequireProjectId.automations} replace />,
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.singleTable,
    handle: shellHandles.builder,
    element: (
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
      </HideTablesGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.connections,
    handle: shellHandles.projectWithHeader,
    element: (
      <RoutePermissionGuard
        requiredPermissions={Permission.READ_APP_CONNECTION}
      >
        <PageTitle title="Connections">
          <SuspenseWrapper>
            <AppConnectionsPage />
          </SuspenseWrapper>
        </PageTitle>
      </RoutePermissionGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.variables,
    handle: shellHandles.projectWithHeader,
    element: (
      <RoutePermissionGuard requiredPermissions={Permission.READ_VARIABLE}>
        <PageTitle title="Variables">
          <SuspenseWrapper>
            <VariablesPage />
          </SuspenseWrapper>
        </PageTitle>
      </RoutePermissionGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.releases,
    handle: shellHandles.projectWithHeader,
    element: (
      <PageTitle title="Releases">
        <SuspenseWrapper>
          <ProjectReleasesPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.approvals,
    handle: shellHandles.projectWithHeader,
    element: (
      <RoutePermissionGuard requiredPermissions={Permission.READ_FLOW}>
        <PageTitle title="Pending approvals">
          <SuspenseWrapper>
            <ApprovalsPage />
          </SuspenseWrapper>
        </PageTitle>
      </RoutePermissionGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: routesThatRequireProjectId.settings,
    handle: shellHandles.projectWithHeader,
    element: <SettingsRerouter></SettingsRerouter>,
  }),
  {
    path: '/impact',
    handle: shellHandles.project,
    element: (
      <PageTitle title="Impact">
        <SuspenseWrapper>
          <AnalyticsPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/mcp-server/pieces',
    handle: shellHandles.project,
    element: <LegacyPiecesRedirect />,
  },
  {
    path: '/mcp-server/:tab?',
    handle: shellHandles.project,
    element: (
      <McpReachGuard>
        <PageTitle title="MCP Server">
          <SuspenseWrapper>
            <McpServerPage />
          </SuspenseWrapper>
        </PageTitle>
      </McpReachGuard>
    ),
  },
];
