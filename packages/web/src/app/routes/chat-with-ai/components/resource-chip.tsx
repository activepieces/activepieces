import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { agentsApi } from '@/features/agents/api/agents';
import { AnyToolPart, chatPartUtils } from '@/features/chat/lib/chat-types';
import { followAlong } from '@/features/chat/lib/follow/follow-along';
import {
  ResourceKind,
  ResourceRef,
  resourceRegistry,
} from '@/features/chat/lib/resources/registry';
import { flowsApi } from '@/features/flows';
import { tablesApi } from '@/features/tables';
import { cn } from '@/lib/utils';

export function ResourceChips({
  parts,
  className,
}: {
  parts: AnyToolPart[];
  className?: string;
}) {
  const resources = useMemo(() => {
    const seen = new Map<string, ResourceRef>();
    for (const part of parts) {
      const resource = resourceOfPart(part);
      if (!resource) continue;
      const key = resourceRegistry.keyOf(resource);
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
          key={resourceRegistry.keyOf(resource)}
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

export function useResourceName(resource: ResourceRef): string | null {
  const fetchName = FETCH_NAME[resource.kind];
  const { data } = useQuery({
    queryKey: ['chat-resource-name', resource.kind, resource.id],
    queryFn: () => (fetchName ? fetchName(resource.id) : null),
    enabled: !resource.name && fetchName !== undefined,
    staleTime: 30_000,
    retry: false,
  });
  return resource.name ?? data ?? null;
}

function ResourceChip({ resource }: { resource: ResourceRef }) {
  const { pathname } = useLocation();
  const name = useResourceName(resource);
  const here = resourceRegistry.isOn(pathname, resource);
  const {
    icon: Icon,
    label: kindLabel,
    noun,
  } = resourceRegistry.kindInfo(resource.kind);
  const label = name ? withNoun(name, noun) : kindLabel;

  return (
    <a
      href={resourceRegistry.route(resource)}
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        followAlong.view(resource);
      }}
      aria-current={here ? 'page' : undefined}
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
        {here ? t('Viewing') : t('Open')}
      </span>
    </a>
  );
}

function resourceOfPart(part: AnyToolPart): ResourceRef | null {
  if (part.state !== 'output-available') return null;
  const resolved = resourceRegistry.resolve({
    toolName: chatPartUtils.getToolPartName(part),
    input: part.input,
    output: part.output,
  });
  if (
    !resolved ||
    resolved.op === 'delete' ||
    !resourceRegistry.isChange(resolved.outcome)
  ) {
    return null;
  }
  return resolved.ref;
}

function withNoun(name: string, noun: string): string {
  return name.toLowerCase().endsWith(noun.toLowerCase())
    ? name
    : `${name} ${noun}`;
}

const FETCH_NAME: Partial<
  Record<ResourceKind, (id: string) => Promise<string>>
> = {
  flow: (id) => flowsApi.get(id).then((flow) => flow.version.displayName),
  table: (id) => tablesApi.getById(id).then((table) => table.name),
  agent: (id) => agentsApi.get(id).then((agent) => agent.displayName),
};
