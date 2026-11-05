import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Bot, Table2, Workflow } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { agentsApi } from '@/features/agents/api/agents';
import { AnyToolPart, chatPartUtils } from '@/features/chat/lib/chat-types';
import { followAlong } from '@/features/chat/lib/follow/follow-along';
import {
  FollowResource,
  FollowResourceKind,
  followResources,
} from '@/features/chat/lib/follow/follow-resources';
import { flowsApi } from '@/features/flows';
import { tablesApi } from '@/features/tables';
import { cn } from '@/lib/utils';

// "Leads table · View": the resource a tool call edited. View opens it beside
// the chat and follows it again.

export function ResourceChips({
  parts,
  className,
}: {
  parts: AnyToolPart[];
  className?: string;
}) {
  const resources = useMemo(() => {
    const seen = new Map<string, FollowResource>();
    for (const part of parts) {
      const resource = resourceOfPart(part);
      if (!resource) continue;
      const key = followResources.keyOf(resource);
      const known = seen.get(key);
      if (!known || (!known.name && resource.name)) seen.set(key, resource);
    }
    return [...seen.values()];
  }, [parts]);
  if (resources.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {resources.map((resource) => (
        <ResourceChip
          key={followResources.keyOf(resource)}
          resource={resource}
        />
      ))}
    </div>
  );
}

export function ToolResourceChip({
  part,
  className,
}: {
  part: AnyToolPart;
  className?: string;
}) {
  const resource = resourceOfPart(part);
  return resource ? (
    <div className={className}>
      <ResourceChip resource={resource} />
    </div>
  ) : null;
}

function ResourceChip({ resource }: { resource: FollowResource }) {
  const { pathname } = useLocation();
  const name = useResourceName(resource);
  const here = followResources.isOn(pathname, resource);
  const Icon = ICONS[resource.kind];
  const noun = NOUNS[resource.kind]();
  const label = name ? withNoun(name, noun) : CAPITALIZED[resource.kind]();

  return (
    <button
      type="button"
      onClick={() => followAlong.view(resource)}
      title={here ? undefined : t('Open beside the chat')}
      className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-gray-6 bg-gray-1 pl-2 pr-2.5 text-xs transition-colors hover:border-gray-7 hover:bg-gray-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-8"
    >
      <Icon className="size-3.5 shrink-0 text-gray-11" aria-hidden />
      <span className="truncate text-gray-12">{label}</span>
      <span className="text-gray-8" aria-hidden>
        ·
      </span>
      <span
        className={cn(
          'shrink-0',
          here ? 'text-gray-11' : 'font-medium text-accent-11',
        )}
      >
        {here ? t('Viewing') : t('View')}
      </span>
    </button>
  );
}

function resourceOfPart(part: AnyToolPart): FollowResource | null {
  if (part.state === 'output-error' || part.state === 'output-denied') {
    return null;
  }
  return followResources.resolve({
    toolName: chatPartUtils.getToolPartName(part),
    input: part.input,
    output: part.state === 'output-available' ? part.output : undefined,
  });
}

function useResourceName(resource: FollowResource): string | null {
  const { data } = useQuery({
    queryKey: ['chat-resource-name', resource.kind, resource.id],
    queryFn: () => FETCH_NAME[resource.kind](resource.id),
    enabled: !resource.name,
    staleTime: 30_000,
    retry: false,
  });
  return resource.name ?? data ?? null;
}

// "Leads" -> "Leads table"; "Leads table" stays as is.
function withNoun(name: string, noun: string): string {
  return name.toLowerCase().endsWith(noun.toLowerCase())
    ? name
    : `${name} ${noun}`;
}

const FETCH_NAME: Record<FollowResourceKind, (id: string) => Promise<string>> =
  {
    flow: (id) => flowsApi.get(id).then((flow) => flow.version.displayName),
    table: (id) => tablesApi.getById(id).then((table) => table.name),
    agent: (id) => agentsApi.get(id).then((agent) => agent.displayName),
  };

const ICONS: Record<FollowResourceKind, typeof Workflow> = {
  flow: Workflow,
  table: Table2,
  agent: Bot,
};

const NOUNS: Record<FollowResourceKind, () => string> = {
  flow: () => t('flow'),
  table: () => t('table'),
  agent: () => t('agent'),
};

const CAPITALIZED: Record<FollowResourceKind, () => string> = {
  flow: () => t('Flow'),
  table: () => t('Table'),
  agent: () => t('Agent'),
};
