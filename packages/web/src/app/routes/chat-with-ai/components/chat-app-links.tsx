import { t } from 'i18next';
import { useMemo } from 'react';
import { matchPath } from 'react-router-dom';

import { AppLinkProvider, useAppLinks } from '@/components/prompt-kit/app-link';
import { ChatUIMessage, chatPartUtils } from '@/features/chat/lib/chat-types';
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
  const handlers = useMemo(() => {
    if (!outer) return null;
    return {
      ...outer,
      label: (route: string) =>
        resourceName({ route, resources: resourcesIn(messages) }) ??
        outer.label(route),
    };
  }, [outer, messages]);
  if (!handlers) return <>{children}</>;
  return <AppLinkProvider value={handlers}>{children}</AppLinkProvider>;
}

function label(route: string): string {
  const path = pathOf(route);
  const inProject = path.replace(/^\/projects\/[^/]+/, '');
  const page = PAGES.find(({ pattern }) =>
    matchPath({ path: pattern, end: false }, inProject),
  );
  return page ? page.name() : path;
}

function resourceName({
  route,
  resources,
}: {
  route: string;
  resources: ResourceRef[];
}): string | null {
  const path = pathOf(route);
  const match = resources.findLast((ref) => resourceRegistry.isOn(path, ref));
  return match?.name ?? null;
}

function resourcesIn(messages: ChatUIMessage[]): ResourceRef[] {
  return messages.flatMap((message) =>
    message.parts.flatMap((part) => {
      if (!chatPartUtils.isAnyToolPart(part)) return [];
      if (part.state !== 'output-available') return [];
      const resolved = resourceRegistry.resolve(part.output);
      return resolved ? [resolved.ref] : [];
    }),
  );
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
