import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { Error, Success } from '@/features/billing';

import { PlatformLayout } from '../components/platform-layout';

import { LegacyPathRedirect } from './platform/legacy-path-redirect';
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
const RoleDetailPage = React.lazy(() =>
  import('./platform/security/project-role/role-detail-page').then((m) => ({
    default: m.RoleDetailPage,
  })),
);
const RolesComparePage = React.lazy(() =>
  import('./platform/security/project-role/roles-compare-page').then((m) => ({
    default: m.RolesComparePage,
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
const AIKeyDetailPage = React.lazy(() =>
  import('./platform/setup/ai/key-detail-page').then((m) => ({
    default: m.AIKeyDetailPage,
  })),
);
const PlatformMcpPage = React.lazy(() => import('./platform/setup/mcp'));
const GeneralPage = React.lazy(() =>
  import('./platform/setup/general').then((m) => ({
    default: m.GeneralPage,
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
        <PageTitle title="Members">
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
    path: '/platform/ai',
    element: (
      <PlatformLayout>
        <PageTitle title="AI">
          <LegacyTabRedirect basePath="/platform/ai" tabPaths={AI_TAB_PATHS}>
            <PlanFeatureSample feature="aiProviders">
              <SuspenseWrapper>
                <AIProvidersPage />
              </SuspenseWrapper>
            </PlanFeatureSample>
          </LegacyTabRedirect>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/ai/capabilities',
    element: <Navigate to="/platform/ai" replace />,
  },
  {
    path: '/platform/ai/keys/:id',
    element: (
      <PlatformLayout>
        <PageTitle title="AI">
          <SuspenseWrapper>
            <AIKeyDetailPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/mcp',
    element: (
      <PlatformLayout>
        <PageTitle title="MCP tools">
          <SuspenseWrapper>
            <PlatformMcpPage section="access" />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/mcp/tools',
    element: <Navigate to="/platform/mcp" replace />,
  },
  {
    path: '/platform/mcp/activity',
    element: (
      <PlatformLayout>
        <PageTitle title="MCP activity">
          <SuspenseWrapper>
            <PlatformMcpPage section="activity" />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/pieces',
    element: (
      <PlatformLayout>
        <PageTitle title="Pieces">
          <LegacyTabRedirect
            basePath="/platform/pieces"
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
    path: '/platform/pieces/piece-sets',
    element: (
      <PlatformLayout>
        <PageTitle title="Piece sets">
          <LegacyTabRedirect
            basePath="/platform/pieces"
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
    path: '/platform/pieces/piece-sets/:id',
    element: (
      <PlatformLayout>
        <PageTitle title="Piece set">
          <SuspenseWrapper>
            <PieceSetDetailsPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/connections/global',
    element: <Navigate to="/platform/connections?scope=global" replace />,
  },
  {
    path: '/platform/templates',
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
    path: '/platform/general',
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
    path: '/platform/billing',
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
    path: '/platform/billing/usage',
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
    path: '/platform/billing/success',
    element: (
      <PlatformLayout>
        <PageTitle title="Billing">
          <Success />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/billing/error',
    element: (
      <PlatformLayout>
        <PageTitle title="Billing">
          <Error />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/api-keys',
    element: (
      <PlatformLayout>
        <PageTitle title="API keys">
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
    path: '/platform/secret-managers',
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
    path: '/platform/audit-log',
    element: (
      <PlatformLayout>
        <PageTitle title="Audit log">
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
    path: '/platform/embedding',
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
    path: '/platform/sso',
    element: (
      <PlatformLayout>
        <PageTitle title="Single sign-on">
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
    path: '/platform/users/roles',
    element: (
      <PlatformLayout>
        <PageTitle title="Roles">
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
    path: '/platform/users/roles/compare',
    element: (
      <PlatformLayout>
        <PageTitle title="Compare roles">
          <PlanFeatureSample feature="projectRoles">
            <SuspenseWrapper>
              <RolesComparePage />
            </SuspenseWrapper>
          </PlanFeatureSample>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/users/roles/:roleId',
    element: (
      <PlatformLayout>
        <PageTitle title="Role">
          <PlanFeatureSample feature="projectRoles">
            <SuspenseWrapper>
              <RoleDetailPage />
            </SuspenseWrapper>
          </PlanFeatureSample>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/workers',
    element: (
      <PlatformLayout>
        <PageTitle title="Workers">
          <LegacyTabRedirect
            basePath="/platform/workers"
            tabPaths={WORKERS_TAB_PATHS}
          >
            <SuspenseWrapper>
              <SettingsWorkersPage section="machines" />
            </SuspenseWrapper>
          </LegacyTabRedirect>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/workers/groups',
    element: (
      <PlatformLayout>
        <PageTitle title="Worker groups">
          <LegacyTabRedirect
            basePath="/platform/workers"
            tabPaths={WORKERS_TAB_PATHS}
          >
            <PlanFeatureSample feature="workerGroups">
              <SuspenseWrapper>
                <SettingsWorkersPage section="groups" />
              </SuspenseWrapper>
            </PlanFeatureSample>
          </LegacyTabRedirect>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/health',
    element: (
      <PlatformLayout>
        <PageTitle title="System health">
          <LegacyTabRedirect
            basePath="/platform/health"
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
    path: '/platform/health/runs',
    element: (
      <PlatformLayout>
        <PageTitle title="Runs health">
          <LegacyTabRedirect
            basePath="/platform/health"
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
    path: '/platform/health/queue',
    element: (
      <PlatformLayout>
        <PageTitle title="Queue health">
          <LegacyTabRedirect
            basePath="/platform/health"
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
    path: '/platform/configurations',
    element: <Navigate to="/platform/general" replace />,
  },
  {
    path: '/platform/health/triggers',
    element: (
      <PlatformLayout>
        <PageTitle title="Trigger health">
          <SuspenseWrapper>
            <TriggerHealthPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/audit-log/streaming',
    element: (
      <PlatformLayout>
        <PageTitle title="Event streaming">
          <PlanFeatureSample feature="eventStreaming">
            <SuspenseWrapper>
              <EventDestinationsPage />
            </SuspenseWrapper>
          </PlanFeatureSample>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  ...[
    '/platform/setup/*',
    '/platform/security/*',
    '/platform/infrastructure/*',
  ].map((path) => ({ path, element: <LegacyPathRedirect /> })),
  {
    path: '/platform/triggers',
    element: <Navigate to="/platform/health/triggers" replace />,
  },
  {
    path: '/platform/usage',
    element: <Navigate to="/platform/billing/usage" replace />,
  },
];
