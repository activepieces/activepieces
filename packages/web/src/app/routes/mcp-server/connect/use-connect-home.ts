import { McpOAuthGrant } from '@activepieces/shared';
import { useMemo } from 'react';

import { authenticationSession } from '@/lib/authentication-session';

import { CatalogClient } from '../mcp-client-catalog';
import { mcpGrantsQueries } from '../mcp-grants-hooks';

export function useConnectHome({ clients }: { clients: CatalogClient[] }) {
  const ordered = useMemo(() => orderClients(clients), [clients]);
  const userId = authenticationSession.getCurrentUserId();
  const grantsQuery = mcpGrantsQueries.useGrants({
    request: {
      limit: GRANTS_LIMIT,
      ...(userId === null ? {} : { memberIds: [userId] }),
    },
  });

  const grants = useMemo(
    () => sortByLastUsed(grantsQuery.data?.data ?? []),
    [grantsQuery.data],
  );

  return {
    clients: ordered,
    grants,
    grantsByClient: groupByClient({ grants, clients: ordered }),
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

const GRANTS_LIMIT = 100;
const CLIENT_ORDER = [
  'claude',
  'chatgpt',
  'claude-code',
  'codex',
  'cursor',
  'vscode',
  'gemini-cli',
  'windsurf',
  'opencode',
  'unknown',
];

export type ConnectHome = ReturnType<typeof useConnectHome>;
