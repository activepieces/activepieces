import { t } from 'i18next';
import { useMemo, useState } from 'react';
import { matchPath } from 'react-router-dom';

import { AppLinkProvider, useAppLinks } from '@/components/prompt-kit/app-link';
import {
  AnyToolPart,
  ChatUIMessage,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
import {
  ResourceRef,
  resourceRegistry,
} from '@/features/chat/lib/resources/registry';
import { chatPanelUtils } from '@/features/workspace/lib/chat-panel-open';
import { routesThatRequireProjectId } from '@/lib/route-utils';

export function ChatAppLinks({ children }: { children: React.ReactNode }) {
  return <AppLinkProvider value={HANDLERS}>{children}</AppLinkProvider>;
}

export function ChatResourceLinks({
  messages,
  children,
}: {
  messages: ChatUIMessage[];
  children: React.ReactNode;
}) {
  const outer = useAppLinks();
  const latest = resourcesIn(messages);
  const latestKey = keyOf(latest);
  const [shown, setShown] = useState({ key: latestKey, resources: latest });
  if (shown.key !== latestKey) {
    setShown({ key: latestKey, resources: latest });
  }
  const resources = shown.resources;
  const handlers = useMemo(() => {
    if (!outer) return null;
    return {
      ...outer,
      label: (route: string) =>
        resourceName({ route, resources }) ?? outer.label(route),
    };
  }, [outer, resources]);
  if (!handlers) return <>{children}</>;
  return <AppLinkProvider value={handlers}>{children}</AppLinkProvider>;
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

function resourceName({
  route,
  resources,
}: {
  route: string;
  resources: ResourceRef[];
}): string | null {
  const path = pathOf(route);
  const match = resources.findLast((ref) =>
    resourceRegistry.isOn({ pathname: path, ref }),
  );
  return match?.name ?? null;
}

function resourcesIn(messages: ChatUIMessage[]): ResourceRef[] {
  return messages.flatMap((message) =>
    message.parts.flatMap((part) => {
      if (!chatPartUtils.isAnyToolPart(part)) return [];
      if (part.state !== 'output-available') return [];
      const ref = finishedOutputRef(part);
      return ref ? [ref] : [];
    }),
  );
}

function finishedOutputRef(part: AnyToolPart): ResourceRef | null {
  const cached = finishedOutputs.get(part);
  if (cached !== undefined) return cached;
  const ref = resourceRegistry.resolve(part.output)?.ref ?? null;
  finishedOutputs.set(part, ref);
  return ref;
}

function keyOf(resources: ResourceRef[]): string {
  return resources
    .map((ref) => `${resourceRegistry.keyOf(ref)}@${ref.projectId}=${ref.name}`)
    .join('|');
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

const finishedOutputs = new WeakMap<AnyToolPart, ResourceRef | null>();

const HANDLERS = {
  open: ({ route, name }: { route: string; name: string }) =>
    chatPanelUtils.openBeside({ route, push: true, name }),
  label,
};

export const chatAppLinkUtils = {
  label,
  resourceName,
  resourcesIn,
};
