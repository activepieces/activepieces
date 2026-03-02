import { Navigate } from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { Error, Success } from '@/features/billing';

import { PlatformLayout } from '../components/platform-layout';

import SettingsBilling from './platform/billing';
import EventDestinationsPage from './platform/infra/event-destinations';
import SettingsHealthPage from './platform/infra/health';
import TriggerHealthPage from './platform/infra/triggers';
import SettingsWorkersPage from './platform/infra/workers';
import ProjectsPage from './platform/projects';
import { ApiKeysPage } from './platform/security/api-keys';
import AuditLogsPage from './platform/security/audit-logs';
import { ProjectRolePage } from './platform/security/project-role';
import { ProjectRoleUsersTable } from './platform/security/project-role/project-role-users-table';
import SecretManagersPage from './platform/security/secret-managers';
import { SigningKeysPage } from './platform/security/signing-keys';
import { SSOPage } from './platform/security/sso';
import AIProvidersPage from './platform/setup/ai';
import { BrandingPage } from './platform/setup/branding';
import { GlobalConnectionsTable } from './platform/setup/connections';
import { PlatformPiecesPage } from './platform/setup/pieces';
import { PlatformTemplatesPage } from './platform/setup/templates';
import UsersPage from './platform/users';

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
          <ProjectsPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/users',
    element: (
      <PlatformLayout>
        <PageTitle title="Users">
          <UsersPage />
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
          <AIProvidersPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/pieces',
    element: (
      <PlatformLayout>
        <PageTitle title="Pieces">
          <PlatformPiecesPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/connections',
    element: (
      <PlatformLayout>
        <PageTitle title="Connections">
          <GlobalConnectionsTable />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/templates',
    element: (
      <PlatformLayout>
        <PageTitle title="Templates">
          <PlatformTemplatesPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/branding',
    element: (
      <PlatformLayout>
        <PageTitle title="Branding">
          <BrandingPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/setup/billing',
    element: (
      <PlatformLayout>
        <PageTitle title="Billing">
          <SettingsBilling />
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
          <ApiKeysPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/secret-managers',
    element: (
      <PlatformLayout>
        <PageTitle title="Secret managers">
          <SecretManagersPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/audit-logs',
    element: (
      <PlatformLayout>
        <PageTitle title="Audit Logs">
          <AuditLogsPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/signing-keys',
    element: (
      <PlatformLayout>
        <PageTitle title="Signing Keys">
          <SigningKeysPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/sso',
    element: (
      <PlatformLayout>
        <PageTitle title="SSO">
          <SSOPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/project-roles',
    element: (
      <PlatformLayout>
        <PageTitle title="Project Roles">
          <ProjectRolePage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/security/project-roles/:projectRoleId',
    element: (
      <PlatformLayout>
        <PageTitle title="Project Role Users">
          <ProjectRoleUsersTable />
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
          <SettingsWorkersPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/health',
    element: (
      <PlatformLayout>
        <PageTitle title="System Health">
          <SettingsHealthPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/triggers',
    element: (
      <PlatformLayout>
        <PageTitle title="Trigger Health">
          <TriggerHealthPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
  {
    path: '/platform/infrastructure/event-destinations',
    element: (
      <PlatformLayout>
        <PageTitle title="Event Streaming">
          <EventDestinationsPage />
        </PageTitle>
      </PlatformLayout>
    ),
  },
];
