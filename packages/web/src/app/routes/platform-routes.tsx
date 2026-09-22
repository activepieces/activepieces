import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { Error, Success } from '@/features/billing';

import { PlatformLayout } from '../components/platform-layout';

import { LegacyTabRedirect } from './platform/legacy-tab-redirect';
import { PlanFeatureSample } from './platform/plan-feature-sample';

const SettingsBilling = React.lazy(() =>
  import('./platform/billing').then((m) => ({ default: m.BillingPlanTab })),
);
const SettingsUsage = React.lazy(() =>
  import('./platform/billing').then((m) => ({ default: m.BillingUsageTab })),
);
const EventDestinationsPage = React.lazy(
  () => import('./platform/infra/event-destinations'),
);
const SettingsHealthPage = React.lazy(() => import('./platform/infra/health'));
const PlatformConfigurationsPage = React.lazy(() =>
  import('./platform/infra/configurations').then((m) => ({
    default: m.ConfigurationsPage,
  })),
);
const TriggerHealthPage = React.lazy(() => import('./platform/infra/triggers'));
const SettingsWorkersPage = React.lazy(
  () => import('./platform/infra/workers'),
);
const ProjectsPage = React.lazy(() => import('./platform/projects'));
const ApiKeysPage = React.lazy(() =>
  import('./platform/security/api-keys').then((m) => ({
    default: m.ApiKeysPage,
  })),
);
const AuditLogsPage = React.lazy(
  () => import('./platform/security/audit-logs'),
);
const ProjectRolePage = React.lazy(() =>
  import('./platform/security/project-role').then((m) => ({
    default: m.ProjectRolePage,
  })),
);
const SecretManagersPage = React.lazy(
  () => import('./platform/security/secret-managers'),
);
const EmbedPage = React.lazy(() =>
  import('./platform/security/embed').then((m) => ({
    default: m.EmbedPage,
  })),
);
const SSOPage = React.lazy(() =>
  import('./platform/security/sso').then((m) => ({ default: m.SSOPage })),
);
const AIProvidersPage = React.lazy(() => import('./platform/setup/ai'));
const PlatformMcpPage = React.lazy(() => import('./platform/setup/mcp'));
const GeneralPage = React.lazy(() =>
  import('./platform/setup/general').then((m) => ({
    default: m.GeneralPage,
  })),
);
const GlobalConnectionsTable = React.lazy(() =>
  import('./platform/setup/connections').then((m) => ({
    default: m.GlobalConnectionsTable,
  })),
);
const PiecesListPage = React.lazy(() =>
  import('./platform/setup/pieces').then((m) => ({
    default: m.PiecesListTab,
  })),
);
const PieceSetsPage = React.lazy(() =>
  import('./platform/setup/pieces/piece-sets/piece-sets-tab').then((m) => ({
    default: m.PieceSetsTab,
  })),
);
const PieceSetDetailsPage = React.lazy(() =>
  import('./platform/setup/pieces/piece-sets/piece-set-details-page').then(
    (m) => ({ default: m.PieceSetDetailsPage }),
  ),
);
const PlatformTemplatesPage = React.lazy(() =>
  import('./platform/setup/templates').then((m) => ({
    default: m.PlatformTemplatesPage,
  })),
);
const UsersPage = React.lazy(() => import('./platform/users'));
const PlatformConnectionsPage = React.lazy(
  () => import('./platform/connections'),
);

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteLoadingBar />}>{children}</Suspense>;
}

const HEALTH_TAB_PATHS = { system: '', runs: 'runs', queue: 'queue' };
const WORKERS_TAB_PATHS = { health: '', 'worker-groups': 'groups' };
const AI_TAB_PATHS = { providers: '', capabilities: 'capabilities' };
const PIECES_TAB_PATHS = { pieces: '', 'piece-sets': 'piece-sets' };

export const platformRoutes = [
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
    path: '/platform/projects',
    element: (
      <PlatformLayout>
        <PageTitle title="Projects">
          <SuspenseWrapper>
            <ProjectsPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/users',
    element: (
      <PlatformLayout>
        <PageTitle title="Users">
          <SuspenseWrapper>
            <UsersPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/connections',
    element: (
      <PlatformLayout>
        <PageTitle title="Connections">
          <SuspenseWrapper>
            <PlatformConnectionsPage />
          </SuspenseWrapper>
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
    path: '/platform/setup/ai',
    element: (
      <PlatformLayout>
        <PageTitle title="AI Center">
          <LegacyTabRedirect
            basePath="/platform/setup/ai"
            tabPaths={AI_TAB_PATHS}
          >
            <SuspenseWrapper>
              <AIProvidersPage section="providers" />
            </SuspenseWrapper>
          </LegacyTabRedirect>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/ai/capabilities',
    element: (
      <PlatformLayout>
        <PageTitle title="AI Capabilities">
          <LegacyTabRedirect
            basePath="/platform/setup/ai"
            tabPaths={AI_TAB_PATHS}
          >
            <SuspenseWrapper>
              <AIProvidersPage section="capabilities" />
            </SuspenseWrapper>
          </LegacyTabRedirect>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/ai-capabilities',
    element: <Navigate to="/platform/setup/ai/capabilities" replace />,
  },
  {
    path: '/platform/setup/mcp',
    element: (
      <PlatformLayout>
        <PageTitle title="MCP Server">
          <SuspenseWrapper>
            <PlatformMcpPage section="connection" />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/mcp/tools',
    element: (
      <PlatformLayout>
        <PageTitle title="MCP Tools">
          <SuspenseWrapper>
            <PlatformMcpPage section="tools" />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/mcp/activity',
    element: (
      <PlatformLayout>
        <PageTitle title="MCP Activity">
          <SuspenseWrapper>
            <PlatformMcpPage section="activity" />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/pieces',
    element: (
      <PlatformLayout>
        <PageTitle title="Pieces">
          <LegacyTabRedirect
            basePath="/platform/setup/pieces"
            tabPaths={PIECES_TAB_PATHS}
          >
            <SuspenseWrapper>
              <PiecesListPage />
            </SuspenseWrapper>
          </LegacyTabRedirect>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/pieces/piece-sets',
    element: (
      <PlatformLayout>
        <PageTitle title="Piece Sets">
          <LegacyTabRedirect
            basePath="/platform/setup/pieces"
            tabPaths={PIECES_TAB_PATHS}
          >
            <SuspenseWrapper>
              <PieceSetsPage />
            </SuspenseWrapper>
          </LegacyTabRedirect>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/pieces/piece-sets/:id',
    element: (
      <PlatformLayout>
        <PageTitle title="Piece Set">
          <SuspenseWrapper>
            <PieceSetDetailsPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/connections',
    element: (
      <PlatformLayout>
        <PageTitle title="Connections">
          <PlanFeatureSample feature="globalConnections">
            <SuspenseWrapper>
              <GlobalConnectionsTable />
            </SuspenseWrapper>
          </PlanFeatureSample>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/templates',
    element: (
      <PlatformLayout>
        <PageTitle title="Templates">
          <PlanFeatureSample feature="templates">
            <SuspenseWrapper>
              <PlatformTemplatesPage />
            </SuspenseWrapper>
          </PlanFeatureSample>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/general',
    element: (
      <PlatformLayout>
        <PageTitle title="General">
          <SuspenseWrapper>
            <GeneralPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/branding',
    element: <Navigate to="/platform/setup/general" replace />,
  },
  {
    path: '/platform/setup/billing',
    element: (
      <PlatformLayout>
        <PageTitle title="Billing">
          <SuspenseWrapper>
            <SettingsBilling />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/usage',
    element: (
      <PlatformLayout>
        <PageTitle title="Usage">
          <SuspenseWrapper>
            <SettingsUsage />
          </SuspenseWrapper>
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
    path: '/platform/security/api-keys',
    element: (
      <PlatformLayout>
        <PageTitle title="API Keys">
          <PlanFeatureSample feature="apiKeys">
            <SuspenseWrapper>
              <ApiKeysPage />
            </SuspenseWrapper>
          </PlanFeatureSample>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/secret-managers',
    element: (
      <PlatformLayout>
        <PageTitle title="Secret managers">
          <PlanFeatureSample feature="secretManagers">
            <SuspenseWrapper>
              <SecretManagersPage />
            </SuspenseWrapper>
          </PlanFeatureSample>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/audit-logs',
    element: (
      <PlatformLayout>
        <PageTitle title="Audit Logs">
          <PlanFeatureSample feature="auditLogs">
            <SuspenseWrapper>
              <AuditLogsPage />
            </SuspenseWrapper>
          </PlanFeatureSample>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/embed',
    element: (
      <PlatformLayout>
        <PageTitle title="Embedding">
          <PlanFeatureSample feature="embedding">
            <SuspenseWrapper>
              <EmbedPage />
            </SuspenseWrapper>
          </PlanFeatureSample>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/sso',
    element: (
      <PlatformLayout>
        <PageTitle title="SSO">
          <PlanFeatureSample feature="sso">
            <SuspenseWrapper>
              <SSOPage />
            </SuspenseWrapper>
          </PlanFeatureSample>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/project-roles',
    element: (
      <PlatformLayout>
        <PageTitle title="Project Roles">
          <PlanFeatureSample feature="projectRoles">
            <SuspenseWrapper>
              <ProjectRolePage />
            </SuspenseWrapper>
          </PlanFeatureSample>
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
    path: '/platform/infrastructure/workers',
    element: (
      <PlatformLayout>
        <PageTitle title="Workers">
          <LegacyTabRedirect
            basePath="/platform/infrastructure/workers"
            tabPaths={WORKERS_TAB_PATHS}
          >
            <SuspenseWrapper>
              <SettingsWorkersPage section="health" />
            </SuspenseWrapper>
          </LegacyTabRedirect>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/workers/groups',
    element: (
      <PlatformLayout>
        <PageTitle title="Worker Groups">
          <LegacyTabRedirect
            basePath="/platform/infrastructure/workers"
            tabPaths={WORKERS_TAB_PATHS}
          >
            <SuspenseWrapper>
              <SettingsWorkersPage section="worker-groups" />
            </SuspenseWrapper>
          </LegacyTabRedirect>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/health',
    element: (
      <PlatformLayout>
        <PageTitle title="Health">
          <LegacyTabRedirect
            basePath="/platform/infrastructure/health"
            tabPaths={HEALTH_TAB_PATHS}
          >
            <SuspenseWrapper>
              <SettingsHealthPage section="system" />
            </SuspenseWrapper>
          </LegacyTabRedirect>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/health/runs',
    element: (
      <PlatformLayout>
        <PageTitle title="Runs Health">
          <LegacyTabRedirect
            basePath="/platform/infrastructure/health"
            tabPaths={HEALTH_TAB_PATHS}
          >
            <SuspenseWrapper>
              <SettingsHealthPage section="runs" />
            </SuspenseWrapper>
          </LegacyTabRedirect>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/health/queue',
    element: (
      <PlatformLayout>
        <PageTitle title="Queue Health">
          <LegacyTabRedirect
            basePath="/platform/infrastructure/health"
            tabPaths={HEALTH_TAB_PATHS}
          >
            <SuspenseWrapper>
              <SettingsHealthPage section="queue" />
            </SuspenseWrapper>
          </LegacyTabRedirect>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/configurations',
    element: (
      <PlatformLayout>
        <PageTitle title="Configurations">
          <SuspenseWrapper>
            <PlatformConfigurationsPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/triggers',
    element: (
      <PlatformLayout>
        <PageTitle title="Trigger Health">
          <SuspenseWrapper>
            <TriggerHealthPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/event-destinations',
    element: (
      <PlatformLayout>
        <PageTitle title="Event Streaming">
          <PlanFeatureSample feature="eventStreaming">
            <SuspenseWrapper>
              <EventDestinationsPage />
            </SuspenseWrapper>
          </PlanFeatureSample>
        </PageTitle>
      </PlatformLayout>
    ),
  },
];
