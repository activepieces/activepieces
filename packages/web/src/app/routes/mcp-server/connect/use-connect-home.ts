import { McpOAuthClientKey, McpOAuthGrant } from '@activepieces/shared';
import { useMemo, useState } from 'react';

import { authenticationSession } from '@/lib/authentication-session';

import { CatalogClient } from '../mcp-client-catalog';
import { mcpGrantsQueries } from '../mcp-grants-hooks';

export function useConnectWatch(): ConnectWatch {
  const [until, setUntil] = useState<number | null>(null);
  return {
    until,
    start: () => setUntil(Date.now() + WATCH_DURATION_MS),
  };
}

export function useConnectHome({
  clients,
  watch,
  setupClient,
}: {
  clients: CatalogClient[];
  watch: ConnectWatch;
  setupClient: CatalogClient | null;
}) {
  const userId = authenticationSession.getCurrentUserId();
  const grantsQuery = mcpGrantsQueries.useAllGrants({
    request: userId === null ? {} : { memberIds: [userId] },
    refetchInterval: (latest) =>
      isWatching({
        until: watch.until,
        isWaitingOnSetup: isWaitingOnSetup({
          client: setupClient,
          grants: latest ?? [],
          clients,
        }),
        now: Date.now(),
      })
        ? WATCH_INTERVAL_MS
        : false,
  });

  const grants = useMemo(
    () => sortByLastUsed(grantsQuery.data ?? []),
    [grantsQuery.data],
  );

  return {
    clients,
    grants,
    grantsByClient: groupByClient({ grants, clients }),
    startWatching: watch.start,
    isGrantsError: grantsQuery.isError,
    refetchGrants: grantsQuery.refetch,
  };
}

function isWatching({
  until,
  isWaitingOnSetup,
  now,
}: {
  until: number | null;
  isWaitingOnSetup: boolean;
  now: number;
}): boolean {
  return isWaitingOnSetup || (until !== null && now < until);
}

function isWaitingOnSetup({
  client,
  grants,
  clients,
}: {
  client: CatalogClient | null;
  grants: McpOAuthGrant[];
  clients: CatalogClient[];
}): boolean {
  if (client === null || client.grantKey === null) {
    return false;
  }
  return !groupByClient({ grants, clients }).has(client.key);
}

function groupByClient({
  grants,
  clients,
}: {
  grants: McpOAuthGrant[];
  clients: CatalogClient[];
}): Map<string, McpOAuthGrant[]> {
  const cardByGrantKey = new Map(
    clients.flatMap((client): [McpOAuthClientKey, string][] =>
      client.grantKey === null ? [] : [[client.grantKey, client.key]],
    ),
  );
  return grants.reduce((groups, grant) => {
    const key = cardByGrantKey.get(grant.clientKey) ?? 'unknown';
    return new Map(groups).set(key, [...(groups.get(key) ?? []), grant]);
  }, new Map<string, McpOAuthGrant[]>());
}

function sortByLastUsed(grants: McpOAuthGrant[]): McpOAuthGrant[] {
  return [...grants].sort((a, b) =>
    (b.lastUsedAt ?? b.created).localeCompare(a.lastUsedAt ?? a.created),
  );
}

const WATCH_INTERVAL_MS = 4000;
const WATCH_DURATION_MS = 10 * 60 * 1000;

export const connectWatchUtils = { isWatching, isWaitingOnSetup };

export type ConnectHome = ReturnType<typeof useConnectHome>;

export type ConnectWatch = {
  until: number | null;
  start: () => void;
};
