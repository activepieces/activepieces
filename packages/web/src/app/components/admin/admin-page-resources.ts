import { AdminControl } from '@/lib/admin-control';

import { AdminResource } from './admin-resources';

const docs = ({
  label,
  path,
  control,
}: {
  label: string;
  path: string;
  control?: AdminControl;
}): AdminResource => ({
  kind: 'doc',
  label,
  url: `${DOCS_BASE_URL}/${path}`,
  control,
});

const video = ({
  label,
  file,
}: {
  label: string;
  file: string;
}): AdminResource => ({
  kind: 'video',
  label,
  url: `${VIDEOS_BASE_URL}/${file}.mp4`,
});

const DOCS_BASE_URL = 'https://www.activepieces.com/docs';
const VIDEOS_BASE_URL = 'https://cdn.activepieces.com/videos/docs';

export const adminPageResources = {
  projects: [
    docs({
      label: 'Projects guide',
      path: 'admin-guide/guides/structure-projects',
    }),
    video({
      label: 'Personal and team projects',
      file: 'Personal-and-team-projects',
    }),
    video({ label: 'Creating projects', file: 'Creating-Projects' }),
  ],
  users: [
    docs({ label: 'Users guide', path: 'admin-guide/guides/permissions' }),
    video({ label: 'Invite a user', file: 'Invite-user-to-platfom' }),
    video({ label: 'Change a user role', file: 'Edit-user-role' }),
  ],
  roles: [
    docs({
      label: 'Users and roles guide',
      path: 'admin-guide/guides/permissions',
    }),
  ],
  connections: [
    docs({
      label: 'Connections guide',
      path: 'admin-guide/guides/connections',
    }),
  ],
  globalConnections: [
    docs({
      label: 'Global connections guide',
      path: 'admin-guide/guides/global-connections',
    }),
    video({
      label: 'Create a global connection with OAuth2',
      file: 'Create-Global-Connection-With-Oauth-2',
    }),
  ],
  aiProviders: [
    docs({
      label: 'AI providers guide',
      path: 'admin-guide/guides/setup-ai-providers',
    }),
    video({ label: 'Connect an AI provider', file: 'Connect-to-AI-Provider' }),
  ],
  aiCapabilities: [
    docs({
      label: 'AI capabilities guide',
      path: 'admin-guide/guides/ai-capabilities',
    }),
    video({ label: 'Set up AI capabilities', file: 'Set-up-ai-capabilities' }),
  ],
  pieces: [
    docs({ label: 'Pieces guide', path: 'admin-guide/guides/manage-pieces' }),
  ],
  templates: [
    docs({ label: 'Templates guide', path: 'admin-guide/guides/templates' }),
  ],
  general: [
    docs({
      label: 'General settings guide',
      path: 'admin-guide/guides/general',
    }),
  ],
  usage: [docs({ label: 'Usage guide', path: 'admin-guide/guides/usage' })],
  apiKeys: [docs({ label: 'API reference', path: 'endpoints/overview' })],
  secretManagers: [
    docs({
      label: 'Secret managers guide',
      path: 'admin-guide/guides/secret-managers/overview',
    }),
  ],
  auditLogs: [
    docs({
      label: 'Audit logs guide',
      path: 'admin-guide/security/audit-logs/overview',
    }),
  ],
  eventStreaming: [
    docs({
      label: 'Event streaming guide',
      path: 'admin-guide/guides/event-streaming',
    }),
  ],
  embedding: [
    docs({
      label: 'Embedding overview',
      path: 'embedding/overview',
      control: AdminControl.EMBEDDING_DOCS_LINK,
    }),
    docs({
      label: 'Embedding admin guide',
      path: 'admin-guide/guides/embedding',
    }),
  ],
  sso: [
    docs({ label: 'SSO setup guide', path: 'admin-guide/guides/sso' }),
    docs({
      label: 'SCIM provisioning',
      path: 'admin-guide/guides/scim/overview',
    }),
  ],
  workers: [
    docs({ label: 'Workers guide', path: 'admin-guide/guides/workers' }),
    docs({
      label: 'Worker groups',
      path: 'install/configure-operate/worker-groups',
      control: AdminControl.WORKERS_DOCS_LINK,
    }),
  ],
  health: [
    docs({ label: 'Health guide', path: 'admin-guide/guides/health' }),
    docs({
      label: 'Production setup',
      path: 'install/configure-operate/production-setup',
      control: AdminControl.HEALTH_PRODUCTION_SETUP_LINK,
    }),
  ],
  triggers: [
    docs({
      label: 'Trigger health guide',
      path: 'admin-guide/guides/trigger-health',
    }),
  ],
  mcp: [
    docs({ label: 'MCP server guide', path: 'mcp/overview' }),
    docs({ label: 'MCP tools reference', path: 'mcp/tools' }),
  ],
  configurations: [
    docs({ label: 'Telemetry', path: 'install/configure-operate/telemetry' }),
  ],
} satisfies Record<string, AdminResource[]>;
