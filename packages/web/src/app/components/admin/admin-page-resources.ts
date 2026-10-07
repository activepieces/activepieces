import { t } from 'i18next';

import { AdminControl } from '@/lib/admin-control';

import { AdminResource } from './admin-resources';

const docs = ({
  label,
  path,
  control,
}: {
  label: () => string;
  path: string;
  control?: AdminControl;
}): AdminResource => ({
  kind: 'doc',
  label,
  url: `${DOCS_BASE_URL}/${path}`,
  control,
});

const DOCS_BASE_URL = 'https://www.activepieces.com/docs';

export const adminPageResources = {
  projects: [
    docs({
      label: () => t('Projects guide'),
      path: 'admin-guide/guides/structure-projects',
    }),
  ],
  users: [
    docs({
      label: () => t('Users guide'),
      path: 'admin-guide/guides/permissions',
    }),
  ],
  roles: [
    docs({
      label: () => t('Users and roles guide'),
      path: 'admin-guide/guides/permissions',
    }),
  ],
  connections: [
    docs({
      label: () => t('Connections guide'),
      path: 'admin-guide/guides/connections',
    }),
  ],
  globalConnections: [
    docs({
      label: () => t('Global connections guide'),
      path: 'admin-guide/guides/global-connections',
    }),
  ],
  aiProviders: [
    docs({
      label: () => t('AI providers guide'),
      path: 'admin-guide/guides/setup-ai-providers',
    }),
  ],
  aiCapabilities: [
    docs({
      label: () => t('AI capabilities guide'),
      path: 'admin-guide/guides/ai-capabilities',
    }),
  ],
  pieces: [
    docs({
      label: () => t('Pieces guide'),
      path: 'admin-guide/guides/manage-pieces',
    }),
  ],
  templates: [
    docs({
      label: () => t('Templates guide'),
      path: 'admin-guide/guides/templates',
    }),
  ],
  general: [
    docs({
      label: () => t('General settings guide'),
      path: 'admin-guide/guides/general',
    }),
  ],
  usage: [
    docs({ label: () => t('Usage guide'), path: 'admin-guide/guides/usage' }),
  ],
  apiKeys: [
    docs({ label: () => t('API reference'), path: 'endpoints/overview' }),
  ],
  secretManagers: [
    docs({
      label: () => t('Secret managers guide'),
      path: 'admin-guide/guides/secret-managers/overview',
    }),
  ],
  auditLogs: [
    docs({
      label: () => t('Audit logs guide'),
      path: 'admin-guide/security/audit-logs/overview',
    }),
  ],
  eventStreaming: [
    docs({
      label: () => t('Event streaming guide'),
      path: 'admin-guide/guides/event-streaming',
    }),
  ],
  embedding: [
    docs({
      label: () => t('Embedding overview'),
      path: 'embedding/overview',
      control: AdminControl.EMBEDDING_DOCS_LINK,
    }),
    docs({
      label: () => t('Embedding admin guide'),
      path: 'admin-guide/guides/embedding',
    }),
  ],
  sso: [
    docs({ label: () => t('SSO setup guide'), path: 'admin-guide/guides/sso' }),
    docs({
      label: () => t('SCIM provisioning'),
      path: 'admin-guide/guides/scim/overview',
    }),
  ],
  workers: [
    docs({
      label: () => t('Workers guide'),
      path: 'admin-guide/guides/workers',
    }),
    docs({
      label: () => t('Worker groups'),
      path: 'install/configure-operate/worker-groups',
      control: AdminControl.WORKERS_DOCS_LINK,
    }),
  ],
  health: [
    docs({ label: () => t('Health guide'), path: 'admin-guide/guides/health' }),
    docs({
      label: () => t('Production setup'),
      path: 'install/configure-operate/production-setup',
      control: AdminControl.HEALTH_PRODUCTION_SETUP_LINK,
    }),
  ],
  triggers: [
    docs({
      label: () => t('Trigger health guide'),
      path: 'admin-guide/guides/trigger-health',
    }),
  ],
  mcp: [
    docs({ label: () => t('MCP server guide'), path: 'mcp/overview' }),
    docs({ label: () => t('MCP tools reference'), path: 'mcp/tools' }),
  ],
  configurations: [
    docs({
      label: () => t('Telemetry'),
      path: 'install/configure-operate/telemetry',
    }),
  ],
} satisfies Record<string, AdminResource[]>;
