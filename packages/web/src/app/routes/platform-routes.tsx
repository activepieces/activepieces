import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { Error, Success } from '@/features/billing';

import { PlatformLayout } from '../components/platform-layout';

const SettingsBilling = React.lazy(() => import('./platform/billing'));
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
const SecretManagersPage = React.lazy(
  () => import('./platform/security/secret-managers'),
);
const SigningKeysPage = React.lazy(() =>
  import('./platform/security/signing-keys').then((m) => ({
    default: m.SigningKeysPage,
  })),
);
const SSOPage = React.lazy(() =>
  import('./platform/security/sso').then((m) => ({ default: m.SSOPage })),
);
const AIProvidersPage = React.lazy(() => import('./platform/setup/ai'));
const PlatformMcpPage = React.lazy(() => import('./platform/setup/mcp'));
const BrandingPage = React.lazy(() =>
  import('./platform/setup/branding').then((m) => ({
    default: m.BrandingPage,
  })),
);
const GlobalConnectionsTable = React.lazy(() =>
  import('./platform/setup/connections').then((m) => ({
    default: m.GlobalConnectionsTable,
  })),
);
const PlatformPiecesPage = React.lazy(() =>
  import('./platform/setup/pieces').then((m) => ({
    default: m.PlatformPiecesPage,
  })),
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
        <PageTitle title="AI">
          <SuspenseWrapper>
            <AIProvidersPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/mcp',
    element: (
      <PlatformLayout>
        <PageTitle title="MCP Server">
          <SuspenseWrapper>
            <PlatformMcpPage />
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
          <SuspenseWrapper>
            <PlatformPiecesPage />
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
          <SuspenseWrapper>
            <GlobalConnectionsTable />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/templates',
    element: (
      <PlatformLayout>
        <PageTitle title="Templates">
          <SuspenseWrapper>
            <PlatformTemplatesPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/branding',
    element: (
      <PlatformLayout>
        <PageTitle title="Branding">
          <SuspenseWrapper>
            <BrandingPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
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
          <SuspenseWrapper>
            <ApiKeysPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/secret-managers',
    element: (
      <PlatformLayout>
        <PageTitle title="Secret managers">
          <SuspenseWrapper>
            <SecretManagersPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/audit-logs',
    element: (
      <PlatformLayout>
        <PageTitle title="Audit Logs">
          <SuspenseWrapper>
            <AuditLogsPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/signing-keys',
    element: (
      <PlatformLayout>
        <PageTitle title="Embedding">
          <SuspenseWrapper>
            <SigningKeysPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/sso',
    element: (
      <PlatformLayout>
        <PageTitle title="SSO">
          <SuspenseWrapper>
            <SSOPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/project-roles',
    element: (
      <PlatformLayout>
        <PageTitle title="Project Roles">
          <SuspenseWrapper>
            <ProjectRolePage />
          </SuspenseWrapper>
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
          <SuspenseWrapper>
            <SettingsWorkersPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/health',
    element: (
      <PlatformLayout>
        <PageTitle title="System Health">
          <SuspenseWrapper>
            <SettingsHealthPage />
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
          <SuspenseWrapper>
            <EventDestinationsPage />
          </SuspenseWrapper>
        </PageTitle>
      </PlatformLayout>
    ),
  },
];
