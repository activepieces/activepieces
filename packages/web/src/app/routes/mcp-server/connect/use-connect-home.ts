import { McpOAuthGrant } from '@activepieces/shared';
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
  clients: catalogClients,
  watch,
}: {
  clients: CatalogClient[];
  watch: ConnectWatch;
}) {
  const clients = useMemo(() => orderClients(catalogClients), [catalogClients]);
  const userId = authenticationSession.getCurrentUserId();
  const grantsQuery = mcpGrantsQueries.useAllGrants({
    request: userId === null ? {} : { memberIds: [userId] },
    refetchInterval: () =>
      watch.until !== null && Date.now() < watch.until
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

function orderClients(clients: CatalogClient[]): CatalogClient[] {
  const rank = (client: CatalogClient) => {
    const index = CLIENT_ORDER.indexOf(client.key);
    return index === -1 ? CLIENT_ORDER.length : index;
  };
  return [...clients].sort((a, b) => rank(a) - rank(b));
}

function groupByClient({
  grants,
  clients,
}: {
  grants: McpOAuthGrant[];
  clients: CatalogClient[];
}): Map<string, McpOAuthGrant[]> {
  const known = new Set(clients.map((client) => client.key));
  return grants.reduce((groups, grant) => {
    const key = known.has(grant.clientKey) ? grant.clientKey : 'unknown';
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
const CLIENT_ORDER = [
  'claude-code',
  'cursor',
  'claude',
  'chatgpt',
  'vscode',
  'codex',
  'gemini-cli',
  'windsurf',
  'opencode',
  'unknown',
];

export type ConnectHome = ReturnType<typeof useConnectHome>;

export type ConnectWatch = {
  until: number | null;
  start: () => void;
};
