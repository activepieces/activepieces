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

  const statusByClient = useMemo(
    () =>
      statusFromGrants({
        grants: grantsQuery.data?.data ?? [],
        clients: ordered,
      }),
    [grantsQuery.data, ordered],
  );

  const featured = useMemo(
    () =>
      ordered.filter(
        (client) =>
          !DEMOTED_CLIENTS.includes(client.key) ||
          statusByClient.has(client.key),
      ),
    [ordered, statusByClient],
  );

  return {
    clients: featured,
    allClients: ordered,
    namedCount: ordered.filter((client) => client.group !== 'other').length,
    statusByClient,
    isStatusLoading: grantsQuery.isLoading,
    isStatusError:
      grantsQuery.isError ||
      (grantsQuery.isPaused && grantsQuery.data === undefined),
    refetchStatus: grantsQuery.refetch,
  };
}

function statusFromGrants({
  grants,
  clients,
}: {
  grants: McpOAuthGrant[];
  clients: CatalogClient[];
}): Map<string, ClientStatus> {
  const clientKeys = new Set(clients.map((client) => client.key));
  return grants.reduce((statuses, grant) => {
    const key = clientKeys.has(grant.clientKey) ? grant.clientKey : 'unknown';
    const lastUsedAt = latest(statuses.get(key)?.lastUsedAt, grant.lastUsedAt);
    return new Map(statuses).set(key, { lastUsedAt });
  }, new Map<string, ClientStatus>());
}

function latest(a: string | null | undefined, b: string | null): string | null {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  return a > b ? a : b;
}

function orderClients(clients: CatalogClient[]): CatalogClient[] {
  const rank = (client: CatalogClient) => {
    const index = CLIENT_ORDER.indexOf(client.key);
    return index === -1 ? CLIENT_ORDER.length : index;
  };
  return [...clients].sort((a, b) => rank(a) - rank(b));
}

const GRANTS_LIMIT = 100;
const DEMOTED_CLIENTS = ['gemini-cli', 'antigravity', 'zed', 'cline', 'goose'];
const CLIENT_ORDER = [
  'claude',
  'chatgpt',
  'claude-code',
  'codex',
  'cursor',
  'vscode',
  'gemini-cli',
  'opencode',
  'copilot-cli',
  'windsurf',
  'antigravity',
  'zed',
  'cline',
  'goose',
  'unknown',
];

export type ClientStatus = { lastUsedAt: string | null };
