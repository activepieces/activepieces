import { t } from 'i18next';
import { matchPath } from 'react-router-dom';

import { AppLinkProvider } from '@/components/prompt-kit/app-link';
import { chatPanelUtils } from '@/features/workspace/lib/chat-panel-open';
import { routesThatRequireProjectId } from '@/lib/route-utils';

export function ChatAppLinks({ children }: { children: React.ReactNode }) {
  return <AppLinkProvider value={HANDLERS}>{children}</AppLinkProvider>;
}

function label(route: string): string {
  const path = pathOf(route);
  if (path === PLATFORM || path.startsWith(`${PLATFORM}/`)) {
    const page = PLATFORM_PAGES.find(({ pattern }) =>
      matchPath({ path: pattern, end: false }, path),
    );
    return page ? page.name() : t('Platform Admin');
  }
  const inProject = path.replace(/^\/projects\/[^/]+/, '');
  const page = PAGES.find(({ pattern }) =>
    matchPath({ path: pattern, end: false }, inProject),
  );
  return page ? page.name() : t('Open page');
}

function pathOf(route: string): string {
  return route.split(/[?#]/)[0];
}

const PAGES: { pattern: string; name: () => string }[] = [
  { pattern: routesThatRequireProjectId.singleFlow, name: () => t('Flow') },
  { pattern: routesThatRequireProjectId.singleTable, name: () => t('Table') },
  { pattern: routesThatRequireProjectId.singleRun, name: () => t('Run') },
  {
    pattern: routesThatRequireProjectId.singleConnection,
    name: () => t('Connection'),
  },
  { pattern: routesThatRequireProjectId.singleAgent, name: () => t('Agent') },
  { pattern: routesThatRequireProjectId.flows, name: () => t('Flows') },
  { pattern: routesThatRequireProjectId.tables, name: () => t('Tables') },
  { pattern: routesThatRequireProjectId.runs, name: () => t('Runs') },
  {
    pattern: routesThatRequireProjectId.connections,
    name: () => t('Connections'),
  },
  {
    pattern: routesThatRequireProjectId.automations,
    name: () => t('Automations'),
  },
  { pattern: routesThatRequireProjectId.variables, name: () => t('Variables') },
  { pattern: routesThatRequireProjectId.releases, name: () => t('Releases') },
  { pattern: routesThatRequireProjectId.approvals, name: () => t('Approvals') },
  { pattern: routesThatRequireProjectId.settings, name: () => t('Settings') },
];

const PLATFORM = '/platform';

const PLATFORM_PAGES: { pattern: string; name: () => string }[] = [
  { pattern: '/platform/projects', name: () => t('Projects') },
  { pattern: '/platform/users', name: () => t('Users') },
  {
    pattern: '/platform/connections/global',
    name: () => t('Global connections'),
  },
  { pattern: '/platform/ai', name: () => t('AI') },
  { pattern: '/platform/mcp', name: () => t('MCP') },
  { pattern: '/platform/pieces', name: () => t('Pieces') },
  { pattern: '/platform/templates', name: () => t('Templates') },
  { pattern: '/platform/billing', name: () => t('Billing') },
  { pattern: '/platform/usage', name: () => t('Usage') },
  { pattern: '/platform/api-keys', name: () => t('API Keys') },
  { pattern: '/platform/secret-managers', name: () => t('Secret Managers') },
  { pattern: '/platform/audit-log', name: () => t('Audit Logs') },
  { pattern: '/platform/sso', name: () => t('SSO') },
  { pattern: '/platform/embedding', name: () => t('Embedding') },
  { pattern: '/platform/workers', name: () => t('Workers') },
  { pattern: '/platform/health', name: () => t('Health') },
  { pattern: '/platform/general', name: () => t('General') },
];

const HANDLERS = {
  open: ({ route, name }: { route: string; name: string }) =>
    chatPanelUtils.openBeside({ route, push: true, name }),
  label,
};

export const chatAppLinkUtils = {
  label,
};
