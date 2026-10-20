import { McpOAuthGrant } from '@activepieces/shared';
import { useMemo } from 'react';

import { authenticationSession } from '@/lib/authentication-session';

import { CatalogClient } from '../mcp-client-catalog';
import { mcpGrantsQueries } from '../mcp-grants-hooks';

export function useConnectHome({ clients }: { clients: CatalogClient[] }) {
  const ordered = useMemo(() => orderClients(clients), [clients]);
  const userId = authenticationSession.getCurrentUserId();
  const grantsQuery = mcpGrantsQueries.useAllGrants({
    request: {
      limit: GRANTS_LIMIT,
      ...(userId === null ? {} : { memberIds: [userId] }),
    },
  });

  const grantsByClient = useMemo(
    () =>
      groupByClient({
        grants: grantsQuery.data ?? [],
        clients: ordered,
      }),
    [grantsQuery.data, ordered],
  );

  return {
    clients: ordered,
    grantsByClient,
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
  const clientKeys = new Set(clients.map((client) => client.key));
  const groups = new Map<string, McpOAuthGrant[]>();
  for (const grant of grants) {
    const key = clientKeys.has(grant.clientKey) ? grant.clientKey : 'unknown';
    const group = groups.get(key);
    if (group) {
      group.push(grant);
    } else {
      groups.set(key, [grant]);
    }
  }
  return groups;
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
  'opencode',
  'windsurf',
  'unknown',
];
