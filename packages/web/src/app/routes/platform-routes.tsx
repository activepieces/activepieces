import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { PlatformLayout } from '../components/platform-layout';

const EventDestinationsPage = React.lazy(
  () => import('./platform/infra/event-destinations'),
);
const SettingsHealthPage = React.lazy(() => import('./platform/infra/health'));
const TriggerHealthPage = React.lazy(() => import('./platform/infra/triggers'));
const SettingsWorkersPage = React.lazy(
  () => import('./platform/infra/workers'),
);
const ProjectsPage = React.lazy(() => import('./platform/projects'));
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
