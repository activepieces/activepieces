import { McpOAuthGrant } from '@activepieces/shared';
import { t } from 'i18next';
import { useMemo, useState } from 'react';

import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { CatalogClient } from '../mcp-client-catalog';
import { mcpGrantsQueries } from '../mcp-grants-hooks';

export function useConnectHome({
  clients,
  forcedState,
}: {
  clients: CatalogClient[];
  forcedState: ConnectStateOverride;
}) {
  const ordered = useMemo(() => orderClients(clients), [clients]);
  const [selectedKey, setSelectedKey] = useState<string>(
    () => readStoredClient(ordered) ?? ordered[0]?.key ?? 'unknown',
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
  const branding = flagsHooks.useWebsiteBranding();
  const websiteName = branding.websiteName;

  const realGrants = grantsQuery.data?.data ?? [];
  const grants = pickGrants({ realGrants, forcedState });
  const selected =
    ordered.find((client) => client.key === selectedKey) ?? ordered[0];
  const pieceNames = (pieces ?? []).map((piece) => piece.displayName);

  return {
    clients: ordered,
    selected,
    select: (key: string) => {
      setSelectedKey(key);
      writeStoredClient(key);
    },
    grants,
    isGrantsLoading: grantsQuery.isLoading && forcedState === 'auto',
    isGrantsError: grantsQuery.isError && forcedState === 'auto',
    refetchGrants: grantsQuery.refetch,
    isConnected: grants.length > 0,
    latestGrant: latestGrant(grants),
    connectedKeys: new Set<string>(grants.map((grant) => grant.clientKey)),
    isWatching,
    startWatching: () => setWatchUntil(Date.now() + WATCH_DURATION_MS),
    brandName: websiteName,
    brandIconUrl: branding.logos.logoIconUrl,
    pieceCount: pieces?.length ?? 0,
    pieceLogos: (pieces ?? []).slice(0, MAX_LOGOS).map((piece) => ({
      name: piece.displayName,
      logoUrl: piece.logoUrl,
    })),
    prompts: tryPrompts({ pieceNames, brandName: websiteName }),
  };
}

function pickGrants({
  realGrants,
  forcedState,
}: {
  realGrants: McpOAuthGrant[];
  forcedState: ConnectStateOverride;
}): McpOAuthGrant[] {
  if (forcedState === 'first') return [];
  if (forcedState === 'connected' && realGrants.length === 0) {
    return SAMPLE_GRANTS;
  }
  return realGrants;
}

function latestGrant(grants: McpOAuthGrant[]): McpOAuthGrant | null {
  const used = grants
    .filter((grant) => grant.lastUsedAt !== null)
    .sort((a, b) => (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? ''));
  return used[0] ?? grants[0] ?? null;
}

function orderClients(clients: CatalogClient[]): CatalogClient[] {
  const rank = (client: CatalogClient) => {
    const index = CLIENT_ORDER.indexOf(client.key);
    return index === -1 ? CLIENT_ORDER.length : index;
  };
  return [...clients].sort((a, b) => rank(a) - rank(b));
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
const MAX_GRANTS = 5;
const MAX_LOGOS = 8;
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
const SAMPLE_GRANTS: McpOAuthGrant[] = [
  {
    id: 'sample-1',
    clientKey: 'claude-code',
    clientName: null,
    projectId: null,
    projectName: null,
    member: null,
    created: new Date(Date.now() - 3 * 86400000).toISOString(),
    lastUsedAt: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: 'sample-2',
    clientKey: 'cursor',
    clientName: null,
    projectId: 'sample-project',
    projectName: 'Marketing',
    member: null,
    created: new Date(Date.now() - 86400000).toISOString(),
    lastUsedAt: null,
  },
];

export type ConnectStateOverride = 'auto' | 'first' | 'connected';

export type ConnectHome = ReturnType<typeof useConnectHome>;
