import { McpOAuthGrant } from '@activepieces/shared';
import { useMemo, useState } from 'react';

import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { CatalogClient } from '../mcp-client-catalog';
import { mcpGrantsQueries } from '../mcp-grants-hooks';

export function useConnectHome({
  clients: catalogClients,
}: {
  clients: CatalogClient[];
}) {
  const clients = useMemo(() => orderClients(catalogClients), [catalogClients]);
  const [watchUntil, setWatchUntil] = useState<number | null>(null);
  const isWatching = watchUntil !== null && Date.now() < watchUntil;
  const userId = authenticationSession.getCurrentUserId();
  const grantsQuery = mcpGrantsQueries.useGrants({
    request: {
      limit: MAX_GRANTS,
      ...(userId === null ? {} : { memberIds: [userId] }),
    },
    refetchInterval: isWatching ? WATCH_INTERVAL_MS : false,
  });
  const { pieces } = piecesHooks.usePieces({ skipProjectFilter: true });
  const { websiteName } = flagsHooks.useWebsiteBranding();

  const grants = useMemo(
    () => sortByLastUsed(grantsQuery.data?.data ?? []),
    [grantsQuery.data],
  );

  return {
    clients,
    grants,
    grantsByClient: groupByClient({ grants, clients }),
    brandName: websiteName,
    pieceCount: pieces?.length ?? 0,
    startWatching: () => setWatchUntil(Date.now() + WATCH_DURATION_MS),
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

const MAX_GRANTS = 50;
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
