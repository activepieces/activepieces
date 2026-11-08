import { isObject } from '@activepieces/core-utils';
import { QueryClient, QueryKey, useQuery } from '@tanstack/react-query';

import { agentsApi } from '@/features/agents/api/agents';
import { agentKeys } from '@/features/agents/hooks/agents-hooks';
import { flowHooks, flowsApi } from '@/features/flows';
import { tablesApi } from '@/features/tables';

import { ResourceKind, ResourceRef } from './registry';

export function useResourceName(resource: ResourceRef): string | null {
  const source = SOURCES[resource.kind];
  const { data } = useQuery({
    queryKey: queryKey(resource),
    queryFn: () => (source ? source.fetch(resource.id) : null),
    select: (value: unknown) => (source ? source.name(value) : null),
    enabled: !resource.name && source !== undefined,
    staleTime: NAME_STALE_MS,
    retry: false,
  });
  return resource.name ?? data ?? null;
}

function queryKey(ref: Pick<ResourceRef, 'kind' | 'id'>): QueryKey {
  return SOURCES[ref.kind]?.key(ref.id) ?? ['chat-resource', ref.kind, ref.id];
}

function known({
  queryClient,
  ref,
}: {
  queryClient: QueryClient;
  ref: ResourceRef;
}): string | null {
  const source = SOURCES[ref.kind];
  if (ref.name || !source) return ref.name ?? null;
  return source.name(queryClient.getQueryData(source.key(ref.id)));
}

async function fetchOne({
  queryClient,
  ref,
}: {
  queryClient: QueryClient;
  ref: Pick<ResourceRef, 'kind' | 'id'>;
}): Promise<void> {
  const source = SOURCES[ref.kind];
  if (!source) return;
  await queryClient.fetchQuery({
    queryKey: source.key(ref.id),
    queryFn: () => source.fetch(ref.id),
    staleTime: 0,
    retry: false,
  });
}

function stringAt(value: unknown, key: string): string | null {
  if (!isObject(value)) return null;
  const found = value[key];
  return typeof found === 'string' && found.length > 0 ? found : null;
}

const NAME_STALE_MS = 30_000;

const SOURCES: Partial<Record<ResourceKind, NameSource>> = {
  flow: {
    key: (id) =>
      flowHooks.createFlowQueryKeys({ flowId: id, versionId: undefined }),
    fetch: (id) => flowsApi.get(id),
    name: (flow) =>
      isObject(flow) ? stringAt(flow.version, 'displayName') : null,
  },
  table: {
    key: (id) => ['chat-resource', 'table', id],
    fetch: (id) => tablesApi.getById(id),
    name: (table) => stringAt(table, 'name'),
  },
  agent: {
    key: (id) => agentKeys.one({ id, includeUsage: false }),
    fetch: (id) => agentsApi.get(id),
    name: (agent) => stringAt(agent, 'displayName'),
  },
};

export const resourceNames = { known, fetchOne };

type NameSource = {
  key: (id: string) => QueryKey;
  fetch: (id: string) => Promise<unknown>;
  name: (data: unknown) => string | null;
};
