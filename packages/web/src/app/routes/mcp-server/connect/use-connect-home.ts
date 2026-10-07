import { McpOAuthGrant } from '@activepieces/shared';
import { t } from 'i18next';
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
  const [pickedKey, setPickedKey] = useState<string | null>(() =>
    readStoredClient(clients),
  );
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
  const grantsByClient = groupByClient({ grants, clients });
  const connected = clients.filter((client) => grantsByClient.has(client.key));
  const available = clients.filter((client) => !grantsByClient.has(client.key));
  const pickable = available.length > 0 ? available : clients;
  const selected =
    pickable.find((client) => client.key === pickedKey) ?? pickable[0];
  const pieceNames = (pieces ?? []).map((piece) => piece.displayName);

  return {
    connected,
    available,
    selected,
    exampleClient:
      connected.find((client) =>
        grantsByClient.get(client.key)?.includes(grants[0]),
      ) ?? selected,
    grants,
    latestGrant: grants[0] ?? null,
    clients,
    grantsByClient,
    focus: clients.find((client) => client.key === pickedKey) ?? selected,
    isConnected: connected.length > 0,
    isLoading: grantsQuery.isLoading,
    isWatching,
    brandName: websiteName,
    prompts: tryPrompts({ pieceNames, brandName: websiteName }),
    select: (key: string) => {
      setPickedKey(key);
      writeStoredClient(key);
    },
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

function tryPrompts({
  pieceNames,
  brandName,
}: {
  pieceNames: string[];
  brandName: string;
}): string[] {
  const [first, second] = pieceNames;
  return [
    first && second
      ? t('What can you do with {first} and {second}?', { first, second })
      : t('What {brand} tools do you have?', { brand: brandName }),
    t('Which of my flows failed this week, and why?'),
    t('Create a table to track leads and add three sample rows.'),
  ];
}

function readStoredClient(clients: CatalogClient[]): string | null {
  try {
    const key = localStorage.getItem(STORAGE_KEY);
    return clients.some((client) => client.key === key) ? key : null;
  } catch {
    return null;
  }
}

function writeStoredClient(key: string) {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    return;
  }
}

const STORAGE_KEY = 'mcp-connect-last-client';
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
